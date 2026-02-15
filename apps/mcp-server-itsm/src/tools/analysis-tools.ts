import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { prisma } from '#src/prisma.js';
import { withErrorHandling } from '#mcp-shared';

export function registerAnalysisTools(server: McpServer) {
  server.tool(
    'get_itsm_stats',
    'Get aggregate ITSM statistics: asset counts by type, status, and criticality; change counts by status and type; capacity plan counts by status.',
    {},
    withErrorHandling('get_itsm_stats', async () => {
      const [
        totalAssets,
        byAssetType,
        byAssetStatus,
        byBusinessCriticality,
        totalChanges,
        byChangeStatus,
        byChangeType,
        totalCapacityPlans,
        byCapacityPlanStatus,
      ] = await Promise.all([
        prisma.asset.count(),
        prisma.asset.groupBy({ by: ['assetType'], _count: true }),
        prisma.asset.groupBy({ by: ['status'], _count: true }),
        prisma.asset.groupBy({ by: ['businessCriticality'], _count: true }),
        prisma.change.count(),
        prisma.change.groupBy({ by: ['status'], _count: true }),
        prisma.change.groupBy({ by: ['changeType'], _count: true }),
        prisma.capacityPlan.count(),
        prisma.capacityPlan.groupBy({ by: ['status'], _count: true }),
      ]);

      const stats = {
        assets: {
          total: totalAssets,
          byType: Object.fromEntries(byAssetType.map((t: Record<string, unknown>) => [t.assetType, t._count])),
          byStatus: Object.fromEntries(byAssetStatus.map((s: Record<string, unknown>) => [s.status, s._count])),
          byCriticality: Object.fromEntries(byBusinessCriticality.map((c: Record<string, unknown>) => [c.businessCriticality, c._count])),
        },
        changes: {
          total: totalChanges,
          byStatus: Object.fromEntries(byChangeStatus.map((s: Record<string, unknown>) => [s.status, s._count])),
          byType: Object.fromEntries(byChangeType.map((t: Record<string, unknown>) => [t.changeType, t._count])),
        },
        capacityPlans: {
          total: totalCapacityPlans,
          byStatus: Object.fromEntries(byCapacityPlanStatus.map((s: Record<string, unknown>) => [s.status, s._count])),
        },
      };

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(stats, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_itsm_dashboard',
    'Comprehensive ITSM dashboard: asset counts, change counts, capacity alerts, and security posture summary (avg risk score, assets with critical vulns, encryption rates).',
    {},
    withErrorHandling('get_itsm_dashboard', async () => {
      const [
        totalAssets,
        activeAssets,
        byAssetType,
        byCriticality,
        totalChanges,
        openChanges,
        byChangeStatus,
        // Security posture aggregates
        assetsWithCriticalVulns,
        encryptionAtRestCount,
        encryptionInTransitCount,
        backupEnabledCount,
        monitoringEnabledCount,
        // Capacity
        capacityWarning,
        capacityCritical,
        capacityExhausted,
      ] = await Promise.all([
        prisma.asset.count(),
        prisma.asset.count({ where: { status: 'ACTIVE' } }),
        prisma.asset.groupBy({ by: ['assetType'], _count: true, orderBy: { _count: { assetType: 'desc' } }, take: 10 }),
        prisma.asset.groupBy({ by: ['businessCriticality'], _count: true }),
        prisma.change.count(),
        prisma.change.count({
          where: {
            status: { in: ['DRAFTED', 'SUBMITTED', 'PENDING_APPROVAL', 'NEEDS_INFO', 'APPROVED', 'SCHEDULED', 'IMPLEMENTING', 'IN_PROGRESS'] },
          },
        }),
        prisma.change.groupBy({ by: ['status'], _count: true }),
        prisma.asset.count({ where: { openVulnsCritical: { gt: 0 } } }),
        prisma.asset.count({ where: { encryptionAtRest: true, status: 'ACTIVE' } }),
        prisma.asset.count({ where: { encryptionInTransit: true, status: 'ACTIVE' } }),
        prisma.asset.count({ where: { backupEnabled: true, status: 'ACTIVE' } }),
        prisma.asset.count({ where: { monitoringEnabled: true, status: 'ACTIVE' } }),
        prisma.asset.count({ where: { capacityStatus: 'WARNING' } }),
        prisma.asset.count({ where: { capacityStatus: 'CRITICAL' } }),
        prisma.asset.count({ where: { capacityStatus: 'EXHAUSTED' } }),
      ]);

      // Calculate average risk score for active assets with scores
      const riskAgg = await prisma.asset.aggregate({
        where: { status: 'ACTIVE', riskScore: { not: null } },
        _avg: { riskScore: true },
        _count: true,
      });

      const dashboard = {
        assets: {
          total: totalAssets,
          active: activeAssets,
          topTypesByCount: byAssetType.map((t: Record<string, unknown>) => ({ type: t.assetType, count: t._count })),
          byCriticality: Object.fromEntries(byCriticality.map((c: Record<string, unknown>) => [c.businessCriticality, c._count])),
        },
        changes: {
          total: totalChanges,
          open: openChanges,
          byStatus: Object.fromEntries(byChangeStatus.map((s: Record<string, unknown>) => [s.status, s._count])),
        },
        capacityAlerts: {
          warning: capacityWarning,
          critical: capacityCritical,
          exhausted: capacityExhausted,
          totalAlerts: capacityWarning + capacityCritical + capacityExhausted,
        },
        securityPosture: {
          avgRiskScore: riskAgg._avg.riskScore != null ? Math.round(riskAgg._avg.riskScore) : null,
          assetsWithRiskScores: riskAgg._count,
          assetsWithCriticalVulns,
          encryptionAtRestRate: activeAssets > 0 ? Math.round((encryptionAtRestCount / activeAssets) * 100) : 0,
          encryptionInTransitRate: activeAssets > 0 ? Math.round((encryptionInTransitCount / activeAssets) * 100) : 0,
          backupRate: activeAssets > 0 ? Math.round((backupEnabledCount / activeAssets) * 100) : 0,
          monitoringRate: activeAssets > 0 ? Math.round((monitoringEnabledCount / activeAssets) * 100) : 0,
        },
      };

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(dashboard, null, 2) }],
      };
    }),
  );

  server.tool(
    'get_asset_risk_summary',
    'For each business criticality level, count assets and calculate average risk score. Useful for risk-based prioritization.',
    {},
    withErrorHandling('get_asset_risk_summary', async () => {
      const criticalities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;

      const summaries = await Promise.all(
        criticalities.map(async (criticality) => {
          const [count, riskAgg] = await Promise.all([
            prisma.asset.count({ where: { businessCriticality: criticality, status: 'ACTIVE' } }),
            prisma.asset.aggregate({
              where: { businessCriticality: criticality, status: 'ACTIVE', riskScore: { not: null } },
              _avg: { riskScore: true },
              _count: true,
            }),
          ]);
          return {
            criticality,
            totalActive: count,
            assetsWithRiskScore: riskAgg._count,
            avgRiskScore: riskAgg._avg.riskScore != null ? Math.round(riskAgg._avg.riskScore) : null,
          };
        }),
      );

      const response: Record<string, unknown> = { summaries };
      const totalActive = summaries.reduce((sum, s) => sum + s.totalActive, 0);
      if (totalActive === 0) {
        response.note = 'No active assets found in the system.';
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(response, null, 2) }],
      };
    }),
  );
}
