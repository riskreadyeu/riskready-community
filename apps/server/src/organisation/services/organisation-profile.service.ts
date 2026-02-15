import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

// Map frontend appetite level names to stored values
function mapAppetiteLevel(level: string): string {
  const map: Record<string, string> = {
    'AVERSE': 'MINIMAL',
    'CAUTIOUS': 'LOW',
    'BALANCED': 'MODERATE',
    'AGGRESSIVE': 'HIGH',
    'MINIMAL': 'MINIMAL',
    'LOW': 'LOW',
    'MODERATE': 'MODERATE',
    'HIGH': 'HIGH',
  };
  return map[level] || 'MODERATE';
}

@Injectable()
export class OrganisationProfileService {
  private readonly logger = new Logger(OrganisationProfileService.name);

  constructor(private prisma: PrismaService) { }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.OrganisationProfileWhereInput;
    orderBy?: Prisma.OrganisationProfileOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params || {};
    const [results, count] = await Promise.all([
      this.prisma.organisationProfile.findMany({
        skip,
        take,
        where,
        orderBy: orderBy || { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.organisationProfile.count({ where }),
    ]);
    return { results, count };
  }

  async findOne(id: string) {
    return this.prisma.organisationProfile.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async create(data: Prisma.OrganisationProfileCreateInput) {
    return this.prisma.organisationProfile.create({
      data,
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(id: string, data: Prisma.OrganisationProfileUpdateInput) {
    return this.prisma.organisationProfile.update({
      where: { id },
      data,
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  /**
   * Update profile with appetite level handling
   * When appetiteLevel is provided, creates/updates OrganisationSelectedAppetite record
   */
  async updateWithAppetite(
    id: string,
    data: Record<string, any>,
    userId?: string
  ) {
    // Map appetiteLevel to the riskAppetite string field
    const { appetiteLevel, ...profileData } = data;

    this.logger.log(`updateWithAppetite called. appetiteLevel=${appetiteLevel}, keys=${Object.keys(profileData).join(',')}`);

    if (appetiteLevel) {
      profileData['riskAppetite'] = mapAppetiteLevel(appetiteLevel);
    }

    const profile = await this.prisma.organisationProfile.update({
      where: { id },
      data: profileData as Prisma.OrganisationProfileUpdateInput,
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (appetiteLevel) {
      this.logger.log(`Updated appetite level for organisation ${id}: ${appetiteLevel} → ${profile.riskAppetite}`);
    }

    return profile;
  }

  async delete(id: string) {
    return this.prisma.organisationProfile.delete({ where: { id } });
  }

  async getDashboardSummary() {
    const profile = await this.prisma.organisationProfile.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!profile) return null;

    return {
      name: profile.name,
      legalName: profile.legalName,
      industrySector: profile.industrySector,
      employeeCount: profile.employeeCount,
      size: profile.size,
      isoCertificationStatus: profile.isoCertificationStatus,
      certificationExpiry: profile.certificationExpiry,
      nextAuditDate: profile.nextAuditDate,
    };
  }
}
