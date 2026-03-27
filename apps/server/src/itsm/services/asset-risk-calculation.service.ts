import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Centralized Asset Risk Calculation Service
 *
 * This service provides a consistent risk scoring methodology for assets
 * based on GRC best practices. It follows a category-weighted model:
 *
 * Inherent Risk = (Vulnerability Score × 35%) + (Business Score × 25%) +
 *                 (Access Score × 20%) + (Lifecycle Score × 20%)
 *
 * Residual Risk = Inherent Risk × (1 - Control Effectiveness × 0.8)
 *
 * All scores are normalized to 0-100 scale.
 */
@Injectable()
export class AssetRiskCalculationService {
    private readonly logger = new Logger(AssetRiskCalculationService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Calculate risk score for a single asset
     *
     * @param assetId The asset ID to calculate risk for
     * @param options Optional parameters for customizing calculation
     * @returns The calculated residual risk score (0-100)
     */
    async calculateRiskScore(
        assetId: string,
        options: {
            updateDatabase?: boolean;
            skipVulnerabilityRefresh?: boolean;
        } = {}
    ): Promise<number> {
        const { updateDatabase = true, skipVulnerabilityRefresh = false } = options;

        // Refresh vulnerability counts if not skipped
        if (!skipVulnerabilityRefresh) {
            await this.updateVulnerabilityCounts(assetId);
        }

        // Fetch asset with all relevant data
        const asset = await this.prisma.asset.findUnique({
            where: { id: assetId },
            select: {
                id: true,
                businessCriticality: true,
                dataClassification: true,
                openVulnsCritical: true,
                openVulnsHigh: true,
                openVulnsMedium: true,
                openVulnsLow: true,
                slaBreachedVulns: true,
                privilegedUserCount: true,
                humanUserCount: true,
                lastAuthFailureCount: true,
                endOfLife: true,
                supportExpiry: true,
                scaScore: true,
            },
        });

        if (!asset) {
            this.logger.warn(`Asset ${assetId} not found for risk calculation`);
            return 0;
        }

        // ==========================================
        // 1. VULNERABILITY SCORE (35% weight)
        // ==========================================
        const vulnScore = this.calculateVulnerabilityScore(
            asset.openVulnsCritical || 0,
            asset.openVulnsHigh || 0,
            asset.openVulnsMedium || 0,
            asset.openVulnsLow || 0,
            asset.slaBreachedVulns || 0
        );

        // ==========================================
        // 2. BUSINESS CRITICALITY SCORE (25% weight)
        // ==========================================
        const businessScore = this.calculateBusinessScore(
            asset.businessCriticality,
            asset.dataClassification
        );

        // ==========================================
        // 3. ACCESS CONTROL SCORE (20% weight)
        // ==========================================
        const accessScore = this.calculateAccessScore(
            asset.privilegedUserCount || 0,
            asset.humanUserCount || 0,
            asset.lastAuthFailureCount || 0
        );

        // ==========================================
        // 4. LIFECYCLE SCORE (20% weight)
        // ==========================================
        const lifecycleScore = this.calculateLifecycleScore(
            asset.endOfLife,
            asset.supportExpiry
        );

        // ==========================================
        // CALCULATE INHERENT RISK (weighted sum)
        // ==========================================
        const inherentRisk =
            (vulnScore * 0.35) +      // 35% weight
            (businessScore * 0.25) +   // 25% weight
            (accessScore * 0.20) +     // 20% weight
            (lifecycleScore * 0.20);   // 20% weight

        // ==========================================
        // CALCULATE RESIDUAL RISK (after controls)
        // ==========================================
        let controlEffectiveness = 0;
        if (asset.scaScore !== null && asset.scaScore !== undefined) {
            controlEffectiveness = asset.scaScore / 100;
        }

        const riskReductionFactor = 1 - (controlEffectiveness * 0.8);
        const residualRisk = Math.round(inherentRisk * riskReductionFactor);

        // Save the score if requested
        if (updateDatabase) {
            await this.prisma.asset.update({
                where: { id: assetId },
                data: {
                    riskScore: residualRisk,
                    riskScoreCalculatedAt: new Date(),
                },
            });
        }

        return residualRisk;
    }

    /**
     * Calculate vulnerability score based on open vulnerabilities
     * Normalized to 0-100 scale
     */
    calculateVulnerabilityScore(
        critical: number,
        high: number,
        medium: number,
        low: number,
        slaBreached: number
    ): number {
        // Weighted scoring: Critical (12 pts), High (6 pts), Medium (2 pts), Low (0.5 pt)
        // SLA breached adds penalty of 8 points each
        let score = 0;
        score += Math.min(critical, 10) * 12;  // Cap at 10 critical vulns (120 pts max)
        score += Math.min(high, 20) * 6;       // Cap at 20 high vulns (120 pts max)
        score += Math.min(medium, 50) * 2;     // Cap at 50 medium vulns (100 pts max)
        score += Math.min(low, 100) * 0.5;     // Cap at 100 low vulns (50 pts max)
        score += Math.min(slaBreached, 10) * 8; // SLA breach penalty (80 pts max)

        // Normalize: max theoretical = 120+120+100+50+80 = 470, but cap at 100
        return Math.min(100, Math.round(score / 4.7 * 10) / 10 * 10);
    }

    /**
     * Calculate business criticality score
     * Normalized to 0-100 scale
     */
    calculateBusinessScore(
        businessCriticality: string | null,
        dataClassification: string | null
    ): number {
        // Business criticality (50% of business score)
        const criticalityScores: Record<string, number> = {
            CRITICAL: 50,
            HIGH: 35,
            MEDIUM: 20,
            LOW: 5,
        };
        const criticalityScore = criticalityScores[businessCriticality || ''] || 10;

        // Data classification (50% of business score)
        const classificationScores: Record<string, number> = {
            RESTRICTED: 50,
            CONFIDENTIAL: 35,
            INTERNAL: 15,
            PUBLIC: 5,
        };
        const classificationScore = classificationScores[dataClassification || ''] || 10;

        return criticalityScore + classificationScore;
    }

    /**
     * Calculate access control risk score
     * Normalized to 0-100 scale
     */
    calculateAccessScore(
        privilegedUsers: number,
        totalUsers: number,
        authFailures: number
    ): number {
        // Privileged user ratio (50% of access score)
        let privilegedRatio = 0;
        if (totalUsers > 0) {
            privilegedRatio = (privilegedUsers / totalUsers) * 100;
        } else if (privilegedUsers > 0) {
            privilegedRatio = 100; // Unknown total, assume all privileged
        }
        const privilegedScore = Math.min(50, privilegedRatio / 2);

        // Auth failures score (50% of access score)
        // 0 failures = 0, 10+ failures = 50
        const authScore = Math.min(50, authFailures * 5);

        return Math.round(privilegedScore + authScore);
    }

    /**
     * Calculate lifecycle risk score
     * Normalized to 0-100 scale
     */
    calculateLifecycleScore(
        endOfLifeDate: Date | null,
        supportExpiry: Date | null
    ): number {
        const now = new Date();
        let score = 0;

        // End of Life is more severe than End of Support
        if (endOfLifeDate && new Date(endOfLifeDate) < now) {
            score = 100; // EOL = maximum lifecycle risk
        } else if (supportExpiry && new Date(supportExpiry) < now) {
            score = 75;  // EOS = high lifecycle risk
        } else if (endOfLifeDate) {
            // Calculate how close we are to EOL
            const daysToEOL = Math.floor((new Date(endOfLifeDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysToEOL < 90) {
                score = 50; // Less than 90 days to EOL
            } else if (daysToEOL < 180) {
                score = 25; // Less than 180 days to EOL
            }
        }

        return score;
    }

    /**
     * Update vulnerability counts for an asset from linked vulnerabilities
     */
    async updateVulnerabilityCounts(_assetId: string): Promise<void> {
        // VulnerabilityAsset model not available in Community Edition
        // Vulnerability counts are managed directly on the Asset model
    }

    /**
     * Calculate risk scores for all assets
     */
    async calculateAllRiskScores(): Promise<{ updated: number; errors: number }> {
        const assets = await this.prisma.asset.findMany({
            select: { id: true },
        });

        let updated = 0;
        let errors = 0;

        for (const asset of assets) {
            try {
                await this.calculateRiskScore(asset.id);
                updated++;
            } catch (err) {
                this.logger.error(`Failed to calculate risk score for asset ${asset.id}:`, err);
                errors++;
            }
        }

        return { updated, errors };
    }
}
