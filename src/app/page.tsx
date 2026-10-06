import { requireSession } from "@/server/session";
import { SignOutButton } from "./sign-out-button";

// Placeholder home. The real "Home" (due soon / missing / recently graded)
// is specified in .claude/skills/ajv-lms/SKILL.md §5.
export default async function HomePage() {
  const { user } = await requireSession();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Signed in as {user.role}</p>
          <h1 className="text-2xl font-semibold">Hi, {user.name.split(" ")[0]}</h1>
        </div>
        <SignOutButton />
      </div>
      <p className="mt-8 rounded-lg border bg-card p-6 text-muted-foreground">
        Setup works. Next up: the Home dashboard and Grades.
      </p>
    </main>
  );
}
