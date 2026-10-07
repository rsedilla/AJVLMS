import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { assertCan, type Actor } from "@/server/authz";
import { getSession } from "@/server/session";
import type { Role } from "@/lib/roles";
import { canReadRoles } from "./policy";
import { findRolesByUserId } from "./repo";

export type CurrentActor = Actor & { readonly name: string };

/**
 * Builds the Actor for the signed-in user (session + roles). Deduplicated per request.
 * This is the bootstrap step every other policy check depends on, so it has no can() of its own:
 * it only ever reads the caller's own roles.
 */
export const getCurrentActor = cache(async (): Promise<CurrentActor | null> => {
  const session = await getSession();
  if (!session) return null;
  const roles = await findRolesByUserId(session.user.id);
  return { userId: session.user.id, name: session.user.name, roles: new Set(roles) };
});

/** For pages that need a signed-in user. */
export async function requireActor(): Promise<CurrentActor> {
  const actor = await getCurrentActor();
  if (!actor) redirect("/login");
  return actor;
}

/** Roles of any user: the user themself or an admin (otherwise NotFoundError → 404). */
export async function getUserRoles(actor: Actor, userId: string): Promise<Role[]> {
  assertCan(canReadRoles(actor, userId));
  return findRolesByUserId(userId);
}
