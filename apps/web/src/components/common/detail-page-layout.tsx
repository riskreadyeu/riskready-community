
import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon?: LucideIcon;
  content: ReactNode;
}

interface DetailPageHeaderProps {
  backLink: string;
  backLabel?: string;
  title: string;
  subtitle?: string;
  code?: string;
  status?: {
    label: string;
    variant: "success" | "warning" | "destructive" | "default" | "secondary";
  };
  badges?: Array<{ label: string; variant?: "outline" | "default" | "secondary" }>;
  actions?: ReactNode;
  metadata?: Array<{ label: string; value: ReactNode }>;
}

// Tabs-based layout props
interface TabsLayoutProps {
  header: DetailPageHeaderProps;
  tabs: Tab[];
  defaultTab?: string;
}

// Two-column layout props (legacy/BCM style)
interface TwoColumnLayoutProps {
  leftColumn: ReactNode;
  rightColumn: ReactNode;
}

type DetailPageLayoutProps = TabsLayoutProps | TwoColumnLayoutProps;

function isTabsLayout(props: DetailPageLayoutProps): props is TabsLayoutProps {
  return 'tabs' in props;
}

const statusVariantClasses = {
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  default: "bg-primary/10 text-primary border-primary/20",
  secondary: "bg-secondary text-muted-foreground",
};

export function DetailPageHeader({
  backLink,
  backLabel = "Back",
  title,
  subtitle,
  code,
  status,
  badges,
  actions,
  metadata,
}: DetailPageHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Navigation and Actions Row */}
      <div className="flex items-center justify-between">
        <Link to={backLink}>
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
            {backLabel}
          </Button>
        </Link>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Title Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            {code && (
              <span className="font-mono text-sm text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                {code}
              </span>
            )}
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {status && (
              <Badge
                variant="outline"
                className={cn("text-xs", statusVariantClasses[status.variant])}
              >
                {status.label}
              </Badge>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground max-w-2xl">{subtitle}</p>
          )}
          {badges && badges.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {badges.map((badge, index) => (
                <Badge key={index} variant={badge.variant || "outline"} className="text-xs">
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Metadata Row */}
      {metadata && metadata.length > 0 && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm border-t border-border pt-4">
          {metadata.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-muted-foreground">{item.label}:</span>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DetailPageLayout(props: DetailPageLayoutProps) {
  // Two-column layout (legacy/BCM style)
  if (!isTabsLayout(props)) {
    const { leftColumn, rightColumn } = props;
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          {leftColumn}
        </div>
        <div className="lg:col-span-2">
          {rightColumn}
        </div>
      </div>
    );
  }

  // Tabs-based layout
  const { header, tabs, defaultTab } = props;
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || "");

  return (
    <div className="space-y-6 animate-slide-up">
      <DetailPageHeader {...header} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-card border border-border rounded-lg p-1.5 h-auto gap-2 flex-wrap">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 px-4 py-2.5"
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6">
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-0">
              {tab.content}
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
