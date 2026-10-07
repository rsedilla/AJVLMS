// Base roles (CLAUDE.md §3). Shared by the DB schema, the authz core and the UI.
export const ROLES = ["student", "parent", "staff", "principal", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const isRole = (value: unknown): value is Role => (ROLES as readonly unknown[]).includes(value);
