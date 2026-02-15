import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getRiskScoreColor,
  getRiskScoreBgColor,
  LIKELIHOOD_LABELS,
  LIKELIHOOD_VALUES,
} from '@/lib/risk-scoring';
import type {
  ResidualFactorScoresResponse,
  ControlFactorReduction,
} from '@/lib/risks-api';

interface ResidualLikelihoodCardProps {
  scenarioId: string;
  inherentScores: {
    f1ThreatFrequency: number | null;
    f2ControlEffectiveness: number | null;
    f3GapVulnerability: number | null;
  };
  residualData?: ResidualFactorScoresResponse;
  linkedControls?: ControlFactorReduction[];
  calculatedResidualLikelihood: number | null;
  onSave: (data: {
    scores: { f1Residual: number | null; f2Residual: number | null; f3Residual: number | null };
    overrides: Record<string, boolean | string | undefined>;
  }) => Promise<void>;
  isSaving?: boolean;
}

export function ResidualLikelihoodCard({
  scenarioId,
  inherentScores,
  residualData,
  linkedControls = [],
  calculatedResidualLikelihood,
  onSave,
  isSaving = false,
}: ResidualLikelihoodCardProps) {
  const factors = [
    {
      key: 'f1',
      label: 'F1 - Threat Frequency',
      inherent: inherentScores.f1ThreatFrequency,
      residual: residualData?.residualScores?.f1Residual ?? null,
      reduction: residualData?.controlReductions?.f1 ?? 0,
    },
    {
      key: 'f2',
      label: 'F2 - Control Effectiveness',
      inherent: inherentScores.f2ControlEffectiveness,
      residual: residualData?.residualScores?.f2Residual ?? null,
      reduction: residualData?.controlReductions?.f2 ?? 0,
    },
    {
      key: 'f3',
      label: 'F3 - Gap/Vulnerability',
      inherent: inherentScores.f3GapVulnerability,
      residual: residualData?.residualScores?.f3Residual ?? null,
      reduction: residualData?.controlReductions?.f3 ?? 0,
    },
  ];

  return (
    <Card variant="glass">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          Residual Likelihood Factors
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {factors.map((factor) => (
          <div key={factor.key} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{factor.label}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground tabular-nums">
                {factor.inherent ?? '—'}
              </span>
              {factor.reduction > 0 && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  -{factor.reduction}
                </Badge>
              )}
              <span className="font-medium tabular-nums">
                {factor.residual ?? '—'}
              </span>
            </div>
          </div>
        ))}

        {linkedControls.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              {linkedControls.length} linked control{linkedControls.length !== 1 ? 's' : ''} contributing to reduction
            </p>
          </div>
        )}

        {calculatedResidualLikelihood !== null && (
          <div className="pt-2 border-t flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Calculated Residual Likelihood</span>
            <span className="font-semibold tabular-nums">
              {calculatedResidualLikelihood}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
