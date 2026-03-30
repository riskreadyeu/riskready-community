/**
 * ISO 27001/27002 reference excerpts for Wave 3 documents.
 * Operational procedures (STD-005 through STD-009).
 * These are summaries of the relevant ISO/IEC 27002:2022 controls.
 */

export const WAVE3_REFERENCES: Record<string, string> = {
  'STD-005': `## ISO/IEC 27002:2022 — Backup and Redundancy Controls

### 8.13 Information backup
Control: Backup copies of information, software and systems shall be maintained and regularly tested in accordance with the agreed topic-specific policy on backup.

Purpose: To allow recovery of information and software in the event of loss of data or systems.

Guidance: A topic-specific policy on backup should be established, taking into account the organization's retention requirements and business continuity requirements. Adequate backup facilities should be provided to ensure that all essential information and software can be recovered after a disaster or media failure.

Key considerations:
- Accurate and complete records of backup copies and documented restoration procedures should be produced.
- The extent (e.g. full or differential backup) and frequency of backups should reflect business requirements, security requirements and the criticality of the information.
- Backups should be stored in a remote location, at a sufficient distance to escape any damage from a disaster at the main site.
- Backup information should be given an appropriate level of physical and environmental protection consistent with the standards applied at the main site.
- Backup media should be regularly tested to ensure they can be relied upon for emergency use.
- Restoration procedures should be regularly checked and tested.

### 8.14 Redundancy of information processing facilities
Control: Information processing facilities shall be implemented with redundancy sufficient to meet availability requirements.

Purpose: To ensure the continuous operation of information processing facilities.

Guidance: The organization should identify the business requirements for the availability of information systems. Where availability cannot be guaranteed using the existing systems architecture as tested, redundant components or architectures should be considered. Redundant information processing facilities should be tested to ensure that the failover from one component to another works as intended.`,

  'STD-006': `## ISO/IEC 27002:2022 — Vulnerability and Configuration Management Controls

### 8.8 Management of technical vulnerabilities
Control: Information about technical vulnerabilities of information systems in use shall be obtained in a timely fashion, the organization's exposure to such vulnerabilities evaluated and appropriate measures taken.

Purpose: To prevent exploitation of technical vulnerabilities.

Guidance: A continuous and current inventory of assets is a prerequisite for effective technical vulnerability management. Specific information includes the software vendor, version numbers, current state of deployment, and the person(s) responsible. Appropriate and timely action should be taken in response to the identification of potential technical vulnerabilities. Specific guidance includes:
- Define and establish roles and responsibilities for monitoring, vulnerability risk assessment, patching, asset tracking and coordination.
- Identify vulnerability information resources (e.g. vendor advisories, vulnerability databases like NVD).
- Establish a timeline to react to notifications, based on risk.
- Once a potential vulnerability is identified, determine the associated risks and the actions to be taken (patching, applying workarounds, accepting the risk).
- Depending on urgency, the action should follow change management or incident response procedures.
- Patch from trusted sources and verify integrity before installation.

### 8.9 Configuration management
Control: Configurations, including security configurations, of hardware, software, services and networks shall be established, documented, implemented, monitored and reviewed.

Purpose: To ensure hardware, software, services and networks function correctly with required security settings, and configuration is not altered by unauthorized or incorrect changes.

Guidance: Standard templates for security configuration of hardware, software, services and networks should be defined using publicly available guidance (e.g. vendor and CIS benchmarks). The configurations should be reviewed at regular intervals and updated as needed.

### 8.10 Information deletion
Control: Information stored in information systems, devices or in any other storage media shall be deleted when no longer required.

Purpose: To prevent unnecessary exposure of sensitive information and to comply with legal, statutory, regulatory and contractual requirements for information deletion.`,

  'STD-007': `## ISO/IEC 27002:2022 — Media Handling Controls

### 7.10 Storage media
Control: Storage media shall be managed through their life cycle of acquisition, use, transportation and disposal in accordance with the organization's classification scheme and handling requirements.

Purpose: To ensure only authorized disclosure, modification, removal or destruction of information on storage media.

Guidance: The following guidelines should be considered:
- If no longer required, the contents of any reusable storage media that are to leave the organization should be made unrecoverable.
- Where necessary, media should require authorization for removal from the organization and a record of such removal should be kept.
- All media should be stored in a safe, secure environment, in accordance with the manufacturer's specifications.
- If data confidentiality or integrity is of high importance, cryptographic techniques should be used to protect data on storage media.
- Where needed, media degradation risks should be mitigated by transferring stored data to fresh media before becoming unreadable.
- Multiple copies of valuable data should be stored on separate media to reduce the risk of coincidental data damage or loss.
- Registration of removable media should be considered to limit the opportunity for data loss.
- Removable media drives should only be enabled if there is a business reason for doing so.

### 7.14 Secure disposal or re-use of equipment
Control: Items of equipment containing storage media shall be verified to ensure that any sensitive data and licensed software has been removed or securely overwritten prior to disposal or re-use.

Purpose: To prevent leakage of information from equipment to be disposed or re-used.

Guidance: Equipment should be checked to determine whether storage media is contained within it prior to disposal or re-use. Storage media containing confidential or copyrighted information should be physically destroyed, or the information should be destroyed, deleted or overwritten using techniques to make the original information non-retrievable, rather than simply using standard delete or format function. Techniques for secure overwriting or destruction should be selected in accordance with a risk assessment and classification of the information.`,

  'STD-008': `## ISO/IEC 27002:2022 — Control 8.6: Capacity management

Control: The use of resources shall be monitored and adjusted in line with current and expected capacity requirements.

Purpose: To ensure the required capacity of information processing facilities, human resources, offices and other facilities.

Guidance: Capacity requirements should be identified, taking into account the business criticality of concerned systems and processes. System tuning and monitoring should be applied to ensure and, where necessary, improve the availability and efficiency of systems. Detective controls should be put in place to indicate problems in due time.

Projections of future capacity requirements should take into account new business and system requirements and current and projected trends in the organization's information processing capabilities. Particular attention should be given to any resources with long procurement lead times or high costs; therefore, managers should monitor the utilisation of key system resources. They should identify trends in usage, particularly in relation to business applications or IT management tools.

Managers should use this information to identify and avoid potential bottlenecks and dependency on key personnel that can present a threat to system security or services, and plan appropriate action. Sufficient capacity can be provided by increasing capacity or by reducing demand. Examples of managing capacity demand include:
- deleting obsolete data (disk space);
- decommissioning applications, systems, databases or environments;
- optimizing batch processes and schedules;
- optimizing application logic or database queries;
- restricting bandwidth for resource-hungry services if not business critical (e.g. video streaming).

A capacity management plan should be considered for mission critical systems. The plan should address potential capacity issues and dependencies on key personnel and service providers.`,

  'STD-009': `## ISO/IEC 27002:2022 — Supplier Security Controls

### 5.19 Information security in supplier relationships
Control: Processes and procedures shall be defined and implemented to manage the information security risks associated with the use of supplier's products or services.

Purpose: To maintain an agreed level of information security in supplier relationships.

Guidance: The organization should identify and implement processes and procedures to address the information security risks associated with the supplier's product or service supply chain. This includes identifying the types of suppliers, establishing the policy and processes for handling supplier relationships, and identifying the types of information security requirements to address with each type of supplier.

### 5.20 Addressing information security within supplier agreements
Control: Relevant information security requirements shall be established and agreed with each supplier based on the type of supplier relationship.

Purpose: To maintain an agreed level of information security in supplier relationships.

Guidance: Information security requirements should be established and documented to ensure both parties are clear about their obligations. Requirements to consider include: description of information to be accessed and methods of access, classification of information, legal and regulatory requirements, obligation of each party, incident management procedures, sub-contracting rules, right to audit, and exit arrangements.

### 5.21 Managing information security in the ICT supply chain
Control: Processes and procedures shall be defined and implemented to manage the information security risks associated with the ICT products and services supply chain.

Purpose: To maintain an agreed level of information security in supplier relationships.

Guidance: Additional requirements to address ICT supply chain security include: defining information security requirements for acquired ICT products and services, requiring that suppliers propagate security practices throughout the supply chain, implementing monitoring processes and acceptable methods for validating delivered products and services, and identifying components critical to maintaining functionality.

### 5.22 Monitoring, review and change management of supplier services
Control: The organization shall regularly monitor, review, evaluate and manage change in supplier information security practices and service delivery.

Purpose: To maintain an agreed level of information security and service delivery in line with supplier agreements.

### 5.23 Information security for use of cloud services
Control: Processes for acquisition, use, management and exit from cloud services shall be established in accordance with the organization's information security requirements.

Purpose: To specify and manage information security for the use of cloud services.

Guidance: The organization should establish and communicate a topic-specific policy on the use of cloud services to all relevant interested parties. The organization should define and communicate how it intends to manage information security risks associated with the use of cloud services, including the shared responsibility model, multi-cloud management, and exit strategy.`,
};
