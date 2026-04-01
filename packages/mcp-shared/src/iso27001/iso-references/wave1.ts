/**
 * ISO 27001/27002 reference excerpts for Wave 1 documents.
 * Only non-seeded Wave 1 documents need references (POL-009 through POL-013).
 * These are summaries of the normative requirements from ISO/IEC 27001:2022.
 */

export const WAVE1_REFERENCES: Record<string, string> = {
  'POL-009': `## ISO/IEC 27001:2022 — Clause 6.1.2: Information security risk assessment

The organization shall define and apply an information security risk assessment process that:

a) establishes and maintains information security risk criteria that include:
   1) the risk acceptance criteria; and
   2) criteria for performing information security risk assessments;

b) ensures that repeated information security risk assessments produce consistent, valid and comparable results;

c) identifies the information security risks:
   1) apply the information security risk assessment process to identify risks associated with the loss of confidentiality, integrity and availability for information within the scope of the ISMS; and
   2) identify the risk owners;

d) analyses the information security risks:
   1) assess the potential consequences that would result if the risks identified were to materialize;
   2) assess the realistic likelihood of the occurrence of the risks identified; and
   3) determine the levels of risk;

e) evaluates the information security risks:
   1) compare the results of risk analysis with the risk criteria established; and
   2) prioritize the analysed risks for risk treatment.

The organization shall retain documented information about the information security risk assessment process.

## ISO/IEC 27001:2022 — Clause 6.1.3: Information security risk treatment

The organization shall define and apply an information security risk treatment process to:
a) select appropriate information security risk treatment options, taking account of the risk assessment results;
b) determine all controls that are necessary to implement the chosen risk treatment option(s);
c) compare the controls determined with those in Annex A and verify that no necessary controls have been omitted;
d) produce a Statement of Applicability that contains the necessary controls, justification for inclusion, whether implemented or not, and justification for excluding any Annex A controls;
e) formulate an information security risk treatment plan; and
f) obtain risk owners' approval of the risk treatment plan and acceptance of the residual information security risks.

## ISO/IEC 27001:2022 — Clause 8.2: Information security risk assessment

The organization shall perform information security risk assessments at planned intervals or when significant changes are proposed or occur, taking account of the criteria established in 6.1.2 a).

## ISO/IEC 27001:2022 — Clause 8.3: Information security risk treatment

The organization shall implement the information security risk treatment plan.`,

  'POL-010': `## ISO/IEC 27001:2022 — Clause 7.5: Documented information

### 7.5.1 General
The organization's ISMS shall include:
a) documented information required by this document; and
b) documented information determined by the organization as being necessary for the effectiveness of the ISMS.

The extent of documented information can differ from one organization to another due to:
1) the size of organization and its type of activities, processes, products and services;
2) the complexity of processes and their interactions; and
3) the competence of persons.

### 7.5.2 Creating and updating
When creating and updating documented information the organization shall ensure appropriate:
a) identification and description (e.g. a title, date, author, or reference number);
b) format (e.g. language, software version, graphics) and media (e.g. paper, electronic); and
c) review and approval for suitability and adequacy.

### 7.5.3 Control of documented information
Documented information required by the ISMS and by this document shall be controlled to ensure:
a) it is available and suitable for use, where and when it is needed; and
b) it is adequately protected (e.g. from loss of confidentiality, improper use, or loss of integrity).

For the control of documented information, the organization shall address:
c) distribution, access, retrieval and use;
d) storage and preservation, including the preservation of legibility;
e) control of changes (e.g. version control); and
f) retention and disposition.

Documented information of external origin shall be identified as appropriate, and controlled.`,

  'POL-011': `## ISO/IEC 27001:2022 — Clause 9.2: Internal audit

### 9.2.1 General
The organization shall conduct internal audits at planned intervals to provide information on whether the ISMS:
a) conforms to:
   1) the organization's own requirements for its ISMS;
   2) the requirements of this document;
b) is effectively implemented and maintained.

### 9.2.2 Internal audit programme
The organization shall plan, establish, implement and maintain an audit programme(s), including the frequency, methods, responsibilities, planning requirements and reporting.

When establishing the internal audit programme(s), the organization shall consider the importance of the processes concerned and the results of previous audits.

The organization shall:
a) define the audit criteria and scope for each audit;
b) select auditors and conduct audits that ensure objectivity and the impartiality of the audit process;
c) ensure that the results of the audits are reported to relevant management.

Documented information shall be available as evidence of the implementation of the audit programme(s) and the audit results.`,

  'POL-012': `## ISO/IEC 27001:2022 — Clause 9.3: Management review

### 9.3.1 General
Top management shall review the organization's ISMS at planned intervals to ensure its continuing suitability, adequacy and effectiveness.

### 9.3.2 Management review inputs
The management review shall include consideration of:
a) the status of actions from previous management reviews;
b) changes in external and internal issues that are relevant to the ISMS;
c) changes in needs and expectations of interested parties that are relevant to the ISMS;
d) feedback on the information security performance, including trends in:
   1) nonconformities and corrective actions;
   2) monitoring and measurement results;
   3) audit results;
   4) fulfilment of information security objectives;
e) feedback from interested parties;
f) results of risk assessment and status of risk treatment plan;
g) opportunities for continual improvement.

### 9.3.3 Management review results
The results of the management review shall include decisions related to continual improvement opportunities and any needs for changes to the ISMS.

Documented information shall be available as evidence of the results of management reviews.`,

  'POL-013': `## ISO/IEC 27001:2022 — Clause 7.2: Competence

The organization shall:
a) determine the necessary competence of person(s) doing work under its control that affects its information security performance;
b) ensure that these persons are competent on the basis of appropriate education, training, or experience;
c) where applicable, take actions to acquire the necessary competence, and evaluate the effectiveness of the actions taken; and
d) retain appropriate documented information as evidence of competence.

Applicable actions can include, for example: the provision of training to, the mentoring of, or the re-assignment of current employees; or the hiring or contracting of competent persons.

## ISO/IEC 27001:2022 — Clause 7.3: Awareness

Persons doing work under the organization's control shall be aware of:
a) the information security policy;
b) their contribution to the effectiveness of the ISMS, including the benefits of improved information security performance; and
c) the implications of not conforming with the ISMS requirements.

## ISO/IEC 27002:2022 — Control 6.3: Information security awareness, education and training

Control: Personnel of the organization and relevant interested parties shall receive appropriate information security awareness, education and training and regular updates of the organization's information security policy, topic-specific policies and procedures, as relevant for their job function.

Purpose: To ensure personnel and relevant interested parties are aware of and fulfil their information security responsibilities.

Guidance: An information security awareness programme should aim to make personnel and relevant interested parties aware of their responsibilities for information security and the means by which those responsibilities are fulfilled. The programme should be planned taking into consideration the organization's information security policies, topic-specific policies and relevant procedures, along with information security implications of the roles of personnel.`,
};
