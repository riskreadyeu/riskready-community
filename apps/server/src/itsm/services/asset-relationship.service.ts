import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, RelationshipType } from '@prisma/client';

@Injectable()
export class AssetRelationshipService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.AssetRelationshipWhereInput;
  }) {
    const { skip, take, where } = params || {};
    const [results, count] = await Promise.all([
      this.prisma.assetRelationship.findMany({
        skip,
        take,
        where,
        include: {
          fromAsset: { select: { id: true, assetTag: true, name: true, assetType: true } },
          toAsset: { select: { id: true, assetTag: true, name: true, assetType: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.assetRelationship.count({ where }),
    ]);
    return { results, count };
  }

  async findByAsset(assetId: string, direction?: 'outgoing' | 'incoming' | 'all') {
    const dir = direction || 'all';
    const where: Prisma.AssetRelationshipWhereInput =
      dir === 'outgoing'
        ? { fromAssetId: assetId }
        : dir === 'incoming'
          ? { toAssetId: assetId }
          : { OR: [{ fromAssetId: assetId }, { toAssetId: assetId }] };

    return this.prisma.assetRelationship.findMany({
      where,
      include: {
        fromAsset: { select: { id: true, assetTag: true, name: true, assetType: true, status: true } },
        toAsset: { select: { id: true, assetTag: true, name: true, assetType: true, status: true } },
      },
    });
  }

  async create(data: {
    fromAssetId: string;
    toAssetId: string;
    relationshipType: string;
    description?: string;
    isCritical?: boolean;
    notes?: string;
    createdById?: string;
  }) {
    // Prevent self-reference
    if (data.fromAssetId === data.toAssetId) {
      throw new BadRequestException('An asset cannot have a relationship with itself');
    }

    // Check if relationship already exists
    const existing = await this.prisma.assetRelationship.findFirst({
      where: {
        fromAssetId: data.fromAssetId,
        toAssetId: data.toAssetId,
        relationshipType: data.relationshipType as RelationshipType,
      },
    });

    if (existing) {
      throw new BadRequestException('This relationship already exists');
    }

    return this.prisma.assetRelationship.create({
      data: {
        fromAsset: { connect: { id: data.fromAssetId } },
        toAsset: { connect: { id: data.toAssetId } },
        relationshipType: data.relationshipType as RelationshipType,
        description: data.description,
        isCritical: data.isCritical || false,
        notes: data.notes,
        createdBy: data.createdById ? { connect: { id: data.createdById } } : undefined,
      },
      include: {
        fromAsset: { select: { id: true, assetTag: true, name: true, assetType: true } },
        toAsset: { select: { id: true, assetTag: true, name: true, assetType: true } },
      },
    });
  }

  async update(id: string, data: Prisma.AssetRelationshipUpdateInput) {
    return this.prisma.assetRelationship.update({
      where: { id },
      data,
      include: {
        fromAsset: { select: { id: true, assetTag: true, name: true, assetType: true } },
        toAsset: { select: { id: true, assetTag: true, name: true, assetType: true } },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.assetRelationship.delete({ where: { id } });
  }

  async getDependencyChain(assetId: string, depth: number = 3) {
    // Get transitive dependencies up to specified depth
    const visited = new Set<string>();
    const chain: Record<string, unknown>[] = [];

    const traverse = async (currentId: string, currentDepth: number) => {
      if (currentDepth > depth || visited.has(currentId)) return;
      visited.add(currentId);

      const dependencies = await this.prisma.assetRelationship.findMany({
        where: {
          fromAssetId: currentId,
          relationshipType: 'DEPENDS_ON',
        },
        include: {
          toAsset: {
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

      for (const dep of dependencies) {
        chain.push({
          level: currentDepth,
          fromAssetId: currentId,
          toAsset: dep.toAsset,
          isCritical: dep.isCritical,
        });
        await traverse(dep.toAsset.id, currentDepth + 1);
      }
    };

    await traverse(assetId, 1);
    return chain;
  }
}
