// Export utilities for Risk Management and Controls modules

import { type Risk, type KeyRiskIndicator, type RiskScenario } from "./risks-api";
import { format } from "date-fns";

/**
 * Column mapping interface for exports
 */
export interface ExportColumn<T = any> {
  key: string;
  label?: string;
  header?: string;
  format?: (value: any, row: T) => string;
  width?: number;
}

/**
 * Export options interface
 */
export interface ExportOptions {
  filename: string;
  sheetName?: string;
  title?: string;
}

/**
 * Convert data to CSV format
 */
export function toCSV<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T | string; header: string; format?: (value: any, row: T) => string }[]
): string {
  if (data.length === 0) return "";

  // Header row
  const headers = columns.map((col) => `"${col.header}"`).join(",");

  // Data rows
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = typeof col.key === "string" && col.key.includes(".")
          ? col.key.split(".").reduce((obj, key) => obj?.[key], row as any)
          : row[col.key as keyof T];
        
        const formatted = col.format ? col.format(value, row) : String(value ?? "");
        // Escape quotes and wrap in quotes
        return `"${formatted.replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  return [headers, ...rows].join("\n");
}

/**
 * Download data as CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Risk Register to CSV
 */
export function exportRiskRegister(risks: Risk[]): void {
  const columns = [
    { key: "riskId", header: "Risk ID" },
    { key: "title", header: "Title" },
    { key: "description", header: "Description" },
    { key: "tier", header: "Tier" },
    { key: "status", header: "Status" },
    { key: "framework", header: "Framework" },
    { key: "likelihood", header: "Likelihood" },
    { key: "impact", header: "Impact" },
    { key: "inherentScore", header: "Inherent Score", format: (v: number) => v?.toString() || "" },
    { key: "residualScore", header: "Residual Score", format: (v: number) => v?.toString() || "" },
    { key: "riskOwner", header: "Risk Owner" },
    { key: "treatmentPlan", header: "Treatment Plan" },
    { key: "_count.scenarios", header: "Scenarios", format: (_: any, row: Risk) => row._count?.scenarios?.toString() || "0" },
    { key: "_count.kris", header: "KRIs", format: (_: any, row: Risk) => row._count?.kris?.toString() || "0" },
    { key: "createdAt", header: "Created Date", format: (v: string) => v ? format(new Date(v), "yyyy-MM-dd") : "" },
    { key: "updatedAt", header: "Last Updated", format: (v: string) => v ? format(new Date(v), "yyyy-MM-dd") : "" },
  ];

  const csv = toCSV(risks, columns);
  downloadCSV(csv, "Risk_Register");
}

/**
 * Export KRI Report to CSV
 */
export function exportKRIReport(kris: KeyRiskIndicator[]): void {
  const columns = [
    { key: "kriId", header: "KRI ID" },
    { key: "name", header: "Name" },
    { key: "description", header: "Description" },
    { key: "tier", header: "Tier" },
    { key: "framework", header: "Framework" },
    { key: "frequency", header: "Collection Frequency" },
    { key: "unit", header: "Unit" },
    { key: "currentValue", header: "Current Value" },
    { key: "status", header: "RAG Status" },
    { key: "trend", header: "Trend" },
    { key: "thresholdGreen", header: "Green Threshold" },
    { key: "thresholdAmber", header: "Amber Threshold" },
    { key: "thresholdRed", header: "Red Threshold" },
    { key: "formula", header: "Formula" },
    { key: "dataSource", header: "Data Source" },
    { key: "automated", header: "Automated", format: (v: boolean) => v ? "Yes" : "No" },
    { key: "risk.riskId", header: "Parent Risk ID", format: (_: any, row: KeyRiskIndicator) => row.risk?.riskId || "" },
    { key: "risk.title", header: "Parent Risk Title", format: (_: any, row: KeyRiskIndicator) => row.risk?.title || "" },
    { key: "lastMeasured", header: "Last Measured", format: (v: string) => v ? format(new Date(v), "yyyy-MM-dd HH:mm") : "" },
    { key: "createdAt", header: "Created Date", format: (v: string) => v ? format(new Date(v), "yyyy-MM-dd") : "" },
  ];

  const csv = toCSV(kris, columns);
  downloadCSV(csv, "KRI_Report");
}

/**
 * Export Risk Scenarios to CSV
 */
export function exportRiskScenarios(scenarios: RiskScenario[]): void {
  const columns = [
    { key: "scenarioId", header: "Scenario ID" },
    { key: "title", header: "Title" },
    { key: "cause", header: "Cause" },
    { key: "event", header: "Event" },
    { key: "consequence", header: "Consequence" },
    { key: "framework", header: "Framework" },
    { key: "likelihood", header: "Likelihood" },
    { key: "impact", header: "Impact" },
    { key: "inherentScore", header: "Inherent Score", format: (v: number) => v?.toString() || "" },
    { key: "residualScore", header: "Residual Score", format: (v: number) => v?.toString() || "" },
    { key: "sleLow", header: "SLE (Low)", format: (v: number) => v?.toString() || "" },
    { key: "sleLikely", header: "SLE (Likely)", format: (v: number) => v?.toString() || "" },
    { key: "sleHigh", header: "SLE (High)", format: (v: number) => v?.toString() || "" },
    { key: "aro", header: "ARO", format: (v: number) => v?.toString() || "" },
    { key: "ale", header: "ALE", format: (v: number) => v?.toString() || "" },
    { key: "controlIds", header: "Control IDs" },
    { key: "risk.riskId", header: "Parent Risk ID", format: (_: any, row: RiskScenario) => row.risk?.riskId || "" },
    { key: "risk.title", header: "Parent Risk Title", format: (_: any, row: RiskScenario) => row.risk?.title || "" },
    { key: "createdAt", header: "Created Date", format: (v: string) => v ? format(new Date(v), "yyyy-MM-dd") : "" },
  ];

  const csv = toCSV(scenarios, columns);
  downloadCSV(csv, "Risk_Scenarios");
}

/**
 * Export Risk Assessment Summary to CSV
 */
export function exportRiskAssessmentSummary(risks: Risk[]): void {
  // Group by score levels
  const summary = [
    { level: "Critical", range: ">16", count: risks.filter(r => (r.inherentScore || 0) > 16).length },
    { level: "High", range: "10-16", count: risks.filter(r => (r.inherentScore || 0) > 9 && (r.inherentScore || 0) <= 16).length },
    { level: "Medium", range: "5-9", count: risks.filter(r => (r.inherentScore || 0) > 4 && (r.inherentScore || 0) <= 9).length },
    { level: "Low", range: "1-4", count: risks.filter(r => (r.inherentScore || 0) > 0 && (r.inherentScore || 0) <= 4).length },
    { level: "Unassessed", range: "N/A", count: risks.filter(r => !r.inherentScore).length },
  ];

  const columns = [
    { key: "level" as const, header: "Risk Level" },
    { key: "range" as const, header: "Score Range" },
    { key: "count" as const, header: "Count", format: (v: number) => v.toString() },
  ];

  const csv = toCSV(summary, columns);
  downloadCSV(csv, "Risk_Assessment_Summary");
}

/**
 * Generic export to Excel
 * Note: Falls back to CSV since xlsx package is optional.
 * To enable Excel export, install: npm install xlsx
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn<T>[],
  options: ExportOptions
): void {
  // Excel export requires xlsx package - fall back to CSV
  // To enable: npm install xlsx
  console.info("Excel export using CSV format. Install 'xlsx' package for native .xlsx support.");
  exportToCSV(data, columns, options);
}

/**
 * Generic export to PDF
 * Note: Falls back to CSV since jspdf package is optional.
 * To enable PDF export, install: npm install jspdf jspdf-autotable
 */
export function exportToPDF<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn<T>[],
  options: ExportOptions
): void {
  // PDF export requires jspdf package - fall back to CSV
  // To enable: npm install jspdf jspdf-autotable
  console.info("PDF export using CSV format. Install 'jspdf' and 'jspdf-autotable' packages for native .pdf support.");
  exportToCSV(data, columns, options);
}

/**
 * Generic export to CSV (updated to use new column interface)
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn<T>[],
  options: ExportOptions
): void {
  if (data.length === 0) return;

  // Convert to legacy format for toCSV function
  const legacyColumns = columns.map((col) => ({
    key: col.key,
    header: col.header || col.label || col.key,
    format: col.format,
  }));

  const csv = toCSV(data, legacyColumns);
  downloadCSV(csv, options.filename);
}

/**
 * Helper function to get nested values from objects
 */
function getNestedValue(obj: any, path: string): any {
  if (!path.includes(".")) {
    return obj[path];
  }
  return path.split(".").reduce((current, key) => current?.[key], obj);
}
