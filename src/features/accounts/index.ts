// Public surface of the accounts feature. Never re-export repo functions (CLAUDE.md §0).
export { getCurrentActor, getUserRoles, requireActor, type CurrentActor } from "./service";
