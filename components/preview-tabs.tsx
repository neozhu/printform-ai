"use client";

import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MockDeliveryNotePreview } from "./mock-delivery-note-preview";
import { MockLabelPreview } from "./mock-label-preview";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";

interface PreviewTabsProps {
  customerName?: string;
  packageName?: string;
  deliveryNoteMode?: string;
  labelQuantityRule?: string;
  barcodeContent?: string;
  outputs?: string[];
  rows?: any[];
}

export function PreviewTabs({
  customerName,
  packageName,
  deliveryNoteMode,
  labelQuantityRule,
  barcodeContent,
  outputs = ["A4 Portrait"],
  rows,
}: PreviewTabsProps) {
  const showDN = outputs.includes("A4 Portrait") || outputs.includes("A4 Landscape");
  const showLabel = outputs.includes("Custom Size");

  const [activeTab, setActiveTab] = useState(showDN ? "delivery-note" : "label");
  const [zoom, setZoom] = useState(1);

  React.useEffect(() => {
    if (showDN && !showLabel) {
      setActiveTab("delivery-note");
    } else if (showLabel && !showDN) {
      setActiveTab("label");
    }
  }, [showDN, showLabel]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 1.4));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.6));
  const handleZoomReset = () => setZoom(1);

  const previewData = {
    customer: customerName,
    packageName,
    deliveryNoteMode,
    labelQuantityRule,
    barcodeContent,
  };

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl shadow-sm overflow-hidden min-h-[500px]">
      {/* Tab bar + Zoom Controls */}
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

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs font-mono font-semibold text-muted-foreground w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="icon-sm" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleZoomReset} title="Actual Size / Reset">
            <Maximize className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto p-6 bg-muted/5 flex items-start justify-center">
        <div className="w-full transition-transform duration-150">
          {activeTab === "delivery-note" && showDN && (
            <MockDeliveryNotePreview 
              scale={zoom} 
              isLandscape={outputs.includes("A4 Landscape")}
              data={previewData} 
              rows={rows} 
            />
          )}
          {activeTab === "label" && showLabel && (
            <MockLabelPreview scale={zoom} data={previewData} rows={rows} />
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
