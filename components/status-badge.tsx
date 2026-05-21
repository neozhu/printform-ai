import React from "react";
import { TemplateStatus } from "@/lib/mock-data";

interface StatusBadgeProps {
  status: TemplateStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    locked: "bg-emerald-50/70 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50",
    draft: "bg-amber-50/70 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50",
    archived: "bg-zinc-100/70 text-zinc-600 border-zinc-200/60 dark:bg-zinc-800/40 dark:text-zinc-400 dark:border-zinc-800/50",
  };

  const labels = {
    locked: "Locked",
    draft: "Draft",
    archived: "Archived",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
