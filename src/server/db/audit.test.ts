import { describe, expect, it, vi } from "vitest";
import { AUDIT_ACTIONS, AUDIT_ACTION_FORMAT } from "@/lib/audit-actions";

vi.mock("./index", () => ({ db: {} }));
const { writeAudit } = await import("./audit");

function fakeTx() {
  const values = vi.fn(async () => undefined);
  const tx = { insert: vi.fn(() => ({ values })) };
  return { tx: tx as never, values };
}

describe("writeAudit", () => {
  it("stores only the changed fields", async () => {
    const { tx, values } = fakeTx();
    await writeAudit(tx, {
      actorId: "admin-1",
      action: "section_adviser.archive",
      entityType: "section_adviser",
      entityId: "sa-1",
      before: { userId: "t-1", archivedAt: null },
      after: { userId: "t-1", archivedAt: "2026-10-07T00:00:00Z" },
    });
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ before: { archivedAt: null }, after: { archivedAt: "2026-10-07T00:00:00Z" } }),
    );
  });

  it("turns a blank reason into null and trims a real one", async () => {
    const { tx, values } = fakeTx();
    await writeAudit(tx, { actorId: null, action: "role.grant", entityType: "user_role", entityId: "u", reason: "   " });
    await writeAudit(tx, { actorId: null, action: "role.grant", entityType: "user_role", entityId: "u", reason: " ok " });
    expect(values.mock.calls.map((c) => (c as unknown as [{ reason: string | null }])[0].reason)).toEqual([null, "ok"]);
  });

  it("records the system (null actor) and a missing subject as null", async () => {
    const { tx, values } = fakeTx();
    await writeAudit(tx, { actorId: null, action: "enrollment.create", entityType: "enrollment", entityId: "e" });
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ actorId: null, subjectUserId: null }));
  });
});

describe("writeAudit refuses sensitive fields (rows are permanent)", () => {
  it.each([
    [{ password: "x" }],
    [{ tempPassword: "x" }],
    [{ passwordHash: "x" }],
    [{ refreshToken: "x" }],
    [{ nested: { apiKey: "x" } }],
    [{ sessionId: "x" }],
  ])("rejects %j and writes nothing", async (after) => {
    const { tx, values } = fakeTx();
    const { AuditPayloadError } = await import("./audit");
    await expect(
      writeAudit(tx, { actorId: "a", action: "password.reset", entityType: "user", entityId: "u", after }),
    ).rejects.toBeInstanceOf(AuditPayloadError);
    expect(values).not.toHaveBeenCalled();
  });

  it("allows ordinary domain fields", async () => {
    const { tx, values } = fakeTx();
    await writeAudit(tx, {
      actorId: "a",
      action: "score.change",
      entityType: "submission",
      entityId: "s",
      before: { score: 15, status: "graded" },
      after: { score: 18, status: "graded" },
    });
    expect(values).toHaveBeenCalledOnce();
  });
});

describe("AUDIT_ACTIONS", () => {
  it("every action matches the DB CHECK format (<entity>.<verb>)", () => {
    for (const action of AUDIT_ACTIONS) expect(action).toMatch(AUDIT_ACTION_FORMAT);
  });

  it("the TS format mirrors the CHECK in the schema", async () => {
    const { readFileSync } = await import("node:fs");
    const schema = readFileSync(new URL("./schema/audit.ts", import.meta.url), "utf8");
    expect(schema).toContain(String.raw`'^[a-z_]+(\\.[a-z_]+)+$'`);
    expect(AUDIT_ACTION_FORMAT.source).toBe(String.raw`^[a-z_]+(\.[a-z_]+)+$`);
  });
});
