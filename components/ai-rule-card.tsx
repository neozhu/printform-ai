import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecommendedSetup } from "@/lib/mock-data";
import { Sparkles, FileText, Printer, Barcode, ListChecks, Layers } from "lucide-react";

interface AIRuleCardProps {
  setup: RecommendedSetup;
}

export function AIRuleCard({ setup }: AIRuleCardProps) {
  return (
    <Card className="border-border shadow-sm relative overflow-hidden bg-card/65 backdrop-blur-sm">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-muted/20 to-transparent rounded-bl-full pointer-events-none" />
      <CardHeader className="pb-3 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-foreground/80" />
          AI Recommended Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Delivery Note Mode */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">
            <FileText className="h-3.5 w-3.5" />
            <span>Delivery Note Output</span>
          </div>
          <p className="text-sm font-semibold text-foreground">{setup.deliveryNoteMode}</p>
        </div>

        {/* Header Fields */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">
            <ListChecks className="h-3.5 w-3.5" />
            <span>Header Fields</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {setup.headerFields.map((field) => (
              <Badge key={field} variant="secondary" className="text-[10px] px-2 py-0">
                {field}
              </Badge>
            ))}
            {setup.headerFields.length === 0 && (
              <span className="text-xs text-muted-foreground italic">None detected</span>
            )}
          </div>
        </div>

        {/* Line Rule */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">
            <Layers className="h-3.5 w-3.5" />
            <span>Line Item Rule</span>
          </div>
          <p className="text-sm font-medium text-foreground leading-relaxed">{setup.lineRule}</p>
        </div>

        {/* Label Qty Rule */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">
            <Printer className="h-3.5 w-3.5" />
            <span>Label Quantity Rule</span>
          </div>
          <p className="text-sm font-semibold text-foreground">{setup.labelQuantityRule}</p>
        </div>

        {/* Barcode Content */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase tracking-wider">
            <Barcode className="h-3.5 w-3.5" />
            <span>Barcode Content</span>
          </div>
          <p className="text-sm font-semibold text-foreground">{setup.barcodeContent}</p>
        </div>
      </CardContent>
    </Card>
  );
}
