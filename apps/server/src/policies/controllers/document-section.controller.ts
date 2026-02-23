import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { DocumentSectionService } from '../services/document-section.service';
import { DocumentSectionType, DocumentType, Prisma } from '@prisma/client';

@Controller('policies')
export class DocumentSectionController {
  constructor(private readonly service: DocumentSectionService) {}

  // =============================================
  // DOCUMENT SECTIONS
  // =============================================

  @Get(':documentId/sections')
  async getSections(@Param('documentId') documentId: string) {
    return this.service.getSections(documentId);
  }

  @Get('sections/:id')
  async getSection(@Param('id') id: string) {
    return this.service.getSection(id);
  }

  @Post(':documentId/sections')
  async createSection(
    @Param('documentId') documentId: string,
    @Body()
    data: {
      sectionType: DocumentSectionType;
      title: string;
      order?: number;
      content?: string;
      structuredData?: Prisma.InputJsonValue;
      templateId?: string;
      isVisible?: boolean;
      isCollapsed?: boolean;
      createdById?: string;
    },
  ) {
    return this.service.createSection({ documentId, ...data });
  }

  @Put('sections/:id')
  async updateSection(
    @Param('id') id: string,
    @Body()
    data: {
      title?: string;
      order?: number;
      content?: string;
      structuredData?: Prisma.InputJsonValue;
      isVisible?: boolean;
      isCollapsed?: boolean;
    },
  ) {
    return this.service.updateSection(id, data);
  }

  @Delete('sections/:id')
  async deleteSection(@Param('id') id: string) {
    return this.service.deleteSection(id);
  }

  @Put(':documentId/sections/reorder')
  async reorderSections(
    @Param('documentId') documentId: string,
    @Body() data: { sectionOrders: Array<{ id: string; order: number }> },
  ) {
    return this.service.reorderSections(documentId, data.sectionOrders);
  }

  @Post(':documentId/sections/from-template')
  async cloneSectionsFromTemplate(
    @Param('documentId') documentId: string,
    @Body() data: { templateId: string; startOrder?: number; createdById?: string },
  ) {
    return this.service.cloneSectionsFromTemplate({ documentId, ...data });
  }

  // =============================================
  // DOCUMENT DEFINITIONS
  // =============================================

  @Get(':documentId/definitions')
  async getDefinitions(@Param('documentId') documentId: string) {
    return this.service.getDefinitions(documentId);
  }

  @Get('definitions/:id')
  async getDefinition(@Param('id') id: string) {
    return this.service.getDefinition(id);
  }

  @Post(':documentId/definitions')
  async createDefinition(
    @Param('documentId') documentId: string,
    @Body() data: { term: string; definition: string; source?: string; order?: number },
  ) {
    return this.service.createDefinition({ documentId, ...data });
  }

  @Put('definitions/:id')
  async updateDefinition(
    @Param('id') id: string,
    @Body() data: { term?: string; definition?: string; source?: string; order?: number },
  ) {
    return this.service.updateDefinition(id, data);
  }

  @Delete('definitions/:id')
  async deleteDefinition(@Param('id') id: string) {
    return this.service.deleteDefinition(id);
  }

  @Post(':documentId/definitions/bulk')
  async bulkCreateDefinitions(
    @Param('documentId') documentId: string,
    @Body()
    data: {
      definitions: Array<{
        term: string;
        definition: string;
        source?: string;
        order?: number;
      }>;
    },
  ) {
    return this.service.bulkCreateDefinitions(documentId, data.definitions);
  }

  // =============================================
  // DOCUMENT PROCESS STEPS
  // =============================================

  @Get(':documentId/process-steps')
  async getProcessSteps(@Param('documentId') documentId: string) {
    return this.service.getProcessSteps(documentId);
  }

  @Get('process-steps/:id')
  async getProcessStep(@Param('id') id: string) {
    return this.service.getProcessStep(id);
  }

  @Post(':documentId/process-steps')
  async createProcessStep(
    @Param('documentId') documentId: string,
    @Body()
    data: {
      stepNumber: string;
      title: string;
      description: string;
      order?: number;
      responsible?: string;
      accountable?: string;
      consulted?: string[];
      informed?: string[];
      estimatedDuration?: string;
      inputs?: string[];
      outputs?: string[];
      isDecisionPoint?: boolean;
      decisionOptions?: Prisma.InputJsonValue;
    },
  ) {
    return this.service.createProcessStep({ documentId, ...data });
  }

  @Put('process-steps/:id')
  async updateProcessStep(
    @Param('id') id: string,
    @Body()
    data: {
      stepNumber?: string;
      title?: string;
      description?: string;
      order?: number;
      responsible?: string;
      accountable?: string;
      consulted?: string[];
      informed?: string[];
      estimatedDuration?: string;
      inputs?: string[];
      outputs?: string[];
      isDecisionPoint?: boolean;
      decisionOptions?: Prisma.InputJsonValue;
    },
  ) {
    return this.service.updateProcessStep(id, data);
  }

  @Delete('process-steps/:id')
  async deleteProcessStep(@Param('id') id: string) {
    return this.service.deleteProcessStep(id);
  }

  @Post(':documentId/process-steps/bulk')
  async bulkCreateProcessSteps(
    @Param('documentId') documentId: string,
    @Body()
    data: {
      steps: Array<{
        stepNumber: string;
        title: string;
        description: string;
        order?: number;
        responsible?: string;
        accountable?: string;
        consulted?: string[];
        informed?: string[];
        estimatedDuration?: string;
        inputs?: string[];
        outputs?: string[];
        isDecisionPoint?: boolean;
        decisionOptions?: Prisma.InputJsonValue;
      }>;
    },
  ) {
    return this.service.bulkCreateProcessSteps(documentId, data.steps);
  }

  // =============================================
  // DOCUMENT PREREQUISITES
  // =============================================

  @Get(':documentId/prerequisites')
  async getPrerequisites(@Param('documentId') documentId: string) {
    return this.service.getPrerequisites(documentId);
  }

  @Get('prerequisites/:id')
  async getPrerequisite(@Param('id') id: string) {
    return this.service.getPrerequisite(id);
  }

  @Post(':documentId/prerequisites')
  async createPrerequisite(
    @Param('documentId') documentId: string,
    @Body()
    data: {
      item: string;
      category?: string;
      isMandatory?: boolean;
      order?: number;
    },
  ) {
    return this.service.createPrerequisite({ documentId, ...data });
  }

  @Put('prerequisites/:id')
  async updatePrerequisite(
    @Param('id') id: string,
    @Body()
    data: {
      item?: string;
      category?: string;
      isMandatory?: boolean;
      order?: number;
    },
  ) {
    return this.service.updatePrerequisite(id, data);
  }

  @Delete('prerequisites/:id')
  async deletePrerequisite(@Param('id') id: string) {
    return this.service.deletePrerequisite(id);
  }

  @Post(':documentId/prerequisites/bulk')
  async bulkCreatePrerequisites(
    @Param('documentId') documentId: string,
    @Body()
    data: {
      prerequisites: Array<{
        item: string;
        category?: string;
        isMandatory?: boolean;
        order?: number;
      }>;
    },
  ) {
    return this.service.bulkCreatePrerequisites(documentId, data.prerequisites);
  }

  // =============================================
  // DOCUMENT ROLES
  // =============================================

  @Get(':documentId/roles')
  async getRoles(@Param('documentId') documentId: string) {
    return this.service.getRoles(documentId);
  }

  @Get('roles/:id')
  async getRole(@Param('id') id: string) {
    return this.service.getRole(id);
  }

  @Post(':documentId/roles')
  async createRole(
    @Param('documentId') documentId: string,
    @Body()
    data: {
      role: string;
      responsibilities?: string[];
      raciMatrix?: Prisma.InputJsonValue;
      order?: number;
    },
  ) {
    return this.service.createRole({ documentId, ...data });
  }

  @Put('roles/:id')
  async updateRole(
    @Param('id') id: string,
    @Body()
    data: {
      role?: string;
      responsibilities?: string[];
      raciMatrix?: Prisma.InputJsonValue;
      order?: number;
    },
  ) {
    return this.service.updateRole(id, data);
  }

  @Delete('roles/:id')
  async deleteRole(@Param('id') id: string) {
    return this.service.deleteRole(id);
  }

  @Post(':documentId/roles/bulk')
  async bulkCreateRoles(
    @Param('documentId') documentId: string,
    @Body()
    data: {
      roles: Array<{
        role: string;
        responsibilities?: string[];
        raciMatrix?: Prisma.InputJsonValue;
        order?: number;
      }>;
    },
  ) {
    return this.service.bulkCreateRoles(documentId, data.roles);
  }

  // =============================================
  // DOCUMENT REVISIONS
  // =============================================

  @Get(':documentId/revisions')
  async getRevisions(@Param('documentId') documentId: string) {
    return this.service.getRevisions(documentId);
  }

  @Get('revisions/:id')
  async getRevision(@Param('id') id: string) {
    return this.service.getRevision(id);
  }

  @Post(':documentId/revisions')
  async createRevision(
    @Param('documentId') documentId: string,
    @Body()
    data: {
      version: string;
      date: string;
      author: string;
      description: string;
      approvedBy?: string;
      order?: number;
    },
  ) {
    return this.service.createRevision({
      documentId,
      ...data,
      date: new Date(data.date),
    });
  }

  @Put('revisions/:id')
  async updateRevision(
    @Param('id') id: string,
    @Body()
    data: {
      version?: string;
      date?: string;
      author?: string;
      description?: string;
      approvedBy?: string;
      order?: number;
    },
  ) {
    return this.service.updateRevision(id, {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
    });
  }

  @Delete('revisions/:id')
  async deleteRevision(@Param('id') id: string) {
    return this.service.deleteRevision(id);
  }

  @Post(':documentId/revisions/bulk')
  async bulkCreateRevisions(
    @Param('documentId') documentId: string,
    @Body()
    data: {
      revisions: Array<{
        version: string;
        date: string;
        author: string;
        description: string;
        approvedBy?: string;
        order?: number;
      }>;
    },
  ) {
    return this.service.bulkCreateRevisions(
      documentId,
      data.revisions.map((r) => ({ ...r, date: new Date(r.date) })),
    );
  }

  // =============================================
  // SECTION TEMPLATES
  // =============================================

  @Get('section-templates')
  async getTemplates(@Query('organisationId') organisationId?: string) {
    return this.service.getTemplates(organisationId);
  }

  @Get('section-templates/:id')
  async getTemplate(@Param('id') id: string) {
    return this.service.getTemplate(id);
  }

  @Post('section-templates')
  async createTemplate(
    @Body()
    data: {
      name: string;
      sectionType: DocumentSectionType;
      applicableTypes?: DocumentType[];
      isRequired?: boolean;
      defaultOrder?: number;
      defaultTitle?: string;
      defaultContent?: string;
      schema?: Prisma.InputJsonValue;
      description?: string;
      helpText?: string;
      organisationId?: string;
      isSystemTemplate?: boolean;
    },
  ) {
    return this.service.createTemplate(data);
  }

  @Put('section-templates/:id')
  async updateTemplate(
    @Param('id') id: string,
    @Body()
    data: {
      name?: string;
      applicableTypes?: DocumentType[];
      isRequired?: boolean;
      defaultOrder?: number;
      defaultTitle?: string;
      defaultContent?: string;
      schema?: Prisma.InputJsonValue;
      description?: string;
      helpText?: string;
    },
  ) {
    return this.service.updateTemplate(id, data);
  }

  @Delete('section-templates/:id')
  async deleteTemplate(@Param('id') id: string) {
    return this.service.deleteTemplate(id);
  }

  // =============================================
  // UTILITY ENDPOINTS
  // =============================================

  @Get(':documentId/structure')
  async getDocumentStructure(@Param('documentId') documentId: string) {
    return this.service.getDocumentStructure(documentId);
  }

  @Post(':documentId/structure/clone')
  async cloneDocumentStructure(
    @Param('documentId') targetDocumentId: string,
    @Body() data: { sourceDocumentId: string; createdById?: string },
  ) {
    return this.service.cloneDocumentStructure(
      data.sourceDocumentId,
      targetDocumentId,
      data.createdById,
    );
  }

  @Delete(':documentId/structure')
  async deleteDocumentStructure(@Param('documentId') documentId: string) {
    return this.service.deleteDocumentStructure(documentId);
  }
}
