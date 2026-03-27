// =============================================================================
// Risks V2 Module - Shared Constants, Types & Helpers
// =============================================================================

import {
  Minus,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import type {
  RiskTier,
  RiskStatus,
  RAGStatus,
  TrendDirection,
  RTSStatus,
  ToleranceLevel,
  TreatmentStatus,
  TreatmentType,
  TreatmentPriority,
} from "@/lib/risks-api";

// =============================================================================
// Risk Labels & Colors
// =============================================================================

export const tierLabels: Record<RiskTier, string> = {
  CORE: "Core",
  EXTENDED: "Extended",
  ADVANCED: "Advanced",
};

export const tierColors: Record<RiskTier, string> = {
  CORE: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  EXTENDED: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  ADVANCED: "bg-amber-500/10 text-amber-600 border-amber-500/30",
};

export const statusLabels: Record<RiskStatus, string> = {
  IDENTIFIED: "Identified",
  ASSESSED: "Assessed",
  TREATING: "Treating",
  ACCEPTED: "Accepted",
  CLOSED: "Closed",
};

export const statusColors: Record<RiskStatus, string> = {
  IDENTIFIED: "bg-gray-500/10 text-gray-600 border-gray-500/30",
  ASSESSED: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  TREATING: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  ACCEPTED: "bg-green-500/10 text-green-600 border-green-500/30",
  CLOSED: "bg-muted text-muted-foreground border-muted",
};

// =============================================================================
// RAG Status
// =============================================================================

export const ragColors: Record<RAGStatus, string> = {
  GREEN: "bg-green-500",
  AMBER: "bg-amber-500",
  RED: "bg-red-500",
  NOT_MEASURED: "bg-gray-400",
};

export const ragBadgeColors: Record<RAGStatus, string> = {
  GREEN: "bg-green-500/10 text-green-600 border-green-500/30",
  AMBER: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  RED: "bg-red-500/10 text-red-600 border-red-500/30",
  NOT_MEASURED: "bg-gray-500/10 text-gray-600 border-gray-500/30",
};

// =============================================================================
// Trend Icons & Colors
// =============================================================================

export const trendIcons: Record<TrendDirection, typeof TrendingUp> = {
  IMPROVING: TrendingUp,
  STABLE: Minus,
  DECLINING: TrendingDown,
  NEW: Plus,
};

export const trendColors: Record<TrendDirection, string> = {
  IMPROVING: "text-green-500",
  STABLE: "text-gray-500",
  DECLINING: "text-red-500",
  NEW: "text-blue-500",
};

// =============================================================================
// RTS (Risk Tolerance Statement) Labels & Colors
// =============================================================================

export const rtsStatusLabels: Record<RTSStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  ACTIVE: "Active",
  SUPERSEDED: "Superseded",
  RETIRED: "Retired",
};

export const rtsStatusColors: Record<RTSStatus, string> = {
  DRAFT: "bg-gray-500/10 text-gray-600 border-gray-500/30",
  PENDING_APPROVAL: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  APPROVED: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  ACTIVE: "bg-green-500/10 text-green-600 border-green-500/30",
  SUPERSEDED: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  RETIRED: "bg-muted text-muted-foreground border-muted",
};

// =============================================================================
// Tolerance Level Labels & Colors
// =============================================================================

export const toleranceLevelLabels: Record<ToleranceLevel, string> = {
  VERY_HIGH: "Very High",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
  VERY_LOW: "Very Low",
};

export const toleranceLevelColors: Record<ToleranceLevel, string> = {
  VERY_HIGH: "bg-red-500/10 text-red-600 border-red-500/30",
  HIGH: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  MEDIUM: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  LOW: "bg-green-500/10 text-green-600 border-green-500/30",
  VERY_LOW: "bg-blue-500/10 text-blue-600 border-blue-500/30",
};

// =============================================================================
// Treatment Labels & Colors
// =============================================================================

export const treatmentStatusLabels: Record<TreatmentStatus, string> = {
  DRAFT: "Draft",
  PROPOSED: "Proposed",
  APPROVED: "Approved",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  ON_HOLD: "On Hold",
  CANCELLED: "Cancelled",
};

export const treatmentStatusColors: Record<TreatmentStatus, string> = {
  DRAFT: "bg-gray-500/10 text-gray-600 border-gray-500/30",
  PROPOSED: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  APPROVED: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30",
  IN_PROGRESS: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  COMPLETED: "bg-green-500/10 text-green-600 border-green-500/30",
  ON_HOLD: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  CANCELLED: "bg-muted text-muted-foreground border-muted",
};

export const treatmentTypeLabels: Record<TreatmentType, string> = {
  MITIGATE: "Mitigate",
  TRANSFER: "Transfer",
  ACCEPT: "Accept",
  AVOID: "Avoid",
  SHARE: "Share",
};

export const treatmentTypeColors: Record<TreatmentType, string> = {
  MITIGATE: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  TRANSFER: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  ACCEPT: "bg-green-500/10 text-green-600 border-green-500/30",
  AVOID: "bg-red-500/10 text-red-600 border-red-500/30",
  SHARE: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30",
};

export const priorityColors: Record<TreatmentPriority, string> = {
  CRITICAL: "bg-red-500/10 text-red-600 border-red-500/30",
  HIGH: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  MEDIUM: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  LOW: "bg-green-500/10 text-green-600 border-green-500/30",
};

export const actionStatusLabels: Record<string, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  BLOCKED: "Blocked",
  CANCELLED: "Cancelled",
};

export const actionStatusColors: Record<string, string> = {
  NOT_STARTED: "bg-gray-500/10 text-gray-600 border-gray-500/30",
  IN_PROGRESS: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  COMPLETED: "bg-green-500/10 text-green-600 border-green-500/30",
  BLOCKED: "bg-red-500/10 text-red-600 border-red-500/30",
  CANCELLED: "bg-muted text-muted-foreground border-muted",
};

// =============================================================================
// Likelihood & Impact Labels
// =============================================================================

export const likelihoodLabels: Record<number, string> = {
  1: "Rare",
  2: "Unlikely",
  3: "Possible",
  4: "Likely",
  5: "Almost Certain",
};

export const impactLabels: Record<number, string> = {
  1: "Negligible",
  2: "Minor",
  3: "Moderate",
  4: "Major",
  5: "Severe",
};

// =============================================================================
// Helper Functions
// =============================================================================

/** Get risk level label and colors from score */
export const getRiskLevel = (score: number): { level: string; color: string; bgColor: string } => {
  if (score >= 20) return { level: "CRITICAL", color: "text-red-600", bgColor: "bg-red-500" };
  if (score >= 15) return { level: "HIGH", color: "text-orange-600", bgColor: "bg-orange-500" };
  if (score >= 8) return { level: "MEDIUM", color: "text-amber-600", bgColor: "bg-amber-500" };
  return { level: "LOW", color: "text-green-600", bgColor: "bg-green-500" };
};

/** Get heatmap cell color based on likelihood × impact */
export const getHeatmapColor = (likelihood: number, impact: number): string => {
  const score = likelihood * impact;
  if (score <= 7) return "bg-green-500";
  if (score <= 14) return "bg-amber-500";
  if (score <= 19) return "bg-orange-500";
  return "bg-red-500";
};

/** Get score level category for WorkflowSidebar scoring */
export const getScoreLevel = (score: number): "low" | "medium" | "high" | "critical" => {
  if (score >= 20) return "critical";
  if (score >= 15) return "high";
  if (score >= 8) return "medium";
  return "low";
};

// =============================================================================
// Configuration Page Types
// =============================================================================

export type AppetiteLevel = "LOW" | "MEDIUM" | "HIGH";

// =============================================================================
// Configuration Helper Functions
// =============================================================================

export const getLevelBgColor = (level: number): string => {
  if (level === 1) return "bg-green-500";
  if (level === 2) return "bg-lime-500";
  if (level === 3) return "bg-amber-500";
  if (level === 4) return "bg-orange-500";
  return "bg-red-500";
};
