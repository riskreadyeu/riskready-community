"use client";

import * as React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Shield,
  Layers,
  FileCheck,
  BarChart3,
  TestTube,
  AlertTriangle,
  TrendingUp,
  Search,
  LayoutDashboard,
  List,
  ClipboardCheck,
  CheckCircle2,
  Settings,
  Plus,
  FileText,
  Activity,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { getControls, getCapabilities } from "@/lib/controls-api";
import type { Control, Capability } from "@/lib/controls-api";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState("");
  const [controls, setControls] = React.useState<Control[]>([]);
  const [capabilities, setCapabilities] = React.useState<Capability[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Load data when search changes
  React.useEffect(() => {
    if (!open) return;
    
    const loadData = async () => {
      if (search.length < 2) {
        setControls([]);
        setCapabilities([]);
        return;
      }
      
      setLoading(true);
      try {
        const [controlsRes, capsRes] = await Promise.all([
          getControls({ search, take: 5 }),
          getCapabilities({ search, take: 5 }),
        ]);
        setControls(controlsRes.results);
        setCapabilities(capsRes.results);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(loadData, 200);
    return () => clearTimeout(debounce);
  }, [search, open]);

  // Reset search when closed
  React.useEffect(() => {
    if (!open) {
      setSearch("");
      setControls([]);
      setCapabilities([]);
    }
  }, [open]);

  const handleSelect = React.useCallback((callback: () => void) => {
    onOpenChange(false);
    callback();
  }, [onOpenChange]);

  // Navigation items
  const navigationItems = [
    { icon: LayoutDashboard, label: "Command Center", path: "/controls", shortcut: "⌘D" },
    { icon: List, label: "Control Browser", path: "/controls/library", shortcut: "⌘L" },
    { icon: ClipboardCheck, label: "Statement of Applicability", path: "/controls/soa" },
    { icon: TestTube, label: "Effectiveness Tests", path: "/controls/tests" },
    { icon: BarChart3, label: "Maturity Assessments", path: "/controls/assessments" },
    { icon: Layers, label: "All Capabilities", path: "/controls/capabilities" },
  ];

  const analysisItems = [
    { icon: CheckCircle2, label: "Effectiveness Report", path: "/controls/effectiveness" },
    { icon: BarChart3, label: "Maturity Heatmap", path: "/controls/maturity" },
    { icon: AlertTriangle, label: "Gap Analysis", path: "/controls/gaps" },
    { icon: TrendingUp, label: "Trend Analysis", path: "/controls/trends" },
  ];

  const actionItems = [
    { icon: Plus, label: "New Assessment", action: () => navigate("/controls/assessments/new") },
    { icon: TestTube, label: "Schedule Test", action: () => navigate("/controls/tests/schedule") },
    { icon: FileText, label: "Export Report", action: () => toast.info("Export is not yet available") },
    { icon: Activity, label: "View Activity", action: () => navigate("/controls/activity") },
  ];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search controls, capabilities, or navigate..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? "Searching..." : "No results found."}
        </CommandEmpty>

        {/* Search Results - Controls */}
        {controls.length > 0 && (
          <CommandGroup heading="Controls">
            {controls.map((control) => (
              <CommandItem
                key={control.id}
                value={`control-${control.controlId}-${control.name}`}
                onSelect={() => handleSelect(() => navigate(`/controls/${control.id}`))}
              >
                <Shield className="h-4 w-4 text-blue-500" />
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {control.controlId}
                    </span>
                    <Badge variant="outline" className="text-[10px] h-4">
                      {control.framework}
                    </Badge>
                  </div>
                  <span className="truncate text-sm">{control.name}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Search Results - Capabilities */}
        {capabilities.length > 0 && (
          <CommandGroup heading="Capabilities">
            {capabilities.map((capability) => (
              <CommandItem
                key={capability.id}
                value={`capability-${capability.capabilityId}-${capability.name}`}
                onSelect={() => handleSelect(() => 
                  navigate(`/controls/${capability.controlId}/capabilities/${capability.id}`)
                )}
              >
                <Layers className="h-4 w-4 text-purple-500" />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="font-mono text-xs text-muted-foreground">
                    {capability.capabilityId}
                  </span>
                  <span className="truncate text-sm">{capability.name}</span>
                </div>
                <Badge 
                  variant="secondary" 
                  className="text-[10px] h-4"
                >
                  {capability.type}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Show navigation when not searching */}
        {search.length < 2 && (
          <>
            <CommandGroup heading="Navigation">
              {navigationItems.map((item) => (
                <CommandItem
                  key={item.path}
                  value={`nav-${item.label}`}
                  onSelect={() => handleSelect(() => navigate(item.path))}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.shortcut && (
                    <CommandShortcut>{item.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Analytics">
              {analysisItems.map((item) => (
                <CommandItem
                  key={item.path}
                  value={`analysis-${item.label}`}
                  onSelect={() => handleSelect(() => navigate(item.path))}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Quick Actions">
              {actionItems.map((item) => (
                <CommandItem
                  key={item.label}
                  value={`action-${item.label}`}
                  onSelect={() => handleSelect(item.action)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

// Hook to manage command palette state
export function useCommandPalette() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return { open, setOpen };
}
