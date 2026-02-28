"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { RiCloseLine, RiMenuLine } from "@remixicon/react";

import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <Sidebar className="hidden md:flex" />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-background px-4 py-3 md:hidden">
            <div className="flex items-center justify-between">
              <button
                type="button"
                aria-label="Open menu"
                onClick={() => setIsMobileNavOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background-card text-foreground transition-colors duration-150 hover:bg-background-muted"
              >
                <RiMenuLine size={20} aria-hidden="true" />
              </button>
              <div className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground-secondary">
                Cafizo
              </div>
              <div className="h-10 w-10" aria-hidden="true" />
            </div>
          </header>

          <main className="flex min-h-screen flex-1 flex-col px-4 pb-8 pt-4 md:px-8 md:pt-6">
            {children}
          </main>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-40 md:hidden ${
          isMobileNavOpen ? "" : "pointer-events-none"
        }`}
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setIsMobileNavOpen(false)}
          className={`absolute inset-0 bg-black/35 transition-opacity duration-150 ${
            isMobileNavOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          className={`absolute left-0 top-0 h-full w-[88%] max-w-[340px] transition-transform duration-200 ${
            isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar className="h-full min-h-full" onNavigate={() => setIsMobileNavOpen(false)} />
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setIsMobileNavOpen(false)}
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background-card text-foreground transition-colors duration-150 hover:bg-background-muted"
          >
            <RiCloseLine size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
