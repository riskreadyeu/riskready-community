import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentSectionType, DocumentType } from '@prisma/client';

@Injectable()
export class DocumentSectionService {
  constructor(private prisma: PrismaService) {}

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
    structuredData?: any;
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
    structuredData?: any;
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
      structuredData: template.schema,
      templateId: template.id,
      createdById,
    });
  }

  // =============================================
  // DOCUMENT DEFINITIONS
  // =============================================

  async getDefinitions(documentId: string) {
    return this.prisma.documentDefinition.findMany({
      where: { documentId },
      orderBy: { order: 'asc' },
    });
  }

  async getDefinition(id: string) {
    const definition = await this.prisma.documentDefinition.findUnique({
      where: { id },
    });

    if (!definition) {
      throw new NotFoundException(`Definition with ID ${id} not found`);
    }

    return definition;
  }

  async createDefinition(data: {
    documentId: string;
    term: string;
    definition: string;
    source?: string;
    order?: number;
  }) {
    const { documentId, term, definition, source, order = 0 } = data;

    // Check if term already exists for this document
    const existing = await this.prisma.documentDefinition.findUnique({
      where: { documentId_term: { documentId, term } },
    });

    if (existing) {
      throw new BadRequestException(`Definition for term "${term}" already exists`);
    }

    return this.prisma.documentDefinition.create({
      data: {
        document: { connect: { id: documentId } },
        term,
        definition,
        source,
        order,
      },
    });
  }

  async updateDefinition(id: string, data: {
    term?: string;
    definition?: string;
    source?: string;
    order?: number;
  }) {
    return this.prisma.documentDefinition.update({
      where: { id },
      data,
    });
  }

  async deleteDefinition(id: string) {
    await this.prisma.documentDefinition.delete({ where: { id } });
    return { deleted: true };
  }

  async bulkCreateDefinitions(documentId: string, definitions: Array<{
    term: string;
    definition: string;
    source?: string;
    order?: number;
  }>) {
    // Verify document exists
    const document = await this.prisma.policyDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    // Check for duplicate terms
    const terms = definitions.map(d => d.term);
    const duplicates = terms.filter((term, index) => terms.indexOf(term) !== index);

    if (duplicates.length > 0) {
      throw new BadRequestException(`Duplicate terms found: ${duplicates.join(', ')}`);
    }

    // Create all definitions
    const created = await this.prisma.$transaction(
      definitions.map((def, index) =>
        this.prisma.documentDefinition.create({
          data: {
            document: { connect: { id: documentId } },
            term: def.term,
            definition: def.definition,
            source: def.source,
            order: def.order ?? index,
          },
        })
      )
    );

    return { created: created.length, definitions: created };
  }

  // =============================================
  // DOCUMENT PROCESS STEPS
  // =============================================

  async getProcessSteps(documentId: string) {
    return this.prisma.documentProcessStep.findMany({
      where: { documentId },
      orderBy: { order: 'asc' },
    });
  }

  async getProcessStep(id: string) {
    const step = await this.prisma.documentProcessStep.findUnique({
      where: { id },
    });

    if (!step) {
      throw new NotFoundException(`Process step with ID ${id} not found`);
    }

    return step;
  }

  async createProcessStep(data: {
    documentId: string;
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
    decisionOptions?: any;
  }) {
    const {
      documentId,
      stepNumber,
      title,
      description,
      order = 0,
      responsible,
      accountable,
      consulted = [],
      informed = [],
      estimatedDuration,
      inputs = [],
      outputs = [],
      isDecisionPoint = false,
      decisionOptions,
    } = data;

    return this.prisma.documentProcessStep.create({
      data: {
        document: { connect: { id: documentId } },
        stepNumber,
        title,
        description,
        order,
        responsible,
        accountable,
        consulted,
        informed,
        estimatedDuration,
        inputs,
        outputs,
        isDecisionPoint,
        decisionOptions,
      },
    });
  }

  async updateProcessStep(id: string, data: {
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
    decisionOptions?: any;
  }) {
    return this.prisma.documentProcessStep.update({
      where: { id },
      data,
    });
  }

  async deleteProcessStep(id: string) {
    await this.prisma.documentProcessStep.delete({ where: { id } });
    return { deleted: true };
  }

  async bulkCreateProcessSteps(documentId: string, steps: Array<{
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
    decisionOptions?: any;
  }>) {
    // Verify document exists
    const document = await this.prisma.policyDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    const created = await this.prisma.$transaction(
      steps.map((step, index) =>
        this.prisma.documentProcessStep.create({
          data: {
            document: { connect: { id: documentId } },
            stepNumber: step.stepNumber,
            title: step.title,
            description: step.description,
            order: step.order ?? index,
            responsible: step.responsible,
            accountable: step.accountable,
            consulted: step.consulted || [],
            informed: step.informed || [],
            estimatedDuration: step.estimatedDuration,
            inputs: step.inputs || [],
            outputs: step.outputs || [],
            isDecisionPoint: step.isDecisionPoint || false,
            decisionOptions: step.decisionOptions,
          },
        })
      )
    );

    return { created: created.length, steps: created };
  }

  // =============================================
  // DOCUMENT PREREQUISITES
  // =============================================

  async getPrerequisites(documentId: string) {
    return this.prisma.documentPrerequisite.findMany({
      where: { documentId },
      orderBy: { order: 'asc' },
    });
  }

  async getPrerequisite(id: string) {
    const prerequisite = await this.prisma.documentPrerequisite.findUnique({
      where: { id },
    });

    if (!prerequisite) {
      throw new NotFoundException(`Prerequisite with ID ${id} not found`);
    }

    return prerequisite;
  }

  async createPrerequisite(data: {
    documentId: string;
    item: string;
    category?: string;
    isMandatory?: boolean;
    order?: number;
  }) {
    const { documentId, item, category, isMandatory = true, order = 0 } = data;

    return this.prisma.documentPrerequisite.create({
      data: {
        document: { connect: { id: documentId } },
        item,
        category,
        isMandatory,
        order,
      },
    });
  }

  async updatePrerequisite(id: string, data: {
    item?: string;
    category?: string;
    isMandatory?: boolean;
    order?: number;
  }) {
    return this.prisma.documentPrerequisite.update({
      where: { id },
      data,
    });
  }

  async deletePrerequisite(id: string) {
    await this.prisma.documentPrerequisite.delete({ where: { id } });
    return { deleted: true };
  }

  async bulkCreatePrerequisites(documentId: string, prerequisites: Array<{
    item: string;
    category?: string;
    isMandatory?: boolean;
    order?: number;
  }>) {
    // Verify document exists
    const document = await this.prisma.policyDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    const created = await this.prisma.$transaction(
      prerequisites.map((prereq, index) =>
        this.prisma.documentPrerequisite.create({
          data: {
            document: { connect: { id: documentId } },
            item: prereq.item,
            category: prereq.category,
            isMandatory: prereq.isMandatory ?? true,
            order: prereq.order ?? index,
          },
        })
      )
    );

    return { created: created.length, prerequisites: created };
  }

  // =============================================
  // DOCUMENT ROLES
  // =============================================

  async getRoles(documentId: string) {
    return this.prisma.documentRole.findMany({
      where: { documentId },
      orderBy: { order: 'asc' },
    });
  }

  async getRole(id: string) {
    const role = await this.prisma.documentRole.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }

  async createRole(data: {
    documentId: string;
    role: string;
    responsibilities?: string[];
    raciMatrix?: any;
    order?: number;
  }) {
    const { documentId, role, responsibilities = [], raciMatrix, order = 0 } = data;

    return this.prisma.documentRole.create({
      data: {
        document: { connect: { id: documentId } },
        role,
        responsibilities,
        raciMatrix,
        order,
      },
    });
  }

  async updateRole(id: string, data: {
    role?: string;
    responsibilities?: string[];
    raciMatrix?: any;
    order?: number;
  }) {
    return this.prisma.documentRole.update({
      where: { id },
      data,
    });
  }

  async deleteRole(id: string) {
    await this.prisma.documentRole.delete({ where: { id } });
    return { deleted: true };
  }

  async bulkCreateRoles(documentId: string, roles: Array<{
    role: string;
    responsibilities?: string[];
    raciMatrix?: any;
    order?: number;
  }>) {
    // Verify document exists
    const document = await this.prisma.policyDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    const created = await this.prisma.$transaction(
      roles.map((r, index) =>
        this.prisma.documentRole.create({
          data: {
            document: { connect: { id: documentId } },
            role: r.role,
            responsibilities: r.responsibilities || [],
            raciMatrix: r.raciMatrix,
            order: r.order ?? index,
          },
        })
      )
    );

    return { created: created.length, roles: created };
  }

  // =============================================
  // DOCUMENT REVISIONS
  // =============================================

  async getRevisions(documentId: string) {
    return this.prisma.documentRevision.findMany({
      where: { documentId },
      orderBy: { date: 'desc' },
    });
  }

  async getRevision(id: string) {
    const revision = await this.prisma.documentRevision.findUnique({
      where: { id },
    });

    if (!revision) {
      throw new NotFoundException(`Revision with ID ${id} not found`);
    }

    return revision;
  }

  async createRevision(data: {
    documentId: string;
    version: string;
    date: Date;
    author: string;
    description: string;
    approvedBy?: string;
    order?: number;
  }) {
    const { documentId, version, date, author, description, approvedBy, order = 0 } = data;

    return this.prisma.documentRevision.create({
      data: {
        document: { connect: { id: documentId } },
        version,
        date,
        author,
        description,
        approvedBy,
        order,
      },
    });
  }

  async updateRevision(id: string, data: {
    version?: string;
    date?: Date;
    author?: string;
    description?: string;
    approvedBy?: string;
    order?: number;
  }) {
    return this.prisma.documentRevision.update({
      where: { id },
      data,
    });
  }

  async deleteRevision(id: string) {
    await this.prisma.documentRevision.delete({ where: { id } });
    return { deleted: true };
  }

  async bulkCreateRevisions(documentId: string, revisions: Array<{
    version: string;
    date: Date;
    author: string;
    description: string;
    approvedBy?: string;
    order?: number;
  }>) {
    // Verify document exists
    const document = await this.prisma.policyDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    const created = await this.prisma.$transaction(
      revisions.map((rev, index) =>
        this.prisma.documentRevision.create({
          data: {
            document: { connect: { id: documentId } },
            version: rev.version,
            date: rev.date,
            author: rev.author,
            description: rev.description,
            approvedBy: rev.approvedBy,
            order: rev.order ?? index,
          },
        })
      )
    );

    return { created: created.length, revisions: created };
  }

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
    schema?: any;
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
    schema?: any;
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
        structuredData: section.structuredData,
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
        decisionOptions: step.decisionOptions,
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
        raciMatrix: role.raciMatrix,
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
