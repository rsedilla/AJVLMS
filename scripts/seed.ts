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
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
