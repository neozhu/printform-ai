"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { UploadDropzone } from "@/components/upload-dropzone";
import { PreviewTabs } from "@/components/preview-tabs";
import { AICorrectionBox } from "@/components/ai-correction-box";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TemplatePackage, RecommendedSetup } from "@/lib/mock-data";
import { getTemplatePackages, logPrintSession } from "@/lib/supabase/actions";
import { FileText, Printer, FileSpreadsheet, Download, RefreshCw, CheckCircle, Sparkles } from "lucide-react";

function PrintWorkspaceContent() {
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get("templateId");

  const [lockedTemplates, setLockedTemplates] = useState<TemplatePackage[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplatePackage | null>(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [fileName, setFileName] = useState("");
  const [activeSetup, setActiveSetup] = useState<RecommendedSetup | null>(null);
  const [isAILoading, setIsAILoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const [parsedColumns, setParsedColumns] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<any[]>([]);

  const getGroupKey = () => {
    if (!activeSetup || parsedRows.length === 0) return null;
    
    // Look for a column from the actual sheet that matches any header field in activeSetup.headerFields
    const matchedField = activeSetup.headerFields.find(field => 
      parsedRows[0] && Object.keys(parsedRows[0]).some(k => k.toLowerCase() === field.toLowerCase())
    );
    if (matchedField) {
      return Object.keys(parsedRows[0]).find(k => k.toLowerCase() === matchedField.toLowerCase()) || null;
    }
    
    // Fallbacks based on deliveryNoteMode
    const firstRowKeys = Object.keys(parsedRows[0] || {});
    if (activeSetup.deliveryNoteMode === "By PO No.") {
      return firstRowKeys.find(k => /po|purchase|order/i.test(k)) || null;
    }
    if (activeSetup.deliveryNoteMode === "By Delivery No.") {
      return firstRowKeys.find(k => /deliv|dn|ship|invoice/i.test(k)) || null;
    }
    return null;
  };

  const calculateDocumentCount = () => {
    if (parsedRows.length === 0) return 0;
    if (activeSetup?.deliveryNoteMode === "One document") return 1;
    
    const groupKey = getGroupKey();
    if (!groupKey) {
      return Math.min(parsedRows.length, 3); // Fallback: group by a default split
    }
    
    const uniqueValues = new Set(parsedRows.map(r => String(r[groupKey] || "").trim()).filter(Boolean));
    return uniqueValues.size || 1;
  };

  const calculateLabelCount = () => {
    if (parsedRows.length === 0) return 0;
    if (activeSetup?.labelQuantityRule === "One label per row") {
      return parsedRows.length;
    }
    
    const firstRowKeys = Object.keys(parsedRows[0] || {});
    const qtyKey = firstRowKeys.find(k => /qty|quantity|pcs|pieces|pack|box|carton/i.test(k));
    if (qtyKey) {
      const total = parsedRows.reduce((sum, row) => {
        const val = parseInt(row[qtyKey]);
        return sum + (isNaN(val) ? 1 : val);
      }, 0);
      return total;
    }
    
    return parsedRows.length;
  };

  const rowCount = parsedRows.length;
  const docCount = calculateDocumentCount();
  const labelCount = calculateLabelCount();

  // Load locked templates from Supabase
  useEffect(() => {
    getTemplatePackages()
      .then((pkgs) => {
        setLockedTemplates(pkgs.filter((tp) => tp.status === "locked"));
      })
      .catch((err) => console.error("Failed to load templates:", err));
  }, []);

  // Sync with templateId from URL search param if present
  useEffect(() => {
    if (templateIdParam && lockedTemplates.length > 0) {
      const pkg = lockedTemplates.find((tp) => tp.id === templateIdParam);
      if (pkg) {
        setSelectedTemplate(pkg);
        setActiveSetup(pkg.recommendedSetup);
      }
    }
  }, [templateIdParam, lockedTemplates]);

  const handleTemplateChange = (id: string) => {
    const pkg = lockedTemplates.find((tp) => tp.id === id) || null;
    setSelectedTemplate(pkg);
    setIsUploaded(false);
    setFileName("");
    setParsedColumns([]);
    setParsedRows([]);
    setSuccessMessage(null);
    if (pkg) {
      setActiveSetup(pkg.recommendedSetup);
    } else {
      setActiveSetup(null);
    }
  };

  const handleExcelUpload = (name: string) => {
    setFileName(name);
    setIsUploaded(true);
  };

  const handleExcelParsed = (data: { sheetName: string; columns: string[]; rows: any[] }) => {
    setParsedColumns(data.columns);
    setParsedRows(data.rows);
  };

  const handleAICorrection = async (message: string) => {
    if (!activeSetup) return;
    setIsAILoading(true);
    try {
      const res = await fetch("/api/ai/template-correction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          currentSetup: activeSetup,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveSetup(data.recommendedSetup);
        setSuccessMessage(`AI applied fix: ${data.explanation}`);
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err) {
      console.error("AI correction call failed:", err);
    } finally {
      setIsAILoading(false);
    }
  };

  const resetUpload = () => {
    setIsUploaded(false);
    setFileName("");
    setParsedColumns([]);
    setParsedRows([]);
  };

  return (
    <AppShell>
      <PageHeader 
        title="Daily Print Workspace" 
        description="Select a template, feed in the shipment spreadsheet, and output formatted printables."
      />

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 flex items-start gap-3 shadow-sm dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400">
          <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Rule adjustment applied</h4>
            <p className="text-xs mt-0.5">{successMessage}</p>
          </div>
        </div>
      )}

      {/* 1. Layout Before Upload */}
      {!isUploaded ? (
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                1. Select Template Package
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                value={selectedTemplate?.id || ""} 
                onValueChange={handleTemplateChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a locked template package..." />
                </SelectTrigger>
                <SelectContent>
                  {lockedTemplates.map((tp) => (
                    <SelectItem key={tp.id} value={tp.id}>
                      {tp.customerName} - {tp.packageName} ({tp.version})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedTemplate && (
                <div className="mt-4 flex gap-2">
                  <span className="text-xs text-muted-foreground font-medium">Expected Outputs:</span>
                  {selectedTemplate.outputs.map((out) => (
                    <Badge key={out} variant="outline" className="text-[10px] px-2 py-0">
                      {out}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedTemplate && (
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  2. Upload Excel File
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UploadDropzone
                  accept=".xlsx, .xls, .csv"
                  title="Upload Excel Spreadsheet"
                  subtitle="Drag and drop shipment manifest row data here"
                  onUpload={handleExcelUpload}
                  onExcelParsed={handleExcelParsed}
                />
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* 2. Layout After Upload (Three-Column Workspace) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Job Summary */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3 border-b border-border bg-muted/10">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Job Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase block leading-none">Template</span>
                  <span className="font-bold text-sm text-foreground mt-1 block">
                    {selectedTemplate?.customerName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {selectedTemplate?.packageName} ({selectedTemplate?.version})
                  </span>
                </div>

                <div className="border-t border-border/80 pt-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase leading-none mb-1">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    <span>Uploaded Sheet</span>
                  </div>
                  <span className="font-semibold text-xs text-foreground truncate block" title={fileName}>
                    {fileName}
                  </span>
                  <button 
                    onClick={resetUpload}
                    className="text-[10px] text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1 mt-1.5 transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Replace File
                  </button>
                </div>

                 <div className="border-t border-border/80 pt-3 space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Parsed Rows:</span>
                    <span className="font-bold text-foreground">{rowCount} rows</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Delivery Notes:</span>
                    <span className="font-bold text-foreground">{docCount} documents</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Generated Labels:</span>
                    <span className="font-bold text-foreground">{labelCount} labels</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {parsedRows.length > 0 && (
              <Card className="border-border shadow-sm overflow-hidden">
                <CardHeader className="pb-2 border-b border-border bg-muted/10 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Spreadsheet Preview
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-normal px-2 py-0">
                    First 5 Rows
                  </Badge>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto max-h-[220px] overflow-y-auto">
                  <table className="w-full text-[10px] text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border">
                        {parsedColumns.slice(0, 5).map((col) => (
                          <th key={col} className="p-2 font-semibold text-muted-foreground uppercase tracking-wider border-r border-border last:border-r-0">
                            {col}
                          </th>
                        ))}
                        {parsedColumns.length > 5 && (
                          <th className="p-2 font-semibold text-muted-foreground uppercase tracking-wider">
                            +{parsedColumns.length - 5} more
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.slice(0, 5).map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-b border-border/60 hover:bg-muted/10 last:border-b-0">
                          {parsedColumns.slice(0, 5).map((col) => (
                            <td key={col} className="p-2 border-r border-border/60 last:border-r-0 text-foreground truncate max-w-[120px]" title={row[col]}>
                              {String(row[col] ?? "")}
                            </td>
                          ))}
                          {parsedColumns.length > 5 && (
                            <td className="p-2 text-muted-foreground italic">
                              ...
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            <Card className="border-border shadow-sm bg-muted/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Active Rule Config
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block leading-none">DN Mode</span>
                  <span className="font-medium text-foreground">{activeSetup?.deliveryNoteMode}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block leading-none">Label Qty</span>
                  <span className="font-medium text-foreground">{activeSetup?.labelQuantityRule}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block leading-none">Barcode Type</span>
                  <span className="font-medium text-foreground">{activeSetup?.barcodeContent}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Column: Preview Canvas */}
          <div className="lg:col-span-6">
            <PreviewTabs
              customerName={selectedTemplate?.customerName}
              packageName={selectedTemplate?.packageName}
              deliveryNoteMode={activeSetup?.deliveryNoteMode}
              labelQuantityRule={activeSetup?.labelQuantityRule}
              barcodeContent={activeSetup?.barcodeContent}
              outputs={selectedTemplate?.outputs}
              rows={parsedRows}
            />
          </div>

          {/* Right Column: Actions & AI adjustments */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="border-border shadow-sm bg-card">
              <CardHeader className="pb-3 border-b border-border bg-muted/10">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Print Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2.5">
                {selectedTemplate?.outputs.includes("Delivery Note") && (
                  <Button variant="outline" className="w-full flex justify-between items-center group/btn" size="default">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>Download Delivery Notes</span>
                    </span>
                    <Download className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover/btn:translate-y-0.5" />
                  </Button>
                )}

                {selectedTemplate?.outputs.includes("Label") && (
                  <Button variant="outline" className="w-full flex justify-between items-center group/btn" size="default">
                    <span className="flex items-center gap-2">
                      <Printer className="h-4 w-4 text-muted-foreground" />
                      <span>Download Labels PDF</span>
                    </span>
                    <Download className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover/btn:translate-y-0.5" />
                  </Button>
                )}

                <Button 
                  className="w-full shadow-sm" 
                  size="default"
                  onClick={async () => {
                    if (!selectedTemplate) return;
                    setIsPrinting(true);
                    try {
                      await logPrintSession({
                        templatePackageId: selectedTemplate.id,
                        fileName: fileName || "shipment_manifest.xlsx",
                        rowCount: rowCount,
                        documentCount: docCount,
                        labelCount: labelCount,
                      });
                      setSuccessMessage("Print job completed. Session logged to database.");
                      setTimeout(() => setSuccessMessage(null), 5000);
                    } catch (err) {
                      console.error("Failed to log session:", err);
                    } finally {
                      setIsPrinting(false);
                    }
                  }}
                  disabled={isPrinting}
                >
                  {isPrinting ? "Logging Print Job..." : "Print All Documents"}
                </Button>
              </CardContent>
            </Card>

            <AICorrectionBox 
              onSubmit={handleAICorrection} 
              isLoading={isAILoading}
            />
          </div>

        </div>
      )}
    </AppShell>
  );
}

export default function PrintWorkspacePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm font-semibold">Loading print workspace...</div>}>
      <PrintWorkspaceContent />
    </Suspense>
  );
}
