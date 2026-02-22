import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const AUTH_COOKIE = "kinetic_auth";

type Props = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export const metadata: Metadata = {
  title: "Sign in | Cafizo",
};

export default async function SignupPage({ searchParams }: Props) {
  const cookieStore = await cookies();
  if (cookieStore.get(AUTH_COOKIE)?.value === "1") {
    redirect("/students");
  }

  const params = await searchParams;
  const hasError = params.error === "1";
  const nextPath =
    params.next && params.next.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/students";

  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center md:min-h-[calc(100vh-3rem)]">
        <section className="w-full border border-border bg-background-card rounded-lg p-5">
          <header className="border-b border-border-subtle pb-5">
            <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
              Access
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              Sign in
            </h1>
            <p className="mt-2 text-sm text-foreground-secondary">
              Enter your credentials to access Cafizo.
            </p>
          </header>

          <form action="/api/auth/login" method="POST" className="mt-6 flex flex-col gap-4">
            <input type="hidden" name="next" value={nextPath} />

            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                Username
              </span>
              <input
                name="username"
                type="text"
                autoComplete="username"
                required
                className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                placeholder="Enter username"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
                Password
              </span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="h-10 w-full border border-border bg-background-card px-3 text-sm text-foreground rounded-md transition-colors duration-150 focus:outline-none focus:border-accent"
                placeholder="Enter password"
              />
            </label>

            {hasError ? (
              <div className="rounded-[4px] border border-error/20 bg-error/10 px-3 py-2 text-sm text-error">
                Invalid username or password.
              </div>
            ) : null}

            <button
              type="submit"
              className="mt-2 inline-flex h-10 items-center justify-center border border-accent bg-accent px-4 text-sm font-medium text-accent-foreground rounded-md transition-colors duration-150 hover:bg-accent/90"
            >
              Enter
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
