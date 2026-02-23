export default function AsesoradoLoading() {
  return (
    <div className="min-h-screen w-full bg-background md:grid md:grid-cols-[1fr_minmax(0,430px)_1fr]">
      <aside
        aria-hidden="true"
        className="hidden border-r border-border md:block"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-18deg, rgba(26,26,26,0.06) 0px, rgba(26,26,26,0.06) 48px, transparent 48px, transparent 112px)",
        }}
      />

      <main className="min-h-[100dvh] w-full bg-background p-4 pb-[max(2rem,env(safe-area-inset-bottom))] md:border-x md:border-border">
        <header className="border-b border-border pb-4 pt-[max(0rem,env(safe-area-inset-top))]">
          <div className="h-8 w-52 animate-pulse rounded-md bg-background-muted" />
        </header>

        <section className="mt-6 border border-border bg-background-card rounded-lg p-5">
          <div className="h-3 w-24 animate-pulse rounded bg-background-muted" />
          <div className="mt-3 h-7 w-56 animate-pulse rounded bg-background-muted" />
          <div className="mt-2 h-4 w-40 animate-pulse rounded bg-background-muted" />

          <div className="mt-4 flex gap-2">
            <div className="h-10 w-16 animate-pulse rounded-md bg-background-muted" />
            <div className="h-10 w-16 animate-pulse rounded-md bg-background-muted" />
            <div className="h-10 w-16 animate-pulse rounded-md bg-background-muted" />
          </div>

          <div className="mt-4 space-y-2">
            <div className="h-20 animate-pulse rounded-md bg-background-muted" />
            <div className="h-20 animate-pulse rounded-md bg-background-muted" />
            <div className="h-20 animate-pulse rounded-md bg-background-muted" />
          </div>
        </section>

        <section className="mt-6 border border-border bg-background-card rounded-lg p-5">
          <div className="h-3 w-28 animate-pulse rounded bg-background-muted" />
          <div className="mt-3 h-6 w-40 animate-pulse rounded bg-background-muted" />

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="h-20 animate-pulse rounded-md bg-background-muted" />
            <div className="h-20 animate-pulse rounded-md bg-background-muted" />
          </div>

          <div className="mt-4 space-y-2">
            <div className="h-16 animate-pulse rounded-md bg-background-muted" />
            <div className="h-16 animate-pulse rounded-md bg-background-muted" />
            <div className="h-16 animate-pulse rounded-md bg-background-muted" />
          </div>
        </section>
      </main>

      <aside
        aria-hidden="true"
        className="hidden border-l border-border md:block"
        style={{
          backgroundImage:
            "repeating-linear-gradient(18deg, rgba(26,26,26,0.06) 0px, rgba(26,26,26,0.06) 48px, transparent 48px, transparent 112px)",
        }}
      />
    </div>
  );
}
