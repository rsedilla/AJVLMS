// Creates one dev account per role. Run: pnpm db:seed
// Every account uses SEED_PASSWORD from .env. Dev only; never run in production.
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { Pool } from "pg";
import * as schema from "../src/server/db/schema";
import type { Role } from "../src/lib/roles";

if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed in production.");
const password = process.env.SEED_PASSWORD;
if (!password || password.length < 8) throw new Error("Set SEED_PASSWORD (8+ chars) in .env first.");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema, casing: "snake_case" });

// Fictional accounts only (D9). A user may hold several roles (CLAUDE.md §3).
const accounts: { username: string; name: string; roles: Role[] }[] = [
  { username: "admin", name: "Registrar Admin", roles: ["admin"] },
  { username: "principal", name: "Test Principal", roles: ["principal"] },
  { username: "t-0001", name: "Test Teacher", roles: ["staff"] },
  { username: "t-0002", name: "Teacher Who Is Also A Parent", roles: ["staff", "parent"] },
  { username: "2099-0001", name: "Test Student", roles: ["student"] },
  { username: "p-0001", name: "Test Parent", roles: ["parent"] },
];

async function main() {
  const hash = await hashPassword(password!);
  for (const a of accounts) {
    const existing = await db.query.user.findFirst({ where: eq(schema.user.username, a.username) });
    if (existing) {
      console.log(`skip  ${a.username} (exists)`);
      continue;
    }
    const id = randomUUID();
    await db.transaction(async (tx) => {
      await tx.insert(schema.user).values({
        id,
        name: a.name,
        email: `${a.username}@students.ajv.invalid`,
        username: a.username,
        displayUsername: a.username,
      });
      await tx.insert(schema.account).values({
        id: randomUUID(),
        accountId: id,
        providerId: "credential",
        userId: id,
        password: hash,
      });
      await tx.insert(schema.userRole).values(a.roles.map((role) => ({ userId: id, role })));
    });
    console.log(`added ${a.username} (${a.roles.join(", ")})`);
  }
  await seedSchool();
}

// School structure (fictional). Real rules from the school: June → March, three terms,
// Nursery, Kinder, Grade 1–10. Section names here are made up.
async function seedSchool() {
  if (await db.query.schoolYear.findFirst({ where: eq(schema.schoolYear.name, "2026-2027") })) {
    console.log("skip  school structure (exists)");
    return;
  }
  const userId = async (username: string) =>
    (await db.query.user.findFirst({ where: eq(schema.user.username, username) }))!.id;

  await db.transaction(async (tx) => {
    const [year] = await tx
      .insert(schema.schoolYear)
      .values({ name: "2026-2027", startsOn: "2026-06-08", endsOn: "2027-03-26", isCurrent: true })
      .returning();

    await tx.insert(schema.term).values([
      { schoolYearId: year.id, sequence: 1, name: "Term 1", startsOn: "2026-06-08", endsOn: "2026-09-11" },
      { schoolYearId: year.id, sequence: 2, name: "Term 2", startsOn: "2026-09-14", endsOn: "2026-12-18" },
      { schoolYearId: year.id, sequence: 3, name: "Term 3", startsOn: "2027-01-04", endsOn: "2027-03-26" },
    ]);

    const levelNames = ["Nursery", "Kinder", ...Array.from({ length: 10 }, (_, i) => `Grade ${i + 1}`)];
    const levels = await tx
      .insert(schema.gradeLevel)
      .values(levelNames.map((name, i) => ({ name, sortOrder: i + 1 })))
      .returning();
    const grade8 = levels.find((l) => l.name === "Grade 8")!;

    const [rizal] = await tx
      .insert(schema.section)
      .values([
        { schoolYearId: year.id, gradeLevelId: grade8.id, name: "Rizal" },
        { schoolYearId: year.id, gradeLevelId: grade8.id, name: "Mabini" },
      ])
      .returning();

    await tx.insert(schema.subject).values([
      { code: "MATH-8", name: "Mathematics 8", gradeLevelId: grade8.id },
      { code: "SCI-8", name: "Science 8", gradeLevelId: grade8.id },
      { code: "ENG-8", name: "English 8", gradeLevelId: grade8.id },
      { code: "FIL-8", name: "Filipino 8", gradeLevelId: grade8.id },
    ]);

    await tx.insert(schema.enrollment).values({
      studentId: await userId("2099-0001"),
      sectionId: rizal.id,
      schoolYearId: year.id,
    });
    await tx.insert(schema.sectionAdviser).values({ sectionId: rizal.id, userId: await userId("t-0001") });
  });
  console.log("added school structure: 2026-2027 (3 terms), 12 grade levels, Grade 8 Rizal + Mabini, 4 subjects");
  console.log("      2099-0001 enrolled in Rizal; t-0001 advises Rizal");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
