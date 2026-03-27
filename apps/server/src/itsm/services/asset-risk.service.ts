import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AssetRiskService {
  constructor(private prisma: PrismaService) {}

  async findByAsset(assetId: string) {
    return this.prisma.assetRisk.findMany({
      where: { assetId },
      include: {
        risk: {
          select: {
            id: true,
            riskId: true,
            title: true,
            tier: true,
            status: true,
            inherentScore: true,
            residualScore: true,
          },
        },
      },
    });
  }

  async findByRisk(riskId: string) {
    return this.prisma.assetRisk.findMany({
      where: { riskId },
      include: {
        asset: {
          select: {
            id: true,
            assetTag: true,
            name: true,
            assetType: true,
            businessCriticality: true,
            status: true,
          },
        },
      },
    });
  }

  async linkAssetToRisk(data: {
    assetId: string;
    riskId: string;
    impactLevel?: string;
    notes?: string;
  }) {
    // Check if asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: data.assetId },
    });
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${data.assetId} not found`);
    }

    // Check if risk exists
    const risk = await this.prisma.risk.findUnique({
      where: { id: data.riskId },
    });
    if (!risk) {
      throw new NotFoundException(`Risk with ID ${data.riskId} not found`);
    }

    return this.prisma.assetRisk.upsert({
      where: {
        assetId_riskId: {
          assetId: data.assetId,
          riskId: data.riskId,
        },
      },
      create: {
        assetId: data.assetId,
        riskId: data.riskId,
        impactLevel: data.impactLevel,
        notes: data.notes,
      },
      update: {
        impactLevel: data.impactLevel,
        notes: data.notes,
      },
      include: {
        asset: {
          select: {
            id: true,
            assetTag: true,
            name: true,
            assetType: true,
          },
        },
        risk: {
          select: {
            id: true,
            riskId: true,
            title: true,
          },
        },
      },
    });
  }

  async unlinkAssetFromRisk(assetId: string, riskId: string) {
    return this.prisma.assetRisk.delete({
      where: {
        assetId_riskId: {
          assetId,
          riskId,
        },
      },
    });
  }

  async bulkLinkAssetsToRisk(
    riskId: string,
    assetLinks: Array<{ assetId: string; impactLevel?: string; notes?: string }>,
  ) {
    // Delete existing links
    await this.prisma.assetRisk.deleteMany({ where: { riskId } });

    // Create new links
    return this.prisma.assetRisk.createMany({
      data: assetLinks.map((link) => ({
        riskId,
        assetId: link.assetId,
        impactLevel: link.impactLevel,
        notes: link.notes,
      })),
    });
  }

  async getAssetRiskSummary() {
    const [
      totalLinks,
      criticalAssets,
      assetsByImpact,
    ] = await Promise.all([
      this.prisma.assetRisk.count(),
      this.prisma.assetRisk.count({
        where: {
          asset: { businessCriticality: 'CRITICAL' },
        },
      }),
      this.prisma.assetRisk.groupBy({
        by: ['impactLevel'],
        _count: { _all: true },
      }),
    ]);

    return {
      totalLinks,
      criticalAssets,
      byImpact: assetsByImpact.reduce((acc, item) => {
        acc[item.impactLevel || 'unknown'] = item._count._all;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
