"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowUp, Loader2, History } from "lucide-react";
import { CorrectionHistoryItem } from "@/lib/mock-data";

interface AICorrectionBoxProps {
  onSubmit: (message: string) => void;
  isLoading?: boolean;
  excelColumns?: string[];
  value?: string;
  onChange?: (val: string) => void;
  history?: CorrectionHistoryItem[];
}

export function AICorrectionBox({ 
  onSubmit, 
  isLoading = false,
  excelColumns = [],
  value: controlledValue,
  onChange: controlledOnChange,
  history = [],
}: AICorrectionBoxProps) {
  const [localValue, setLocalValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : localValue;

  const setValue = (val: string) => {
    if (controlledOnChange) {
      controlledOnChange(val);
    } else {
      setLocalValue(val);
    }
  };

  const examples = [
    "Use delivery quantity for quantity",
    "Generate labels by pallet count",
    "Use PO number as barcode content",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading) return;
    onSubmit(value);
    setValue("");
  };

  const handleInsertColumn = (col: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      
      // Determine if spacing is needed around the column name
      const insertText = (start > 0 && !before.endsWith(" ") ? " " : "") + 
                         `"${col}"` + 
                         (after !== "" && !after.startsWith(" ") ? " " : "");
      
      const newValue = before + insertText + after;
      setValue(newValue);
      
      // Restore focus and position cursor after selection update
      setTimeout(() => {
        textarea.focus();
        const cursorPosition = start + insertText.length;
        textarea.setSelectionRange(cursorPosition, cursorPosition);
      }, 0);
    } else {
      // Fallback: append at the end
      setValue(value ? `${value} "${col}"` : `"${col}"`);
    }
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
            ref={textareaRef}
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

        {excelColumns && excelColumns.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">
              Excel Fields (Click to insert)
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
              {excelColumns.map((col) => (
                <button
                  key={col}
                  type="button"
                  className="text-[10px] px-2 py-1 rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium transition-colors border border-border cursor-pointer shadow-sm active:scale-95 duration-100"
                  onClick={() => handleInsertColumn(col)}
                  disabled={isLoading}
                >
                  {col}
                </button>
              ))}
            </div>
          </div>
        )}

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

        {history && history.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-border/80">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1">
              <History className="h-3 w-3 text-muted-foreground" />
              Optimization History
            </span>
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 select-none">
              {history.slice().reverse().map((item, idx) => (
                <div 
                  key={idx} 
                  className="text-xs p-2 rounded-lg bg-muted/40 border border-border/40 hover:border-border/80 transition-all duration-200 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                    <span className="font-semibold text-foreground/75">
                      Instruction #{history.length - idx}
                    </span>
                    <span>
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p 
                    className="text-[11px] text-foreground font-medium italic bg-background/50 px-2 py-1 rounded cursor-pointer hover:bg-background transition-colors duration-150"
                    onClick={() => setValue(item.prompt)}
                    title="Click to copy to input"
                  >
                    "{item.prompt}"
                  </p>
                  {item.explanation && (
                    <p className="text-[10px] text-muted-foreground font-normal leading-relaxed pl-1 border-l border-foreground/10">
                      {item.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
