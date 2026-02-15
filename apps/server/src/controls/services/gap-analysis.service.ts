import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GapAnalysisService {
  constructor(private prisma: PrismaService) {}

  async getGapAnalysis(organisationId: string) {
    const controls = await this.prisma.control.findMany({
      where: { organisationId, applicable: true, enabled: true },
      select: {
        id: true,
        controlId: true,
        name: true,
        theme: true,
        implementationStatus: true,
      },
      orderBy: { controlId: 'asc' },
    });

    const gaps = controls
      .filter((c) => c.implementationStatus !== 'IMPLEMENTED')
      .map((c) => ({
        controlId: c.controlId,
        name: c.name,
        theme: c.theme,
        implementationStatus: c.implementationStatus,
      }));

    const total = controls.length;
    const implemented = controls.filter((c) => c.implementationStatus === 'IMPLEMENTED').length;
    const partial = controls.filter((c) => c.implementationStatus === 'PARTIAL').length;
    const notStarted = controls.filter((c) => c.implementationStatus === 'NOT_STARTED').length;

    return {
      organisationId,
      gaps,
      summary: {
        total,
        implemented,
        partial,
        notStarted,
        completionRate: total > 0 ? Math.round((implemented / total) * 100) : 0,
      },
    };
  }
}
