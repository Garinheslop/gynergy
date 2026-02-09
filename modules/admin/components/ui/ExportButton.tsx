"use client";

import { useState, useRef, useEffect } from "react";

import { cn } from "@lib/utils/style";

export type ExportFormat = "csv" | "json" | "pdf";

interface ExportOption {
  format: ExportFormat;
  label: string;
  icon: string;
  description: string;
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    format: "csv",
    label: "CSV",
    icon: "gng-file-text",
    description: "Spreadsheet compatible",
  },
  {
    format: "json",
    label: "JSON",
    icon: "gng-code",
    description: "Raw data format",
  },
  {
    format: "pdf",
    label: "PDF",
    icon: "gng-file",
    description: "Print-ready report",
  },
];

interface ExportButtonProps {
  onExport: (format: ExportFormat) => void | Promise<void>;
  disabled?: boolean;
  className?: string;
  loading?: boolean;
  formats?: ExportFormat[];
}

export default function ExportButton({
  onExport,
  disabled = false,
  className,
  loading = false,
  formats = ["csv", "json", "pdf"],
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleExport = async (format: ExportFormat) => {
    setExportingFormat(format);
    setIsExporting(true);

    try {
      await onExport(format);
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
      setIsOpen(false);
    }
  };

  const availableOptions = EXPORT_OPTIONS.filter((opt) => formats.includes(opt.format));

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || loading || isExporting}
        className={cn(
          "border-grey-700 bg-grey-800 hover:bg-grey-700 flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium text-white transition-colors",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "ring-action-500 ring-2"
        )}
        aria-label="Export data"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {isExporting ? (
          <>
            <i className="gng-loader animate-spin" />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <i className="gng-download" />
            <span>Export</span>
            <i
              className={cn(
                "gng-chevron-down text-xs transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </>
        )}
      </button>

      {isOpen && (
        <div
          className="bg-grey-900 border-grey-700 absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-lg border shadow-xl"
          role="menu"
          aria-label="Export format options"
        >
          {availableOptions.map((option) => (
            <button
              key={option.format}
              onClick={() => handleExport(option.format)}
              disabled={isExporting}
              className={cn(
                "hover:bg-grey-800 flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                "disabled:cursor-wait disabled:opacity-50"
              )}
              role="menuitem"
            >
              <div
                className={cn(
                  "bg-grey-800 flex h-8 w-8 items-center justify-center rounded-lg",
                  exportingFormat === option.format && "bg-action-900"
                )}
              >
                {exportingFormat === option.format ? (
                  <i className="gng-loader text-action-400 animate-spin" />
                ) : (
                  <i className={cn(option.icon, "text-grey-400")} />
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-white">{option.label}</div>
                <div className="text-grey-500 text-xs">{option.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Quick export trigger component
interface QuickExportProps {
  onExport: (format: ExportFormat) => void | Promise<void>;
  format: ExportFormat;
  label?: string;
  className?: string;
}

export function QuickExport({ onExport, format, label, className }: QuickExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(format);
    } finally {
      setIsExporting(false);
    }
  };

  const option = EXPORT_OPTIONS.find((o) => o.format === format);

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={cn(
        "text-grey-400 hover:text-grey-200 hover:bg-grey-800 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
        "disabled:cursor-wait disabled:opacity-50",
        className
      )}
    >
      {isExporting ? (
        <i className="gng-loader animate-spin" />
      ) : (
        <i className={option?.icon || "gng-download"} />
      )}
      <span>{label || option?.label || "Export"}</span>
    </button>
  );
}
