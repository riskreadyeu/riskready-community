import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Card variants for consistent styling across the application
 *
 * - default: Standard card with subtle shadow
 * - glass: Frosted glass effect with backdrop blur (for dashboards/overview)
 * - elevated: More prominent shadow for standalone content
 * - interactive: With hover effects for clickable cards
 * - metric: For KPI/metric display cards
 * - insight: For insight/recommendation cards with colored accents
 */
const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground transition-all duration-200",
  {
    variants: {
      variant: {
        default: "shadow-sm",
        glass: "shadow-sm glass-card",
        elevated: "shadow-md",
        interactive: "shadow-sm hover:shadow-md hover:border-primary/30 cursor-pointer",
        metric: "shadow-sm hover:shadow-md hover:border-primary/30",
        insight: "shadow-sm border-l-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

/**
 * Enhanced CardHeader with icon support
 * Use this for consistent header styling across the app
 */
interface CardHeaderWithIconProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  iconBgColor?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const CardHeaderWithIcon = React.forwardRef<HTMLDivElement, CardHeaderWithIconProps>(
  ({ className, icon, iconBgColor = "bg-primary/10", title, description, action, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-between p-6 pb-3", className)}
      {...props}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className={cn("p-2 rounded-lg", iconBgColor)}>
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-card-title">{title}</h3>
          {description && (
            <p className="text-caption text-muted-foreground mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
);
CardHeaderWithIcon.displayName = "CardHeaderWithIcon";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-card-title", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

/**
 * MetricCard - Specialized card for displaying KPIs and metrics
 * Commonly used in dashboards
 */
interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBgColor?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  (
    {
      className,
      title,
      value,
      subtitle,
      icon,
      iconBgColor = "bg-primary/10",
      trend,
      trendValue,
      ...props
    },
    ref
  ) => (
    <Card
      ref={ref}
      variant="metric"
      className={cn("p-4", className)}
      {...props}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-caption">{title}</p>
          <p className="text-lg font-bold">{value}</p>
          {subtitle && (
            <p className="text-caption">{subtitle}</p>
          )}
          {trend && trendValue && (
            <p
              className={cn(
                "text-xs font-medium",
                trend === "up" && "text-green-600",
                trend === "down" && "text-red-600",
                trend === "neutral" && "text-muted-foreground"
              )}
            >
              {trend === "up" && "↑"}
              {trend === "down" && "↓"}
              {trend === "neutral" && "→"} {trendValue}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn("p-2 rounded-lg", iconBgColor)}>{icon}</div>
        )}
      </div>
    </Card>
  )
);
MetricCard.displayName = "MetricCard";

/**
 * InsightCard - Specialized card for insights, recommendations, and alerts
 * Commonly used for action items and warnings
 */
interface InsightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon?: React.ReactNode;
  accentColor?: "primary" | "success" | "warning" | "destructive" | "info";
  action?: React.ReactNode;
}

const accentColorMap = {
  primary: "border-l-primary bg-primary/5",
  success: "border-l-green-500 bg-green-500/5",
  warning: "border-l-amber-500 bg-amber-500/5",
  destructive: "border-l-red-500 bg-red-500/5",
  info: "border-l-blue-500 bg-blue-500/5",
};

const InsightCard = React.forwardRef<HTMLDivElement, InsightCardProps>(
  (
    {
      className,
      title,
      description,
      icon,
      accentColor = "primary",
      action,
      ...props
    },
    ref
  ) => (
    <Card
      ref={ref}
      variant="insight"
      className={cn("p-4", accentColorMap[accentColor], className)}
      {...props}
    >
      <div className="flex items-start gap-3">
        {icon && <div className="flex-shrink-0 mt-0.5">{icon}</div>}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-caption mt-0.5">{description}</p>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </Card>
  )
);
InsightCard.displayName = "InsightCard";

export {
  Card,
  CardHeader,
  CardHeaderWithIcon,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  MetricCard,
  InsightCard,
  cardVariants,
};
