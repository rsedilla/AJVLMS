import { hasRole, type Actor } from "@/server/authz";

/**
 * Reading the audit log: principal (read-only oversight) and admin/registrar.
 * Staff, students and parents never read it directly; features may show their own
 * "Updated <date>" markers instead (§4).
 */
export const canReadAuditLog = (actor: Actor): boolean => hasRole(actor, "principal", "admin");
