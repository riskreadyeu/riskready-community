import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  icon?: ReactNode;
  iconClassName?: string;
  variant?: "default" | "success" | "warning" | "destructive";
  trend?: {
    value: number;
    label?: string;
    positive?: boolean;
  };
  className?: string;
}

const variantClasses = {
  default: "",
  success: "border-green-500/20 bg-green-500/5",
  warning: "border-amber-500/20 bg-amber-500/5",
  destructive: "border-red-500/20 bg-red-500/5",
};

export function StatCard({
  title,
  value,
  subtitle,
  description,
  icon,
  iconClassName,
  variant = "default",
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("bg-card border-border glass-card", variantClasses[variant], className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && (
          <div className={cn("h-4 w-4 text-muted-foreground", iconClassName)}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(subtitle || description) && (
          <p className="text-xs text-muted-foreground">{subtitle || description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            <span
              className={cn(
                "text-xs font-medium",
                trend.positive ? "text-success" : "text-destructive"
              )}
            >
              {trend.positive ? "+" : ""}{trend.value}%
            </span>
            {trend.label && (
              <span className="text-xs text-muted-foreground">{trend.label}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StatCardGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
}

export function StatCardGrid({ children, columns = 4 }: StatCardGridProps) {
  const colClasses = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
    5: "md:grid-cols-5",
    6: "md:grid-cols-6",
  };

  return (
    <div className={cn("grid gap-4", colClasses[columns])}>
      {children}
    </div>
  );
}
