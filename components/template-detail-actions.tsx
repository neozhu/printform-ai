"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Printer, FileEdit, History, Archive, Loader2 } from "lucide-react";
import { cloneTemplatePackageAsDraft, archiveTemplatePackage } from "@/lib/supabase/actions";
import { TemplatePackage } from "@/lib/mock-data";

interface TemplateDetailActionsProps {
  pkg: TemplatePackage;
}

export function TemplateDetailActions({ pkg }: TemplateDetailActionsProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<"clone" | "archive" | null>(null);

  const handleCreateNewVersion = async () => {
    setLoadingAction("clone");
    try {
      const draft = await cloneTemplatePackageAsDraft(pkg.id);
      router.push(`/templates/new?id=${draft.id}`);
    } catch (err) {
      console.error("Failed to create new template package version:", err);
      alert("Failed to create new draft version.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleArchive = async () => {
    if (!confirm("Are you sure you want to archive this template? This cannot be undone.")) {
      return;
    }
    setLoadingAction("archive");
    try {
      await archiveTemplatePackage(pkg.id);
      router.push("/templates");
      router.refresh();
    } catch (err) {
      console.error("Failed to archive template package:", err);
      alert("Failed to archive template.");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-2">
      {pkg.status === "locked" ? (
        <Button className="w-full shadow-sm" asChild disabled={loadingAction !== null}>
          <Link href={`/print?templateId=${pkg.id}`} className="flex items-center justify-center gap-1.5">
            <Printer className="h-4 w-4" />
            <span>Use for Printing</span>
          </Link>
        </Button>
      ) : (
        pkg.status !== "archived" && (
          <Button className="w-full shadow-sm" asChild disabled={loadingAction !== null}>
            <Link href={`/templates/new?id=${pkg.id}`} className="flex items-center justify-center gap-1.5">
              <FileEdit className="h-4 w-4" />
              <span>Edit Draft</span>
            </Link>
          </Button>
        )
      )}

      {pkg.status === "locked" && (
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-1.5 hover:bg-muted"
          onClick={handleCreateNewVersion}
          disabled={loadingAction !== null}
        >
          {loadingAction === "clone" ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <History className="h-4 w-4 text-muted-foreground" />
          )}
          <span>Create New Version</span>
        </Button>
      )}

      {pkg.status !== "archived" && (
        <Button
          variant="outline"
          className="w-full flex items-center justify-center gap-1.5 text-destructive border-destructive/20 hover:bg-destructive/10 dark:text-red-400 dark:border-red-950/40 dark:hover:bg-red-950/20"
          onClick={handleArchive}
          disabled={loadingAction !== null}
        >
          {loadingAction === "archive" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Archive className="h-4 w-4" />
          )}
          <span>Archive Template</span>
        </Button>
      )}
    </div>
  );
}
