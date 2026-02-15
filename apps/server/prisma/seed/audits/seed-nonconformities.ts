import { PrismaClient, NonconformitySource, NCSeverity, NCCategory, NCStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function seedNonconformities() {
  console.log('🔍 Seeding nonconformities...');

  // Get sample data
  const users = await prisma.user.findMany({ take: 3 });
  const controls = await prisma.control.findMany({ take: 10, include: { capabilities: true } });
  const tests = await prisma.capabilityEffectivenessTest.findMany({ 
    where: { testResult: 'FAIL' },
    take: 5,
    include: { capability: { include: { control: true } } }
  });

  if (users.length === 0) {
    console.log('⚠️  No users found. Skipping NC seed.');
    return;
  }

  if (controls.length === 0) {
    console.log('⚠️  No controls found. Skipping NC seed.');
    return;
  }

  const user1 = users[0];
  const user2 = users.length > 1 ? users[1] : users[0];

  // Clear existing NCs
  await prisma.nonconformity.deleteMany();

  const year = new Date().getFullYear();
  const nonconformities = [];

  // NC from failed test (if any)
  if (tests.length > 0) {
    const test = tests[0];
    nonconformities.push({
      ncId: `NC-${year}-001`,
      dateRaised: new Date('2024-11-15'),
      source: NonconformitySource.TEST,
      sourceReferenceId: test.id,
      severity: NCSeverity.MAJOR,
      category: NCCategory.CONTROL_FAILURE,
      title: `${test.testType} Test Failed: ${test.capability.name}`,
      description: `${test.testType} effectiveness test failed for capability ${test.capability.capabilityId}. The control does not operate as designed.`,
      findings: test.findings || 'Control testing revealed significant gaps in the implementation.',
      rootCause: 'Inadequate documentation and lack of automated monitoring.',
      impact: 'Control effectiveness cannot be assured, increasing risk exposure.',
      isoClause: test.capability.control.sourceStandard || 'A.5.1',
      controlId: test.capability.controlId,
      capabilityId: test.capabilityId,
      testId: test.id,
      correctiveAction: 'Implement automated monitoring and update documentation within 30 days.',
      responsibleUserId: user2.id,
      targetClosureDate: new Date('2024-12-31'),
      status: NCStatus.IN_PROGRESS,
      raisedById: user1.id,
    });
  }

  // NC from internal audit
  if (controls.length > 0 && controls[0].capabilities.length > 0) {
    const control = controls[0];
    const capability = control.capabilities[0];
    
    nonconformities.push({
      ncId: `NC-${year}-002`,
      dateRaised: new Date('2024-11-20'),
      source: NonconformitySource.INTERNAL_AUDIT,
      severity: NCSeverity.MINOR,
      category: NCCategory.DOCUMENTATION,
      title: 'Incomplete Access Control Documentation',
      description: `Documentation for ${control.name} is incomplete. Missing evidence of periodic access reviews.`,
      findings: 'Access review logs for Q3 2024 are missing. No evidence of management approval for privileged accounts.',
      rootCause: 'Lack of standardized documentation process and unclear ownership.',
      impact: 'Cannot demonstrate compliance during external audit.',
      isoClause: 'A.9.2',
      controlId: control.id,
      capabilityId: capability.id,
      correctiveAction: 'Complete missing documentation and implement quarterly review checklist.',
      responsibleUserId: user1.id,
      targetClosureDate: new Date('2024-12-15'),
      status: NCStatus.AWAITING_VERIFICATION,
      verificationMethod: 'Document review and walkthrough',
      verificationDate: new Date('2024-12-10'),
      verifiedById: user2.id,
      verificationResult: 'EFFECTIVE',
      verificationNotes: 'All missing documentation has been completed. Quarterly checklist implemented.',
      raisedById: user2.id,
    });
  }

  // NC from external audit
  if (controls.length > 1 && controls[1].capabilities.length > 0) {
    const control = controls[1];
    const capability = control.capabilities[0];
    
    nonconformities.push({
      ncId: `NC-${year}-003`,
      dateRaised: new Date('2024-10-05'),
      source: NonconformitySource.EXTERNAL_AUDIT,
      severity: NCSeverity.MAJOR,
      category: NCCategory.PROCESS,
      title: 'Patch Management Process Not Followed',
      description: `Critical security patches were not applied within the required timeframe for ${control.name}.`,
      findings: 'Audit evidence shows 15 servers with critical patches overdue by more than 30 days.',
      rootCause: 'Patch management process not integrated with vulnerability scanning tools. Manual tracking failed.',
      impact: 'Systems remain vulnerable to known exploits. Non-compliance with ISO 27001 requirements.',
      isoClause: 'A.8.8',
      controlId: control.id,
      capabilityId: capability.id,
      correctiveAction: 'Implement automated patch deployment and integrate with vulnerability scanner. Retrospectively patch all systems.',
      responsibleUserId: user1.id,
      targetClosureDate: new Date('2024-11-30'),
      status: NCStatus.CLOSED,
      verificationMethod: 'RE_TEST',
      verificationDate: new Date('2024-11-28'),
      verifiedById: user2.id,
      verificationResult: 'EFFECTIVE',
      verificationNotes: 'All systems patched. Automated deployment configured and tested. No overdue patches found.',
      closedAt: new Date('2024-11-29'),
      closedById: user2.id,
      raisedById: user2.id,
    });
  }

  // NC from self-assessment (OVERDUE)
  if (controls.length > 2 && controls[2].capabilities.length > 0) {
    const control = controls[2];
    const capability = control.capabilities[0];
    
    nonconformities.push({
      ncId: `NC-${year}-004`,
      dateRaised: new Date('2024-09-01'),
      source: NonconformitySource.SELF_ASSESSMENT,
      severity: NCSeverity.MINOR,
      category: NCCategory.TRAINING,
      title: 'Security Awareness Training Compliance Gap',
      description: `Only 75% of staff completed mandatory security awareness training for ${control.name}.`,
      findings: '25% of employees have not completed annual security awareness training. Several departments show < 50% completion.',
      rootCause: 'No automated reminder system. Training not tracked in HR system.',
      impact: 'Increased risk of social engineering attacks. Non-compliance with training requirements.',
      isoClause: 'A.6.3',
      controlId: control.id,
      capabilityId: capability.id,
      correctiveAction: 'Integrate training tracker with HR system. Send automated reminders. Make training mandatory for system access.',
      responsibleUserId: user1.id,
      targetClosureDate: new Date('2024-10-31'), // OVERDUE!
      status: NCStatus.OPEN,
      raisedById: user1.id,
    });
  }

  // NC - Recent observation
  if (controls.length > 3 && controls[3].capabilities.length > 0) {
    const control = controls[3];
    const capability = control.capabilities[0];
    
    nonconformities.push({
      ncId: `NC-${year}-005`,
      dateRaised: new Date('2024-12-01'),
      source: NonconformitySource.MANAGEMENT_REVIEW,
      severity: NCSeverity.OBSERVATION,
      category: NCCategory.ORGANIZATIONAL,
      title: 'Opportunity to Improve Incident Response Documentation',
      description: `Incident response documentation for ${control.name} could be enhanced with additional playbooks.`,
      findings: 'Current documentation covers basic scenarios but lacks detailed playbooks for complex attack scenarios.',
      rootCause: 'Documentation has not been updated since initial implementation.',
      impact: 'Minor - current documentation is adequate but could be more comprehensive.',
      isoClause: 'A.5.24',
      controlId: control.id,
      capabilityId: capability.id,
      correctiveAction: 'Develop additional playbooks for ransomware, DDoS, and insider threat scenarios.',
      responsibleUserId: user2.id,
      targetClosureDate: new Date('2025-01-31'),
      status: NCStatus.OPEN,
      raisedById: user1.id,
    });
  }

  // NC - DRAFT status (auto-created from failed test, pending review)
  if (tests.length > 1) {
    const test = tests[1];
    nonconformities.push({
      ncId: `NC-${year}-006`,
      dateRaised: new Date(),
      source: NonconformitySource.TEST,
      sourceReferenceId: test.id,
      severity: NCSeverity.MAJOR,
      category: NCCategory.CONTROL_FAILURE,
      title: `[PENDING REVIEW] ${test.testType} Test Failed: ${test.capability.name}`,
      description: `Auto-created: ${test.testType} effectiveness test failed for capability ${test.capability.capabilityId}. This NC requires manual review before being opened.`,
      findings: test.findings || 'Automated test detected control effectiveness issues.',
      isoClause: test.capability.control.sourceStandard || 'A.5.1',
      controlId: test.capability.controlId,
      capabilityId: test.capabilityId,
      testId: test.id,
      status: NCStatus.DRAFT, // Auto-created, pending manual review
      raisedById: user1.id,
    });
  } else if (controls.length > 4 && controls[4].capabilities.length > 0) {
    // Fallback if no failed tests
    const control = controls[4];
    const capability = control.capabilities[0];
    
    nonconformities.push({
      ncId: `NC-${year}-006`,
      dateRaised: new Date(),
      source: NonconformitySource.TEST,
      severity: NCSeverity.MAJOR,
      category: NCCategory.CONTROL_FAILURE,
      title: `[PENDING REVIEW] Design Test Failed: ${control.name}`,
      description: `Auto-created: DESIGN effectiveness test failed for control ${control.controlId}. This NC requires manual review before being opened.`,
      findings: 'Automated test detected control design issues that require validation.',
      isoClause: control.sourceStandard || 'A.5.1',
      controlId: control.id,
      capabilityId: capability.id,
      status: NCStatus.DRAFT, // Auto-created, pending manual review
      raisedById: user1.id,
    });
  }

  // NC - Another DRAFT status for more realistic testing
  if (controls.length > 5 && controls[5].capabilities.length > 0) {
    const control = controls[5];
    const capability = control.capabilities[0];
    
    nonconformities.push({
      ncId: `NC-${year}-007`,
      dateRaised: new Date(),
      source: NonconformitySource.TEST,
      severity: NCSeverity.MINOR,
      category: NCCategory.PROCESS,
      title: `[PENDING REVIEW] Operating Test Failed: ${control.name}`,
      description: `Auto-created: OPERATING effectiveness test failed for control ${control.controlId}. Review findings and decide whether to open or reject this NC.`,
      findings: 'Automated operating test detected process deviations. Review required to confirm if this constitutes a nonconformity.',
      isoClause: control.sourceStandard || 'A.5.1',
      controlId: control.id,
      capabilityId: capability.id,
      status: NCStatus.DRAFT, // Auto-created, pending manual review
      raisedById: user1.id,
    });
  }

  // Create all NCs
  for (const nc of nonconformities) {
    await prisma.nonconformity.create({ data: nc });
  }

  console.log(`✅ Seeded ${nonconformities.length} nonconformities`);
  console.log(`   - 1 MAJOR IN_PROGRESS (from failed test)`);
  console.log(`   - 1 MINOR AWAITING_VERIFICATION (documentation)`);
  console.log(`   - 1 MAJOR CLOSED (external audit)`);
  console.log(`   - 1 MINOR OPEN OVERDUE (training)`);
  console.log(`   - 1 OBSERVATION OPEN (management review)`);
  console.log(`   - 1-2 DRAFT (pending review - auto-created)`);
}

// Run if executed directly
if (require.main === module) {
  seedNonconformities()
    .catch((e) => {
      console.error('❌ Error seeding nonconformities:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seedNonconformities };
