"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadDropzoneProps {
  accept: string;
  title: string;
  subtitle?: string;
  onUpload: (fileName: string) => void;
}

export function UploadDropzone({ accept, title, subtitle, onUpload }: UploadDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const simulateUpload = (fileName: string) => {
    setUploading(true);
    setUploadedFile(null);
    setTimeout(() => {
      setUploading(false);
      setUploadedFile(fileName);
      onUpload(fileName);
    }, 1200);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      simulateUpload(file.name);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      simulateUpload(e.target.files[0].name);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const isExcel = accept.includes("xls") || accept.includes("xlsx");

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={onButtonClick}
      className={`border border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-250 ${
        isDragActive 
          ? "border-foreground bg-muted/60 scale-[0.99]" 
          : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleChange}
      />
      
      {uploading ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
          <p className="text-sm font-semibold text-foreground">Uploading and analyzing document...</p>
        </div>
      ) : uploadedFile ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/40">
            <Check className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{uploadedFile}</p>
            <p className="text-xs text-muted-foreground mt-1">Click or drag to replace file</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border border-border">
            {isExcel ? (
              <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
            ) : (
              <UploadCloud className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <Button variant="outline" size="sm" className="mt-2" onClick={(e) => {
            e.stopPropagation();
            onButtonClick();
          }}>
            Select File
          </Button>
        </div>
      )}
    </div>
  );
}
