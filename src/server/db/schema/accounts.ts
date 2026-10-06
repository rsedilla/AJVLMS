// Roles (CLAUDE.md §3, ADR 0005). A user may hold several roles.
// Responsibilities (teaches / advises / guardian of) are *assignments*, added with
// their features (courses, school, guardians), not roles.
import { sql } from "drizzle-orm";
import { check, index, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import type { Role } from "@/lib/roles";
import { user } from "./auth";

export const userRole = pgTable(
  "user_role",
  {
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text().$type<Role>().notNull(),
    grantedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    // Null when granted by a migration, seed or import script.
    grantedBy: text().references(() => user.id, { onDelete: "set null" }),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.role] }), // also serves as the user_id index
    index("user_role_granted_by_idx").on(t.grantedBy),
    // D4: fixed value lists are text + CHECK, never a pg enum.
    // Keep in sync with ROLES in src/lib/roles.ts (a schema test checks this).
    check("user_role_role_check", sql`${t.role} in ('student', 'parent', 'staff', 'principal', 'admin')`),
  ],
);
