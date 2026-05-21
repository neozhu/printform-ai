import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { TemplatePackageCard } from "@/components/template-package-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTemplatePackages, getStats, getPrintSessions } from "@/lib/supabase/actions";
import { 
  Printer, 
  FilePlus2, 
  Lock, 
  FileSignature, 
  History, 
  ArrowRight,
  TrendingUp
} from "lucide-react";

export default async function DashboardPage() {
  // Fetch stats and packages dynamically from Supabase
  const stats = await getStats().catch(() => ({ lockedCount: 0, draftCount: 0, totalPrintSessions: 0 }));
  const allPackages = await getTemplatePackages().catch(() => []);
  const recentPackages = allPackages.slice(0, 3);
  const printSessions = await getPrintSessions().catch(() => []);
  const recentSessions = printSessions.slice(0, 5);

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
            <div className="text-2xl font-black text-foreground">{stats.lockedCount}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Ready for direct printing</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Draft Templates</span>
            <FileSignature className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-foreground">{stats.draftCount}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Awaiting layout adjustments</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Print Jobs</span>
            <History className="h-4 w-4 text-foreground/70" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-foreground">{stats.totalPrintSessions}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Generated in current session</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Recent Template Packages */}
        <div className="lg:col-span-2 space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recentPackages.map((pkg) => (
                <TemplatePackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          </div>

          {/* Recent Print Jobs Activity List */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                Recent Print Activity
              </h3>
            </div>

            <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
              {recentSessions.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No print sessions logged yet. Select a template and print to start logging.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/15 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <th className="py-2.5 px-4">Template / Customer</th>
                        <th className="py-2.5 px-4">Excel Source File</th>
                        <th className="py-2.5 px-4 text-center">Stats</th>
                        <th className="py-2.5 px-4 text-right">Printed At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentSessions.map((session) => (
                        <tr key={session.id} className="hover:bg-muted/10 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-foreground">{session.packageName}</div>
                            <div className="text-[10px] text-muted-foreground">{session.customerName}</div>
                          </td>
                          <td className="py-3 px-4 truncate max-w-[150px] font-mono text-[11px]" title={session.fileName}>
                            {session.fileName}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex gap-1.5 text-[10px] font-medium bg-muted px-2 py-0.5 rounded border border-border">
                              <span>{session.rowCount} rows</span>
                              <span className="text-muted-foreground">•</span>
                              <span>{session.documentCount} DNs</span>
                              <span className="text-muted-foreground">•</span>
                              <span>{session.labelCount} Lbls</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-[10px] text-muted-foreground">
                            {new Date(session.printedAt).toLocaleDateString()} {new Date(session.printedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Guidelines Card / Welcome Info */}
        <div className="space-y-6">
          <Card className="border-border shadow-sm bg-muted/10">
            <CardHeader className="pb-3 border-b border-border/80">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Lock className="h-4 w-4" />
                <span>Production Security</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs leading-relaxed text-muted-foreground">
              <p>
                All template packages in <strong>PrintForm AI</strong> are locked before they can be used in the Daily Print Workspace. This protects production-grade print runs from layout shifts.
              </p>
              <p>
                To edit a layout rule, you must edit the template draft and save it as a new locked revision version.
              </p>
              <div className="p-3 bg-card border border-border rounded-lg text-[11px] text-foreground font-semibold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Local AI Rule Validation Active</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
