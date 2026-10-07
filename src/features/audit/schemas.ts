export type AuditEntryDto = {
  id: string;
  occurredAt: string; // ISO-8601 UTC
  actorId: string | null; // null = system
  action: string;
  entityType: string;
  entityId: string;
  subjectUserId: string | null;
  before: unknown;
  after: unknown;
  reason: string | null;
};

/** Cursor pagination (A7): pass `nextCursor` back as `cursor` to get the next (older) page. */
export type AuditPage = { entries: AuditEntryDto[]; nextCursor: string | null };

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 50;
