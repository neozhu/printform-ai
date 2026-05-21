import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getTemplatePackageById } from "@/lib/supabase/actions";
import { TemplateDetailActions } from "@/components/template-detail-actions";
import { 
  ArrowLeft, 
  Printer, 
  FileEdit, 
  History, 
  FileText, 
  Barcode, 
  Archive,
  Lock,
  Layers,
  ChevronRight
} from "lucide-react";

export default async function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pkg = await getTemplatePackageById(id).catch(() => null);

  if (!pkg) {
    notFound();
  }

  const setup = pkg.recommendedSetup;

  return (
    <AppShell>
      <PageHeader 
        title={`${pkg.customerName}`} 
        description={`Template details for ${pkg.packageName}`}
      >
        <Button variant="outline" size="sm" asChild className="h-8">
          <Link href="/templates" className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to List</span>
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Details and Sub-templates */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Overview Banner */}
          <Card className="border-border shadow-sm overflow-hidden bg-card">
            <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/10 border-b border-border">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground font-bold uppercase block tracking-wider">
                  Customer Template Package
                </span>
                <h3 className="text-xl font-bold text-foreground">{pkg.packageName}</h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium pt-0.5">
                  <span>Version {pkg.version}</span>
                  <span>•</span>
                  <span>Updated {new Date(pkg.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={pkg.status} />
              </div>
            </div>
            
            <CardContent className="p-6">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                Included Output Formats
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Delivery Note sub-template */}
                {pkg.outputs.includes("Delivery Note") ? (
                  <Card className="border-border shadow-sm">
                    <CardHeader className="pb-2 flex flex-row items-center gap-2 space-y-0">
                      <div className="w-8 h-8 rounded bg-blue-50 text-blue-700 flex items-center justify-center dark:bg-blue-950/20 dark:text-blue-400">
                        <FileText className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold">A4 Delivery Note</CardTitle>
                        <span className="text-[10px] text-muted-foreground font-medium">Locked layout spec</span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2 space-y-2 text-xs text-foreground/90">
                      <div className="flex justify-between py-1 border-b border-border/60">
                        <span className="text-muted-foreground font-medium">Grouping Mode:</span>
                        <span className="font-semibold">{setup.deliveryNoteMode}</span>
                      </div>
                      <div className="py-1 border-b border-border/60">
                        <span className="text-muted-foreground font-medium block mb-1">Header Fields:</span>
                        <div className="flex flex-wrap gap-1">
                          {setup.headerFields.map((f) => (
                            <span key={f} className="text-[9px] bg-muted px-1.5 py-0.5 rounded border border-border">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="py-1">
                        <span className="text-muted-foreground font-medium block">Line Item Rules:</span>
                        <span className="text-[11px] leading-relaxed text-muted-foreground mt-0.5 block">
                          {setup.lineRule}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-border border-dashed shadow-sm flex items-center justify-center p-6 bg-muted/5 min-h-[140px]">
                    <div className="text-center text-muted-foreground">
                      <FileText className="h-6 w-6 mx-auto opacity-30 mb-2" />
                      <p className="text-xs font-semibold">No Delivery Note Output</p>
                    </div>
                  </Card>
                )}

                {/* Label sub-template */}
                {pkg.outputs.includes("Label") ? (
                  <Card className="border-border shadow-sm">
                    <CardHeader className="pb-2 flex flex-row items-center gap-2 space-y-0">
                      <div className="w-8 h-8 rounded bg-purple-50 text-purple-700 flex items-center justify-center dark:bg-purple-950/20 dark:text-purple-400">
                        <Barcode className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold">80x80 Barcode Label</CardTitle>
                        <span className="text-[10px] text-muted-foreground font-medium">Locked layout spec</span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2 space-y-2 text-xs text-foreground/90">
                      <div className="flex justify-between py-1 border-b border-border/60">
                        <span className="text-muted-foreground font-medium">Quantity Rule:</span>
                        <span className="font-semibold">{setup.labelQuantityRule}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground font-medium">Barcode Format:</span>
                        <span className="font-semibold">{setup.barcodeContent}</span>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-border border-dashed shadow-sm flex items-center justify-center p-6 bg-muted/5 min-h-[140px]">
                    <div className="text-center text-muted-foreground">
                      <Barcode className="h-6 w-6 mx-auto opacity-30 mb-2" />
                      <p className="text-xs font-semibold">No Barcode Label Output</p>
                    </div>
                  </Card>
                )}

              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Column: Version History & Actions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions Panel */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border bg-muted/10">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <TemplateDetailActions pkg={pkg} />
            </CardContent>
          </Card>

          {/* Revision History */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border bg-muted/10">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <History className="h-4 w-4 text-muted-foreground" />
                <span>Revision History</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-5">
              <div className="relative border-l-2 border-border/80 pl-4 space-y-4 text-xs">
                
                {/* Current revision */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 bg-foreground w-2 h-2 rounded-full border border-background" />
                  <span className="font-semibold text-foreground text-xs block">Version {pkg.version}</span>
                  <span className="text-[10px] text-muted-foreground">2026-05-21 • neo_z</span>
                  <p className="text-muted-foreground mt-0.5 text-[11px]">
                    Current active layout release. Fully locked.
                  </p>
                </div>

                {/* Initial revision */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 bg-muted-foreground/60 w-2 h-2 rounded-full border border-background" />
                  <span className="font-semibold text-muted-foreground text-xs block">Version v1.0</span>
                  <span className="text-[10px] text-muted-foreground">2026-05-15 • System AI</span>
                  <p className="text-muted-foreground mt-0.5 text-[11px]">
                    Initial template drafting completed from sample upload.
                  </p>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </AppShell>
  );
}
