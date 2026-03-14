import { useEffect, useState } from "react";
import {
  getControls,
  getControlStats,
  type Control,
  type ControlFramework,
  type ControlStats,
  type ControlTheme,
  type ImplementationStatus,
} from "@/lib/controls-api";
import { logAppError } from "@/lib/app-errors";

export function useControlsLibrary() {
  const [loading, setLoading] = useState(true);
  const [controls, setControls] = useState<Control[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<ControlStats | null>(null);
  const [themeFilter, setThemeFilterState] = useState<string>("all");
  const [statusFilter, setStatusFilterState] = useState<string>("all");
  const [frameworkFilter, setFrameworkFilterState] = useState<string>("all");
  const [activeOnly, setActiveOnlyState] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  async function refresh() {
    try {
      setLoading(true);
      const [controlsData, statsData] = await Promise.all([
        getControls({
          skip: (currentPage - 1) * pageSize,
          take: pageSize,
          ...(themeFilter !== "all" && { theme: themeFilter as ControlTheme }),
          ...(statusFilter !== "all" && {
            implementationStatus: statusFilter as ImplementationStatus,
          }),
          ...(frameworkFilter !== "all" && {
            framework: frameworkFilter as ControlFramework,
          }),
          ...(activeOnly && { activeOnly: true }),
        }),
        getControlStats(),
      ]);

      setControls(controlsData.results);
      setTotalCount(controlsData.count);
      setStats(statsData);
    } catch (error) {
      logAppError("Error loading controls:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [currentPage, pageSize, themeFilter, statusFilter, frameworkFilter, activeOnly]);

  function setThemeFilter(value: string) {
    setThemeFilterState(value);
    setCurrentPage(1);
  }

  function setStatusFilter(value: string) {
    setStatusFilterState(value);
    setCurrentPage(1);
  }

  function setFrameworkFilter(value: string) {
    setFrameworkFilterState(value);
    setCurrentPage(1);
  }

  function setActiveOnly(value: boolean) {
    setActiveOnlyState(value);
    setCurrentPage(1);
  }

  return {
    loading,
    controls,
    totalCount,
    stats,
    themeFilter,
    setThemeFilter,
    statusFilter,
    setStatusFilter,
    frameworkFilter,
    setFrameworkFilter,
    activeOnly,
    setActiveOnly,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    refresh,
  };
}
