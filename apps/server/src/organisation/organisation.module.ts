import { Module } from '@nestjs/common';
// PrismaService provided globally by PrismaModule

// Services
import { OrganisationProfileService } from './services/organisation-profile.service';
import { DepartmentService } from './services/department.service';
import { OrganisationalUnitService } from './services/organisational-unit.service';
import { LocationService } from './services/location.service';
import { ExecutivePositionService } from './services/executive-position.service';
import { SecurityChampionService } from './services/security-champion.service';
import { BusinessProcessService } from './services/business-process.service';
import { ExternalDependencyService } from './services/external-dependency.service';
import { RegulatorService } from './services/regulator.service';
import { SecurityCommitteeService } from './services/security-committee.service';
import { CommitteeMembershipService } from './services/committee-membership.service';
import { CommitteeMeetingService } from './services/committee-meeting.service';
import { MeetingAttendanceService } from './services/meeting-attendance.service';
import { MeetingDecisionService } from './services/meeting-decision.service';
import { MeetingActionItemService } from './services/meeting-action-item.service';
import { RegulatoryEligibilityService } from './services/regulatory-eligibility.service';
import { RegulatoryScopePropagationService } from './services/regulatory-scope-propagation.service';
import { OrganisationDashboardService } from './services/organisation-dashboard.service';
import { ProductServiceService } from './services/product-service.service';
import { TechnologyPlatformService } from './services/technology-platform.service';
import { InterestedPartyService } from './services/interested-party.service';
import { ContextIssueService } from './services/context-issue.service';
import { KeyPersonnelService } from './services/key-personnel.service';
import { ApplicableFrameworkService } from './services/applicable-framework.service';
// Controllers
import { OrganisationProfileController } from './controllers/organisation-profile.controller';
import { DepartmentController } from './controllers/department.controller';
import { OrganisationalUnitController } from './controllers/organisational-unit.controller';
import { LocationController } from './controllers/location.controller';
import { ExecutivePositionController } from './controllers/executive-position.controller';
import { SecurityChampionController } from './controllers/security-champion.controller';
import { BusinessProcessController } from './controllers/business-process.controller';
import { ExternalDependencyController } from './controllers/external-dependency.controller';
import { RegulatorController } from './controllers/regulator.controller';
import { SecurityCommitteeController } from './controllers/security-committee.controller';
import { CommitteeMembershipController } from './controllers/committee-membership.controller';
import { CommitteeMeetingController } from './controllers/committee-meeting.controller';
import { MeetingAttendanceController } from './controllers/meeting-attendance.controller';
import { MeetingDecisionController } from './controllers/meeting-decision.controller';
import { MeetingActionItemController } from './controllers/meeting-action-item.controller';
import { RegulatoryEligibilityController } from './controllers/regulatory-eligibility.controller';
import { OrganisationDashboardController } from './controllers/organisation-dashboard.controller';
import { ProductServiceController } from './controllers/product-service.controller';
import { TechnologyPlatformController } from './controllers/technology-platform.controller';
import { InterestedPartyController } from './controllers/interested-party.controller';
import { ContextIssueController } from './controllers/context-issue.controller';
import { KeyPersonnelController } from './controllers/key-personnel.controller';
import { ApplicableFrameworkController } from './controllers/applicable-framework.controller';
@Module({
  controllers: [
    OrganisationProfileController,
    DepartmentController,
    OrganisationalUnitController,
    LocationController,
    ExecutivePositionController,
    SecurityChampionController,
    BusinessProcessController,
    ExternalDependencyController,
    RegulatorController,
    SecurityCommitteeController,
    CommitteeMembershipController,
    CommitteeMeetingController,
    MeetingAttendanceController,
    MeetingDecisionController,
    MeetingActionItemController,
    RegulatoryEligibilityController,
    OrganisationDashboardController,
    ProductServiceController,
    TechnologyPlatformController,
    InterestedPartyController,
    ContextIssueController,
    KeyPersonnelController,
    ApplicableFrameworkController,
  ],
  providers: [
    OrganisationProfileService,
    DepartmentService,
    OrganisationalUnitService,
    LocationService,
    ExecutivePositionService,
    SecurityChampionService,
    BusinessProcessService,
    ExternalDependencyService,
    RegulatorService,
    SecurityCommitteeService,
    CommitteeMembershipService,
    CommitteeMeetingService,
    MeetingAttendanceService,
    MeetingDecisionService,
    MeetingActionItemService,
    RegulatoryEligibilityService,
    RegulatoryScopePropagationService,
    OrganisationDashboardService,
    ProductServiceService,
    TechnologyPlatformService,
    InterestedPartyService,
    ContextIssueService,
    KeyPersonnelService,
    ApplicableFrameworkService,
  ],
  exports: [
    OrganisationProfileService,
    DepartmentService,
    OrganisationalUnitService,
    LocationService,
    ExecutivePositionService,
    SecurityChampionService,
    BusinessProcessService,
    ExternalDependencyService,
    RegulatorService,
    SecurityCommitteeService,
    CommitteeMembershipService,
    CommitteeMeetingService,
    MeetingAttendanceService,
    MeetingDecisionService,
    MeetingActionItemService,
    RegulatoryEligibilityService,
    RegulatoryScopePropagationService,
    OrganisationDashboardService,
    ProductServiceService,
    TechnologyPlatformService,
    InterestedPartyService,
    ContextIssueService,
    KeyPersonnelService,
    ApplicableFrameworkService,
  ],
})
export class OrganisationModule {}
