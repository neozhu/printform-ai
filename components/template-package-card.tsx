import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";
import { Button } from "@/components/ui/button";
import { FileText, Printer } from "lucide-react";
import { TemplatePackage } from "@/lib/mock-data";

interface TemplatePackageCardProps {
  pkg: TemplatePackage;
}

export function TemplatePackageCard({ pkg }: TemplatePackageCardProps) {
  return (
    <Card className="hover:border-foreground/30 transition-all duration-300 bg-card shadow-sm flex flex-col justify-between overflow-hidden">
      <CardHeader className="pb-3 border-b border-border bg-muted/10">
        <div className="flex justify-between items-start gap-2">
          <div>
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
              {pkg.customerName}
            </span>
            <CardTitle className="text-base font-bold text-foreground mt-0.5 leading-snug">{pkg.packageName}</CardTitle>
          </div>
          <StatusBadge status={pkg.status} />
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <div className="flex gap-2">
          {pkg.outputs.includes("Delivery Note") && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/30">
              <FileText className="h-3 w-3" />
              Delivery Note
            </span>
          )}
          {pkg.outputs.includes("Label") && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800/30">
              <Printer className="h-3 w-3" />
              Label
            </span>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground flex justify-between items-center font-medium pt-1">
          <span>Version: {pkg.version}</span>
          <span>Updated: {new Date(pkg.updatedAt).toLocaleDateString()}</span>
        </div>
      </CardContent>
      <CardFooter className="pb-4 pt-3 border-t border-border/50 bg-muted/10 flex gap-2">
        <Button variant="outline" size="sm" asChild className="flex-1">
          <Link href={`/templates/${pkg.id}`}>
            View Details
          </Link>
        </Button>
        {pkg.status === "locked" ? (
          <Button size="sm" asChild className="flex-1">
            <Link href={`/print?templateId=${pkg.id}`}>
              Use to Print
            </Link>
          </Button>
        ) : (
          <Button size="sm" variant="outline" asChild className="flex-1 bg-muted/20 border-dashed text-muted-foreground hover:text-foreground">
            <Link href={`/templates/new?id=${pkg.id}`}>
              Edit Draft
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
