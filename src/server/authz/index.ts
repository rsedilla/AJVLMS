// Authorization core (CLAUDE.md §3, ADR 0005). Feature rules live in each feature's policy.ts;
// this file only holds the shared vocabulary they build on.
import type { Role } from "@/lib/roles";

/** The signed-in user as every service and policy sees them. */
export type Actor = {
  readonly userId: string;
  readonly roles: ReadonlySet<Role>;
};

export const hasRole = (actor: Actor, ...roles: Role[]): boolean => roles.some((r) => actor.roles.has(r));

/**
 * Thrown when the caller may not see or act on a resource.
 * Route handlers turn it into a 404 (A5): callers must not learn that the resource exists.
 */
export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

/** The gate: deny by default. Call with the result of a policy check. */
export function assertCan(allowed: boolean): asserts allowed {
  if (!allowed) throw new NotFoundError();
}
