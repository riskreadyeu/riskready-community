"use client";

import { cn } from "@/lib/utils";

interface DetailStatCardProps {
  icon: React.ReactNode;
  iconBg?: string;
  label: string;
  value: string | number | React.ReactNode;
  subValue?: string | React.ReactNode;
  trend?: {
    direction: "up" | "down" | "stable";
    value: string;
  };
  status?: "success" | "warning" | "destructive" | "muted";
  onClick?: () => void;
  className?: string;
}

export function DetailStatCard({
  icon,
  iconBg = "bg-primary/10",
  label,
  value,
  subValue,
  trend,
  status,
  onClick,
  className,
}: DetailStatCardProps) {
  const statusBorders = {
    success: "border-l-success",
    warning: "border-l-warning",
    destructive: "border-l-destructive",
    muted: "border-l-muted-foreground",
  };

  return (
    <div
      className={cn(
        "bg-card border rounded-lg p-4 transition-all",
        status && `border-l-4 ${statusBorders[status]}`,
        onClick && "cursor-pointer hover:shadow-md hover:border-primary/30",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
          iconBg
        )}>
          {icon}
        </div>
        
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
          
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold">{value}</span>
            {subValue && (
              <span className="text-xs text-muted-foreground">{subValue}</span>
            )}
          </div>
          
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-xs mt-1",
              trend.direction === "up" && "text-success",
              trend.direction === "down" && "text-destructive",
              trend.direction === "stable" && "text-muted-foreground"
            )}>
              {trend.direction === "up" && "↑"}
              {trend.direction === "down" && "↓"}
              {trend.direction === "stable" && "→"}
              {trend.value}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Quick stats row for inline display
interface QuickStatProps {
  items: Array<{
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    status?: "success" | "warning" | "destructive" | "muted";
  }>;
  className?: string;
}

export function QuickStats({ items, className }: QuickStatProps) {
  return (
    <div className={cn("flex items-center gap-6 flex-wrap", className)}>
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          {item.icon}
          <span className="text-xs text-muted-foreground">{item.label}:</span>
          <span className={cn(
            "text-sm font-medium",
            item.status === "success" && "text-success",
            item.status === "warning" && "text-warning",
            item.status === "destructive" && "text-destructive"
          )}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
