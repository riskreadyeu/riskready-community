// =============================================================================
// Risks Module - Page Exports (Community Edition)
// =============================================================================

// Shared constants and helpers
export * from "./_shared";

// Dashboard & List Pages
export { RisksV2DashboardPage as RisksDashboardPage } from "./dashboard";
export { RiskRegisterV2Page as RiskRegisterPage } from "./risk-register";
export { RTSListV2Page as RTSListPage } from "./rts-list";
export { TreatmentPlanListV2Page as TreatmentPlanListPage } from "./treatment-plan-list";

// Detail Pages
export { RiskDetailV2Page as RiskDetailPage } from "./risk-detail";
export { RiskScenarioDetailV2Page as RiskScenarioDetailPage } from "./scenario-detail";
export { RTSDetailV2Page as RTSDetailPage } from "./rts-detail";
export { TreatmentPlanDetailV2Page as TreatmentPlanDetailPage } from "./treatment-plan-detail";

// Create Pages
export { default as RiskCreatePage } from "./RiskCreatePage";
export { default as RTSCreatePage } from "./RTSCreatePage";
export { default as TreatmentPlanCreatePage } from "./TreatmentPlanCreatePage";
export { default as ScenarioCreatePage } from "./ScenarioCreatePage";
