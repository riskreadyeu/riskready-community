import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class IncidentNotificationService {
  private readonly logger = new Logger(IncidentNotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createRequiredNotifications(incidentId: string, userId: string) {
    this.logger.debug(`createRequiredNotifications(${incidentId})`);
    return { incidentId, notifications: [] };
  }
}
