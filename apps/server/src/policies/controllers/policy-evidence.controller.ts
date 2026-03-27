import { Controller, Post, Get, Param } from '@nestjs/common';
import { PolicyEvidenceCollectorService } from '../services/policy-evidence-collector.service';

@Controller('policies/evidence')
export class PolicyEvidenceController {
  constructor(private readonly evidenceCollector: PolicyEvidenceCollectorService) {}

  /**
   * Trigger evidence collection for Control 5.1 capabilities
   * Collects evidence from:
   * - Approval workflows → 5.1-C01 (Policy Development and Approval)
   * - Acknowledgments → 5.1-C02 (Policy Communication and Acknowledgment)
   * - Document inventory → 5.1-C03 (Topic-Specific Policy Framework)
   * - Reviews and change requests → 5.1-C04 (Policy Review and Maintenance)
   */
  @Post('collect/:organisationId')
  async collectEvidence(@Param('organisationId') organisationId: string) {
    const result = await this.evidenceCollector.collectAllEvidence(organisationId);
    return {
      success: result.errors.length === 0,
      ...result,
    };
  }

  /**
   * Get summary of collected evidence for Control 5.1
   */
  @Get('summary/:organisationId')
  async getEvidenceSummary(@Param('organisationId') organisationId: string) {
    return this.evidenceCollector.getEvidenceSummary(organisationId);
  }
}
