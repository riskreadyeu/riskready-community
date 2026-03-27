import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface ToleranceCheckComponentProps {
    inherentScore: number;
    residualScore: number;
    threshold: number | null | undefined;
    status?: 'WITHIN' | 'EXCEEDS' | 'CRITICAL' | null;
    className?: string;
}

export function ToleranceCheckComponent({
    inherentScore,
    residualScore,
    threshold,
    status,
    className,
}: ToleranceCheckComponentProps) {
    // Safe default if threshold is missing
    const safeThreshold = threshold ?? 12; // Standard risk appetite default

    // Calculate percentage positions (scale 1-25)
    const getPosition = (score: number) => {
        const percentage = (score / 25) * 100;
        return Math.min(Math.max(percentage, 0), 100);
    };

    const inherentPos = getPosition(inherentScore);
    const residualPos = getPosition(residualScore);
    const thresholdPos = getPosition(safeThreshold);

    // Check if markers overlap (within 5% of each other)
    const markersOverlap = Math.abs(inherentPos - residualPos) < 5;

    // Calculate reduction percentage
    const reductionPercent = inherentScore > residualScore
        ? Math.round(((inherentScore - residualScore) / inherentScore) * 100)
        : 0;

    // Status Colors
    const statusColor = useMemo(() => {
        if (status === 'WITHIN') return 'text-green-600';
        if (status === 'EXCEEDS') return 'text-amber-600';
        if (status === 'CRITICAL') return 'text-red-600';
        return 'text-muted-foreground';
    }, [status]);

    const barColor = useMemo(() => {
        if (status === 'WITHIN') return 'bg-green-500';
        if (status === 'EXCEEDS') return 'bg-amber-500';
        if (status === 'CRITICAL') return 'bg-red-500';
        return 'bg-gray-400';
    }, [status]);

    const StatusIcon = useMemo(() => {
        if (status === 'WITHIN') return CheckCircle;
        if (status === 'EXCEEDS') return AlertTriangle;
        if (status === 'CRITICAL') return XCircle;
        return AlertTriangle;
    }, [status]);

    return (
        <div className={cn("space-y-4 px-4 py-4 pt-2", className)}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                        Tolerance Check
                        {status && (
                            <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full border font-medium flex items-center gap-1",
                                status === 'WITHIN' && "bg-green-50 border-green-200 text-green-700",
                                status === 'EXCEEDS' && "bg-amber-50 border-amber-200 text-amber-700",
                                status === 'CRITICAL' && "bg-red-50 border-red-200 text-red-700"
                            )}>
                                <StatusIcon className="w-3 h-3" />
                                {status === 'WITHIN' ? 'Within Appetite' : status === 'CRITICAL' ? 'Critical Impact' : 'Exceeds Appetite'}
                            </span>
                        )}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Residual score vs. Risk Appetite Threshold (≤{safeThreshold})
                    </p>
                </div>
            </div>

            <div className="relative h-20 w-full select-none">
                {/* Track container with padding for markers */}
                <div className="absolute top-0 bottom-0 left-5 right-5">
                    {/* Track Background with Zone Coloring */}
                    <div className="absolute top-8 left-0 right-0 h-2 rounded-full overflow-hidden">
                        {/* Safe zone (green) */}
                        <div
                            className="absolute top-0 left-0 h-full bg-green-100"
                            style={{ width: `${thresholdPos}%` }}
                        />
                        {/* Danger zone (red) */}
                        <div
                            className="absolute top-0 right-0 h-full bg-red-50"
                            style={{ width: `${100 - thresholdPos}%` }}
                        />
                    </div>

                    {/* Threshold Line */}
                    <div
                        className="absolute top-3 h-12 w-0.5 border-l-2 border-dashed border-primary/70 z-10"
                        style={{ left: `${thresholdPos}%` }}
                    >
                        <div className="absolute -top-5 -translate-x-1/2 text-center">
                            <span className="text-[10px] font-medium text-primary bg-background px-1.5 py-0.5 border rounded shadow-sm whitespace-nowrap">
                                Appetite ≤{safeThreshold}
                            </span>
                        </div>
                    </div>

                    {/* Reduction Bar (Inherent to Residual) */}
                    {!markersOverlap && (
                        <div
                            className={cn(
                                "absolute top-8 h-2 z-0 opacity-40 rounded-full",
                                barColor
                            )}
                            style={{
                                left: `${Math.min(inherentPos, residualPos)}%`,
                                width: `${Math.abs(inherentPos - residualPos)}%`,
                            }}
                        />
                    )}

                    {/* Reduction Percentage Label */}
                    {reductionPercent > 0 && !markersOverlap && (
                        <div
                            className="absolute top-10 z-10 -translate-x-1/2"
                            style={{ left: `${(inherentPos + residualPos) / 2}%` }}
                        >
                            <span className="text-[10px] font-medium text-green-600 bg-green-50 px-1 rounded">
                                ↓{reductionPercent}%
                            </span>
                        </div>
                    )}

                    {/* Markers - Combined when overlapping */}
                    {markersOverlap ? (
                        /* Combined marker when scores are equal/close */
                        <div
                            className="absolute top-5 z-30 flex flex-col items-center"
                            style={{ left: `${residualPos}%`, transform: 'translateX(-50%)' }}
                        >
                            <div className={cn(
                                "w-9 h-9 rounded-full flex items-center justify-center shadow-md text-white border-2 border-white",
                                barColor
                            )}>
                                <span className="text-xs font-bold">{residualScore}</span>
                            </div>
                            <span className="text-[10px] font-medium text-muted-foreground mt-1">
                                {inherentScore === residualScore ? 'Both' : 'Inherent / Residual'}
                            </span>
                        </div>
                    ) : (
                        <>
                            {/* Inherent Marker */}
                            <div
                                className="absolute top-6 z-20 flex flex-col items-center"
                                style={{ left: `${inherentPos}%`, transform: 'translateX(-50%)' }}
                            >
                                <div className="w-6 h-6 rounded-full bg-orange-100 border-2 border-orange-400 flex items-center justify-center shadow-sm">
                                    <span className="text-[10px] font-bold text-orange-700">{inherentScore}</span>
                                </div>
                                <span className="text-[10px] font-medium text-orange-600 mt-1">
                                    Inherent
                                </span>
                            </div>

                            {/* Residual Marker */}
                            <div
                                className="absolute top-5 z-30 flex flex-col items-center"
                                style={{ left: `${residualPos}%`, transform: 'translateX(-50%)' }}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shadow-md text-white border-2 border-white",
                                    barColor
                                )}>
                                    <span className="text-xs font-bold">{residualScore}</span>
                                </div>
                                <span className={cn(
                                    "text-[10px] font-medium mt-1",
                                    statusColor
                                )}>
                                    Residual
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Scale Labels */}
            <div className="flex justify-between text-[10px] text-muted-foreground px-1 border-t pt-2">
                <span>1</span>
                <span className="text-primary font-medium">{safeThreshold}</span>
                <span>25</span>
            </div>
        </div>
    );
}
