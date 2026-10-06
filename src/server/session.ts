import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/** Current session or null. Deduplicated per request. */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/** Use in server components/pages that need a signed-in user. */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
