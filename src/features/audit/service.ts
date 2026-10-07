import "server-only";
import { isUuid } from "@/lib/ids";
import { assertCan, type Actor } from "@/server/authz";
import { canReadAuditLog } from "./policy";
import * as repo from "./repo";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, type AuditPage } from "./schemas";

type PageOptions = { limit?: number; cursor?: string | null };

const clampLimit = (limit = DEFAULT_PAGE_SIZE) => Math.min(Math.max(Math.trunc(limit) || 1, 1), MAX_PAGE_SIZE);
const validCursor = (cursor?: string | null) => (cursor && isUuid(cursor) ? cursor : null);

/** History of one record (e.g. one adviser assignment), newest first. */
export async function getEntityHistory(
  actor: Actor,
  entityType: string,
  entityId: string,
  options: PageOptions = {},
): Promise<AuditPage> {
  assertCan(canReadAuditLog(actor));
  return repo.findByEntity(entityType, entityId, clampLimit(options.limit), validCursor(options.cursor));
}

/** Everything recorded about one person (e.g. a student), newest first. Supports Data Privacy Act requests. */
export async function getSubjectHistory(actor: Actor, subjectUserId: string, options: PageOptions = {}): Promise<AuditPage> {
  assertCan(canReadAuditLog(actor));
  return repo.findBySubject(subjectUserId, clampLimit(options.limit), validCursor(options.cursor));
}
