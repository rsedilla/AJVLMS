// School structure (features/school). Answers from the school (2026-10-07):
//   - a school year runs June → March of the next calendar year
//   - three terms per school year
//   - grade levels: Nursery, Kinder, Grade 1–10; sections per level vary with enrollment
// Assignments here: enrollment (student in a section) and section_adviser (staff advises a section).
// "Teaches" assignments arrive with the courses feature.
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { uuidv7 } from "../../../lib/ids";
import { user } from "./auth";

const id = () => uuid().primaryKey().$defaultFn(() => uuidv7()); // D1
const timestamps = () => ({
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(), // D2
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  archivedAt: timestamp({ withTimezone: true }), // D5: archive, never delete
});

export const schoolYear = pgTable(
  "school_year",
  {
    id: id(),
    name: text().notNull(), // e.g. "2026-2027"
    startsOn: date().notNull(),
    endsOn: date().notNull(),
    isCurrent: boolean().notNull().default(false),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("school_year_name_uq").on(t.name),
    // At most one current school year.
    uniqueIndex("school_year_one_current_uq").on(t.isCurrent).where(sql`${t.isCurrent}`),
    check("school_year_dates_check", sql`${t.endsOn} > ${t.startsOn}`),
  ],
);

export const term = pgTable(
  "term",
  {
    id: id(),
    schoolYearId: uuid().notNull().references(() => schoolYear.id),
    sequence: smallint().notNull(), // 1..3
    name: text().notNull(), // e.g. "Term 1"
    startsOn: date().notNull(),
    endsOn: date().notNull(),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("term_year_sequence_uq").on(t.schoolYearId, t.sequence), // also indexes the FK
    uniqueIndex("term_year_name_uq").on(t.schoolYearId, t.name),
    // Three terms per school year. The DB enforces "at most 3"; the (future) term write service must also
    // check that a term lies inside its school year's dates and doesn't overlap another term.
    check("term_sequence_check", sql`${t.sequence} between 1 and 3`),
    check("term_dates_check", sql`${t.endsOn} > ${t.startsOn}`),
  ],
);

export const gradeLevel = pgTable(
  "grade_level",
  {
    id: id(),
    name: text().notNull(), // "Nursery", "Kinder", "Grade 1" … "Grade 10"
    sortOrder: smallint().notNull(), // Nursery = 1, Kinder = 2, Grade 1 = 3 … Grade 10 = 12
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("grade_level_name_uq").on(t.name),
    uniqueIndex("grade_level_sort_order_uq").on(t.sortOrder),
    check("grade_level_sort_order_check", sql`${t.sortOrder} between 1 and 20`),
  ],
);

export const section = pgTable(
  "section",
  {
    id: id(),
    schoolYearId: uuid().notNull().references(() => schoolYear.id),
    gradeLevelId: uuid().notNull().references(() => gradeLevel.id),
    name: text().notNull(), // e.g. "Rizal". The number of sections per level varies with enrollment.
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("section_year_name_uq").on(t.schoolYearId, t.name), // also indexes school_year_id
    index("section_grade_level_idx").on(t.gradeLevelId),
    // Target for enrollment's composite FK (section must belong to the enrollment's year).
    // A table-level UNIQUE (not a unique index) so it exists before that FK is created.
    unique("section_id_year_uq").on(t.id, t.schoolYearId),
  ],
);

export const subject = pgTable(
  "subject",
  {
    id: id(),
    code: text().notNull(), // e.g. "MATH-8"
    name: text().notNull(), // e.g. "Mathematics 8"
    gradeLevelId: uuid().references(() => gradeLevel.id), // null = not tied to one level
    ...timestamps(),
  },
  (t) => [uniqueIndex("subject_code_uq").on(t.code), index("subject_grade_level_idx").on(t.gradeLevelId)],
);

// Assignment: a student belongs to one section per school year.
export const enrollment = pgTable(
  "enrollment",
  {
    id: id(),
    studentId: text().notNull().references(() => user.id),
    sectionId: uuid().notNull(),
    schoolYearId: uuid().notNull(),
    enrolledAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    ...timestamps(),
  },
  (t) => [
    // The section must be in the same school year as the enrollment.
    foreignKey({
      name: "enrollment_section_year_fk",
      columns: [t.sectionId, t.schoolYearId],
      foreignColumns: [section.id, section.schoolYearId],
    }),
    index("enrollment_section_year_idx").on(t.sectionId, t.schoolYearId),
    // One active section per student per school year (a transfer archives the old row).
    uniqueIndex("enrollment_student_year_active_uq")
      .on(t.studentId, t.schoolYearId)
      .where(sql`${t.archivedAt} is null`),
    index("enrollment_student_idx").on(t.studentId),
  ],
);

// Assignment: staff member(s) advising a section (a section belongs to one school year).
// Ending an assignment archives the row (D5); history is kept and the same person can be re-assigned.
export const sectionAdviser = pgTable(
  "section_adviser",
  {
    id: id(),
    sectionId: uuid().notNull().references(() => section.id),
    userId: text().notNull().references(() => user.id),
    assignedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    assignedBy: text().references(() => user.id, { onDelete: "set null" }),
    archivedAt: timestamp({ withTimezone: true }),
    archivedBy: text().references(() => user.id, { onDelete: "set null" }),
  },
  (t) => [
    // One active assignment per person per section.
    uniqueIndex("section_adviser_active_uq").on(t.sectionId, t.userId).where(sql`${t.archivedAt} is null`),
    index("section_adviser_section_idx").on(t.sectionId), // full FK index (the unique index above is partial)
    index("section_adviser_user_idx").on(t.userId),
    index("section_adviser_assigned_by_idx").on(t.assignedBy),
    index("section_adviser_archived_by_idx").on(t.archivedBy),
  ],
);
