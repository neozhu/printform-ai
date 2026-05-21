"use client";

import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { TemplatePackageCard } from "@/components/template-package-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockTemplatePackages, mockStats } from "@/lib/mock-data";
import { 
  Printer, 
  FilePlus2, 
  Lock, 
  FileSignature, 
  History, 
  ArrowRight,
  TrendingUp
} from "lucide-react";

export default function DashboardPage() {
  // Grab the 3 most recently updated packages for display
  const recentPackages = [...mockTemplatePackages]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  return (
    <AppShell>
      <PageHeader 
        title="Dashboard" 
        description="Welcome to PrintForm AI. Streamline your shipping documents and barcode labels."
      />

      {/* Main Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="hover:border-foreground/20 transition-all duration-300 shadow-sm relative overflow-hidden group">
          <CardHeader className="pb-4">
            <div className="w-10 h-10 rounded-lg bg-foreground text-background flex items-center justify-center mb-3">
              <Printer className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-bold">Daily Print Workspace</CardTitle>
            <CardDescription className="text-sm">
              Select an existing customer template, upload your Excel sheet, and print delivery notes or barcode labels.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild className="w-full group">
              <Link href="/print" className="flex items-center justify-center gap-2">
                <span>Start Printing Job</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-foreground/20 transition-all duration-300 shadow-sm relative overflow-hidden group">
          <CardHeader className="pb-4">
            <div className="w-10 h-10 rounded-lg bg-foreground text-background flex items-center justify-center mb-3">
              <FilePlus2 className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg font-bold">Template Setup Studio</CardTitle>
            <CardDescription className="text-sm">
              Create a new customer template. Upload sample documents, and let AI structure the printing layout.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button variant="outline" asChild className="w-full group hover:bg-foreground hover:text-background">
              <Link href="/templates/new" className="flex items-center justify-center gap-2">
                <span>Create Customer Template</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <Card className="bg-card/50 backdrop-blur-sm border-border shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Locked Templates</span>
            <Lock className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-foreground">{mockStats.lockedCount}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Ready for direct printing</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Draft Templates</span>
            <FileSignature className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-foreground">{mockStats.draftCount}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Awaiting layout adjustments</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Print Jobs</span>
            <History className="h-4 w-4 text-foreground/70" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-foreground">{mockStats.totalPrintSessions}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Generated in current session</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Template Packages */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            Recently Updated Templates
          </h3>
          <Button variant="link" size="sm" asChild className="p-0 text-xs font-semibold text-muted-foreground hover:text-foreground">
            <Link href="/templates" className="flex items-center gap-1">
              <span>View All Templates</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentPackages.map((pkg) => (
            <TemplatePackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
