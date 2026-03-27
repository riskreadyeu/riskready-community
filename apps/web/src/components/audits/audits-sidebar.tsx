import { NavLink, useLocation } from "react-router-dom";
import {
  ClipboardCheck,
  LayoutDashboard,
  FileWarning,
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

const auditsNavGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", to: "/audits", icon: LayoutDashboard },
    ],
  },
  {
    label: "Nonconformities",
    items: [
      { title: "NC Register", to: "/audits/nonconformities", icon: FileWarning },
    ],
  },
];

export function AuditsSidebar({ className }: { className?: string }) {
  const location = useLocation();

  return (
    <div className={cn("flex h-full flex-col bg-sidebar border-r border-sidebar-border", className)}>
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <ClipboardCheck className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">Audits</span>
            <span className="text-[10px] text-muted-foreground">Module Navigation</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {auditsNavGroups.map((group) => (
            <div key={group.label}>
              <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </span>
              <div className="mt-2 space-y-1">
                {group.items.map((item) => {
                  const isActive = item.to === "/audits" 
                    ? location.pathname === "/audits"
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

export function useIsAuditsRoute(): boolean {
  const location = useLocation();
  return location.pathname.startsWith("/audits");
}
