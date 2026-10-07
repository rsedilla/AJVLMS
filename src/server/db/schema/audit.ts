// Append-only audit log (CLAUDE.md §4, ADR 0007).
// Rows are written in the SAME transaction as the change they describe (see src/server/db/audit.ts).
// UPDATE, DELETE and TRUNCATE are rejected by triggers (migration 0006). Never add an update/delete path.
import { sql } from "drizzle-orm";
import { check, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { uuidv7 } from "../../../lib/ids";
import { user } from "./auth";

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid().primaryKey().$defaultFn(() => uuidv7()),
    occurredAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    // Who did it. Null = the system (migration, seed, import job).
    actorId: text().references(() => user.id),
    action: text().notNull(), // e.g. "section_adviser.archive" (list in src/lib/audit-actions.ts)
    entityType: text().notNull(), // e.g. "section_adviser"
    entityId: text().notNull(),
    // Whose data this is about (usually the student), for "everything that changed about X" queries.
    subjectUserId: text().references(() => user.id),
    before: jsonb(), // changed fields only, before the change
    after: jsonb(), // changed fields only, after the change
    reason: text(), // required for admin score edits (§3), optional otherwise
  },
  (t) => [
    check("audit_log_action_format_check", sql`${t.action} ~ '^[a-z_]+(\\.[a-z_]+)+$'`),
    check("audit_log_reason_not_blank_check", sql`${t.reason} is null or length(trim(${t.reason})) > 0`),
    // Reads page by id (UUID v7 = time order), so the composite indexes end in id.
    index("audit_log_entity_idx").on(t.entityType, t.entityId, t.id),
    index("audit_log_subject_idx").on(t.subjectUserId, t.id),
    index("audit_log_actor_idx").on(t.actorId, t.id), // also the actor_id FK index
  ],
);
