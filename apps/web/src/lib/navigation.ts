import type { ComponentType } from "react";

import {
  AlertTriangle,
  Bot,
  Building2,
  ClipboardCheck,
  FileCheck,
  FileText,
  LayoutDashboard,
  type LucideIcon,
  Server,
  Shield,
  Sliders,
} from "lucide-react";

import { AuditsSidebar } from "@/components/audits/audits-sidebar";
import { ControlsSidebar } from "@/components/controls/controls-sidebar";
import { EvidenceSidebar } from "@/components/evidence/evidence-sidebar";
import { IncidentsSidebar } from "@/components/incidents/incidents-sidebar";
import { ITSMSidebar } from "@/components/itsm/itsm-sidebar";
import { OrganisationSidebar } from "@/components/organisation/organisation-sidebar";
import { PoliciesSidebar } from "@/components/policies/policies-sidebar";
import { RisksSidebar } from "@/components/risks/risks-sidebar";

export type NavItem = {
  title: string;
  to: string;
  icon: LucideIcon;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

type ShellModule = {
  key: string;
  matchPrefix: string;
  sidebar: ComponentType<{ className?: string }>;
};

export const shellMeta = {
  appName: "RiskReady",
  edition: "Community Edition",
  version: "v0.1",
} as const;

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
      { title: "Assistant", to: "/assistant", icon: Bot },
    ],
  },
  {
    label: "Risk & Compliance",
    items: [
      { title: "Risk Management", to: "/risks", icon: Shield },
      { title: "Control Management", to: "/controls", icon: Sliders },
      { title: "Policies & Compliance", to: "/policies", icon: FileText },
      { title: "Audit Management", to: "/audits", icon: ClipboardCheck },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "ITSM / CMDB", to: "/itsm", icon: Server },
      { title: "Incidents", to: "/incidents", icon: AlertTriangle },
    ],
  },
  {
    label: "Governance",
    items: [
      { title: "Organisation", to: "/organisation", icon: Building2 },
      { title: "Evidence Center", to: "/evidence", icon: FileCheck },
    ],
  },
];

const shellModules: ShellModule[] = [
  { key: "organisation", matchPrefix: "/organisation", sidebar: OrganisationSidebar },
  { key: "controls", matchPrefix: "/controls", sidebar: ControlsSidebar },
  { key: "risks", matchPrefix: "/risks", sidebar: RisksSidebar },
  { key: "audits", matchPrefix: "/audits", sidebar: AuditsSidebar },
  { key: "policies", matchPrefix: "/policies", sidebar: PoliciesSidebar },
  { key: "itsm", matchPrefix: "/itsm", sidebar: ITSMSidebar },
  { key: "incidents", matchPrefix: "/incidents", sidebar: IncidentsSidebar },
  { key: "evidence", matchPrefix: "/evidence", sidebar: EvidenceSidebar },
];

export function resolveShellModule(pathname: string) {
  return shellModules.find((module) => pathname.startsWith(module.matchPrefix)) ?? null;
}
