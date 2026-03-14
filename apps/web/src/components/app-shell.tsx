import { useMemo, useState, useEffect, type PropsWithChildren } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Bell,
  Bot,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Command,
  HelpCircle,
  LogOut,
  Menu,
  Search,
  Settings,
  Shield,
  Sparkles,
} from "lucide-react";
import { CommandPalette, useCommandPalette } from "@/components/controls/command-palette";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { navGroups, resolveShellModule, shellMeta } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type User = { id: string; email: string };

function formatUserName(email: string) {
  const localPart = email.split("@")[0] ?? "";
  const parts = localPart.split(/[._-]/g).filter(Boolean);

  if (parts.length === 0) {
    return email;
  }

  return parts
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function SideNav(props: { className?: string; collapsed?: boolean; onToggle?: () => void }) {
  return (
    <div className={cn("flex h-full flex-col", props.className)}>
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <Link to="/dashboard" className={cn("flex items-center gap-3", props.collapsed && "justify-center w-full")}>
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/60 shadow-lg glow-primary">
            <Shield className="h-5 w-5 text-sidebar-primary-foreground" />
            <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-success" />
          </div>
          {!props.collapsed ? (
            <div className="flex flex-col">
              <span className="text-base font-semibold tracking-tight text-sidebar-foreground">{shellMeta.appName}</span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{shellMeta.edition}</span>
            </div>
          ) : null}
        </Link>
        {!props.collapsed ? (
          <button
            type="button"
            onClick={props.onToggle}
            className="rounded-lg p-1.5 text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {props.collapsed ? (
        <button
          type="button"
          onClick={props.onToggle}
          className="mx-auto mt-3 rounded-lg p-2 text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : null}

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!props.collapsed ? (
              <span className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </span>
            ) : null}
            <div className={cn("mt-2 space-y-1", props.collapsed && "mt-0")}>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={props.collapsed ? item.title : undefined}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                      isActive
                        ? "bg-sidebar-primary/10 text-sidebar-primary font-medium"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      props.collapsed && "justify-center px-2",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive ? (
                        <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
                      ) : null}
                      <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive && "text-sidebar-primary")} />
                      {!props.collapsed ? (
                        <>
                          <span className="flex-1">{item.title}</span>
                        </>
                      ) : null}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-2 border-t border-sidebar-border p-3">
        {!props.collapsed ? (
          <div className="rounded-lg border border-sidebar-primary/20 bg-gradient-to-br from-sidebar-primary/10 to-sidebar-primary/5 p-3">
            <div className="flex items-center gap-2 text-sidebar-primary">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-medium">Community Edition</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
              Approvals, notifications, and AI actions are shown here when the connected services are available.
            </p>
          </div>
        ) : null}
        <NavLink
          to="/settings/mcp-approvals"
          title={props.collapsed ? "AI Action Queue" : undefined}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground",
              props.collapsed && "justify-center px-2",
              isActive && "bg-sidebar-accent text-sidebar-foreground",
            )
          }
        >
          <Bot className="h-[18px] w-[18px] shrink-0" />
          {!props.collapsed ? <span>AI Action Queue</span> : null}
        </NavLink>
        <NavLink
          to="/settings"
          title={props.collapsed ? "Settings" : undefined}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground",
              props.collapsed && "justify-center px-2",
              isActive && "bg-sidebar-accent text-sidebar-foreground",
            )
          }
        >
          <Settings className="h-[18px] w-[18px] shrink-0" />
          {!props.collapsed ? <span>Settings</span> : null}
        </NavLink>
        <div className="text-xs text-muted-foreground">{shellMeta.version}</div>
      </div>
    </div>
  );
}

export default function AppShell(
  props: PropsWithChildren<{ user: User; onLogout: () => Promise<void> }>,
) {
  const location = useLocation();
  const activeModule = resolveShellModule(location.pathname);
  const hasSecondarySidebar = activeModule !== null;
  const SecondarySidebar = activeModule?.sidebar ?? null;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [manuallyExpanded, setManuallyExpanded] = useState(false);
  const { open: commandOpen, setOpen: setCommandOpen } = useCommandPalette();

  // Auto-collapse main sidebar when on routes with secondary sidebar
  useEffect(() => {
    if (hasSecondarySidebar && !manuallyExpanded) {
      setSidebarCollapsed(true);
    } else if (!hasSecondarySidebar) {
      setSidebarCollapsed(false);
      setManuallyExpanded(false);
    }
  }, [hasSecondarySidebar, manuallyExpanded]);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    if (hasSecondarySidebar) {
      setManuallyExpanded(sidebarCollapsed); // If currently collapsed, user is expanding
    }
  };

  const userMeta = useMemo(() => {
    const email = props.user.email;
    const initials = email
      .split("@")[0]!
      .split(/[._-]/g)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("")
      .slice(0, 2);
    return {
      email,
      name: formatUserName(email),
      role: "Community user",
      initials: initials || "RR",
    };
  }, [props.user.email]);

  return (
    <div className="flex h-screen bg-background">
      <aside
        className={cn(
          "hidden border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-out lg:flex",
          sidebarCollapsed ? "w-[68px]" : "w-[260px]",
        )}
      >
        <SideNav collapsed={sidebarCollapsed} onToggle={handleSidebarToggle} className="w-full" />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-card/50 px-4 backdrop-blur-sm lg:px-6">
          <div className="flex flex-1 items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <div className="h-full w-[260px] bg-sidebar">
                  <SideNav className="h-full" />
                </div>
              </SheetContent>
            </Sheet>

            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="group relative hidden max-w-md flex-1 sm:block"
            >
              <div className="flex w-full items-center rounded-xl border border-border bg-secondary/50 py-2.5 pl-3.5 pr-3 text-sm text-muted-foreground transition-all hover:bg-secondary hover:border-border/80">
                <Search className="mr-2 h-4 w-4" />
                <span className="flex-1 text-left">Search controls, capabilities...</span>
                <kbd className="ml-2 hidden items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:inline-flex">
                  <Command className="h-2.5 w-2.5" />K
                </kbd>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground hover:text-foreground">
              <HelpCircle className="h-5 w-5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-xl text-muted-foreground hover:text-foreground">
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse-glow" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[360px] p-0">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <span className="text-sm font-semibold">Notifications</span>
                  <Badge variant="secondary" className="text-[10px]">
                    Preview
                  </Badge>
                </div>
                <div className="p-4">
                  <p className="text-sm text-muted-foreground">
                    Live notifications are not configured in the community shell yet.
                  </p>
                </div>
                <div className="border-t border-border p-2">
                  <Button variant="ghost" className="h-8 w-full text-xs">
                    Notification center coming later
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="mx-2 h-6 w-px bg-border" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 rounded-xl px-2 hover:bg-secondary/50"
                  data-testid="user-menu-trigger"
                >
                  <Avatar className="h-8 w-8 border-2 border-sidebar-primary/20">
                    <AvatarImage src="/professional-headshot.png" />
                    <AvatarFallback className="bg-sidebar-primary/10 text-xs font-medium text-sidebar-primary">
                      {userMeta.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden flex-col items-start md:flex">
                    <span className="text-sm font-medium">{userMeta.name}</span>
                    <span className="text-[10px] text-muted-foreground">{userMeta.role}</span>
                  </div>
                  <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{userMeta.name}</p>
                    <p className="text-xs text-muted-foreground">{userMeta.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile Settings</DropdownMenuItem>
                <DropdownMenuItem>Organization</DropdownMenuItem>
                <DropdownMenuItem>Team Members</DropdownMenuItem>
                <DropdownMenuItem>Billing</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={async () => {
                    await props.onLogout();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {SecondarySidebar ? (
            <aside
              className="hidden w-[260px] border-r border-sidebar-border lg:block"
              data-testid="shell-secondary-sidebar"
            >
              <SecondarySidebar className="h-full" />
            </aside>
          ) : null}

          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="w-full">{props.children}</div>
          </main>
        </div>
      </div>

      {/* Global Command Palette */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
