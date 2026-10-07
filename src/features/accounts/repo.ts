import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { userRole } from "@/server/db/schema";
import { isRole, type Role } from "@/lib/roles";

/** Roles for exactly one user (filter: always scoped to a single user id). */
export async function findRolesByUserId(userId: string): Promise<Role[]> {
  const rows = await db.select({ role: userRole.role }).from(userRole).where(eq(userRole.userId, userId));
  return rows.map((r) => r.role).filter(isRole);
}
