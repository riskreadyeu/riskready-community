import { Link, useLocation } from "react-router-dom";
import {
  Archive,
  Clock,
  FileCheck,
  FileSearch,
  FileText,
  FolderOpen,
  Home,
  Link2,
  Send,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  {
    group: "Overview",
    items: [
      { label: "Dashboard", icon: Home, href: "/evidence" },
      { label: "Repository", icon: FolderOpen, href: "/evidence/repository" },
    ],
  },
  {
    group: "Workflow",
    items: [
      { label: "Requests", icon: Send, href: "/evidence/requests" },
      { label: "Pending Review", icon: Clock, href: "/evidence/pending" },
      { label: "Approved", icon: FileCheck, href: "/evidence/approved" },
    ],
  },
  {
    group: "Discovery",
    items: [
      { label: "Search", icon: FileSearch, href: "/evidence/search" },
      { label: "Linked Entities", icon: Link2, href: "/evidence/links" },
    ],
  },
  {
    group: "Analytics",
    items: [
      { label: "Coverage Report", icon: TrendingUp, href: "/evidence/coverage" },
      { label: "Expiring Soon", icon: Clock, href: "/evidence/expiring" },
      { label: "Archive", icon: Archive, href: "/evidence/archive" },
    ],
  },
];

export function EvidenceSidebar({ className }: { className?: string }) {
  const location = useLocation();

  return (
    <aside className={cn("hidden lg:flex flex-col w-56 shrink-0 border-r border-border/50 bg-background/50 backdrop-blur-sm", className)}>
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Evidence Center</h2>
            <p className="text-[10px] text-muted-foreground">Central repository</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        {sidebarItems.map((group) => (
          <div key={group.group}>
            <h3 className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.group}
            </h3>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
