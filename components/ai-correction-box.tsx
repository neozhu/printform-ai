"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowUp, Loader2 } from "lucide-react";

interface AICorrectionBoxProps {
  onSubmit: (message: string) => void;
  isLoading?: boolean;
}

export function AICorrectionBox({ onSubmit, isLoading = false }: AICorrectionBoxProps) {
  const [value, setValue] = useState("");

  const examples = [
    "数量用交货数量",
    "标签按托盘数生成",
    "条码用采购合同序号加位号",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading) return;
    onSubmit(value);
    setValue("");
  };

  return (
    <Card className="border-border shadow-sm bg-card/65 backdrop-blur-sm">
      <CardHeader className="pb-3 border-b border-border bg-muted/20">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-foreground/80" />
          AI Correction Instruction
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <form onSubmit={handleSubmit} className="relative">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Instruct the AI helper to adjust rules (e.g., 'Use PO number as barcode content')..."
            className="min-h-[80px] pr-12 resize-none text-xs"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-2 bottom-2 h-7 w-7 rounded-md bg-foreground text-background hover:bg-foreground/90 disabled:opacity-30"
            disabled={isLoading || !value.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowUp className="h-3.5 w-3.5" />
            )}
          </Button>
        </form>

        <div className="space-y-1.5">
          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
            Suggested Corrections
          </span>
          <div className="flex flex-col gap-1.5">
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                className="text-left text-[11px] px-2.5 py-1.5 rounded-lg border border-border bg-muted/25 hover:bg-muted text-muted-foreground hover:text-foreground font-medium transition-all duration-200"
                onClick={() => setValue(ex)}
                disabled={isLoading}
              >
                “{ex}”
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
