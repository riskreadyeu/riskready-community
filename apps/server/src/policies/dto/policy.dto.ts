import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsInt,
  IsArray,
  IsDateString,
  IsNotEmpty,
  MaxLength,
  MinLength,
  ArrayNotEmpty,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  DocumentType,
  DocumentStatus,
  ClassificationLevel,
  ReviewFrequency,
  ApprovalLevel,
  ChangeType,
  ReviewType,
  ReviewOutcome,
  ApprovalWorkflowType,
  WorkflowStatus,
  ApprovalStepStatus,
  ApprovalDecision,
  ApprovalOutcome,
  ChangePriority,
  ChangeRequestStatus,
  ExceptionStatus,
  AcknowledgmentMethod,
  ControlMappingType,
  CoverageLevel,
  RiskRelationshipType,
  DocumentRelationType,
  AttachmentType,
  DocumentSectionType,
} from '@prisma/client';

// =============================================
// POLICY DOCUMENT DTOs
// =============================================

export class CreatePolicyDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  shortTitle?: string;

  @IsEnum(DocumentType)
  @IsNotEmpty()
  documentType!: DocumentType;

  @IsEnum(ClassificationLevel)
  @IsOptional()
  classification?: ClassificationLevel;

  @IsArray()
  @IsOptional()
  distribution?: string[];

  @IsArray()
  @IsOptional()
  restrictedTo?: string[];

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  purpose!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  scope!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  content!: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  parentDocumentId?: string;

  @IsEnum(ReviewFrequency)
  @IsOptional()
  reviewFrequency?: ReviewFrequency;

  @IsString()
  @IsNotEmpty()
  documentOwner!: string;

  @IsString()
  @IsOptional()
  documentOwnerId?: string;

  @IsString()
  @IsNotEmpty()
  author!: string;

  @IsString()
  @IsOptional()
  authorId?: string;

  @IsEnum(ApprovalLevel)
  @IsNotEmpty()
  approvalLevel!: ApprovalLevel;

  @IsBoolean()
  @IsOptional()
  requiresAcknowledgment?: boolean;

  @IsInt()
  @IsOptional()
  @Min(1)
  acknowledgmentDeadline?: number;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsOptional()
  keywords?: string[];

  @IsString()
  @IsOptional()
  language?: string;

  @IsOptional()
  definitions?: any;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  locale?: string;

  @IsArray()
  @IsOptional()
  externalReferences?: string[];

  @IsString()
  @IsNotEmpty()
  organisationId!: string;
}

export class UpdatePolicyDocumentDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  shortTitle?: string;

  @IsEnum(DocumentType)
  @IsOptional()
  documentType?: DocumentType;

  @IsEnum(ClassificationLevel)
  @IsOptional()
  classification?: ClassificationLevel;

  @IsArray()
  @IsOptional()
  distribution?: string[];

  @IsArray()
  @IsOptional()
  restrictedTo?: string[];

  @IsString()
  @IsOptional()
  @MinLength(10)
  purpose?: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  scope?: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  content?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  parentDocumentId?: string;

  @IsEnum(ReviewFrequency)
  @IsOptional()
  reviewFrequency?: ReviewFrequency;

  @IsInt()
  @IsOptional()
  @Min(1)
  reviewReminder?: number;

  @IsString()
  @IsOptional()
  documentOwner?: string;

  @IsString()
  @IsOptional()
  documentOwnerId?: string;

  @IsEnum(ApprovalLevel)
  @IsOptional()
  approvalLevel?: ApprovalLevel;

  @IsBoolean()
  @IsOptional()
  requiresAcknowledgment?: boolean;

  @IsInt()
  @IsOptional()
  @Min(1)
  acknowledgmentDeadline?: number;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsOptional()
  keywords?: string[];

  @IsString()
  @IsOptional()
  updatedById?: string;

  @IsDateString()
  @IsOptional()
  retirementDate?: string;

  @IsString()
  @IsOptional()
  supersededById?: string;

  @IsDateString()
  @IsOptional()
  lastReviewDate?: string;

  @IsDateString()
  @IsOptional()
  nextReviewDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  locale?: string;

  @IsArray()
  @IsOptional()
  externalReferences?: string[];

  @IsOptional()
  definitions?: any;
}

export class UpdatePolicyStatusDto {
  @IsEnum(DocumentStatus)
  @IsNotEmpty()
  status!: DocumentStatus;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  statusReason?: string;

  @IsDateString()
  @IsOptional()
  effectiveDate?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsString()
  @IsOptional()
  approvedBy?: string;

  @IsString()
  @IsOptional()
  approverId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  approvalComments?: string;

  @IsString()
  @IsOptional()
  digitalSignature?: string;

  @IsString()
  @IsOptional()
  updatedById?: string;
}

// =============================================
// SECTION DTOs
// =============================================

export class CreateSectionDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsEnum(DocumentSectionType)
  @IsNotEmpty()
  sectionType!: DocumentSectionType;

  @IsString()
  @IsOptional()
  templateId?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;

  @IsString()
  @IsOptional()
  content?: string;

  @IsOptional()
  structuredData?: any;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @IsBoolean()
  @IsOptional()
  isCollapsed?: boolean;

  @IsString()
  @IsOptional()
  createdById?: string;
}

export class UpdateSectionDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;

  @IsString()
  @IsOptional()
  content?: string;

  @IsOptional()
  structuredData?: any;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @IsBoolean()
  @IsOptional()
  isCollapsed?: boolean;
}

export class ReorderSectionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SectionOrderItem)
  sections!: SectionOrderItem[];
}

class SectionOrderItem {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsInt()
  @Min(0)
  order!: number;
}

// =============================================
// DEFINITION DTOs
// =============================================

export class CreateDefinitionDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  term!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  definition!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  source?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;
}

export class UpdateDefinitionDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(200)
  term?: string;

  @IsString()
  @IsOptional()
  @MinLength(3)
  definition?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  source?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;
}

export class BulkCreateDefinitionsDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => DefinitionItem)
  definitions!: DefinitionItem[];
}

class DefinitionItem {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  term!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  definition!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  source?: string;
}

// =============================================
// PROCESS STEP DTOs
// =============================================

export class CreateProcessStepDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(20)
  stepNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  description!: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  responsible?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  accountable?: string;

  @IsArray()
  @IsOptional()
  consulted?: string[];

  @IsArray()
  @IsOptional()
  informed?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(100)
  estimatedDuration?: string;

  @IsArray()
  @IsOptional()
  inputs?: string[];

  @IsArray()
  @IsOptional()
  outputs?: string[];

  @IsBoolean()
  @IsOptional()
  isDecisionPoint?: boolean;

  @IsOptional()
  decisionOptions?: any;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;
}

export class UpdateProcessStepDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(20)
  stepNumber?: string;

  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MinLength(5)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  responsible?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  accountable?: string;

  @IsArray()
  @IsOptional()
  consulted?: string[];

  @IsArray()
  @IsOptional()
  informed?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(100)
  estimatedDuration?: string;

  @IsArray()
  @IsOptional()
  inputs?: string[];

  @IsArray()
  @IsOptional()
  outputs?: string[];

  @IsBoolean()
  @IsOptional()
  isDecisionPoint?: boolean;

  @IsOptional()
  decisionOptions?: any;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;
}

// =============================================
// PREREQUISITE DTOs
// =============================================

export class CreatePrerequisiteDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  item!: string;

  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;
}

export class UpdatePrerequisiteDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @IsString()
  @IsOptional()
  @MinLength(3)
  item?: string;

  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;
}

// =============================================
// ROLE DTOs
// =============================================

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  role!: string;

  @IsArray()
  @IsOptional()
  responsibilities?: string[];

  @IsOptional()
  raciMatrix?: any;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;
}

export class UpdateRoleDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(200)
  role?: string;

  @IsArray()
  @IsOptional()
  responsibilities?: string[];

  @IsOptional()
  raciMatrix?: any;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;
}

// =============================================
// REVISION DTOs
// =============================================

export class CreateRevisionDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(20)
  version!: string;

  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  author!: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  approvedBy?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  description!: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;
}

export class UpdateRevisionDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(20)
  version?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(200)
  author?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  approvedBy?: string;

  @IsString()
  @IsOptional()
  @MinLength(5)
  description?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;
}

// =============================================
// ATTACHMENT DTOs
// =============================================

export class CreateAttachmentDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  filename!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  originalFilename!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  size!: number;

  @IsEnum(AttachmentType)
  @IsNotEmpty()
  attachmentType!: AttachmentType;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsNotEmpty()
  storagePath!: string;

  @IsString()
  @IsOptional()
  storageProvider?: string;

  @IsString()
  @IsNotEmpty()
  checksum!: string;

  @IsBoolean()
  @IsOptional()
  isEncrypted?: boolean;

  @IsString()
  @IsOptional()
  uploadedById?: string;
}

export class UpdateAttachmentDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  filename?: string;

  @IsEnum(AttachmentType)
  @IsOptional()
  attachmentType?: AttachmentType;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}

// =============================================
// MAPPING DTOs
// =============================================

export class AddControlMappingDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  controlId!: string;

  @IsEnum(ControlMappingType)
  @IsOptional()
  mappingType?: ControlMappingType;

  @IsEnum(CoverageLevel)
  @IsOptional()
  coverage?: CoverageLevel;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;

  @IsBoolean()
  @IsOptional()
  evidenceRequired?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  evidenceDescription?: string;

  @IsString()
  @IsOptional()
  createdById?: string;
}

export class UpdateControlMappingDto {
  @IsEnum(ControlMappingType)
  @IsOptional()
  mappingType?: ControlMappingType;

  @IsEnum(CoverageLevel)
  @IsOptional()
  coverage?: CoverageLevel;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;

  @IsBoolean()
  @IsOptional()
  evidenceRequired?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  evidenceDescription?: string;
}

export class AddRiskMappingDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  riskId!: string;

  @IsEnum(RiskRelationshipType)
  @IsOptional()
  relationshipType?: RiskRelationshipType;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;

  @IsString()
  @IsOptional()
  createdById?: string;
}

export class UpdateRiskMappingDto {
  @IsEnum(RiskRelationshipType)
  @IsOptional()
  relationshipType?: RiskRelationshipType;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}

export class AddDocumentRelationDto {
  @IsString()
  @IsNotEmpty()
  sourceDocumentId!: string;

  @IsString()
  @IsNotEmpty()
  targetDocumentId!: string;

  @IsEnum(DocumentRelationType)
  @IsNotEmpty()
  relationType!: DocumentRelationType;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  createdById?: string;
}

// =============================================
// TEMPLATE DTOs
// =============================================

export class CreateSectionTemplateDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @IsEnum(DocumentSectionType)
  @IsNotEmpty()
  sectionType!: DocumentSectionType;

  @IsArray()
  @IsOptional()
  @IsEnum(DocumentType, { each: true })
  applicableTypes?: DocumentType[];

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsInt()
  @IsOptional()
  @Min(0)
  defaultOrder?: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  defaultTitle?: string;

  @IsString()
  @IsOptional()
  defaultContent?: string;

  @IsOptional()
  schema?: any;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  helpText?: string;

  @IsString()
  @IsOptional()
  organisationId?: string;

  @IsBoolean()
  @IsOptional()
  isSystemTemplate?: boolean;
}

export class UpdateSectionTemplateDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(200)
  name?: string;

  @IsEnum(DocumentSectionType)
  @IsOptional()
  sectionType?: DocumentSectionType;

  @IsArray()
  @IsOptional()
  @IsEnum(DocumentType, { each: true })
  applicableTypes?: DocumentType[];

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsInt()
  @IsOptional()
  @Min(0)
  defaultOrder?: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  defaultTitle?: string;

  @IsString()
  @IsOptional()
  defaultContent?: string;

  @IsOptional()
  schema?: any;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  helpText?: string;
}

// =============================================
// DOCUMENT VERSION DTOs
// =============================================

export class CreateDocumentVersionDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(20)
  version!: string;

  @IsInt()
  @IsNotEmpty()
  @Min(1)
  majorVersion!: number;

  @IsInt()
  @IsNotEmpty()
  @Min(0)
  minorVersion!: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  content!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  changeDescription!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  changeSummary?: string;

  @IsEnum(ChangeType)
  @IsNotEmpty()
  changeType!: ChangeType;

  @IsString()
  @IsOptional()
  approvedBy?: string;

  @IsDateString()
  @IsOptional()
  approvalDate?: string;

  @IsString()
  @IsOptional()
  diffFromPrevious?: string;

  @IsString()
  @IsOptional()
  createdById?: string;
}

// =============================================
// DOCUMENT REVIEW DTOs
// =============================================

export class CreateDocumentReviewDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsEnum(ReviewType)
  @IsNotEmpty()
  reviewType!: ReviewType;

  @IsDateString()
  @IsOptional()
  reviewDate?: string;

  @IsString()
  @IsOptional()
  reviewedById?: string;

  @IsEnum(ReviewOutcome)
  @IsNotEmpty()
  outcome!: ReviewOutcome;

  @IsString()
  @IsOptional()
  findings?: string;

  @IsString()
  @IsOptional()
  recommendations?: string;

  @IsString()
  @IsOptional()
  actionItems?: string;

  @IsBoolean()
  @IsOptional()
  changesRequired?: boolean;

  @IsString()
  @IsOptional()
  changeDescription?: string;

  @IsDateString()
  @IsOptional()
  nextReviewDate?: string;
}

// =============================================
// APPROVAL WORKFLOW DTOs
// =============================================

export class CreateApprovalWorkflowDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsEnum(ApprovalWorkflowType)
  @IsNotEmpty()
  workflowType!: ApprovalWorkflowType;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ApprovalStepDto)
  steps!: ApprovalStepDto[];

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  comments?: string;

  @IsString()
  @IsOptional()
  initiatedById?: string;
}

class ApprovalStepDto {
  @IsInt()
  @Min(1)
  stepOrder!: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  stepName!: string;

  @IsString()
  @IsOptional()
  approverId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  approverRole?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class UpdateApprovalStepDto {
  @IsEnum(ApprovalStepStatus)
  @IsOptional()
  status?: ApprovalStepStatus;

  @IsEnum(ApprovalDecision)
  @IsOptional()
  decision?: ApprovalDecision;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  comments?: string;

  @IsString()
  @IsOptional()
  signature?: string;

  @IsString()
  @IsOptional()
  delegatedToId?: string;
}

export class CompleteApprovalWorkflowDto {
  @IsEnum(ApprovalOutcome)
  @IsNotEmpty()
  finalOutcome!: ApprovalOutcome;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  comments?: string;
}

// =============================================
// CHANGE REQUEST DTOs
// =============================================

export class CreateChangeRequestDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  changeRequestId!: string;

  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  justification!: string;

  @IsEnum(ChangeType)
  @IsNotEmpty()
  changeType!: ChangeType;

  @IsEnum(ChangePriority)
  @IsNotEmpty()
  priority!: ChangePriority;

  @IsString()
  @IsOptional()
  impactAssessment?: string;

  @IsArray()
  @IsOptional()
  affectedDocuments?: string[];

  @IsArray()
  @IsOptional()
  affectedProcesses?: string[];

  @IsArray()
  @IsOptional()
  affectedSystems?: string[];

  @IsDateString()
  @IsOptional()
  targetDate?: string;

  @IsString()
  @IsOptional()
  requestedById?: string;

  @IsString()
  @IsNotEmpty()
  organisationId!: string;
}

export class UpdateChangeRequestDto {
  @IsString()
  @IsOptional()
  @MinLength(5)
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  description?: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  justification?: string;

  @IsEnum(ChangeType)
  @IsOptional()
  changeType?: ChangeType;

  @IsEnum(ChangePriority)
  @IsOptional()
  priority?: ChangePriority;

  @IsEnum(ChangeRequestStatus)
  @IsOptional()
  status?: ChangeRequestStatus;

  @IsString()
  @IsOptional()
  impactAssessment?: string;

  @IsArray()
  @IsOptional()
  affectedDocuments?: string[];

  @IsArray()
  @IsOptional()
  affectedProcesses?: string[];

  @IsArray()
  @IsOptional()
  affectedSystems?: string[];

  @IsDateString()
  @IsOptional()
  targetDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  approvalComments?: string;
}

export class ApproveChangeRequestDto {
  @IsString()
  @IsOptional()
  approverId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  approvalComments?: string;
}

export class ImplementChangeRequestDto {
  @IsString()
  @IsOptional()
  implementedById?: string;

  @IsString()
  @IsOptional()
  newVersionId?: string;

  @IsDateString()
  @IsOptional()
  actualCompletionDate?: string;
}

// =============================================
// EXCEPTION DTOs
// =============================================

export class CreateDocumentExceptionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  exceptionId!: string;

  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  justification!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  scope!: string;

  @IsArray()
  @IsOptional()
  affectedEntities?: string[];

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  riskAssessment!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  residualRisk!: string;

  @IsString()
  @IsOptional()
  compensatingControls?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsEnum(ApprovalLevel)
  @IsNotEmpty()
  approvalLevel!: ApprovalLevel;

  @IsEnum(ReviewFrequency)
  @IsOptional()
  reviewFrequency?: ReviewFrequency;

  @IsString()
  @IsOptional()
  requestedById?: string;

  @IsString()
  @IsNotEmpty()
  organisationId!: string;
}

export class UpdateDocumentExceptionDto {
  @IsString()
  @IsOptional()
  @MinLength(5)
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  description?: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  justification?: string;

  @IsString()
  @IsOptional()
  @MinLength(10)
  scope?: string;

  @IsArray()
  @IsOptional()
  affectedEntities?: string[];

  @IsString()
  @IsOptional()
  @MinLength(10)
  riskAssessment?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  residualRisk?: string;

  @IsString()
  @IsOptional()
  compensatingControls?: string;

  @IsEnum(ExceptionStatus)
  @IsOptional()
  status?: ExceptionStatus;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsEnum(ReviewFrequency)
  @IsOptional()
  reviewFrequency?: ReviewFrequency;
}

export class ApproveExceptionDto {
  @IsString()
  @IsOptional()
  approvedById?: string;

  @IsDateString()
  @IsOptional()
  approvalDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  approvalComments?: string;
}

export class CloseExceptionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  closureReason!: string;
}

// =============================================
// ACKNOWLEDGMENT DTOs
// =============================================

export class CreateAcknowledgmentDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  documentVersion!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class RecordAcknowledgmentDto {
  @IsEnum(AcknowledgmentMethod)
  @IsNotEmpty()
  method!: AcknowledgmentMethod;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;
}

export class BulkCreateAcknowledgmentsDto {
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @IsString()
  @IsNotEmpty()
  documentVersion!: string;

  @IsArray()
  @ArrayNotEmpty()
  userIds!: string[];

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
