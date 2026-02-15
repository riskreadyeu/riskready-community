import { NavLink, useLocation } from "react-router-dom";
import {
  AlertTriangle,
  LayoutDashboard,
  List,
  Plus,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IncidentsSidebarProps {
  className?: string;
}

const navSections = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", to: "/incidents", end: true, icon: LayoutDashboard },
      { title: "Incident Register", to: "/incidents/register", icon: List },
      { title: "Report Incident", to: "/incidents/new", icon: Plus },
    ],
  },
  {
    title: "Learning",
    items: [
      { title: "Lessons Learned", to: "/incidents/lessons", icon: BookOpen },
    ],
  },
];

export function IncidentsSidebar({ className }: IncidentsSidebarProps) {
  const location = useLocation();

  return (
    <div className={cn("flex flex-col bg-sidebar", className)}>
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-sidebar-foreground">
              Incidents
            </h2>
            <p className="text-[10px] text-muted-foreground">
              Response & Learning
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {navSections.map((section) => (
          <div key={section.title}>
            <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </span>
            <div className="mt-2 space-y-1">
              {section.items.map((item) => {
                const isActive = item.end
                  ? location.pathname === item.to
                  : location.pathname === item.to ||
                    location.pathname.startsWith(item.to + "/");

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
                    <item.icon
                      className={cn("h-4 w-4 shrink-0", isActive && "text-sidebar-primary")}
                    />
                    <span>{item.title}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}

export default IncidentsSidebar;
