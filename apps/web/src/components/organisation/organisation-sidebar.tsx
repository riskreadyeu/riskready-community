import { NavLink, useLocation } from "react-router-dom";
import {
  Building2,
  MapPin,
  Network,
  Link2,
  Scale,
  Users,
  Shield,
  Calendar,
  CheckSquare,
  Gavel,
  Crown,
  FileCheck,
  LayoutDashboard,
  Package,
  Server,
  AlertCircle,
  ClipboardCheck,
  FileText,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const organisationNavGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", to: "/organisation", icon: LayoutDashboard },
    ],
  },
  {
    label: "Structure",
    items: [
      { title: "Departments", to: "/organisation/departments", icon: Building2 },
      { title: "Locations", to: "/organisation/locations", icon: MapPin },
      { title: "Business Processes", to: "/organisation/processes", icon: Network },
      { title: "External Dependencies", to: "/organisation/dependencies", icon: Link2 },
      { title: "Products & Services", to: "/organisation/products-services", icon: Package },
      { title: "Technology Platforms", to: "/organisation/technology-platforms", icon: Server },
    ],
  },
  {
    label: "Governance",
    items: [
      { title: "Security Committees", to: "/organisation/security-committees", icon: Shield },
      { title: "Committee Meetings", to: "/organisation/committee-meetings", icon: Calendar },
      { title: "Meeting Decisions", to: "/organisation/meeting-decisions", icon: Gavel },
      { title: "Action Items", to: "/organisation/meeting-action-items", icon: CheckSquare },
    ],
  },
  {
    label: "People",
    items: [
      { title: "Key Personnel", to: "/organisation/key-personnel", icon: UserCheck },
      { title: "Executive Positions", to: "/organisation/executive-positions", icon: Crown },
      { title: "Security Champions", to: "/organisation/security-champions", icon: Shield },
    ],
  },
  {
    label: "ISMS Context",
    items: [
      { title: "Interested Parties", to: "/organisation/interested-parties", icon: Users },
      { title: "Context Issues", to: "/organisation/context-issues", icon: AlertCircle },
    ],
  },
  {
    label: "Organisation",
    items: [
      { title: "Organisation Profile", to: "/organisation/profiles", icon: Building2 },
    ],
  },
  {
    label: "Compliance",
    items: [
      { title: "Applicable Frameworks", to: "/organisation/applicable-frameworks", icon: FileCheck },
      { title: "Regulators", to: "/organisation/regulators", icon: Scale },
      { title: "DORA Assessment", to: "/organisation/regulatory-eligibility?type=dora", icon: ClipboardCheck },
      { title: "NIS2 Assessment", to: "/organisation/regulatory-eligibility?type=nis2", icon: FileText },
    ],
  },
];

export function OrganisationSidebar({ className }: { className?: string }) {
  const location = useLocation();

  return (
    <div className={cn("flex h-full flex-col bg-sidebar border-r border-sidebar-border", className)}>
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">Organisation</span>
            <span className="text-[10px] text-muted-foreground">Module Navigation</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {organisationNavGroups.map((group) => (
            <div key={group.label}>
              <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </span>
              <div className="mt-2 space-y-1">
                {group.items.map((item) => {
                  const isActive = item.to === "/organisation" 
                    ? location.pathname === "/organisation"
                    : location.pathname.startsWith(item.to);
                  
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                      )}
                      <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                      <span className="flex-1 truncate">{item.title}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function useIsOrganisationRoute(): boolean {
  const location = useLocation();
  return location.pathname.startsWith("/organisation");
}
