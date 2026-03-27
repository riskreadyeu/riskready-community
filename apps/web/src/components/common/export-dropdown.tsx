"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ExportColumn<T = any> {
  key: string;
  label: string;
  format?: (value: unknown, row: T) => string;
  width?: number;
}

export interface ExportDropdownProps<T extends Record<string, any> = Record<string, unknown>> {
  data: T[];
  columns: ExportColumn<T>[];
  filename: string;
  disabled?: boolean;
  formats?: ("excel" | "csv" | "pdf")[];
  onExport?: (format: "excel" | "csv" | "pdf") => void;
}

export function ExportDropdown<T extends Record<string, any> = Record<string, unknown>>({
  data,
  columns,
  filename,
  disabled = false,
  formats = ["excel", "csv", "pdf"],
  onExport,
}: ExportDropdownProps<T>) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: "excel" | "csv" | "pdf") => {
    if (disabled || isExporting) return;

    setIsExporting(true);
    try {
      if (onExport) {
        onExport(format);
      } else {
        // Default export behavior
        const { exportToExcel, exportToPDF, exportToCSV } = await import("@/lib/export-utils");

        switch (format) {
          case "excel":
            exportToExcel(data, columns, { filename });
            break;
          case "pdf":
            exportToPDF(data, columns, { filename });
            break;
          case "csv":
            exportToCSV(data, columns, { filename });
            break;
        }
      }
    } catch (error) {
      console.error(`Export failed:`, error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatConfig = {
    excel: {
      label: "Export to Excel",
      icon: <FileSpreadsheet className="w-4 h-4" />,
    },
    csv: {
      label: "Export to CSV",
      icon: <FileText className="w-4 h-4" />,
    },
    pdf: {
      label: "Export to PDF",
      icon: <File className="w-4 h-4" />,
    },
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isExporting || data.length === 0}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {formats.map((format) => (
          <DropdownMenuItem
            key={format}
            onClick={() => handleExport(format)}
            className="gap-2"
          >
            {formatConfig[format].icon}
            {formatConfig[format].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
