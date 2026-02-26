import {
  AlertCircle,
  CheckCircle,
  FileCheck,
  Target,
  AlertTriangle,
  Play,
  Pause,
  Eye,
  Archive,
  Ban,
  ArrowUp,
  RefreshCw,
} from "lucide-react";
import type { ScenarioStatus, StatusConfig, Transition, DecisionGuidance } from "./workflow-types";

// ============================================
// STATUS CONFIGURATION
// ============================================

export const STATUS_CONFIG: Record<ScenarioStatus, StatusConfig> = {
  DRAFT: {
    label: "Draft",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-300",
    icon: <Target className="w-4 h-4" />,
    description: "You're building the risk picture",
    whatToDo: "Set likelihood and impact levels to calculate the inherent risk score. This creates the evidence base for your risk decision.",
    phase: "assessment",
  },
  ASSESSED: {
    label: "Assessed",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-300",
    icon: <FileCheck className="w-4 h-4" />,
    description: "Assessment complete - awaiting tolerance check",
    whatToDo: "The system compares your score to the Risk Tolerance Statement (RTS). This determines if treatment is needed.",
    phase: "assessment",
  },
  EVALUATED: {
    label: "Decision Required",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-300",
    icon: <Eye className="w-4 h-4" />,
    description: "Your risk score has been compared to tolerance",
    whatToDo: "Make a formal decision: Accept (if within tolerance), Treat (to reduce risk), or Escalate (if beyond your authority).",
    phase: "decision",
  },
  TREATING: {
    label: "Treatment In Progress",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-300",
    icon: <Play className="w-4 h-4" />,
    description: "Controls are being implemented to reduce risk",
    whatToDo: "Complete the treatment actions. Each action should reduce likelihood or impact. Mark complete when done.",
    phase: "treatment",
  },
  TREATED: {
    label: "Treatment Complete",
    color: "text-teal-600",
    bgColor: "bg-teal-100",
    borderColor: "border-teal-300",
    icon: <Pause className="w-4 h-4" />,
    description: "Treatment actions are finished",
    whatToDo: "Re-assess to measure the new residual risk. Did the controls work? Is the risk now within tolerance?",
    phase: "treatment",
  },
  ACCEPTED: {
    label: "Risk Accepted",
    color: "text-green-600",
    bgColor: "bg-green-100",
    borderColor: "border-green-300",
    icon: <CheckCircle className="w-4 h-4" />,
    description: "Formal sign-off recorded",
    whatToDo: "This risk is now formally accepted. The acceptance decision is recorded for audit. Moves to ongoing monitoring.",
    phase: "acceptance",
  },
  MONITORING: {
    label: "Active Monitoring",
    color: "text-cyan-600",
    bgColor: "bg-cyan-100",
    borderColor: "border-cyan-300",
    icon: <Eye className="w-4 h-4" />,
    description: "Risk is being tracked via KRIs",
    whatToDo: "Key Risk Indicators are monitored. You'll be alerted if thresholds breach. Trigger a review if circumstances change.",
    phase: "acceptance",
  },
  ESCALATED: {
    label: "Awaiting Authority",
    color: "text-red-600",
    bgColor: "bg-red-100",
    borderColor: "border-red-300",
    icon: <ArrowUp className="w-4 h-4" />,
    description: "This risk exceeds your approval level",
    whatToDo: "A higher authority (CISO, Risk Committee, or Board) must decide. They can approve treatment, accept as exception, or terminate the activity.",
    phase: "decision",
  },
  REVIEW: {
    label: "Under Review",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    borderColor: "border-orange-300",
    icon: <RefreshCw className="w-4 h-4" />,
    description: "Periodic or triggered reassessment",
    whatToDo: "Has the risk changed? Review the current assessment and decide: no change, score changed, or new treatment needed.",
    phase: "assessment",
  },
  CLOSED: {
    label: "Closed",
    color: "text-gray-500",
    bgColor: "bg-gray-100",
    borderColor: "border-gray-300",
    icon: <Ban className="w-4 h-4" />,
    description: "Risk no longer applicable",
    whatToDo: "This scenario is closed. The risk source has been eliminated or is no longer relevant. Archive for records.",
    phase: "terminal",
  },
  ARCHIVED: {
    label: "Archived",
    color: "text-gray-400",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    icon: <Archive className="w-4 h-4" />,
    description: "Retained for audit trail",
    whatToDo: "Historical record preserved. No actions available. Can be referenced in audits.",
    phase: "terminal",
  },
};

// ============================================
// TRANSITION DEFINITIONS
// ============================================

export const AVAILABLE_TRANSITIONS: Record<ScenarioStatus, Transition[]> = {
  DRAFT: [
    {
      code: "T01",
      label: "Submit for Evaluation",
      targetStatus: "ASSESSED",
      requiresJustification: false,
      buttonVariant: "default",
      icon: <FileCheck className="w-4 h-4" />,
      description: "I've completed the assessment. Check this against our risk tolerance.",
      recommendation: "recommended",
    },
  ],
  ASSESSED: [],
  EVALUATED: [
    {
      code: "T03",
      label: "Reduce This Risk",
      targetStatus: "TREATING",
      requiresJustification: true,
      requiresTreatmentPlan: true,
      buttonVariant: "default",
      icon: <Play className="w-4 h-4" />,
      description: "This risk is too high. I'll implement controls to bring it within tolerance.",
      recommendation: "recommended",
      showWhen: (toleranceStatus) => toleranceStatus === "EXCEEDS" || toleranceStatus === "CRITICAL",
    },
    {
      code: "T04",
      label: "Accept This Risk",
      targetStatus: "ACCEPTED",
      requiresJustification: true,
      buttonVariant: "secondary",
      icon: <CheckCircle className="w-4 h-4" />,
      description: "This risk is acceptable. I'm formally signing off on this level of exposure.",
      recommendation: "recommended",
      showWhen: (toleranceStatus) => toleranceStatus === "WITHIN",
    },
    {
      code: "T05",
      label: "Escalate to Leadership",
      targetStatus: "ESCALATED",
      requiresJustification: true,
      buttonVariant: "destructive",
      icon: <ArrowUp className="w-4 h-4" />,
      description: "This exceeds my authority. A senior leader must make this decision.",
      recommendation: "escalation",
    },
  ],
  TREATING: [
    {
      code: "T06",
      label: "Treatment Complete",
      targetStatus: "TREATED",
      requiresJustification: false,
      buttonVariant: "default",
      icon: <CheckCircle className="w-4 h-4" />,
      description: "All treatment actions are done. Ready to measure the new risk level.",
      recommendation: "recommended",
    },
  ],
  TREATED: [
    {
      code: "T07",
      label: "Measure New Risk Level",
      targetStatus: "ASSESSED",
      requiresJustification: false,
      buttonVariant: "default",
      icon: <RefreshCw className="w-4 h-4" />,
      description: "Re-assess to see if the treatment worked. Did we reduce the risk enough?",
      recommendation: "recommended",
    },
  ],
  ACCEPTED: [
    {
      code: "T24",
      label: "Something Changed",
      targetStatus: "REVIEW",
      requiresJustification: true,
      buttonVariant: "outline",
      icon: <RefreshCw className="w-4 h-4" />,
      description: "Circumstances have changed. This risk needs to be reviewed again.",
      recommendation: "alternative",
    },
  ],
  MONITORING: [
    {
      code: "T12",
      label: "Trigger Review",
      targetStatus: "REVIEW",
      requiresJustification: true,
      buttonVariant: "outline",
      icon: <RefreshCw className="w-4 h-4" />,
      description: "Something has changed. I need to reassess this risk.",
      recommendation: "alternative",
    },
    {
      code: "T18",
      label: "Risk No Longer Exists",
      targetStatus: "CLOSED",
      requiresJustification: true,
      buttonVariant: "secondary",
      icon: <Ban className="w-4 h-4" />,
      description: "The source of this risk has been eliminated. Close the scenario.",
      recommendation: "alternative",
    },
  ],
  ESCALATED: [
    {
      code: "T09",
      label: "Approve Treatment Plan",
      targetStatus: "TREATING",
      requiresJustification: true,
      requiresEscalationDecision: true,
      buttonVariant: "default",
      icon: <Play className="w-4 h-4" />,
      description: "I authorize the treatment. Proceed with implementing controls.",
      recommendation: "recommended",
    },
    {
      code: "T10",
      label: "Accept as Exception",
      targetStatus: "ACCEPTED",
      requiresJustification: true,
      requiresEscalationDecision: true,
      buttonVariant: "secondary",
      icon: <CheckCircle className="w-4 h-4" />,
      description: "I accept this risk despite it exceeding tolerance. This is a formal exception.",
      recommendation: "alternative",
    },
    {
      code: "T11",
      label: "Stop the Activity",
      targetStatus: "CLOSED",
      requiresJustification: true,
      requiresEscalationDecision: true,
      buttonVariant: "destructive",
      icon: <Ban className="w-4 h-4" />,
      description: "The risk is unacceptable. Terminate the activity that creates this risk.",
      recommendation: "escalation",
    },
  ],
  REVIEW: [
    {
      code: "T13",
      label: "No Change Needed",
      targetStatus: "MONITORING",
      requiresJustification: true,
      requiresReviewOutcome: true,
      buttonVariant: "secondary",
      icon: <CheckCircle className="w-4 h-4" />,
      description: "I've reviewed this. The risk level hasn't changed. Continue monitoring.",
      recommendation: "alternative",
    },
    {
      code: "T14",
      label: "Risk Level Changed",
      targetStatus: "ASSESSED",
      requiresJustification: true,
      requiresReviewOutcome: true,
      buttonVariant: "default",
      icon: <RefreshCw className="w-4 h-4" />,
      description: "The risk has changed. Re-evaluate against tolerance.",
      recommendation: "recommended",
    },
    {
      code: "T15",
      label: "New Treatment Needed",
      targetStatus: "TREATING",
      requiresJustification: true,
      requiresReviewOutcome: true,
      buttonVariant: "default",
      icon: <Play className="w-4 h-4" />,
      description: "Additional controls are needed. Start a new treatment plan.",
      recommendation: "recommended",
    },
    {
      code: "T25",
      label: "Risk No Longer Exists",
      targetStatus: "CLOSED",
      requiresJustification: true,
      buttonVariant: "secondary",
      icon: <Ban className="w-4 h-4" />,
      description: "This risk source has been eliminated. Close the scenario.",
      recommendation: "alternative",
    },
  ],
  CLOSED: [
    {
      code: "T19",
      label: "Archive",
      targetStatus: "ARCHIVED",
      requiresJustification: false,
      buttonVariant: "outline",
      icon: <Archive className="w-4 h-4" />,
      description: "Archive this scenario for long-term record keeping.",
      recommendation: "alternative",
    },
  ],
  ARCHIVED: [],
};

// ============================================
// DECISION GUIDANCE HELPER
// ============================================

export function getDecisionGuidance(
  status: ScenarioStatus,
  toleranceStatus?: string | null,
  residualScore?: number | null
): DecisionGuidance | null {
  if (status === "EVALUATED") {
    if (toleranceStatus === "WITHIN") {
      return {
        title: "Risk Within Tolerance",
        description: `Your risk score (${residualScore || 0}) is within the acceptable threshold. This risk can be accepted without further treatment.`,
        recommendedAction: "Accept Risk",
        icon: <CheckCircle className="w-5 h-5" />,
        color: "text-green-600",
      };
    } else if (toleranceStatus === "EXCEEDS") {
      return {
        title: "Risk Exceeds Tolerance",
        description: `Your risk score (${residualScore || 0}) exceeds the threshold. Consider implementing treatment controls to reduce the risk.`,
        recommendedAction: "Start Treatment",
        icon: <AlertTriangle className="w-5 h-5" />,
        color: "text-amber-600",
      };
    } else if (toleranceStatus === "CRITICAL") {
      return {
        title: "Critical Risk Level",
        description: `Your risk score (${residualScore || 0}) is critically high. Immediate action required - treatment or escalation to higher authority.`,
        recommendedAction: "Escalate or Start Treatment",
        icon: <AlertCircle className="w-5 h-5" />,
        color: "text-red-600",
      };
    }
  }
  return null;
}
