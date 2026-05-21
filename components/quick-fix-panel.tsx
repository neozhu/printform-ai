import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, Printer, Barcode } from "lucide-react";

interface QuickFixPanelProps {
  onSelectFix: (category: string, value: string) => void;
}

export function QuickFixPanel({ onSelectFix }: QuickFixPanelProps) {
  const fixes = [
    {
      category: "deliveryNoteMode",
      label: "Delivery Note Output",
      icon: FileText,
      options: [
        { label: "One document", value: "One document" },
        { label: "By PO No.", value: "By PO No." },
        { label: "By Delivery No.", value: "By Delivery No." },
      ],
    },
    {
      category: "labelQuantityRule",
      label: "Label Quantity Rule",
      icon: Printer,
      options: [
        { label: "One label per row", value: "One label per row" },
        { label: "By pallet count", value: "By pallet count" },
        { label: "By package count", value: "By package count" },
      ],
    },
    {
      category: "barcodeContent",
      label: "Barcode Content",
      icon: Barcode,
      options: [
        { label: "Code128", value: "Code128" },
        { label: "QR Code", value: "QR Code" },
      ],
    },
  ];

  return (
    <Card className="border-border shadow-sm bg-card/65 backdrop-blur-sm">
      <CardHeader className="pb-3 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-semibold">Quick Fix Adjustments</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {fixes.map((group) => {
          const Icon = group.icon;
          return (
            <div key={group.category} className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                <Icon className="h-3.5 w-3.5" />
                <span>{group.label}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {group.options.map((opt) => (
                  <Button
                    key={opt.value}
                    variant="outline"
                    size="xs"
                    className="text-xs py-1.5 h-auto font-medium transition-all duration-200 hover:bg-foreground hover:text-background"
                    onClick={() => onSelectFix(group.category, opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
