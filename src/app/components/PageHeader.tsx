"use client";

import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  kicker?: string;
};

export default function PageHeader({
  title,
  subtitle,
  actions,
  kicker,
}: PageHeaderProps) {
  return (
    <header className="rounded-lg border border-border bg-background-card p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {kicker ? (
            <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground-muted">
              {kicker}
            </div>
          ) : null}
          <h1 className="text-2xl font-semibold uppercase leading-tight tracking-tight text-foreground md:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 text-sm text-foreground-secondary">{subtitle}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
