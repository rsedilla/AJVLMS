import { hasRole, type Actor } from "@/server/authz";

/** Who may see which roles a user holds: the user themself, or an admin. */
export const canReadRoles = (actor: Actor, targetUserId: string): boolean =>
  actor.userId === targetUserId || hasRole(actor, "admin");
