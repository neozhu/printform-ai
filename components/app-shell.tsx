import React from "react";
import { NavSidebar } from "./nav-sidebar";

interface AppShellProps {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function AppShell({ children, fullWidth = false }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <NavSidebar />
      <main className="flex-1 overflow-y-auto px-8 py-6">
        <div className={fullWidth ? "w-full max-w-none" : "max-w-7xl mx-auto"}>
          {children}
        </div>
      </main>
    </div>
  );
}
