import AppShell from "./AppShell";

type RouteLoadingProps = {
  titleWidth?: string;
  cards?: number;
};

export default function RouteLoading({
  titleWidth = "w-52",
  cards = 3,
}: RouteLoadingProps) {
  return (
    <AppShell>
      <section className="border-b border-border pb-6">
        <div className={`h-9 ${titleWidth} animate-pulse rounded-md bg-background-muted`} />
      </section>

      <section className="mt-8 space-y-4">
        {Array.from({ length: cards }).map((_, idx) => (
          <div key={idx} className="border border-border bg-background-card rounded-lg p-5">
            <div className="h-4 w-24 animate-pulse rounded bg-background-muted" />
            <div className="mt-3 h-7 w-64 animate-pulse rounded bg-background-muted" />
            <div className="mt-3 h-4 w-40 animate-pulse rounded bg-background-muted" />
          </div>
        ))}
      </section>
    </AppShell>
  );
}
