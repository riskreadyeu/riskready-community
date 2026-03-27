import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentSectionType, DocumentType, Prisma } from '@prisma/client';
import { DocumentContentCrudHelper } from './document-content-crud.helper';

@Injectable()
export class DocumentSectionService {
  private readonly contentCrud: DocumentContentCrudHelper;

  constructor(private prisma: PrismaService) {
    this.contentCrud = new DocumentContentCrudHelper(prisma);
  }

  // =============================================
  // DOCUMENT SECTIONS
  // =============================================

  async getSections(documentId: string) {
    return this.prisma.documentSection.findMany({
      where: { documentId },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            sectionType: true,
            defaultTitle: true,
          },
        },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { order: 'asc' },
    });
  }

  async getSection(id: string) {
    const section = await this.prisma.documentSection.findUnique({
      where: { id },
      include: {
        template: true,
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (!section) {
      throw new NotFoundException(`Section with ID ${id} not found`);
    }

    return section;
  }

  async createSection(data: {
    documentId: string;
    sectionType: DocumentSectionType;
    title: string;
    order?: number;
    content?: string;
    structuredData?: Prisma.InputJsonValue;
    templateId?: string;
    isVisible?: boolean;
    isCollapsed?: boolean;
    createdById?: string;
  }) {
    const {
      documentId,
      sectionType,
      title,
      order = 0,
      content,
      structuredData,
      templateId,
      isVisible = true,
      isCollapsed = false,
      createdById,
    } = data;

    // Verify document exists
    const document = await this.prisma.policyDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    return this.prisma.documentSection.create({
      data: {
        document: { connect: { id: documentId } },
        sectionType,
        title,
        order,
        content,
        structuredData,
        template: templateId ? { connect: { id: templateId } } : undefined,
        isVisible,
        isCollapsed,
        createdBy: createdById ? { connect: { id: createdById } } : undefined,
      },
      include: {
        template: true,
      },
    });
  }

  async updateSection(id: string, data: {
    title?: string;
    order?: number;
    content?: string;
    structuredData?: Prisma.InputJsonValue;
    isVisible?: boolean;
    isCollapsed?: boolean;
  }) {
    return this.prisma.documentSection.update({
      where: { id },
      data,
      include: {
        template: true,
      },
    });
  }

  async deleteSection(id: string) {
    await this.prisma.documentSection.delete({ where: { id } });
    return { deleted: true };
  }

  async reorderSections(documentId: string, sectionOrders: Array<{ id: string; order: number }>) {
    // Verify all sections belong to the document
    const sections = await this.prisma.documentSection.findMany({
      where: {
        id: { in: sectionOrders.map(s => s.id) },
        documentId,
      },
    });

    if (sections.length !== sectionOrders.length) {
      throw new BadRequestException('Some sections do not belong to this document');
    }

    // Batch update orders
    const updates = sectionOrders.map(({ id, order }) =>
      this.prisma.documentSection.update({
        where: { id },
        data: { order },
      })
    );

    await this.prisma.$transaction(updates);

    return { updated: true, count: updates.length };
  }

  async cloneSectionsFromTemplate(data: {
    documentId: string;
    templateId: string;
    startOrder?: number;
    createdById?: string;
  }) {
    const { documentId, templateId, startOrder = 0, createdById } = data;

    // Get template sections
    const template = await this.prisma.documentSectionTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    // Create section from template
    return this.createSection({
      documentId,
      sectionType: template.sectionType,
      title: template.defaultTitle || template.name,
      order: startOrder,
      content: template.defaultContent || undefined,
      structuredData: template.schema as Prisma.InputJsonValue ?? undefined,
      templateId: template.id,
      createdById,
    });
  }

  // =============================================
  // CONTENT ENTITIES (delegated to helper)
  // =============================================

  // Definitions
  getDefinitions(documentId: string) { return this.contentCrud.getDefinitions(documentId); }
  getDefinition(id: string) { return this.contentCrud.getDefinition(id); }
  createDefinition(data: Parameters<DocumentContentCrudHelper['createDefinition']>[0]) { return this.contentCrud.createDefinition(data); }
  updateDefinition(...args: Parameters<DocumentContentCrudHelper['updateDefinition']>) { return this.contentCrud.updateDefinition(...args); }
  deleteDefinition(id: string) { return this.contentCrud.deleteDefinition(id); }
  bulkCreateDefinitions(...args: Parameters<DocumentContentCrudHelper['bulkCreateDefinitions']>) { return this.contentCrud.bulkCreateDefinitions(...args); }

  // Process Steps
  getProcessSteps(documentId: string) { return this.contentCrud.getProcessSteps(documentId); }
  getProcessStep(id: string) { return this.contentCrud.getProcessStep(id); }
  createProcessStep(data: Parameters<DocumentContentCrudHelper['createProcessStep']>[0]) { return this.contentCrud.createProcessStep(data); }
  updateProcessStep(...args: Parameters<DocumentContentCrudHelper['updateProcessStep']>) { return this.contentCrud.updateProcessStep(...args); }
  deleteProcessStep(id: string) { return this.contentCrud.deleteProcessStep(id); }
  bulkCreateProcessSteps(...args: Parameters<DocumentContentCrudHelper['bulkCreateProcessSteps']>) { return this.contentCrud.bulkCreateProcessSteps(...args); }

  // Prerequisites
  getPrerequisites(documentId: string) { return this.contentCrud.getPrerequisites(documentId); }
  getPrerequisite(id: string) { return this.contentCrud.getPrerequisite(id); }
  createPrerequisite(data: Parameters<DocumentContentCrudHelper['createPrerequisite']>[0]) { return this.contentCrud.createPrerequisite(data); }
  updatePrerequisite(...args: Parameters<DocumentContentCrudHelper['updatePrerequisite']>) { return this.contentCrud.updatePrerequisite(...args); }
  deletePrerequisite(id: string) { return this.contentCrud.deletePrerequisite(id); }
  bulkCreatePrerequisites(...args: Parameters<DocumentContentCrudHelper['bulkCreatePrerequisites']>) { return this.contentCrud.bulkCreatePrerequisites(...args); }

  // Roles
  getRoles(documentId: string) { return this.contentCrud.getRoles(documentId); }
  getRole(id: string) { return this.contentCrud.getRole(id); }
  createRole(data: Parameters<DocumentContentCrudHelper['createRole']>[0]) { return this.contentCrud.createRole(data); }
  updateRole(...args: Parameters<DocumentContentCrudHelper['updateRole']>) { return this.contentCrud.updateRole(...args); }
  deleteRole(id: string) { return this.contentCrud.deleteRole(id); }
  bulkCreateRoles(...args: Parameters<DocumentContentCrudHelper['bulkCreateRoles']>) { return this.contentCrud.bulkCreateRoles(...args); }

  // Revisions
  getRevisions(documentId: string) { return this.contentCrud.getRevisions(documentId); }
  getRevision(id: string) { return this.contentCrud.getRevision(id); }
  createRevision(data: Parameters<DocumentContentCrudHelper['createRevision']>[0]) { return this.contentCrud.createRevision(data); }
  updateRevision(...args: Parameters<DocumentContentCrudHelper['updateRevision']>) { return this.contentCrud.updateRevision(...args); }
  deleteRevision(id: string) { return this.contentCrud.deleteRevision(id); }
  bulkCreateRevisions(...args: Parameters<DocumentContentCrudHelper['bulkCreateRevisions']>) { return this.contentCrud.bulkCreateRevisions(...args); }

  // =============================================
  // DOCUMENT SECTION TEMPLATES
  // =============================================

  async getTemplates(organisationId?: string) {
    return this.prisma.documentSectionTemplate.findMany({
      where: {
        OR: [
          { isSystemTemplate: true },
          { organisationId },
        ],
      },
      orderBy: { name: 'asc' },
    });
  }

  async getTemplate(id: string) {
    const template = await this.prisma.documentSectionTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return template;
  }

  async createTemplate(data: {
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
  }) {
    const {
      name,
      sectionType,
      applicableTypes = [],
      isRequired = false,
      defaultOrder = 0,
      defaultTitle,
      defaultContent,
      schema,
      description,
      helpText,
      organisationId,
      isSystemTemplate = false,
    } = data;

    // Check if template name already exists for this organization
    if (organisationId) {
      const existing = await this.prisma.documentSectionTemplate.findUnique({
        where: { name_organisationId: { name, organisationId } },
      });

      if (existing) {
        throw new BadRequestException(`Template "${name}" already exists for this organization`);
      }
    }

    return this.prisma.documentSectionTemplate.create({
      data: {
        name,
        sectionType,
        applicableTypes,
        isRequired,
        defaultOrder,
        defaultTitle,
        defaultContent,
        schema,
        description,
        helpText,
        organisation: organisationId ? { connect: { id: organisationId } } : undefined,
        isSystemTemplate,
      },
    });
  }

  async updateTemplate(id: string, data: {
    name?: string;
    applicableTypes?: DocumentType[];
    isRequired?: boolean;
    defaultOrder?: number;
    defaultTitle?: string;
    defaultContent?: string;
    schema?: Prisma.InputJsonValue;
    description?: string;
    helpText?: string;
  }) {
    // Don't allow updating system templates
    const template = await this.getTemplate(id);

    if (template.isSystemTemplate) {
      throw new BadRequestException('Cannot update system templates');
    }

    return this.prisma.documentSectionTemplate.update({
      where: { id },
      data,
    });
  }

  async deleteTemplate(id: string) {
    // Don't allow deleting system templates
    const template = await this.getTemplate(id);

    if (template.isSystemTemplate) {
      throw new BadRequestException('Cannot delete system templates');
    }

    await this.prisma.documentSectionTemplate.delete({ where: { id } });
    return { deleted: true };
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  async getDocumentStructure(documentId: string) {
    const [sections, definitions, processSteps, prerequisites, roles, revisions] = await Promise.all([
      this.getSections(documentId),
      this.getDefinitions(documentId),
      this.getProcessSteps(documentId),
      this.getPrerequisites(documentId),
      this.getRoles(documentId),
      this.getRevisions(documentId),
    ]);

    return {
      sections,
      definitions,
      processSteps,
      prerequisites,
      roles,
      revisions,
    };
  }

  async cloneDocumentStructure(sourceDocumentId: string, targetDocumentId: string, createdById?: string) {
    const structure = await this.getDocumentStructure(sourceDocumentId);

    // Clone all sections
    const sectionPromises = structure.sections.map(section =>
      this.createSection({
        documentId: targetDocumentId,
        sectionType: section.sectionType,
        title: section.title,
        order: section.order,
        content: section.content || undefined,
        structuredData: section.structuredData as Prisma.InputJsonValue | undefined,
        templateId: section.templateId || undefined,
        isVisible: section.isVisible,
        isCollapsed: section.isCollapsed,
        createdById,
      })
    );

    // Clone definitions
    const definitionPromises = structure.definitions.map(def =>
      this.createDefinition({
        documentId: targetDocumentId,
        term: def.term,
        definition: def.definition,
        source: def.source || undefined,
        order: def.order,
      })
    );

    // Clone process steps
    const processStepPromises = structure.processSteps.map(step =>
      this.createProcessStep({
        documentId: targetDocumentId,
        stepNumber: step.stepNumber,
        title: step.title,
        description: step.description,
        order: step.order,
        responsible: step.responsible || undefined,
        accountable: step.accountable || undefined,
        consulted: step.consulted,
        informed: step.informed,
        estimatedDuration: step.estimatedDuration || undefined,
        inputs: step.inputs,
        outputs: step.outputs,
        isDecisionPoint: step.isDecisionPoint,
        decisionOptions: step.decisionOptions as Prisma.InputJsonValue ?? undefined,
      })
    );

    // Clone prerequisites
    const prerequisitePromises = structure.prerequisites.map(prereq =>
      this.createPrerequisite({
        documentId: targetDocumentId,
        item: prereq.item,
        category: prereq.category || undefined,
        isMandatory: prereq.isMandatory,
        order: prereq.order,
      })
    );

    // Clone roles
    const rolePromises = structure.roles.map(role =>
      this.createRole({
        documentId: targetDocumentId,
        role: role.role,
        responsibilities: role.responsibilities,
        raciMatrix: role.raciMatrix as Prisma.InputJsonValue | undefined,
        order: role.order,
      })
    );

    // Clone revisions
    const revisionPromises = structure.revisions.map(rev =>
      this.createRevision({
        documentId: targetDocumentId,
        version: rev.version,
        date: rev.date,
        author: rev.author,
        description: rev.description,
        approvedBy: rev.approvedBy || undefined,
        order: rev.order,
      })
    );

    // Execute all cloning operations
    const [sections, definitions, processSteps, prerequisites, roles, revisions] = await Promise.all([
      Promise.all(sectionPromises),
      Promise.all(definitionPromises),
      Promise.all(processStepPromises),
      Promise.all(prerequisitePromises),
      Promise.all(rolePromises),
      Promise.all(revisionPromises),
    ]);

    return {
      cloned: {
        sections: sections.length,
        definitions: definitions.length,
        processSteps: processSteps.length,
        prerequisites: prerequisites.length,
        roles: roles.length,
        revisions: revisions.length,
      },
      data: {
        sections,
        definitions,
        processSteps,
        prerequisites,
        roles,
        revisions,
      },
    };
  }

  async deleteDocumentStructure(documentId: string) {
    // Delete all structured data for a document
    await this.prisma.$transaction([
      this.prisma.documentSection.deleteMany({ where: { documentId } }),
      this.prisma.documentDefinition.deleteMany({ where: { documentId } }),
      this.prisma.documentProcessStep.deleteMany({ where: { documentId } }),
      this.prisma.documentPrerequisite.deleteMany({ where: { documentId } }),
      this.prisma.documentRole.deleteMany({ where: { documentId } }),
      this.prisma.documentRevision.deleteMany({ where: { documentId } }),
    ]);

    return { deleted: true };
  }
}
