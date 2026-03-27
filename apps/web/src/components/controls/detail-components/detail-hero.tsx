"use client";

import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface DetailHeroProps {
  // Navigation
  breadcrumbs?: Breadcrumb[];
  backLink?: string;
  backLabel?: string;
  
  // Main content
  icon?: React.ReactNode;
  iconBg?: string;
  badge?: React.ReactNode;
  title: string;
  subtitle?: string;
  description?: string;
  
  // Metadata line
  metadata?: Array<{
    label: string;
    value: string | React.ReactNode;
    icon?: React.ReactNode;
  }>;
  
  // Actions
  actions?: React.ReactNode;
  
  // Status indicator (optional colored bar)
  statusColor?: "success" | "warning" | "destructive" | "primary" | "muted";
}

export function DetailHero({
  breadcrumbs,
  backLink,
  backLabel,
  icon,
  iconBg = "bg-primary/10",
  badge,
  title,
  subtitle,
  description,
  metadata,
  actions,
  statusColor,
}: DetailHeroProps) {
  const statusClasses = {
    success: "bg-success",
    warning: "bg-warning",
    destructive: "bg-destructive",
    primary: "bg-primary",
    muted: "bg-muted-foreground",
  };

  return (
    <div className="relative">
      {/* Status bar */}
      {statusColor && (
        <div className={cn(
          "absolute top-0 left-0 w-1 h-full rounded-l-lg",
          statusClasses[statusColor]
        )} />
      )}
      
      <div className={cn("bg-card border rounded-lg p-6", statusColor && "pl-7")}>
        {/* Breadcrumbs or Back Link */}
        {(breadcrumbs || backLink) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            {backLink ? (
              <Link 
                to={backLink}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {backLabel || "Back"}
              </Link>
            ) : breadcrumbs && (
              <nav className="flex items-center gap-1.5">
                {breadcrumbs.map((crumb, idx) => (
                  <span key={idx} className="flex items-center gap-1.5">
                    {idx > 0 && <span className="text-muted-foreground/50">/</span>}
                    {crumb.href ? (
                      <Link to={crumb.href} className="hover:text-foreground transition-colors">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-foreground">{crumb.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}
          </div>
        )}
        
        {/* Main content */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            {/* Icon */}
            {icon && (
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                iconBg
              )}>
                {icon}
              </div>
            )}
            
            {/* Title & Description */}
            <div className="min-w-0 flex-1">
              {/* Badges */}
              {badge && (
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {badge}
                </div>
              )}

              {/* Title */}
              <h1 className="text-xl font-semibold tracking-tight">
                {title}
              </h1>

              {/* Subtitle (ID) */}
              {subtitle && (
                <p className="text-sm text-muted-foreground font-mono mt-0.5">
                  {subtitle}
                </p>
              )}

              {/* Description */}
              {description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {description}
                </p>
              )}
              
              {/* Metadata */}
              {metadata && metadata.length > 0 && (
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  {metadata.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs">
                      {item.icon}
                      <span className="text-muted-foreground">{item.label}:</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Actions */}
          {actions && (
            <div className="flex items-center gap-2 shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
