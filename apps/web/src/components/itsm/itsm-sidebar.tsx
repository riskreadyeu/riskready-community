import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Server,
  GitBranch,
  Plus,
  Clock,
  Shield,
  AlertTriangle,
  Calendar,
  Users,
  Gauge,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Custom hook to check if a nav item is active (handles query strings properly)
function useIsNavActive(to: string, end?: boolean): boolean {
  const location = useLocation();
  const [path, search] = to.split('?') as [string, string | undefined];

  // Check if path matches
  const pathMatches = end
    ? location.pathname === path
    : location.pathname.startsWith(path);
  
  if (!pathMatches) return false;
  
  // If the link has query params, check them too
  if (search) {
    const linkParams = new URLSearchParams(search);
    const currentParams = new URLSearchParams(location.search);
    
    // All link params must match current params
    for (const [key, value] of linkParams.entries()) {
      if (currentParams.get(key) !== value) return false;
    }
    return true;
  }
  
  // If link has no query params but we're checking exact match
  // Only match if current URL also has no query params (or end is true)
  if (end) {
    return location.search === '';
  }
  
  // For non-end links without query params, only match if current has no query params
  // This prevents /itsm/assets from matching /itsm/assets?businessCriticality=CRITICAL
  return location.search === '' || !location.pathname.endsWith(path);
}

interface ITSMSidebarProps {
  className?: string;
}

const navSections = [
  {
    title: 'Overview',
    items: [
      { title: 'Dashboard', to: '/itsm', icon: LayoutDashboard, end: true },
      { title: 'Data Quality', to: '/itsm/data-quality', icon: Gauge },
    ],
  },
  {
    title: 'Asset Management',
    items: [
      { title: 'Asset Register', to: '/itsm/assets', icon: Server, end: true },
      { title: 'New Asset', to: '/itsm/assets/new', icon: Plus },
      { title: 'Critical Assets', to: '/itsm/assets?businessCriticality=CRITICAL', icon: Shield },
      { title: 'Capacity Alerts', to: '/itsm/assets?capacityStatus=WARNING', icon: AlertTriangle },
    ],
  },
  {
    title: 'Change Management',
    items: [
      { title: 'Change Register', to: '/itsm/changes', icon: GitBranch, end: true },
      { title: 'New Change', to: '/itsm/changes/new', icon: Plus },
      { title: 'Change Calendar', to: '/itsm/changes/calendar', icon: Calendar },
      { title: 'CAB Dashboard', to: '/itsm/changes/cab', icon: Users },
      { title: 'Change Templates', to: '/itsm/change-templates', icon: FileText },
      { title: 'Pending Approval', to: '/itsm/changes?status=PENDING_APPROVAL', icon: Clock },
    ],
  },
  {
    title: 'Capacity Management',
    items: [
      { title: 'Capacity Plans', to: '/itsm/capacity-plans', icon: Gauge },
    ],
  },
];

// NavItem component that properly handles query string matching
function NavItem({ item }: { item: typeof navSections[0]['items'][0] }) {
  const isActive = useIsNavActive(item.to, item.end);
  const Icon = item.icon;
  
  return (
    <NavLink
      to={item.to}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
        isActive
          ? 'bg-sidebar-primary/10 text-sidebar-primary font-medium'
          : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
      )}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
      )}
      <Icon
        className={cn(
          'h-4 w-4 shrink-0',
          isActive && 'text-sidebar-primary'
        )}
      />
      <span>{item.title}</span>
    </NavLink>
  );
}

export function ITSMSidebar({ className }: ITSMSidebarProps) {
  return (
    <div className={cn('flex flex-col bg-sidebar', className)}>
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary/10">
            <Server className="h-4 w-4 text-sidebar-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-sidebar-foreground">ITSM</h2>
            <p className="text-[10px] text-muted-foreground">Asset & Change Mgmt</p>
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
              {section.items.map((item) => (
                <NavItem key={item.to} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}
