import { PrismaClient } from '@prisma/client';
import { DemoContext } from './index';

/**
 * Seed NIS2 Directive eligibility survey data for ClearStream Payments.
 *
 * Creates:
 * - 17 SurveyQuestion records covering NIS2 eligibility determination
 * - 1 completed RegulatoryEligibilitySurvey
 * - 17 SurveyResponse records with ClearStream-specific answers
 * - Updates OrganisationProfile with lastNis2AssessmentId
 */
export async function seedNis2Survey(
  prisma: PrismaClient,
  ctx: DemoContext,
): Promise<void> {
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);

  // ============================================================
  // 1. NIS2 ELIGIBILITY SURVEY QUESTIONS (17 questions)
  // ============================================================

  const questionDefs = [
    // --- Entity Identification (steps 1.1–1.4) ---
    {
      stepNumber: '1.1',
      stepCategory: 'Entity Identification',
      questionText:
        'Does your organisation provide services or carry out activities in any EU Member State?',
      ifYes:
        'The organisation falls within the territorial scope of the NIS2 Directive. Proceed to determine sector applicability.',
      ifNo:
        'The NIS2 Directive does not apply to entities that do not provide services or carry out activities within the EU. No further assessment required.',
      legalReference: 'NIS2 Directive (EU) 2022/2555, Article 2(1)',
      notes:
        'Territorial scope covers any entity providing services or carrying out activities within the Union, regardless of place of establishment.',
      sortOrder: 10,
    },
    {
      stepNumber: '1.2',
      stepCategory: 'Entity Identification',
      questionText:
        'Does your organisation fall within a sector listed in Annex I (sectors of high criticality) of the NIS2 Directive? Sectors include: energy, transport, banking, financial market infrastructure, health, drinking water, waste water, digital infrastructure, ICT service management (B2B), public administration, and space.',
      ifYes:
        'The organisation operates in a sector of high criticality. It may qualify as an essential entity (if large) or an important entity (if medium-sized). Proceed to size assessment.',
      ifNo:
        'The organisation does not fall within Annex I. Check Annex II sectors.',
      legalReference:
        'NIS2 Directive (EU) 2022/2555, Article 3(1), Annex I',
      notes:
        'Annex I sectors are considered sectors of high criticality and carry stricter obligations.',
      sortOrder: 20,
    },
    {
      stepNumber: '1.3',
      stepCategory: 'Entity Identification',
      questionText:
        'Does your organisation fall within a sector listed in Annex II (other critical sectors) of the NIS2 Directive? Sectors include: postal and courier services, waste management, manufacture/production/distribution of chemicals, production/processing/distribution of food, manufacturing, digital providers, and research.',
      ifYes:
        'The organisation operates in another critical sector. It may qualify as an important entity if it meets the medium enterprise size threshold. Proceed to size assessment.',
      ifNo:
        'The organisation does not fall within either Annex I or Annex II. Unless special provisions apply (e.g., DNS, TLD, trust services), the NIS2 Directive is unlikely to apply.',
      legalReference:
        'NIS2 Directive (EU) 2022/2555, Article 3(2), Annex II',
      notes:
        'Annex II sectors are classified as other critical sectors with proportionate obligations.',
      sortOrder: 30,
    },
    {
      stepNumber: '1.4',
      stepCategory: 'Entity Identification',
      questionText:
        'Which specific sub-sector best describes your organisation\'s primary activity? (Provide a free-text description.)',
      ifYes: null,
      ifNo: null,
      legalReference:
        'NIS2 Directive (EU) 2022/2555, Annex I and Annex II (sector/sub-sector tables)',
      notes:
        'Identifying the precise sub-sector is necessary for determining the applicable competent authority and for registration purposes under Article 3(3).',
      sortOrder: 40,
    },

    // --- Size Assessment (steps 2.1–2.5) ---
    {
      stepNumber: '2.1',
      stepCategory: 'Size Assessment',
      questionText:
        'Does your organisation employ 250 or more persons?',
      ifYes:
        'The organisation meets the large enterprise threshold. If it operates in an Annex I sector, it qualifies as an essential entity. If in an Annex II sector, it qualifies as an important entity.',
      ifNo:
        'The organisation does not meet the large enterprise threshold. Proceed to check the medium enterprise threshold.',
      legalReference:
        'NIS2 Directive (EU) 2022/2555, Article 2(1); Commission Recommendation 2003/361/EC, Article 2',
      notes:
        'The 250-person threshold is one of the criteria distinguishing large enterprises from medium-sized enterprises under the SME definition.',
      sortOrder: 50,
    },
    {
      stepNumber: '2.2',
      stepCategory: 'Size Assessment',
      questionText:
        'Does your organisation employ 50 or more persons?',
      ifYes:
        'The organisation meets the minimum staffing criterion for a medium-sized enterprise. Check turnover/balance sheet thresholds to confirm medium enterprise status.',
      ifNo:
        'The organisation falls below the medium enterprise headcount threshold. Unless it meets the turnover or balance sheet criteria independently, or a special provision applies, the NIS2 Directive may not apply.',
      legalReference:
        'NIS2 Directive (EU) 2022/2555, Article 2(1); Commission Recommendation 2003/361/EC, Article 2',
      notes:
        'Medium-sized enterprise: 50–249 employees AND annual turnover >EUR 10M or balance sheet >EUR 10M, but not exceeding large enterprise thresholds.',
      sortOrder: 60,
    },
    {
      stepNumber: '2.3',
      stepCategory: 'Size Assessment',
      questionText:
        'Does your organisation have an annual turnover exceeding EUR 50 million?',
      ifYes:
        'The organisation meets the large enterprise turnover threshold. Combined with headcount, this determines essential vs important classification.',
      ifNo:
        'The organisation does not meet the large enterprise turnover threshold. Proceed to check the medium enterprise turnover threshold.',
      legalReference:
        'NIS2 Directive (EU) 2022/2555, Article 2(1); Commission Recommendation 2003/361/EC, Article 2',
      notes:
        'An enterprise is large if it has 250+ employees OR annual turnover >EUR 50M and balance sheet >EUR 43M.',
      sortOrder: 70,
    },
    {
      stepNumber: '2.4',
      stepCategory: 'Size Assessment',
      questionText:
        'Does your organisation have an annual turnover exceeding EUR 10 million?',
      ifYes:
        'The organisation meets the medium enterprise turnover threshold. Combined with headcount (50+), this confirms medium enterprise status under the SME definition.',
      ifNo:
        'The organisation does not meet the medium enterprise turnover threshold. Unless the balance sheet criterion is met, the entity may fall below NIS2 applicability thresholds.',
      legalReference:
        'NIS2 Directive (EU) 2022/2555, Article 2(1); Commission Recommendation 2003/361/EC, Article 2',
      notes:
        'A medium-sized enterprise has turnover >EUR 10M or balance sheet total >EUR 10M.',
      sortOrder: 80,
    },
    {
      stepNumber: '2.5',
      stepCategory: 'Size Assessment',
      questionText:
        'Does your organisation have a balance sheet total exceeding EUR 43 million?',
      ifYes:
        'The organisation meets the large enterprise balance sheet threshold. This may elevate classification to essential entity if combined with the turnover criterion.',
      ifNo:
        'The organisation does not meet the large enterprise balance sheet threshold. Classification will be based on medium enterprise criteria.',
      legalReference:
        'NIS2 Directive (EU) 2022/2555, Article 2(1); Commission Recommendation 2003/361/EC, Article 2',
      notes:
        'Balance sheet total >EUR 43M is the secondary criterion for large enterprise classification.',
      sortOrder: 90,
    },

    // --- Entity Classification (steps 3.1–3.3) ---
    {
      stepNumber: '3.1',
      stepCategory: 'Entity Classification',
      questionText:
        'Is your organisation identified as an essential entity by a Member State under Article 3(1)(e)?',
      ifYes:
        'The organisation is classified as an essential entity regardless of size. Essential entities are subject to the full supervisory regime under Articles 32 and 33.',
      ifNo:
        'The organisation has not been specifically designated as essential. Classification will be determined by sector and size criteria.',
      legalReference:
        'NIS2 Directive (EU) 2022/2555, Article 3(1)(e)',
      notes:
        'Member States may designate specific entities as essential based on national risk assessments, even if they do not meet the standard size thresholds.',
      sortOrder: 100,
    },
    {
      stepNumber: '3.2',
      stepCategory: 'Entity Classification',
      questionText:
        'Does your organisation qualify as a medium-sized enterprise under the SME definition (Commission Recommendation 2003/361/EC)?',
      ifYes:
        'As a medium-sized enterprise in an Annex I sector, the organisation qualifies as an important entity under Article 3(2). As a medium-sized enterprise in an Annex II sector, it also qualifies as an important entity.',
      ifNo:
        'If the organisation is below the medium enterprise threshold and has not been designated essential, it generally falls outside NIS2 scope unless special provisions apply.',
      legalReference:
        'NIS2 Directive (EU) 2022/2555, Article 2(1); Commission Recommendation 2003/361/EC',
      notes:
        'Medium enterprise: 50–249 employees, and annual turnover EUR 10M–50M or balance sheet total EUR 10M–43M.',
      sortOrder: 110,
    },
    {
      stepNumber: '3.3',
      stepCategory: 'Entity Classification',
      questionText:
        'Is your organisation the sole provider of a service that is essential for the maintenance of critical societal or economic activities in a Member State?',
      ifYes:
        'The organisation may be classified as essential regardless of size under Article 3(1)(d). Notify the competent authority of this status.',
      ifNo:
        'Standard size-based classification applies. The organisation is not subject to the sole-provider essential entity designation.',
      legalReference:
        'NIS2 Directive (EU) 2022/2555, Article 3(1)(d)',
      notes:
        'This provision ensures that critical sole providers cannot avoid NIS2 obligations simply because they fall below size thresholds.',
      sortOrder: 120,
    },

    // --- Special Provisions (steps 4.1–4.3) ---
    {
      stepNumber: '4.1',
      stepCategory: 'Special Provisions',
      questionText:
        'Does your organisation provide DNS services, TLD name registration, or domain name registration services?',
      ifYes:
        'The organisation falls within NIS2 scope regardless of its size under Article 2(2)(a). It is subject to the obligations applicable to its classification.',
      ifNo:
        'This special provision does not apply. Proceed to check other special provisions or conclude assessment.',
      legalReference:
        'NIS2 Directive (EU) 2022/2555, Article 2(2)(a)',
      notes:
        'DNS and domain registration services are considered critical for the functioning of the internet and are always in scope.',
      sortOrder: 130,
    },
    {
      stepNumber: '4.2',
      stepCategory: 'Special Provisions',
      questionText:
        'Is your organisation a qualified trust service provider under Regulation (EU) No 910/2014 (eIDAS)?',
      ifYes:
        'The organisation falls within NIS2 scope regardless of its size under Article 2(2)(b). Qualified trust service providers are essential entities.',
      ifNo:
        'This special provision does not apply.',
      legalReference:
        'NIS2 Directive (EU) 2022/2555, Article 2(2)(b); Regulation (EU) No 910/2014',
      notes:
        'Qualified trust service providers are always in scope as essential entities, irrespective of size.',
      sortOrder: 140,
    },
    {
      stepNumber: '4.3',
      stepCategory: 'Special Provisions',
      questionText:
        'Does your organisation manage a top-level domain (TLD) name registry?',
      ifYes:
        'The organisation falls within NIS2 scope regardless of its size under Article 2(2)(c). TLD registries are essential entities.',
      ifNo:
        'This special provision does not apply.',
      legalReference:
        'NIS2 Directive (EU) 2022/2555, Article 2(2)(c)',
      notes:
        'TLD name registries are critical internet infrastructure and are always in scope.',
      sortOrder: 150,
    },

    // --- Regulatory Obligations (steps 5.1–5.2) ---
    {
      stepNumber: '5.1',
      stepCategory: 'Regulatory Obligations',
      questionText:
        'Has your organisation registered with the competent authority in each Member State where it provides services?',
      ifYes:
        'Registration obligation is met. Ensure ongoing compliance with reporting obligations under Articles 23 and 24.',
      ifNo:
        'Registration with the competent authority is mandatory under Article 3(3). Initiate the registration process without delay.',
      legalReference:
        'NIS2 Directive (EU) 2022/2555, Article 3(3)',
      notes:
        'Entities must register with the competent authority and provide specified information including sector, sub-sector, and contact details.',
      sortOrder: 160,
    },
    {
      stepNumber: '5.2',
      stepCategory: 'Regulatory Obligations',
      questionText:
        'Has your organisation designated a representative in the EU if it is not established in a Member State but offers services within the Union?',
      ifYes:
        'Representative designation obligation is met. Ensure the representative is properly registered and contactable by competent authorities.',
      ifNo:
        'If the organisation is established in the EU, this requirement does not apply. If not established in the EU but offering services within it, a representative must be designated under Article 26(3).',
      legalReference:
        'NIS2 Directive (EU) 2022/2555, Article 26(3)',
      notes:
        'This requirement applies only to entities not established in the EU that nevertheless provide services within the Union.',
      sortOrder: 170,
    },
  ];

  const questions = await Promise.all(
    questionDefs.map((q) =>
      prisma.surveyQuestion.upsert({
        where: {
          surveyType_stepNumber: {
            surveyType: 'nis2',
            stepNumber: q.stepNumber,
          },
        },
        update: {},
        create: {
          surveyType: 'nis2',
          stepNumber: q.stepNumber,
          stepCategory: q.stepCategory,
          questionText: q.questionText,
          ifYes: q.ifYes,
          ifNo: q.ifNo,
          legalReference: q.legalReference,
          notes: q.notes,
          sortOrder: q.sortOrder,
        },
      }),
    ),
  );

  console.log(`  📝 ${questions.length} NIS2 survey questions seeded`);

  // Build a lookup: stepNumber → question id
  const qMap = new Map(
    questionDefs.map((def, i) => [def.stepNumber, questions[i].id]),
  );

  // ============================================================
  // 2. COMPLETED SURVEY FOR CLEARSTREAM
  // ============================================================

  const survey = await prisma.regulatoryEligibilitySurvey.create({
    data: {
      surveyType: 'nis2',
      surveyVersion: '1.0',
      status: 'completed',
      completedAt: daysAgo(90),
      isApplicable: true,
      applicabilityReason:
        'ClearStream Payments Ltd qualifies as an important entity under NIS2 Directive Article 3(2). As a medium-sized enterprise (156 employees, EUR 28M revenue) providing banking services (payment processing) listed in Annex I, the organisation exceeds the medium enterprise threshold (50+ employees, EUR 10M+ turnover) and operates within a sector of high criticality.',
      entityClassification: 'important',
      regulatoryRegime: 'nis2',
      createdById: ctx.users.complianceOfficer,
    },
  });

  console.log(`  📋 Completed NIS2 eligibility survey created`);

  // ============================================================
  // 3. SURVEY RESPONSES
  // ============================================================

  // ClearStream's answers: [stepNumber, answer, notes?]
  const responseDefs: [string, string, string | null][] = [
    // Entity Identification
    [
      '1.1',
      'yes',
      'ClearStream Payments Ltd is headquartered in Dublin, Ireland and operates offices in Berlin, Germany and Lisbon, Portugal. Services are provided across multiple EU Member States.',
    ],
    [
      '1.2',
      'yes',
      'ClearStream operates in the banking sector (payment processing and settlement services), which is listed in Annex I of the NIS2 Directive as a sector of high criticality.',
    ],
    [
      '1.3',
      'no',
      'The organisation\'s primary activity falls under Annex I (banking), not Annex II. No secondary activities fall within Annex II sectors.',
    ],
    [
      '1.4',
      'Banking — Payment processing and settlement services',
      'ClearStream provides electronic payment processing, transaction settlement, and related financial technology services to merchants and financial institutions across the EU.',
    ],

    // Size Assessment
    [
      '2.1',
      'no',
      'ClearStream employs 156 persons across three offices (Dublin, Berlin, Lisbon), below the 250-person large enterprise threshold.',
    ],
    [
      '2.2',
      'yes',
      'With 156 employees, ClearStream exceeds the 50-person medium enterprise threshold. Headcount breakdown: Dublin HQ ~90, Berlin ~40, Lisbon ~26.',
    ],
    [
      '2.3',
      'no',
      'Annual turnover is EUR 28M, below the EUR 50M large enterprise threshold.',
    ],
    [
      '2.4',
      'yes',
      'Annual turnover of EUR 28M exceeds the EUR 10M medium enterprise threshold, confirming medium enterprise financial status.',
    ],
    [
      '2.5',
      'no',
      'Balance sheet total is approximately EUR 35M, below the EUR 43M large enterprise threshold.',
    ],

    // Entity Classification
    [
      '3.1',
      'no',
      'ClearStream has not been specifically designated as an essential entity by the Central Bank of Ireland or any other Member State competent authority.',
    ],
    [
      '3.2',
      'yes',
      'ClearStream qualifies as a medium-sized enterprise: 156 employees (50–249 range), EUR 28M turnover (EUR 10M–50M range). This confirms important entity classification under Article 3(2).',
    ],
    [
      '3.3',
      'no',
      'ClearStream is not the sole provider of payment processing services in any Member State. Multiple alternative providers exist in the Irish and EU market.',
    ],

    // Special Provisions
    ['4.1', 'no', null],
    ['4.2', 'no', null],
    ['4.3', 'no', null],

    // Regulatory Obligations
    [
      '5.1',
      'yes',
      'ClearStream is registered with the Central Bank of Ireland (CBI) as the primary competent authority. Registration with BaFin (Germany) and Banco de Portugal is in progress for the Berlin and Lisbon offices respectively.',
    ],
    [
      '5.2',
      'n/a',
      'Not applicable — ClearStream is established in the EU (headquartered in Dublin, Ireland). No representative designation is required.',
    ],
  ];

  const responses = await Promise.all(
    responseDefs.map(([stepNumber, answer, notes]) =>
      prisma.surveyResponse.create({
        data: {
          surveyId: survey.id,
          questionId: qMap.get(stepNumber)!,
          answer,
          notes,
        },
      }),
    ),
  );

  console.log(`  ✅ ${responses.length} survey responses recorded`);

  // ============================================================
  // 4. UPDATE ORGANISATION PROFILE
  // ============================================================

  await prisma.organisationProfile.update({
    where: { id: ctx.orgId },
    data: {
      lastNis2AssessmentId: survey.id,
      regulatoryProfileUpdatedAt: daysAgo(90),
    },
  });

  console.log(`  🔗 Organisation profile linked to NIS2 assessment`);
}
