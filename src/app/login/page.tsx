import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/server/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (await getSession()) redirect(nextPath);

  return (
    <main className="flex flex-1 items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          {/* TODO: replace with the official school crest + script wordmark (public/brand/) */}
          <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full border-4 border-brand-magenta text-lg font-bold text-brand-green">
            AJV
          </div>
          <h1 className="text-xl font-semibold text-brand-magenta">Academia de Julia Victoria</h1>
          <p className="text-sm text-muted-foreground">Learning Portal</p>
        </div>
        <LoginForm nextPath={nextPath} />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Forgot your password? Ask your adviser or the registrar to reset it.
        </p>
      </div>
    </main>
  );
}
