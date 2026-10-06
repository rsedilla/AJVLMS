import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins/username";
import { db } from "./db";
import * as schema from "./db/schema";

// Student numbers look like "2099-0001". Better Auth's default validator
// rejects the hyphen, so we allow letters, digits, ".", "_" and "-".
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    // Accounts are created by the registrar (bulk import), never by self sign-up.
    disableSignUp: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      // Clients can never set their own role.
      role: { type: "string", required: false, defaultValue: "student", input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh once a day
    // Cache the session in a signed cookie for 5 minutes so 500 students
    // opening their grades at once don't each hit the session table on every request.
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  rateLimit: {
    enabled: true,
    storage: "memory", // single web process on one VPS; switch to "database" if we ever run several
    customRules: { "/sign-in/username": { window: 60, max: 10 } },
  },
  plugins: [
    username({ minUsernameLength: 3, maxUsernameLength: 32, usernameValidator: (u) => USERNAME_PATTERN.test(u) }),
    nextCookies(), // must be last
  ],
});

export type Session = typeof auth.$Infer.Session;
