"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { mockTemplatePackages } from "@/lib/mock-data";
import { FilePlus2, Printer, FileEdit, FolderOpen } from "lucide-react";

export default function TemplatesListPage() {
  return (
    <AppShell>
      <PageHeader 
        title="Template Packages" 
        description="Manage customer templates and output configurations."
      >
        <Button asChild className="shadow-sm">
          <Link href="/templates/new" className="flex items-center gap-1.5">
            <FilePlus2 className="h-4 w-4" />
            <span>Create Template Package</span>
          </Link>
        </Button>
      </PageHeader>

      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/15 font-semibold text-xs uppercase tracking-wider">
            <TableRow>
              <TableHead className="py-3 px-6">Customer & Template</TableHead>
              <TableHead className="py-3 px-4">Expected Outputs</TableHead>
              <TableHead className="py-3 px-4">Status</TableHead>
              <TableHead className="py-3 px-4 text-center">Version</TableHead>
              <TableHead className="py-3 px-4">Last Updated</TableHead>
              <TableHead className="py-3 px-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {mockTemplatePackages.map((pkg) => (
              <TableRow key={pkg.id} className="hover:bg-muted/20 transition-colors">
                {/* Customer and package details */}
                <TableCell className="py-4 px-6">
                  <div className="font-semibold text-foreground text-sm">{pkg.packageName}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{pkg.customerName}</div>
                </TableCell>

                {/* Outputs column */}
                <TableCell className="py-4 px-4">
                  <div className="flex flex-wrap gap-1.5">
                    {pkg.outputs.map((out) => (
                      <span
                        key={out}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded border border-border bg-muted/40 text-foreground/80"
                      >
                        {out}
                      </span>
                    ))}
                  </div>
                </TableCell>

                {/* Status Badge column */}
                <TableCell className="py-4 px-4">
                  <StatusBadge status={pkg.status} />
                </TableCell>

                {/* Version column */}
                <TableCell className="py-4 px-4 text-center font-mono text-xs font-semibold text-foreground/85">
                  {pkg.version}
                </TableCell>

                {/* Updated at column */}
                <TableCell className="py-4 px-4 text-xs text-muted-foreground font-medium">
                  {new Date(pkg.updatedAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </TableCell>

                {/* Actions column */}
                <TableCell className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" size="sm" asChild className="h-7 px-2.5">
                      <Link href={`/templates/${pkg.id}`} className="flex items-center gap-1 text-xs">
                        <FolderOpen className="h-3.5 w-3.5" />
                        <span>Details</span>
                      </Link>
                    </Button>
                    
                    {pkg.status === "locked" ? (
                      <Button size="sm" asChild className="h-7 px-2.5">
                        <Link href={`/print?templateId=${pkg.id}`} className="flex items-center gap-1 text-xs">
                          <Printer className="h-3.5 w-3.5" />
                          <span>Print</span>
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" asChild className="h-7 px-2.5">
                        <Link href={`/templates/new?id=${pkg.id}`} className="flex items-center gap-1 text-xs">
                          <FileEdit className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </Link>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}
