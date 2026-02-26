import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Shield,
  ChevronDown,
  ChevronRight,
  Calculator,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getRiskScoreColor,
  getRiskScoreBgColor,
  getRiskLevelLabel,
  LIKELIHOOD_LABELS,
  LIKELIHOOD_VALUES,
  IMPACT_LABELS,
  IMPACT_VALUES,
} from '@/lib/risk-scoring';
import type { RiskScenario } from '@/lib/risks-api';

interface CollapsibleResidualRiskCardProps {
  scenario: RiskScenario;
  residualScore: number;
  onCalculateFromControls: () => Promise<void>;
  calculatingResidual?: boolean;
  className?: string;
  defaultExpanded?: boolean;
}

export function CollapsibleResidualRiskCard({
  scenario,
  residualScore,
  onCalculateFromControls,
  calculatingResidual = false,
  className,
  defaultExpanded = true,
}: CollapsibleResidualRiskCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Determine if residual is better than inherent
  const hasImprovement = scenario.inherentScore && residualScore
    ? residualScore < scenario.inherentScore
    : false;

  const reductionPercent = scenario.inherentScore && residualScore
    ? Math.round(((scenario.inherentScore - residualScore) / scenario.inherentScore) * 100)
    : null;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <Card variant="glass" className={className}>
        {/* Collapsible Header */}
        <CollapsibleTrigger asChild>
          <div className="p-4 cursor-pointer hover:bg-accent/50 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    getRiskScoreBgColor(residualScore)
                  )}
                >
                  <Shield
                    className={cn('w-4 h-4', getRiskScoreColor(residualScore))}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Residual Risk</h3>
                    {hasImprovement && reductionPercent !== null && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        -{reductionPercent}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    After controls are applied
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div
                    className={cn(
                      'text-2xl font-bold tabular-nums',
                      getRiskScoreColor(residualScore)
                    )}
                  >
                    {residualScore || '—'}
                  </div>
                  <div
                    className={cn(
                      'text-xs font-medium',
                      getRiskScoreColor(residualScore)
                    )}
                  >
                    {getRiskLevelLabel(residualScore)}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  Mitigated
                </Badge>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Collapsible Content */}
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4 border-t">
            {/* Calculate from Controls Button */}
            <div className="pt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calculator className="w-4 h-4" />
                <span>Auto-calculate from linked controls</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onCalculateFromControls}
                disabled={calculatingResidual}
                className="gap-2"
              >
                {calculatingResidual ? (
                  <>Calculating...</>
                ) : (
                  <>
                    <Calculator className="w-4 h-4" />
                    {scenario.calculatedResidualScore !== null && scenario.calculatedResidualScore !== undefined
                      ? 'Recalculate'
                      : 'Calculate from Controls'}
                  </>
                )}
              </Button>
            </div>

            {/* Residual Likelihood/Impact Display */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-1">Residual Likelihood</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {scenario.residualLikelihood
                      ? LIKELIHOOD_LABELS[scenario.residualLikelihood]
                      : scenario.likelihood
                        ? LIKELIHOOD_LABELS[scenario.likelihood]
                        : 'Not set'}
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {scenario.residualLikelihood
                      ? LIKELIHOOD_VALUES[scenario.residualLikelihood]
                      : scenario.likelihood
                        ? LIKELIHOOD_VALUES[scenario.likelihood]
                        : '—'}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30">
                <p className="text-xs text-muted-foreground mb-1">Residual Impact</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {scenario.residualImpact
                      ? IMPACT_LABELS[scenario.residualImpact]
                      : scenario.impact
                        ? IMPACT_LABELS[scenario.impact]
                        : 'Not set'}
                  </span>
                  <span className="text-lg font-bold text-primary">
                    {scenario.residualImpact
                      ? IMPACT_VALUES[scenario.residualImpact]
                      : scenario.impact
                        ? IMPACT_VALUES[scenario.impact]
                        : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Override Warning */}
            {scenario.residualOverridden && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800">Manual Override Active</p>
                    {scenario.residualOverrideJustification && (
                      <p className="text-xs text-amber-700 mt-1">
                        {scenario.residualOverrideJustification}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Score Summary */}
            <div
              className={cn(
                'p-3 rounded-lg flex items-center justify-between',
                getRiskScoreBgColor(residualScore)
              )}
            >
              <div>
                <p className="text-xs text-muted-foreground">Residual Score</p>
                <p
                  className={cn('font-medium', getRiskScoreColor(residualScore))}
                >
                  {getRiskLevelLabel(residualScore)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {hasImprovement && scenario.inherentScore && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">From Inherent</p>
                    <p className="text-sm text-muted-foreground line-through">
                      {scenario.inherentScore}
                    </p>
                  </div>
                )}
                <span
                  className={cn(
                    'text-2xl font-bold tabular-nums',
                    getRiskScoreColor(residualScore)
                  )}
                >
                  {residualScore || '—'}
                </span>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default CollapsibleResidualRiskCard;
