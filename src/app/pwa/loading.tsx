export default function PwaLoading() {
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
        <header className="border-b border-border pb-5 pt-[max(0rem,env(safe-area-inset-top))]">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="h-[92px] w-[92px] animate-pulse rounded-full border border-border bg-background-muted/60" />
            <div className="h-10 w-48 animate-pulse rounded-md bg-background-muted/70" />
            <div className="w-full max-w-xl rounded-2xl border border-border bg-background-card p-4">
              <div className="mx-auto h-3 w-24 animate-pulse rounded bg-background-muted/70" />
              <div className="mx-auto mt-3 h-7 w-56 animate-pulse rounded bg-background-muted/70" />
              <div className="mx-auto mt-3 flex justify-center gap-2">
                <div className="h-7 w-24 animate-pulse rounded-full bg-background-muted/70" />
                <div className="h-7 w-28 animate-pulse rounded-full bg-background-muted/70" />
              </div>
            </div>
          </div>
        </header>

        <section className="mt-6">
          <div className="mb-3 h-3 w-28 animate-pulse rounded bg-background-muted/70" />
          <div className="flex gap-3 overflow-x-auto pb-1">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="min-w-[220px] rounded-2xl border border-border bg-background-card p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="h-4 w-28 animate-pulse rounded bg-background-muted/70" />
                  <div className="h-6 w-16 animate-pulse rounded-full bg-background-muted/70" />
                </div>
                <div className="mt-3 flex gap-2">
                  <div className="h-6 w-20 animate-pulse rounded-full bg-background-muted/70" />
                  <div className="h-6 w-24 animate-pulse rounded-full bg-background-muted/70" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 flex border-b border-border">
          <div className="h-11 flex-1 animate-pulse rounded-t-md bg-background-muted/60" />
          <div className="ml-2 h-11 flex-1 animate-pulse rounded-t-md bg-background-muted/40" />
        </div>

        <section className="mt-4 rounded-lg border border-border bg-background-card p-5">
          <div className="h-10 w-40 animate-pulse rounded-md bg-background-muted/70" />
          <div className="mt-4 h-32 animate-pulse rounded-xl border border-border bg-background-muted/40" />
          <div className="mt-3 h-32 animate-pulse rounded-xl border border-border bg-background-muted/40" />
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
