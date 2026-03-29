
import { NavLink, useLocation } from "react-router-dom";
import {
  FileText,
  LayoutDashboard,
  FolderTree,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  LinkIcon,
  Clock,
  ChevronRight,
  CalendarCheck,
  FilePenLine,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: "default" | "warning" | "destructive";
}

const navGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", to: "/policies", icon: LayoutDashboard },
    ],
  },
  {
    label: "Document Management",
    items: [
      { title: "All Documents", to: "/policies/documents", icon: FileText },
      { title: "Document Hierarchy", to: "/policies/hierarchy", icon: FolderTree },
      { title: "Version History", to: "/policies/versions", icon: GitBranch },
      { title: "Reviews", to: "/policies/reviews", icon: CalendarCheck },
    ],
  },
  {
    label: "Governance",
    items: [
      { title: "Pending Approvals", to: "/policies/approvals", icon: CheckCircle2 },
      { title: "Change Requests", to: "/policies/changes", icon: FilePenLine },
      { title: "Exceptions", to: "/policies/exceptions", icon: AlertTriangle },
    ],
  },
  {
    label: "Compliance",
    items: [
      { title: "Acknowledgments", to: "/policies/acknowledgments", icon: UserCheck },
      { title: "Control Mappings", to: "/policies/mappings", icon: LinkIcon },
    ],
  },
];

interface PoliciesSidebarProps {
  className?: string;
}

export function PoliciesSidebar({ className }: PoliciesSidebarProps) {
  const location = useLocation();

  return (
    <div className={cn("flex h-full flex-col bg-sidebar", className)}>
      {/* Header */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary/10">
          <FileText className="h-4 w-4 text-sidebar-primary" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-sidebar-foreground">Policies</span>
          <span className="text-[10px] text-muted-foreground">Document Management</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </span>
            <div className="mt-2 space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.to || 
                  (item.to !== "/policies" && location.pathname.startsWith(item.to));
                
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                      isActive
                        ? "bg-sidebar-primary/10 text-sidebar-primary font-medium"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
                    )}
                    <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-sidebar-primary")} />
                    <span className="flex-1">{item.title}</span>
                    {item.badge !== undefined && (
                      <span
                        className={cn(
                          "flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-medium",
                          item.badgeColor === "warning"
                            ? "bg-warning/10 text-warning"
                            : item.badgeColor === "destructive"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                    {!item.badge && (
                      <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer - Quick Stats */}
      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-lg bg-sidebar-accent/50 p-3">
          <div className="text-xs font-medium text-sidebar-foreground mb-2">Quick Stats</div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="text-muted-foreground">Published</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-warning" />
              <span className="text-muted-foreground">Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-destructive" />
              <span className="text-muted-foreground">Overdue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-muted-foreground" />
              <span className="text-muted-foreground">Draft</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
