import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';

/**
 * Helper class for document content entity CRUD operations.
 * Handles Definitions, ProcessSteps, Prerequisites, Roles, and Revisions.
 *
 * This is extracted from DocumentSectionService to reduce file size.
 * Not an Injectable -- instantiated by DocumentSectionService.
 */
export class DocumentContentCrudHelper {
  constructor(private readonly prisma: PrismaService) {}

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
    decisionOptions?: Prisma.InputJsonValue;
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
    decisionOptions?: Prisma.InputJsonValue;
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
    decisionOptions?: Prisma.InputJsonValue;
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
    raciMatrix?: Prisma.InputJsonValue;
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
    raciMatrix?: Prisma.InputJsonValue;
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
    raciMatrix?: Prisma.InputJsonValue;
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
}
