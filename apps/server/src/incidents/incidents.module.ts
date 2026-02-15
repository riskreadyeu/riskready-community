import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

// Services
import { IncidentService } from './services/incident.service';
import { IncidentClassificationService } from './services/incident-classification.service';
import { IncidentNotificationService } from './services/incident-notification.service';

// Controllers
import { IncidentController } from './controllers/incident.controller';
import { IncidentTimelineController } from './controllers/incident-timeline.controller';
import { IncidentEvidenceController } from './controllers/incident-evidence.controller';
import { IncidentLessonsLearnedController } from './controllers/incident-lessons-learned.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    IncidentController,
    IncidentTimelineController,
    IncidentEvidenceController,
    IncidentLessonsLearnedController,
  ],
  providers: [
    IncidentService,
    IncidentClassificationService,
    IncidentNotificationService,
  ],
  exports: [
    IncidentService,
    IncidentClassificationService,
    IncidentNotificationService,
  ],
})
export class IncidentsModule {}
