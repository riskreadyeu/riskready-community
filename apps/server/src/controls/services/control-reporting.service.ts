import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ControlReportingService {
  constructor(private prisma: PrismaService) {}

  async getEffectivenessReport(organisationId: string) {
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

    const total = controls.length;
    const byStatus = {
      implemented: controls.filter((c) => c.implementationStatus === 'IMPLEMENTED').length,
      partial: controls.filter((c) => c.implementationStatus === 'PARTIAL').length,
      notStarted: controls.filter((c) => c.implementationStatus === 'NOT_STARTED').length,
    };

    return {
      organisationId,
      controls: controls.map((c) => ({
        controlId: c.controlId,
        name: c.name,
        theme: c.theme,
        implementationStatus: c.implementationStatus,
      })),
      summary: {
        total,
        ...byStatus,
        implementationRate: total > 0 ? Math.round((byStatus.implemented / total) * 100) : 0,
      },
    };
  }
}
