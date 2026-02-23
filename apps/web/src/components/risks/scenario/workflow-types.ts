import React from "react";

// ============================================
// STATUS DEFINITIONS
// ============================================

export type ScenarioStatus =
  | "DRAFT"
  | "ASSESSED"
  | "EVALUATED"
  | "TREATING"
  | "TREATED"
  | "ACCEPTED"
  | "MONITORING"
  | "ESCALATED"
  | "REVIEW"
  | "CLOSED"
  | "ARCHIVED";

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  description: string;
  whatToDo: string;
  phase: "assessment" | "decision" | "treatment" | "acceptance" | "terminal";
}

// ============================================
// TRANSITION DEFINITIONS WITH GUIDANCE
// ============================================

export interface Transition {
  code: string;
  label: string;
  targetStatus: ScenarioStatus;
  requiresJustification: boolean;
  requiresTreatmentPlan?: boolean;
  requiresEscalationDecision?: boolean;
  requiresReviewOutcome?: boolean;
  buttonVariant: "default" | "outline" | "destructive" | "secondary";
  icon: React.ReactNode;
  description: string;
  recommendation?: "recommended" | "alternative" | "escalation";
  showWhen?: (toleranceStatus?: string | null) => boolean;
}

// ============================================
// DECISION GUIDANCE
// ============================================

export interface DecisionGuidance {
  title: string;
  description: string;
  recommendedAction: string;
  icon: React.ReactNode;
  color: string;
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface ScenarioWorkflowPanelProps {
  status: ScenarioStatus;
  toleranceStatus?: "WITHIN" | "EXCEEDS" | "CRITICAL" | null;
  residualScore?: number | null;
  toleranceThreshold?: number | null;
  onTransition: (
    targetStatus: ScenarioStatus,
    options: {
      justification?: string;
      treatmentPlanId?: string;
      escalationDecision?: string;
      reviewOutcome?: string;
    }
  ) => Promise<void>;
  isLoading?: boolean;
  availableTransitions?: Transition[];
  approvalLevel?: string | null;
  factorsComplete?: boolean;
  riskId?: string;
  scenarioId?: string;
  scenarioTitle?: string;
}
