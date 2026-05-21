import Skeleton from "@/app/components/Skeleton";

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
            <Skeleton rounded="full" className="h-[88px] w-[88px] border border-border" />
            <Skeleton className="h-9 w-56" />
            <div className="w-full max-w-xl rounded-2xl border border-accent/20 bg-accent/5 p-2 shadow-sm">
              <Skeleton className="mx-auto h-5 w-40" />
            </div>
          </div>
        </header>

        <nav className="mt-6 flex border-b border-border" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              key={index}
              rounded="none"
              soft
              className={`h-11 flex-1 ${index === 0 ? "" : "ml-px"}`}
            />
          ))}
        </nav>

        <section className="mt-4 border border-border bg-background-card rounded-lg p-5">
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-16" />
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="border border-border rounded-md p-3 border-l-4 border-l-border bg-background-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-20" />
                </div>
              </div>
            ))}
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
