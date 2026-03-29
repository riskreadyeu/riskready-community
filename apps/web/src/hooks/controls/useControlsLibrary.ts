import { useState } from "react";
import {
  type ControlFramework,
  type ControlTheme,
  type ImplementationStatus,
} from "@/lib/controls-api";
import { useControls, useControlStats } from "@/hooks/queries";

export function useControlsLibrary() {
  const [themeFilter, setThemeFilterState] = useState<string>("all");
  const [statusFilter, setStatusFilterState] = useState<string>("all");
  const [frameworkFilter, setFrameworkFilterState] = useState<string>("all");
  const [activeOnly, setActiveOnlyState] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { data: controlsData, isLoading: controlsLoading, refetch: refresh } = useControls({
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
  });

  const { data: stats = null, isLoading: statsLoading } = useControlStats();

  const controls = controlsData?.results ?? [];
  const totalCount = controlsData?.count ?? 0;
  const loading = controlsLoading || statsLoading;

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
