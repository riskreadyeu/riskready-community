
import { useState } from "react";
import { MoreHorizontal, Eye, Edit3, TestTube, Target, Activity } from "lucide-react";
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
import { EffectivenessIndicator } from "./effectiveness-indicator";
import {
  type LayerWithStatus,
} from "./types";

interface LayerRowProps {
  layer: LayerWithStatus;
  controlId: string;
  isSelected: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
}

export function LayerRow({
  layer,
  controlId,
  isSelected,
  onToggleSelect,
  onClick,
}: LayerRowProps) {
  const [isHovered, setIsHovered] = useState(false);

  const metricsStatus = layer.metricsStatus || { total: 0, green: 0, amber: 0, red: 0, notMeasured: 0 };
  const effectivenessStatus = layer.effectivenessStatus;
  const latestAssessment = layer.latestAssessment;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors border-b last:border-b-0",
        isSelected && "bg-primary/5",
        isHovered && !isSelected && "bg-secondary/50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Checkbox */}
      <div className="w-6" onClick={e => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect()}
        />
      </div>

      {/* Indent */}
      <div className="w-6 flex items-center justify-center">
        <div className="w-px h-4 bg-border" />
      </div>

      {/* Layer Type */}
      <Badge
        variant="outline"
        className="w-20 justify-center text-[10px] shrink-0"
      >
        {layer.layer}
      </Badge>

      {/* Description */}
      <span className="flex-1 text-sm truncate">
        {layer.description || `${layer.layer} Layer`}
      </span>

      {/* Tests Passed */}
      <div className="w-24 flex justify-center shrink-0">
        <span className="text-xs">
          {effectivenessStatus ? (
            <span className={cn(
              effectivenessStatus.overall === 'EFFECTIVE' && 'text-success',
              effectivenessStatus.overall === 'PARTIALLY_EFFECTIVE' && 'text-warning',
              effectivenessStatus.overall === 'NOT_EFFECTIVE' && 'text-destructive',
              effectivenessStatus.overall === 'NOT_TESTED' && 'text-muted-foreground',
            )}>
              {effectivenessStatus.testsPassed}/{effectivenessStatus.testsTotal} tests
            </span>
          ) : (
            <span className="text-muted-foreground">--</span>
          )}
        </span>
      </div>

      {/* Protection Score */}
      <div className="w-20 shrink-0">
        {latestAssessment ? (
          <div className="flex items-center gap-1">
            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all",
                  latestAssessment.protectionScore >= 80 ? "bg-success" :
                  latestAssessment.protectionScore >= 50 ? "bg-warning" :
                  "bg-destructive"
                )}
                style={{ width: `${latestAssessment.protectionScore}%` }}
              />
            </div>
            <span className="text-xs font-medium tabular-nums w-8 text-right">
              {latestAssessment.protectionScore}%
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">--</span>
        )}
      </div>

      {/* Tests Count */}
      <div className="w-16 shrink-0">
        {layer.testsTotal > 0 ? (
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium">{layer.testsPassed}/{layer.testsTotal}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">--</span>
        )}
      </div>

      {/* Actions */}
      <div
        className={cn(
          "w-16 flex items-center justify-end gap-1 transition-opacity",
          isHovered || isSelected ? "opacity-100" : "opacity-0"
        )}
        onClick={e => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClick}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onClick}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Layer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <TestTube className="h-4 w-4 mr-2" />
              Run Layer Tests
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Target className="h-4 w-4 mr-2" />
              Assess Layer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
