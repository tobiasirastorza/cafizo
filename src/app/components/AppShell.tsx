"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { RiCloseLine, RiMenuLine } from "@remixicon/react";
import { usePathname } from "next/navigation";

import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard";

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      <div className="flex h-full">
        <Sidebar className="hidden md:flex" />

        <div className="flex h-full min-w-0 flex-1 flex-col">
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
                Vida Total
              </div>
              <div className="h-10 w-10" aria-hidden="true" />
            </div>
          </header>

          <main
            className={`flex min-h-0 flex-1 flex-col px-4 pt-4 md:px-8 md:pt-6 ${
              isDashboard ? "overflow-hidden pb-0" : "overflow-y-auto pb-8"
            }`}
          >
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
