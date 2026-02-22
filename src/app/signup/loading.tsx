export default function Loading() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center md:min-h-[calc(100vh-3rem)]">
        <section className="w-full border border-border bg-background-card rounded-lg p-5">
          <div className="h-4 w-16 animate-pulse rounded bg-background-muted" />
          <div className="mt-3 h-8 w-36 animate-pulse rounded bg-background-muted" />
          <div className="mt-8 space-y-4">
            <div className="h-10 w-full animate-pulse rounded-md bg-background-muted" />
            <div className="h-10 w-full animate-pulse rounded-md bg-background-muted" />
            <div className="h-10 w-full animate-pulse rounded-md bg-background-muted" />
          </div>
        </section>
      </div>
    </main>
  );
}
