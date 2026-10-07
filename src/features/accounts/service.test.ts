import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Role } from "@/lib/roles";
import { NotFoundError, type Actor } from "@/server/authz";

vi.mock("@/server/session", () => ({ getSession: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("./repo", () => ({ findRolesByUserId: vi.fn(async (): Promise<Role[]> => ["student"]) }));

const { getUserRoles } = await import("./service");
const repo = await import("./repo");

const as = (userId: string, ...roles: Role[]): Actor => ({ userId, roles: new Set(roles) });

describe("getUserRoles (gate before the repo)", () => {
  beforeEach(() => vi.mocked(repo.findRolesByUserId).mockClear());

  it("returns roles for the user themself", async () => {
    await expect(getUserRoles(as("s-1", "student"), "s-1")).resolves.toEqual(["student"]);
    expect(repo.findRolesByUserId).toHaveBeenCalledWith("s-1");
  });

  it("returns roles for an admin reading another user", async () => {
    await expect(getUserRoles(as("a-1", "admin"), "s-1")).resolves.toEqual(["student"]);
  });

  it.each<[string, Role[]]>([
    ["student", ["student"]],
    ["parent", ["parent"]],
    ["staff", ["staff"]],
    ["principal", ["principal"]],
    ["staff + parent", ["staff", "parent"]],
    ["no roles", []],
  ])("denies %s reading another user with NotFoundError, and never touches the repo", async (_, roles) => {
    await expect(getUserRoles(as("x-1", ...roles), "s-1")).rejects.toBeInstanceOf(NotFoundError);
    expect(repo.findRolesByUserId).not.toHaveBeenCalled();
  });
});
