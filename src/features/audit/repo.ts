import "server-only";
import { and, desc, eq, lt, type SQL } from "drizzle-orm";
import { db } from "@/server/db";
import { auditLog } from "@/server/db/schema";
import type { AuditEntryDto, AuditPage } from "./schemas";

// Ids are UUID v7, so ordering by id is ordering by time; the id doubles as the cursor.
async function page(where: SQL, limit: number, cursor: string | null): Promise<AuditPage> {
  const rows = await db
    .select()
    .from(auditLog)
    .where(cursor ? and(where, lt(auditLog.id, cursor)) : where)
    .orderBy(desc(auditLog.id))
    .limit(limit + 1);

  const entries: AuditEntryDto[] = rows.slice(0, limit).map((r) => ({
    id: r.id,
    occurredAt: r.occurredAt.toISOString(),
    actorId: r.actorId,
    action: r.action,
    entityType: r.entityType,
    entityId: r.entityId,
    subjectUserId: r.subjectUserId,
    before: r.before,
    after: r.after,
    reason: r.reason,
  }));
  return { entries, nextCursor: rows.length > limit ? entries[entries.length - 1].id : null };
}

export const findByEntity = (entityType: string, entityId: string, limit: number, cursor: string | null) =>
  page(and(eq(auditLog.entityType, entityType), eq(auditLog.entityId, entityId))!, limit, cursor);

export const findBySubject = (subjectUserId: string, limit: number, cursor: string | null) =>
  page(eq(auditLog.subjectUserId, subjectUserId), limit, cursor);
