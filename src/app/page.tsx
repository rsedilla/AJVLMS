import { requireActor } from "@/features/accounts";
import { SignOutButton } from "./sign-out-button";

// Placeholder home. The real "Home" (due soon / missing / recently graded)
// is specified in .claude/skills/ajv-lms/SKILL.md §5; visuals come from Claude Design.
export default async function HomePage() {
  const actor = await requireActor();
  const roles = [...actor.roles];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {roles.length ? `Signed in as ${roles.join(", ")}` : "No role assigned yet"}
          </p>
          <h1 className="text-2xl font-semibold">Hi, {actor.name.split(" ")[0]}</h1>
        </div>
        <SignOutButton />
      </div>
      <p className="mt-8 rounded-lg border bg-card p-6 text-muted-foreground">
        {roles.length
          ? "Setup works. Next up: the Home dashboard and Grades."
          : "Your account has no role yet. Please contact the registrar."}
      </p>
    </main>
  );
}
