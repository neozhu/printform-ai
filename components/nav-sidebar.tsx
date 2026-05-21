"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Printer, 
  FileText, 
  Users, 
  Settings,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

export function NavSidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      disabled: false,
    },
    {
      label: "Print Workspace",
      href: "/print",
      icon: Printer,
      disabled: false,
    },
    {
      label: "Templates",
      href: "/templates",
      icon: FileText,
      disabled: false,
    },
    {
      label: "Customers",
      href: "#",
      icon: Users,
      disabled: true,
    },
    {
      label: "Settings",
      href: "#",
      icon: Settings,
      disabled: true,
    },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col h-screen sticky top-0">
      {/* Brand logo header */}
      <div className="h-16 px-6 border-b border-border flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-lg shadow-sm">
          P
        </div>
        <div>
          <h1 className="font-semibold text-sm leading-none text-foreground">PrintForm AI</h1>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Enterprise UI</span>
        </div>
      </div>

      {/* Nav list */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          if (item.disabled) {
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground/50 cursor-not-allowed select-none"
                title="Available in production release"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-muted/60 text-muted-foreground/60 font-semibold border border-border">
                  Soon
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-foreground text-background font-semibold shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4 transition-transform group-hover:scale-105", isActive ? "text-background" : "text-muted-foreground group-hover:text-foreground")} />
              <span>{item.label}</span>
              {isActive && (
                <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-background" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer system status */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-muted-foreground font-medium">Local AI Core Active</span>
        </div>
      </div>
    </aside>
  );
}
