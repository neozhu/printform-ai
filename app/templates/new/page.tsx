"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { UploadDropzone } from "@/components/upload-dropzone";
import { PreviewTabs } from "@/components/preview-tabs";
import { AIRuleCard } from "@/components/ai-rule-card";
import { QuickFixPanel } from "@/components/quick-fix-panel";
import { AICorrectionBox } from "@/components/ai-correction-box";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RecommendedSetup } from "@/lib/mock-data";
import { 
  getTemplatePackageById, 
  createTemplatePackage, 
  updateTemplatePackage, 
  lockTemplatePackage 
} from "@/lib/supabase/actions";
import { Check, ArrowLeft, Info, HelpCircle, Lock } from "lucide-react";

function SetupStudioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const draftIdParam = searchParams.get("id");

  const [customer, setCustomer] = useState("");
  const [packageName, setPackageName] = useState("");
  const [outputs, setOutputs] = useState<("Delivery Note" | "Label")[]>(["Delivery Note", "Label"]);
  const [isExcelUploaded, setIsExcelUploaded] = useState(false);
  const [isDNUploaded, setIsDNUploaded] = useState(false);
  const [isLabelUploaded, setIsLabelUploaded] = useState(false);

  const [isAILoading, setIsAILoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  const [setup, setSetup] = useState<RecommendedSetup>({
    deliveryNoteMode: "One document",
    headerFields: ["Customer Name", "PO Number", "Delivery Date"],
    lineRule: "Group identical rows by part code, aggregate quantites",
    labelQuantityRule: "One label per row",
    barcodeContent: "Code128",
  });

  // Pre-populate if editing an existing draft
  useEffect(() => {
    if (draftIdParam) {
      getTemplatePackageById(draftIdParam)
        .then((pkg) => {
          if (pkg) {
            setCustomer(pkg.customerName);
            setPackageName(pkg.packageName);
            setOutputs(pkg.outputs);
            setSetup(pkg.recommendedSetup);
            setIsExcelUploaded(true);
            if (pkg.outputs.includes("Delivery Note")) setIsDNUploaded(true);
            if (pkg.outputs.includes("Label")) setIsLabelUploaded(true);
          }
        })
        .catch((err) => console.error("Failed to load draft:", err));
    }
  }, [draftIdParam]);

  const handleOutputToggle = (type: "Delivery Note" | "Label") => {
    setOutputs((prev) =>
      prev.includes(type) ? prev.filter((o) => o !== type) : [...prev, type]
    );
  };

  const handleSelectFix = (category: string, value: string) => {
    setSetup((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  const handleAICorrection = async (message: string) => {
    setIsAILoading(true);
    try {
      const res = await fetch("/api/ai/template-correction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          currentSetup: setup,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSetup(data.recommendedSetup);
      }
    } catch (err) {
      console.error("Studio AI correction failed:", err);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!customer.trim() || !packageName.trim()) {
      alert("Please fill in Customer and Package Name before saving draft.");
      return;
    }
    setIsSaving(true);
    try {
      if (draftIdParam) {
        // Update existing draft
        await updateTemplatePackage(draftIdParam, {
          customerName: customer,
          packageName: packageName,
          outputs: outputs,
          recommendedSetup: setup,
        });
        alert("Draft saved successfully.");
      } else {
        // Create new draft
        const newPkg = await createTemplatePackage({
          customerName: customer,
          packageName: packageName,
          outputs: outputs,
          recommendedSetup: setup,
        });
        // Redirect to edit url with new ID to prevent duplicate creations
        router.replace(`/templates/new?id=${newPkg.id}`);
        alert("Draft saved successfully.");
      }
    } catch (err) {
      console.error("Failed to save draft:", err);
      alert("Failed to save draft.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLockTemplate = async () => {
    if (!customer.trim() || !packageName.trim()) {
      alert("Please fill in Customer and Package Name before confirming.");
      return;
    }
    setIsSaving(true);
    try {
      let pkgId = draftIdParam;
      if (pkgId) {
        // Update existing
        await updateTemplatePackage(pkgId, {
          customerName: customer,
          packageName: packageName,
          outputs: outputs,
          recommendedSetup: setup,
        });
      } else {
        // Create new
        const newPkg = await createTemplatePackage({
          customerName: customer,
          packageName: packageName,
          outputs: outputs,
          recommendedSetup: setup,
        });
        pkgId = newPkg.id;
      }
      
      // Lock it
      await lockTemplatePackage(pkgId);
      setShowSuccessOverlay(true);
    } catch (err) {
      console.error("Failed to lock template:", err);
      alert("Failed to lock template.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell>
      <PageHeader 
        title="Template Setup Studio" 
        description="Set up and configure parsing rules with instant AI copilot suggestions."
      >
        <Button variant="outline" size="sm" onClick={() => router.push("/templates")} className="h-8">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Templates
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Input Forms & Document Dropzones */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border bg-muted/10">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                1. Template Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Customer / Client</label>
                <Input
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="e.g. Tesla Motors"
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Package Name</label>
                <Input
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  placeholder="e.g. Standard Parts Labeling"
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-border/80">
                <label className="text-xs font-semibold text-muted-foreground uppercase block">Expected Outputs</label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="out-dn"
                      checked={outputs.includes("Delivery Note")}
                      onCheckedChange={() => handleOutputToggle("Delivery Note")}
                    />
                    <label htmlFor="out-dn" className="text-xs font-medium text-foreground cursor-pointer select-none">
                      A4 Delivery Note Document
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="out-label"
                      checked={outputs.includes("Label")}
                      onCheckedChange={() => handleOutputToggle("Label")}
                    />
                    <label htmlFor="out-label" className="text-xs font-medium text-foreground cursor-pointer select-none">
                      80x80 Barcode / QR Label
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border bg-muted/10">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                2. Sample Source Files
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground font-bold uppercase block">Sample Excel</span>
                <UploadDropzone
                  accept=".xlsx, .xls"
                  title="Upload Sample Excel"
                  onUpload={() => setIsExcelUploaded(true)}
                />
              </div>

              {outputs.includes("Delivery Note") && (
                <div className="space-y-1 pt-2 border-t border-border/80">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase block">Delivery Note Sample</span>
                  <UploadDropzone
                    accept="image/*, .pdf"
                    title="Upload Target Layout"
                    onUpload={() => setIsDNUploaded(true)}
                  />
                </div>
              )}

              {outputs.includes("Label") && (
                <div className="space-y-1 pt-2 border-t border-border/80">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase block">Label Target Layout</span>
                  <UploadDropzone
                    accept="image/*, .pdf"
                    title="Upload Target Label"
                    onUpload={() => setIsLabelUploaded(true)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Center Column: Live preview tab */}
        <div className="lg:col-span-6">
          <PreviewTabs
            customerName={customer || "Tesla Motors"}
            packageName={packageName || "Standard Parts Labeling"}
            deliveryNoteMode={setup.deliveryNoteMode}
            labelQuantityRule={setup.labelQuantityRule}
            barcodeContent={setup.barcodeContent}
            outputs={outputs}
          />
        </div>

        {/* Right Column: AI recommends, quick corrections, and lock confirmation */}
        <div className="lg:col-span-3 space-y-6">
          <AIRuleCard setup={setup} />
          
          <QuickFixPanel onSelectFix={handleSelectFix} />

          <AICorrectionBox onSubmit={handleAICorrection} isLoading={isAILoading} />

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSaveDraft}
              variant="outline"
              className="w-full shadow-sm py-5 h-auto text-sm border-dashed"
              disabled={isSaving}
            >
              {isSaving ? "Saving Draft..." : "Save Draft"}
            </Button>
            <Button 
              onClick={handleLockTemplate}
              className="w-full shadow-sm py-5 h-auto text-sm"
              disabled={isSaving}
            >
              {isSaving ? "Locking..." : "Confirm & Lock Template"}
            </Button>
          </div>
        </div>

      </div>

      {/* Lock success confirmation overlay modal */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-lg p-6 max-w-md w-full text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/40">
              <Lock className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-foreground">Template Package Locked</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Rules for customer <strong className="text-foreground">"{customer}"</strong> have been successfully verified and saved. 
                Future print runs will only require uploading sheet spreadsheets.
              </p>
            </div>
            <div className="pt-2 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowSuccessOverlay(false)}>
                Stay Here
              </Button>
              <Button className="flex-1" onClick={() => router.push("/templates")}>
                Go to Templates
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function TemplateSetupStudioPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-semibold">Loading setup studio...</div>}>
      <SetupStudioContent />
    </Suspense>
  );
}
