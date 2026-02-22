import type { ReactNode } from "react";

import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar />
        <main className="flex min-h-screen flex-1 flex-col px-6 pb-8 pt-6 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
