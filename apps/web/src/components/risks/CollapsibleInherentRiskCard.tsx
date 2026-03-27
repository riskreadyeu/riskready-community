import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Activity,
  Target,
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

interface CollapsibleInherentRiskCardProps {
  scenario: RiskScenario;
  inherentScore: number;
  className?: string;
  defaultExpanded?: boolean;
}

export function CollapsibleInherentRiskCard({
  scenario,
  inherentScore,
  className,
  defaultExpanded = true,
}: CollapsibleInherentRiskCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

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
                    getRiskScoreBgColor(inherentScore)
                  )}
                >
                  <AlertTriangle
                    className={cn('w-4 h-4', getRiskScoreColor(inherentScore))}
                  />
                </div>
                <div>
                  <h3 className="font-semibold">Inherent Risk</h3>
                  <p className="text-xs text-muted-foreground">
                    Before controls are applied
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div
                    className={cn(
                      'text-2xl font-bold tabular-nums',
                      getRiskScoreColor(inherentScore)
                    )}
                  >
                    {inherentScore || '—'}
                  </div>
                  <div
                    className={cn(
                      'text-xs font-medium',
                      getRiskScoreColor(inherentScore)
                    )}
                  >
                    {getRiskLevelLabel(inherentScore)}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-200"
                >
                  Baseline
                </Badge>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Collapsible Content */}
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4 border-t">
            {/* Likelihood Display */}
            <div className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Likelihood</span>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 flex items-center justify-between">
                <span className="text-sm font-medium">
                  {scenario.likelihood
                    ? LIKELIHOOD_LABELS[scenario.likelihood]
                    : 'Not set'}
                </span>
                <span className={cn('text-lg font-bold', 'text-primary')}>
                  {scenario.likelihood
                    ? LIKELIHOOD_VALUES[scenario.likelihood]
                    : '—'}
                </span>
              </div>
            </div>

            {/* Impact Display */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Impact</span>
              </div>
              <div className="p-3 rounded-lg bg-secondary/30 flex items-center justify-between">
                <span className="text-sm font-medium">
                  {scenario.impact
                    ? IMPACT_LABELS[scenario.impact]
                    : 'Not set'}
                </span>
                <span className={cn('text-lg font-bold', 'text-primary')}>
                  {scenario.impact
                    ? IMPACT_VALUES[scenario.impact]
                    : '—'}
                </span>
              </div>
            </div>

            {/* Score Summary */}
            <div
              className={cn(
                'p-3 rounded-lg flex items-center justify-between',
                getRiskScoreBgColor(inherentScore)
              )}
            >
              <div>
                <p className="text-xs text-muted-foreground">
                  Inherent Score = {scenario.likelihood ? LIKELIHOOD_VALUES[scenario.likelihood] : '?'} × {scenario.impact ? IMPACT_VALUES[scenario.impact] : '?'}
                </p>
                <p
                  className={cn('font-medium', getRiskScoreColor(inherentScore))}
                >
                  {getRiskLevelLabel(inherentScore)}
                </p>
              </div>
              <span
                className={cn(
                  'text-2xl font-bold tabular-nums',
                  getRiskScoreColor(inherentScore)
                )}
              >
                {inherentScore || '—'}
              </span>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default CollapsibleInherentRiskCard;
