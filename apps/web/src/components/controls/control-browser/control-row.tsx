"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, MoreHorizontal, Eye, Edit3, TestTube, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { EffectivenessBar } from "./effectiveness-indicator";
import { MaturityIndicator } from "./maturity-indicator";
import { LayerRow } from "./layer-row";
import {
  type ControlWithLayers,
  THEME_LABELS,
  THEME_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
  FRAMEWORK_LABELS,
  FRAMEWORK_COLORS,
  EFFECTIVENESS_COLORS,
} from "./types";

interface ControlRowProps {
  control: ControlWithLayers;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: () => void;
  onToggleSelect: () => void;
  onViewDetails: () => void;
  onLayerClick: (layerId: string) => void;
  selectedLayers: Set<string>;
  onToggleLayerSelect: (layerId: string) => void;
}

export function ControlRow({
  control,
  isExpanded,
  isSelected,
  onToggleExpand,
  onToggleSelect,
  onViewDetails,
  onLayerClick,
  selectedLayers,
  onToggleLayerSelect,
}: ControlRowProps) {
  const [isHovered, setIsHovered] = useState(false);

  const layerCount = control.layers?.length ?? control._count?.['layers'] ?? 0;
  const statusColors = STATUS_COLORS[control.implementationStatus];
  const effectivenessColors = EFFECTIVENESS_COLORS[control.effectivenessRating || 'NOT_TESTED'];

  // Calculate average protection score from layers
  const avgProtectionScore = control.layers?.reduce((sum, layer) => {
    return sum + (layer.latestAssessment?.protectionScore ?? 0);
  }, 0) / (layerCount || 1);

  // Calculate effectiveness summary
  const effectiveCount = control.layers?.filter(l => l.effectivenessStatus?.overall === 'EFFECTIVE').length ?? 0;
  const partialCount = control.layers?.filter(l => l.effectivenessStatus?.overall === 'PARTIALLY_EFFECTIVE').length ?? 0;
  const notEffectiveCount = control.layers?.filter(l => l.effectivenessStatus?.overall === 'NOT_EFFECTIVE').length ?? 0;

  return (
    <div className={cn(
      "border-b last:border-b-0 transition-colors",
      isSelected && "bg-primary/5",
      isHovered && !isSelected && "bg-secondary/30"
    )}>
      {/* Control Row */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onToggleExpand}
      >
        {/* Checkbox */}
        <div onClick={e => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect()}
            className="mr-1"
          />
        </div>
        
        {/* Expand/Collapse */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={e => {
            e.stopPropagation();
            onToggleExpand();
          }}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
        
        {/* Control ID */}
        <span className="font-mono text-xs text-muted-foreground w-16 shrink-0">
          {control.controlId}
        </span>
        
        {/* Framework Badge */}
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 text-[10px] px-1.5 py-0",
            `${FRAMEWORK_COLORS[control.framework || 'ISO']}/10`,
            "border-current"
          )}
        >
          {control.framework || 'ISO'}
        </Badge>
        
        {/* Control Name */}
        <span
          className="flex-1 text-sm font-medium truncate hover:text-primary"
          onClick={e => {
            e.stopPropagation();
            onViewDetails();
          }}
        >
          {control.name}
        </span>
        
        {/* Theme */}
        <Badge
          variant="outline"
          className={cn("shrink-0 text-[10px]", THEME_COLORS[control.theme])}
        >
          {THEME_LABELS[control.theme]}
        </Badge>
        
        {/* Implementation Status */}
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 w-24 justify-center text-[10px]",
            statusColors.bg,
            statusColors.text,
            statusColors.border
          )}
        >
          {STATUS_LABELS[control.implementationStatus]}
        </Badge>
        
        {/* Effectiveness Score */}
        <div className="w-20 shrink-0">
          {control.effectivenessScore !== undefined ? (
            <div className="flex items-center gap-1">
              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all",
                    control.effectivenessScore >= 90 ? "bg-success" :
                    control.effectivenessScore >= 70 ? "bg-warning" :
                    "bg-destructive"
                  )}
                  style={{ width: `${control.effectivenessScore}%` }}
                />
              </div>
              <span className="text-xs font-medium tabular-nums w-8 text-right">
                {control.effectivenessScore}%
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">--</span>
          )}
        </div>
        
        {/* Layers Count */}
        <div className="w-16 shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
          <span className="font-medium">{layerCount}</span>
          <span className="hidden sm:inline">layers</span>
        </div>
        
        {/* Actions */}
        <div
          className={cn(
            "flex items-center gap-1 transition-opacity",
            isHovered || isSelected ? "opacity-100" : "opacity-0"
          )}
          onClick={e => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onViewDetails}
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onViewDetails}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Control
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <TestTube className="h-4 w-4 mr-2" />
                Run Tests
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Target className="h-4 w-4 mr-2" />
                Assess Maturity
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Expanded Layers */}
      {isExpanded && control.layers && control.layers.length > 0 && (
        <div className="border-t bg-secondary/10">
          {/* Layers Header */}
          <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground border-b bg-secondary/20">
            <div className="w-6" /> {/* Checkbox space */}
            <div className="w-6" /> {/* Indent space */}
            <div className="w-20">Layer</div>
            <div className="flex-1">Description</div>
            <div className="w-20">Type</div>
            <div className="w-24 text-center">Effectiveness</div>
            <div className="w-20">Score</div>
            <div className="w-16">Tests</div>
            <div className="w-16" /> {/* Actions */}
          </div>

          {/* Layer Rows */}
          {control.layers.map(layer => (
            <LayerRow
              key={layer.id}
              layer={layer}
              controlId={control.id}
              isSelected={selectedLayers.has(layer.id)}
              onToggleSelect={() => onToggleLayerSelect(layer.id)}
              onClick={() => onLayerClick(layer.id)}
            />
          ))}

          {/* Summary Row */}
          <div className="flex items-center gap-2 px-3 py-2 text-xs bg-secondary/30 border-t">
            <div className="w-6" />
            <div className="w-6" />
            <div className="flex-1 text-muted-foreground">
              {layerCount} layers
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-success">{effectiveCount} effective</span>
              <span className="text-warning">{partialCount} partial</span>
              <span className="text-destructive">{notEffectiveCount} failing</span>
            </div>
            <div className="w-20 text-muted-foreground">
              Avg {Math.round(avgProtectionScore)}%
            </div>
            <div className="w-16" />
            <div className="w-16" />
          </div>
        </div>
      )}

      {/* No Layers Message */}
      {isExpanded && (!control.layers || control.layers.length === 0) && (
        <div className="px-12 py-4 text-sm text-muted-foreground bg-secondary/10 border-t">
          No layers defined for this control.
        </div>
      )}
    </div>
  );
}
