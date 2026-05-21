"use client";

import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MockDeliveryNotePreview } from "./mock-delivery-note-preview";
import { MockLabelPreview } from "./mock-label-preview";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface PreviewTabsProps {
  customerName?: string;
  packageName?: string;
  deliveryNoteMode?: string;
  labelQuantityRule?: string;
  barcodeContent?: string;
  outputs?: string[];
  rows?: any[];
  layoutImage?: string;
  layoutMappings?: any;
  isAnalyzingLayout?: boolean;
}

export function PreviewTabs({
  customerName,
  packageName,
  deliveryNoteMode,
  labelQuantityRule,
  barcodeContent,
  outputs = ["A4 Portrait"],
  rows,
  layoutImage,
  layoutMappings,
  isAnalyzingLayout = false,
}: PreviewTabsProps) {
  const showDN = outputs.includes("A4 Portrait") || outputs.includes("A4 Landscape");
  const showLabel = outputs.includes("Custom Size");

  const [activeTab, setActiveTab] = useState(showDN ? "delivery-note" : "label");

  React.useEffect(() => {
    if (showDN && !showLabel) {
      setActiveTab("delivery-note");
    } else if (showLabel && !showDN) {
      setActiveTab("label");
    }
  }, [showDN, showLabel]);

  const previewData = {
    customer: customerName,
    packageName,
    deliveryNoteMode,
    labelQuantityRule,
    barcodeContent,
  };

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl shadow-sm overflow-hidden min-h-[500px]">
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-muted/20">
        {outputs.length > 1 ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="grid grid-cols-2 w-[240px] h-8 p-0.5">
              <TabsTrigger value="delivery-note" disabled={!showDN} className="text-xs py-1">
                A4 Document
              </TabsTrigger>
              <TabsTrigger value="label" disabled={!showLabel} className="text-xs py-1">
                Barcode Label
              </TabsTrigger>
            </TabsList>
          </Tabs>
        ) : (
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider pl-1">
            {customerName && packageName 
              ? `${customerName} - ${packageName} PREVIEW` 
              : (outputs.includes("Custom Size") 
                  ? "Custom Label Preview" 
                  : "A4 Document Preview")}
          </span>
        )}
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto p-6 bg-muted/5 flex items-start justify-center relative">
        {isAnalyzingLayout && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-7 w-7 text-primary animate-spin" />
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">AI mapping layout coordinates...</p>
          </div>
        )}
        <div className="w-fit min-w-full transition-transform duration-150">
          {activeTab === "delivery-note" && showDN && (
            <MockDeliveryNotePreview 
              isLandscape={outputs.includes("A4 Landscape")}
              data={previewData} 
              rows={rows} 
              layoutImage={layoutImage}
              layoutMappings={layoutMappings}
            />
          )}
          {activeTab === "label" && showLabel && (
            <MockLabelPreview 
              data={previewData} 
              rows={rows} 
              layoutImage={layoutImage}
              layoutMappings={layoutMappings}
            />
          )}
          {((!showDN && activeTab === "delivery-note") || (!showLabel && activeTab === "label")) && (
            <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground w-full">
              <p className="text-sm font-medium">No preview available for this output type.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
