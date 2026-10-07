import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Role } from "@/lib/roles";
import { NotFoundError, type Actor } from "@/server/authz";

vi.mock("./repo", () => ({
  findByEntity: vi.fn(async () => ({ entries: [], nextCursor: null })),
  findBySubject: vi.fn(async () => ({ entries: [], nextCursor: null })),
}));

const service = await import("./service");
const repo = await import("./repo");
const as = (...roles: Role[]): Actor => ({ userId: "u", roles: new Set(roles) });
const CURSOR = "01a11571-ef0c-7bbf-a3b5-7884282cf20c";

beforeEach(() => vi.clearAllMocks());

describe("gate before the repo", () => {
  it.each<Role>(["student", "parent", "staff"])("%s is denied without touching the repo", async (role) => {
    await expect(service.getSubjectHistory(as(role), "s-1")).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.getEntityHistory(as(role), "enrollment", "e-1")).rejects.toBeInstanceOf(NotFoundError);
    expect(repo.findBySubject).not.toHaveBeenCalled();
    expect(repo.findByEntity).not.toHaveBeenCalled();
  });
});

describe("pagination (A7)", () => {
  it("defaults to 50 and caps at 100", async () => {
    await service.getSubjectHistory(as("admin"), "s-1");
    await service.getSubjectHistory(as("admin"), "s-1", { limit: 10_000 });
    await service.getSubjectHistory(as("admin"), "s-1", { limit: 0 });
    expect(vi.mocked(repo.findBySubject).mock.calls.map((c) => c[1])).toEqual([50, 100, 1]);
  });

  it("passes a valid UUID cursor through and drops garbage", async () => {
    await service.getEntityHistory(as("principal"), "enrollment", "e-1", { cursor: CURSOR });
    await service.getEntityHistory(as("principal"), "enrollment", "e-1", { cursor: "' or 1=1 --" });
    expect(vi.mocked(repo.findByEntity).mock.calls.map((c) => c[3])).toEqual([CURSOR, null]);
  });
});
