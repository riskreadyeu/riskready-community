/**
 * ISO 27001/27002 reference excerpts for Wave 2 documents.
 * Annex A policies (POL-014 through POL-021).
 * These are summaries of the relevant ISO/IEC 27002:2022 controls.
 */

export const WAVE2_REFERENCES: Record<string, string> = {
  'POL-014': `## ISO/IEC 27002:2022 — People Controls (Section 6)

### 6.1 Screening
Control: Background verification checks on all candidates to become personnel shall be carried out prior to joining the organization and on an ongoing basis taking into consideration applicable laws, regulations and ethics and be proportional to the business requirements, the classification of the information to be accessed and the perceived risks.

Purpose: To ensure all personnel are eligible and suitable for the roles for which they are considered, and remain eligible and suitable during their employment.

### 6.2 Terms and conditions of employment
Control: The employment contractual agreements shall state the personnel's and the organization's responsibilities for information security.

Purpose: To ensure personnel understand their information security responsibilities for the roles for which they are considered.

### 6.3 Information security awareness, education and training
Control: Personnel of the organization and relevant interested parties shall receive appropriate information security awareness, education and training and regular updates of the organization's information security policy, topic-specific policies and procedures, as relevant for their job function.

Purpose: To ensure personnel and relevant interested parties are aware of and fulfil their information security responsibilities.

### 6.4 Disciplinary process
Control: A disciplinary process shall be formalized and communicated to take actions against personnel and other relevant interested parties who have committed an information security policy violation.

Purpose: To ensure personnel and other relevant interested parties understand the consequences of information security policy violation, to deter and to deal with personnel who committed the violation.

### 6.5 Responsibilities after termination or change of employment
Control: Information security responsibilities and duties that remain valid after termination or change of employment shall be defined, enforced and communicated to relevant personnel and other interested parties.

Purpose: To protect the organization's interests as part of the process of changing or terminating employment or contracts.

### 6.6 Confidentiality or non-disclosure agreements
Control: Confidentiality or non-disclosure agreements reflecting the organization's needs for the protection of information shall be identified, documented, regularly reviewed and signed by personnel and other relevant interested parties.

Purpose: To maintain confidentiality of information accessible by personnel or external parties.`,

  'POL-015': `## ISO/IEC 27002:2022 — Physical Controls (Section 7)

### 7.1 Physical security perimeters
Control: Security perimeters shall be defined and used to protect areas that contain information and other associated assets.

Purpose: To prevent unauthorized physical access, damage and interference to the organization's information and other associated assets.

### 7.2 Physical entry
Control: Secure areas shall be protected by appropriate entry controls and access points.

Purpose: To ensure only authorized physical access to the organization's information and other associated assets occurs.

### 7.3 Securing offices, rooms and facilities
Control: Physical security for offices, rooms and facilities shall be designed and implemented.

Purpose: To prevent unauthorized physical access, damage and interference to the organization's information and other associated assets in offices, rooms and facilities.

### 7.4 Physical security monitoring
Control: Premises shall be continuously monitored for unauthorized physical access.

Purpose: To detect and deter unauthorized physical access.

### 7.5 Protecting against physical and environmental threats
Control: Protection against physical and environmental threats, such as natural disasters and other intentional or unintentional physical threats to infrastructure shall be designed and implemented.

Purpose: To prevent or reduce the consequences of events originating from physical and environmental threats.

### 7.6-7.14 (Equipment security controls)
Additional controls covering working in secure areas (7.6), clear desk and clear screen (7.7), equipment siting and protection (7.8), security of assets off-premises (7.9), storage media (7.10), supporting utilities (7.11), cabling security (7.12), equipment maintenance (7.13), and secure disposal or re-use of equipment (7.14).`,

  'POL-016': `## ISO/IEC 27002:2022 — Organizational Controls (Asset Management)

### 5.9 Inventory of information and other associated assets
Control: An inventory of information and other associated assets, including owners, shall be developed and maintained.

Purpose: To identify the organization's information and other associated assets in order to preserve their information security and assign appropriate ownership.

### 5.10 Acceptable use of information and other associated assets
Control: Rules for the acceptable use and procedures for handling information and other associated assets shall be identified, documented and implemented.

Purpose: To ensure information and other associated assets are appropriately protected, used and handled.

### 5.11 Return of assets
Control: Personnel and other interested parties as appropriate shall return all the organization's assets in their possession upon change or termination of their employment, contract or agreement.

Purpose: To protect the organization's assets as part of the process of changing or terminating employment, contract or agreement.

### 5.12 Classification of information
Control: Information shall be classified according to the information security needs of the organization based on confidentiality, integrity, availability and relevant interested party requirements.

Purpose: To ensure identification and understanding of protection needs of information in accordance with its importance to the organization.

### 5.13 Labelling of information
Control: An appropriate set of procedures for information labelling shall be developed and implemented in accordance with the information classification scheme adopted by the organization.

Purpose: To facilitate communication of classification of information and support automation of information processing and management.

### 5.14 Information transfer
Control: Information transfer rules, procedures, or agreements shall be in place for all types of transfer facilities within the organization and between the organization and other parties.

Purpose: To maintain the security of information transferred within an organization and with any external interested party.`,

  'POL-017': `## ISO/IEC 27002:2022 — Communications Security Controls

### 5.14 Information transfer
Control: Information transfer rules, procedures, or agreements shall be in place for all types of transfer facilities within the organization and between the organization and other parties.

Purpose: To maintain the security of information transferred within an organization and with any external interested party.

### 8.20 Networks security
Control: Networks and network devices shall be secured, managed and controlled to protect information in systems and applications.

Purpose: To protect information in networks and its supporting information processing facilities from compromise via the network.

Guidance: Controls should be implemented to ensure the security of information in networks, and the protection of connected services from unauthorized access. In particular, the following items should be considered: the type and level of network segregation, management of network devices, network design and monitoring.

### 8.21 Security of network services
Control: Security mechanisms, service levels and service requirements of network services shall be identified, implemented and monitored.

Purpose: To ensure security in the use of network services.

### 8.22 Segregation of networks
Control: Groups of information services, users and information systems shall be segregated in the organization's networks.

Purpose: To divide the network into security boundaries and to control traffic between them based on business needs.`,

  'POL-018': `## ISO/IEC 27002:2022 — Secure Development Controls (Section 8.25-8.34)

### 8.25 Secure development life cycle
Control: Rules for the secure development of software and systems shall be established and applied.

Purpose: To ensure information security is designed and implemented within the secure development life cycle of software and systems.

### 8.26 Application security requirements
Control: Information security requirements shall be identified, specified and approved when developing or acquiring applications.

Purpose: To ensure all information security requirements are identified and addressed when developing or acquiring applications.

### 8.27 Secure system architecture and engineering principles
Control: Principles for engineering secure systems shall be established, documented, maintained and applied to any information system development activities.

Purpose: To ensure information systems are securely designed within the development life cycle.

### 8.28 Secure coding
Control: Secure coding principles shall be applied to software development.

Purpose: To ensure software is written securely thereby reducing the number of potential information security vulnerabilities in the software.

### 8.29 Security testing in development and acceptance
Control: Security testing processes shall be defined and implemented in the development life cycle.

Purpose: To validate that information security requirements are met when applications or code are deployed to the production environment.

### 8.30 Outsourced development
Control: The organization shall direct, monitor and review the activities related to outsourced system development.

Purpose: To ensure information security measures required by the organization are implemented in outsourced system development.

### 8.31 Separation of development, test and production environments
Control: Development, testing and production environments shall be separated and secured.

Purpose: To reduce the risks of unauthorized access to, or changes of, the production environment.

### 8.32 Change management
Control: Changes to information processing facilities and information systems shall be subject to change management procedures.

Purpose: To preserve information security when executing changes.

### 8.33 Test information
Control: Test information shall be appropriately selected, protected and managed.

Purpose: To ensure relevance of testing and protection of operational information used for testing.

### 8.34 Protection of information systems during audit testing
Control: Audit tests and other assurance activities involving assessment of operational systems shall be planned and agreed between the tester and appropriate management.

Purpose: To minimize the impact of audit and other assurance activities on operational systems and business processes.`,

  'POL-019': `## ISO/IEC 27002:2022 — Control 5.14: Information transfer

Control: Information transfer rules, procedures, or agreements shall be in place for all types of transfer facilities within the organization and between the organization and other parties.

Purpose: To maintain the security of information transferred within an organization and with any external interested party.

Guidance: Information transfer rules, procedures and agreements should consider the following items:
- controls designed to protect transferred information from interception, unauthorized access, copying, modification, mis-routing, destruction and denial of service, including level of access control aligned with classification;
- procedures to ensure traceability and non-repudiation;
- definition of acceptable use for transfer facilities;
- guidelines for retention and disposal of business correspondence;
- identification of cryptographic techniques (e.g. to protect confidentiality, integrity and authenticity);
- chain of custody and logging requirements;
- information transfer agreements with external parties (including notification, security, responsibilities, liabilities, delivery methods);
- handling and labelling rules for sensitive information in transit;
- technical standards for packaging and transmission;
- results of periodic business risk assessment to determine classification-based controls.

Transfer types to address: electronic transfer (email, instant messaging, social networks, file sharing, cloud), physical media transfer, verbal transfer (phone, voicemail, face-to-face).`,

  'POL-020': `## ISO/IEC 27002:2022 — Logging and Monitoring Controls

### 8.15 Logging
Control: Logs that record activities, exceptions, faults and other relevant events shall be produced, stored, protected and analysed.

Purpose: To record events, generate evidence, ensure the integrity of log information, prevent against unauthorized access, identify information security events that can lead to an information security incident and to support investigations.

Guidance: Event logs should include, when relevant: user IDs, system activities, dates/times/details of key events (log-on/log-off), device identity or location, records of successful and rejected system and data access attempts, changes to system configuration, use of privileges, use of utilities and applications, files accessed, network addresses, access control system alarms, activation and de-activation of protection systems.

### 8.16 Monitoring activities
Control: Networks, systems and applications shall be monitored for anomalous behaviour and appropriate actions taken to evaluate potential information security incidents.

Purpose: To detect anomalous behaviour and potential information security incidents.

Guidance: The scope and level of monitoring should be determined in accordance with business and information security requirements and taking into consideration applicable legislation and regulations. Monitoring records should be retained for defined periods.

### 8.17 Clock synchronization
Control: The clocks of information processing systems used by the organization shall be synchronized to approved time sources.

Purpose: To enable the correlation of and analysis of security-related events and other recorded data, and to support investigations of information security incidents.`,

  'POL-021': `## ISO/IEC 27002:2022 — Compliance Controls

### 5.31 Legal, statutory, regulatory and contractual requirements
Control: Legal, statutory, regulatory and contractual requirements relevant to information security and the organization's approach to meet these requirements shall be identified, documented and kept up to date.

Purpose: To ensure compliance with legal, statutory, regulatory and contractual requirements related to information security.

### 5.32 Intellectual property rights
Control: The organization shall implement appropriate procedures to protect intellectual property rights.

Purpose: To ensure compliance with legal, statutory, regulatory and contractual requirements related to intellectual property rights and use of proprietary products.

### 5.33 Protection of records
Control: Records shall be protected from loss, destruction, falsification, unauthorized access and unauthorized release in accordance with legislatory, regulatory, contractual and business requirements.

Purpose: To ensure compliance with legal, statutory, regulatory and contractual requirements, as well as community or societal expectations related to the protection and availability of records.

### 5.34 Privacy and protection of PII
Control: The organization shall identify and meet the requirements regarding the preservation of privacy and protection of PII as required in applicable laws and regulations and contractual requirements.

Purpose: To ensure compliance with legal, statutory, regulatory and contractual requirements related to the information security aspects of the protection of PII.

### 5.35 Independent review of information security
Control: The organization's approach to managing information security and its implementation including people, processes and technologies shall be reviewed independently at planned intervals, or when significant changes occur.

Purpose: To ensure the continuing suitability, adequacy and effectiveness of the organization's approach to managing information security.

### 5.36 Compliance with policies, rules and standards for information security
Control: Compliance with the organization's information security policy, topic-specific policies, rules and standards shall be regularly reviewed.

Purpose: To ensure that information security is implemented and operated in accordance with the organization's information security policy, topic-specific policies, rules and standards.`,
};
