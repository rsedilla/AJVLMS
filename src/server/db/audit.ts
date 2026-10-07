// Audit writer (CLAUDE.md §4, ADR 0007). Lives with the DB layer so that, per the ESLint layer rules,
// only feature repo.ts files can call it, inside the same transaction as the change they record.
//
// What goes in before/after: only the domain values the history needs (ids, scores, statuses, dates),
// picked explicitly by the caller. Never whole rows, credentials, or contact details (store an id instead).
// Audit rows can never be updated or deleted, so anything written here is permanent.
import type { AuditAction } from "@/lib/audit-actions";
import { changedFields } from "@/lib/diff";
import type { DB } from "./index";
import { auditLog } from "./schema";

/** A transaction handle. writeAudit deliberately does NOT accept the plain `db`. */
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];

export type AuditEntry = {
  /** Who made the change. null = the system (migration, seed, import job). */
  actorId: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  /** Whose data this is about (usually the student). */
  subjectUserId?: string | null;
  /** Explicitly picked fields before/after the change; only the changed ones are stored. */
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reason?: string | null;
};

/** Field names that must never be written to the permanent audit log. */
const FORBIDDEN_KEY = /password|passwd|hash|token|secret|otp|session|cookie|api[_-]?key/i;

export class AuditPayloadError extends Error {
  constructor(keys: string[]) {
    super(`writeAudit refuses sensitive fields (audit rows are permanent): ${keys.join(", ")}`);
    this.name = "AuditPayloadError";
  }
}

function forbiddenKeys(value: unknown, path = ""): string[] {
  if (value === null || typeof value !== "object") return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, v]) => {
    const here = path ? `${path}.${key}` : key;
    return FORBIDDEN_KEY.test(key) ? [here] : forbiddenKeys(v, here);
  });
}

export async function writeAudit(tx: Tx, entry: AuditEntry): Promise<void> {
  const bad = [...forbiddenKeys(entry.before ?? null, "before"), ...forbiddenKeys(entry.after ?? null, "after")];
  if (bad.length) throw new AuditPayloadError(bad); // throwing also rolls back the caller's transaction

  const reason = entry.reason?.trim() || null;
  const { before, after } = changedFields(entry.before ?? null, entry.after ?? null);
  await tx.insert(auditLog).values({
    actorId: entry.actorId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    subjectUserId: entry.subjectUserId ?? null,
    before,
    after,
    reason,
  });
}
