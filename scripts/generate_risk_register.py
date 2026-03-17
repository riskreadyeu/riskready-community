import pandas as pd
import io
import numpy as np

# ==============================================================================
# 1. ORGANISATIONAL PROFILE (THE "PRE-FLIGHT" INPUTS)
# ==============================================================================
# Customize these variables to match the specific organization.
# This Auto-Calibrates the Financial Impact and Vulnerability/Surface scores.

class OrgProfile:
    def __init__(self):
        # --- A. FINANCIAL CONTEXT ---
        self.annual_revenue = 50_000_000  # $50 Million
        self.currency_symbol = "$"

        # --- B. ARCHITECTURE (Sets Baseline F3 - Attack Surface) ---
        # Options: 'Cloud_Native' (Low Surface), 'Hybrid' (High Surface), 'Legacy' (Med Surface)
        self.architecture_type = 'Hybrid'

        # Options: 'High' (Global/Public), 'Med' (Restricted), 'Low' (Internal)
        self.internet_exposure = 'High'

        # --- C. MATURITY (Sets Baseline F2 - Vulnerability) ---
        # Options: 'None' (Score 5), 'Basic' (Score 4), 'Defined' (Score 3), 'Advanced' (Score 2)
        # Basic = AV + Firewall. Advanced = EDR + MFA + Zero Trust.
        self.security_stack = 'Basic'

        # Do users have local admin rights? (Increases Vulnerability)
        self.local_admin_rights = True

        # --- D. HISTORY (Sets Baseline F4 - Incident History) ---
        # Options: 'Frequent' (Score 4), 'Sporadic' (Score 2), 'Clean' (Score 1)
        self.incident_history = 'Sporadic'

    def get_defaults(self):
        """Calculates default F2, F3, F4 scores based on Profile"""

        # 1. Calc Baseline F2 (Vulnerability)
        if self.security_stack == 'None': base_f2 = 5
        elif self.security_stack == 'Basic': base_f2 = 4 if self.local_admin_rights else 3
        elif self.security_stack == 'Defined': base_f2 = 3
        else: base_f2 = 2 # Advanced

        # 2. Calc Baseline F3 (Attack Surface)
        if self.internet_exposure == 'High': base_f3 = 5
        elif self.internet_exposure == 'Med': base_f3 = 3
        else: base_f3 = 2

        # 3. Calc Baseline F4 (History)
        if self.incident_history == 'Frequent': base_f4 = 4
        elif self.incident_history == 'Sporadic': base_f4 = 2
        else: base_f4 = 1

        return base_f2, base_f3, base_f4

# Initialize the Org Profile
org = OrgProfile()
DEF_F2, DEF_F3, DEF_F4 = org.get_defaults()

# Control Maturity Reduction Logic
REDUCTION_MAP = {
    "Non-Existent": 0.00,
    "Weak": 0.25,
    "Satisfactory": 0.50,
    "Strong": 0.80
}

# ==============================================================================
# 2. DATA SOURCES (EMBEDDED CSVs)
# ==============================================================================

# A. THREAT CATALOG (External Intelligence F1)
threat_csv = """Threat_ID;Base_Likelihood
T-CRED;4
T-BRUTE;4
T-PHISH;5
T-SESSION;3
T-PRIVESC;3
T-ORPHAN;3
T-CREEP;4
T-SHARED;3
T-DATAEXP;4
T-INTERCEPT;3
T-CRYPTO;2
T-DATALOSS;3
T-VULN;4
T-INJECTION;4
T-SUPPLY;4
T-CHANGE;3
T-API;4
T-DEVSEC;3
T-MALWARE;4
T-INFOSTEALER;4
T-RANSOM;4
T-DDOS;4
T-MISCONFIG;4
T-SHADOW;4
T-CLOUD;3
T-PREPOSITION;2
T-VENDOR;4
T-VENDORACCESS;3
T-CONCENTRATION;3
T-INSIDER;2
T-NEGLIGENCE;4
T-SOCIAL;3
T-DEEPFAKE;4
T-DPRK-INSIDER;3
T-COMPLIANCE;3
T-GOVGAP;4
T-DISINFO;3
T-PHYSICAL;2
T-THEFT;3
T-ENVIRON;2
T-UTILITY;3
T-CRYPTO-THEFT;4
T-BEC;4
T-SCAM-CENTER;3"""

# B. PARENT RISKS (The Dashboard Headers)
parent_csv = """Risk_ID;Title;Regulatory_Relevance
R-01;Information Security Governance;ISO 27001
R-02;External Parties & Threat Intel;ISO 27001
R-03;Security in Projects & Change;ISO 27001
R-04;Asset Management;ISO 27001
R-05;Data Classification & Handling;ISO 27001
R-06;Identity & Access Management;ISO 27001
R-07;Third-Party & Supply Chain;ISO 27001 / DORA
R-08;Cloud Security;ISO 27001
R-09;Personnel Security Lifecycle;ISO 27001
R-10;Security Awareness & Culture;ISO 27001
R-11;Remote & Mobile Working;ISO 27001
R-12;Physical Security;ISO 27001
R-13;Environmental Security;ISO 27001
R-14;Equipment Security;ISO 27001
R-15;Endpoint Security;ISO 27001
R-16;Malware & Ransomware;ISO 27001
R-17;Network Security;ISO 27001
R-18;Vulnerability Management;ISO 27001
R-19;Secure Development Lifecycle;ISO 27001
R-20;Application Security;ISO 27001
R-21;Cryptographic Failures;ISO 27001
R-22;Logging & Monitoring;ISO 27001
R-23;Incident Management;ISO 27001 / NIS2
R-24;Business Continuity & DR;ISO 27001 / DORA
R-25;Compliance & Legal;ISO 27001
R-26;ICT Supply Chain (DORA/NIS2);DORA / NIS2
R-27;Regulatory Reporting (DORA/NIS2);DORA / NIS2
R-28;Operational Resilience (DORA);DORA
R-29;Exec Accountability (NIS2);NIS2
R-30;Advanced Testing (DORA);DORA
R-31;AI Governance (EU AI Act);EU AI Act
R-32;AI Security (Technical);OWASP LLM"""

# C. RISK SCENARIOS (The 87 Operational Risks)
scenarios_csv = """Scenario_ID;Parent_Risk_ID;Scenario_Title;Primary_Threat_ID;I1_Financial;I2_Operational;I3_Legal;I4_Reputational;I5_Strategic;Key_Controls_Description;Control_Maturity
R-01-S01;R-01;Absence of Information Security Policy;T-GOVGAP;1;2;4;2;2;Policy Portal & Annual Review;Weak
R-01-S02;R-01;Unclear Security Roles & Responsibilities;T-GOVGAP;2;3;3;2;3;Job Descriptions;Satisfactory
R-01-S03;R-01;Inadequate Segregation of Duties;T-INSIDER;4;2;4;3;2;Access Reviews;Weak
R-02-S01;R-02;No Established Authority Contacts;T-GOVGAP;2;2;4;2;1;Legal Retainer;Weak
R-02-S02;R-02;No Security Community Engagement;T-GOVGAP;3;4;2;3;3;ISAC Membership;Weak
R-02-S03;R-02;No Threat Intelligence Program;T-GOVGAP;3;4;2;3;3;Threat Feeds;Weak
R-03-S01;R-03;Security Not Integrated in Projects;T-DEVSEC;3;4;3;3;3;DevSecOps Gates;Satisfactory
R-03-S02;R-03;Undocumented Operating Procedures;T-GOVGAP;2;2;4;2;1;SOP Documentation;Weak
R-03-S03;R-03;Unauthorized Production Changes;T-CHANGE;3;5;3;3;2;Change Advisory Board (CAB);Satisfactory
R-04-S01;R-04;Unknown Shadow IT Assets;T-SHADOW;3;3;4;2;3;CASB / Discovery;Weak
R-04-S02;R-04;Misuse of Information Assets;T-NEGLIGENCE;2;2;3;2;1;Acceptable Use Policy;Satisfactory
R-04-S03;R-04;Assets Not Returned at Termination;T-THEFT;2;2;3;2;1;Asset Tracking;Satisfactory
R-05-S01;R-05;Misclassified Sensitive Data;T-DATAEXP;4;2;5;4;3;Data Discovery Tool;Weak
R-05-S02;R-05;Insecure Data Transfer;T-INTERCEPT;3;2;4;3;2;Secure File Transfer;Weak
R-05-S03;R-05;Improper Data Deletion;T-COMPLIANCE;2;1;4;2;1;Retention Policy;Non-Existent
R-05-S04;R-05;Unmasked Data in Non-Production;T-DATAEXP;4;2;5;3;2;Data Masking;Weak
R-06-S01;R-06;Weak Authentication (No MFA);T-CRED;4;5;4;5;4;MFA Enforced;Strong
R-06-S02;R-06;Excessive User Privileges;T-CREEP;3;4;3;3;3;Privilege Review;Weak
R-06-S03;R-06;Orphaned Accounts;T-ORPHAN;3;2;3;2;2;Automated JML;Satisfactory
R-06-S04;R-06;Shared/Generic Accounts;T-SHARED;2;2;2;2;1;Named Accounts Policy;Weak
R-06-S05;R-06;MFA Fatigue / Push Bombing;T-SOCIAL;4;5;3;4;4;Number Matching MFA;Satisfactory
R-07-S01;R-07;Third-Party Data Breach;T-VENDOR;4;3;5;5;3;Vendor Risk Mgmt;Satisfactory
R-07-S02;R-07;Software Supply Chain Attack;T-SUPPLY;5;5;4;5;5;SBOM;Weak
R-07-S03;R-07;Vendor Access Abuse;T-VENDORACCESS;3;3;3;3;3;Vendor PAM;Weak
R-07-S04;R-07;Insecure Cloud Service Usage;T-SHADOW;4;3;5;4;3;CASB;Weak
R-07-S05;R-07;Insecure Outsourced Development;T-SUPPLY;3;4;3;3;3;Code Review;Weak
R-08-S01;R-08;Cloud Admin Compromise;T-CLOUD;5;5;5;5;5;PIM / MFA;Satisfactory
R-08-S02;R-08;Cloud Misconfiguration;T-MISCONFIG;4;3;5;5;3;CSPM;Satisfactory
R-08-S03;R-08;Shared Responsibility Gaps;T-MISCONFIG;3;4;2;3;2;Cloud Matrix;Weak
R-09-S01;R-09;Inadequate Background Screening;T-INSIDER;3;2;4;3;2;Background Checks;Satisfactory
R-09-S02;R-09;Missing Security Terms;T-GOVGAP;2;2;4;2;3;Contract Review;Satisfactory
R-09-S03;R-09;No Disciplinary Process;T-GOVGAP;1;2;3;2;2;HR Policy;Weak
R-09-S04;R-09;Insecure Termination;T-ORPHAN;3;3;3;3;2;Offboarding Checklist;Satisfactory
R-10-S01;R-10;Phishing Attack Success;T-PHISH;4;5;3;4;3;Simulations;Satisfactory
R-10-S02;R-10;Social Engineering (Vishing);T-SOCIAL;4;3;3;3;2;Verification Procedures;Weak
R-10-S03;R-10;Unreported Security Events;T-NEGLIGENCE;2;4;2;3;2;Just Culture;Weak
R-11-S01;R-11;Insecure Remote Access;T-INTERCEPT;3;3;4;3;2;VPN/Zero Trust;Satisfactory
R-11-S02;R-11;Mobile Device Theft;T-THEFT;3;2;4;3;1;MDM / Encryption;Satisfactory
R-12-S01;R-12;Unauthorized Physical Access;T-PHYSICAL;2;3;2;2;2;Badge Access;Satisfactory
R-12-S02;R-12;Lack of Monitoring;T-PHYSICAL;2;2;2;1;1;CCTV;Weak
R-12-S03;R-12;Clear Desk Violation;T-NEGLIGENCE;2;1;3;2;1;Clean Desk Policy;Weak
R-12-S04;R-12;Unescorted Visitors;T-PHYSICAL;2;3;2;2;2;Visitor Log;Satisfactory
R-13-S01;R-13;Environmental Damage;T-ENVIRON;4;5;2;3;3;Suppression Systems;Satisfactory
R-13-S02;R-13;Utility Failure;T-UTILITY;2;5;2;2;2;Generator/UPS;Satisfactory
R-13-S03;R-13;Cabling Damage;T-PHYSICAL;2;4;1;1;1;Cable Mgmt;Weak
R-14-S01;R-14;Equipment Theft (Office);T-THEFT;3;2;3;2;1;Physical Locks;Satisfactory
R-14-S02;R-14;Improper Media Handling;T-DATALOSS;3;2;4;3;2;Media Encryption;Weak
R-14-S03;R-14;Insecure Disposal;T-DATALOSS;2;1;4;3;1;Secure Destruction;Satisfactory
R-15-S01;R-15;Unmanaged BYOD;T-SHADOW;3;3;4;3;2;BYOD Policy/MAM;Weak
R-15-S02;R-15;Unauthorized Software (Shadow IT);T-MALWARE;2;3;2;2;2;App Whitelisting;Weak
R-15-S03;R-15;USB Malware Infection;T-MALWARE;3;4;2;3;2;USB Blocking;Satisfactory
R-16-S01;R-16;Ransomware (Encryption);T-RANSOM;5;5;4;5;5;EDR / Backups;Satisfactory
R-16-S02;R-16;Double Extortion (Exfiltration);T-DATAEXP;5;5;5;5;5;Egress Filtering;Weak
R-17-S01;R-17;Flat Network Lateral Movement;T-SESSION;4;5;3;4;4;VLANs / ACLs;Weak
R-17-S02;R-17;Insecure Network Services;T-VULN;4;5;3;4;3;Firewall Rules;Satisfactory
R-17-S03;R-17;Unrestricted Web Access;T-MALWARE;3;4;2;3;2;Web Filtering;Satisfactory
R-18-S01;R-18;Unpatched Critical Vulnerability;T-VULN;4;5;4;5;4;Patch Mgmt;Satisfactory
R-18-S02;R-18;System Misconfiguration;T-MISCONFIG;3;4;3;3;3;Hardening Standards;Weak
R-18-S03;R-18;Zero-Day Exploitation;T-VULN;4;5;3;4;4;Behavioral Protection;Weak
R-19-S01;R-19;Missing Security Requirements;T-DEVSEC;3;3;2;2;2;Threat Modeling;Weak
R-19-S02;R-19;Insecure Code Deployment;T-INJECTION;4;4;4;4;3;SAST / DAST;Satisfactory
R-19-S03;R-19;No Penetration Testing;T-GOVGAP;4;3;3;3;2;Pen Test Policy;Satisfactory
R-19-S04;R-19;Mixed Environments;T-MISCONFIG;3;4;3;2;2;Env Separation;Weak
R-20-S01;R-20;Vulnerable Libraries;T-SUPPLY;4;5;4;4;4;SCA Tooling;Satisfactory
R-20-S02;R-20;Source Code Exposure;T-DEVSEC;4;5;3;4;4;Secret Scanning;Weak
R-20-S03;R-20;Insecure API;T-API;3;4;4;3;3;API Gateway;Weak
R-21-S01;R-21;Weak Encryption;T-CRYPTO;3;2;3;2;2;Crypto Standard;Weak
R-21-S02;R-21;Poor Key Management;T-CRYPTO;5;3;4;4;3;KMS / Vault;Weak
R-22-S01;R-22;No Security Logging;T-GOVGAP;2;3;4;2;3;Central Logging;Weak
R-22-S02;R-22;Failure to Detect (No SIEM);T-MISCONFIG;3;5;4;4;4;SIEM / SOC;Weak
R-22-S03;R-22;Time Sync Failure;T-MISCONFIG;1;2;2;1;1;NTP;Satisfactory
R-23-S01;R-23;No Response Plan;T-GOVGAP;4;5;4;5;4;IR Plan;Weak
R-23-S02;R-23;Evidence Contamination;T-NEGLIGENCE;2;3;4;2;2;Forensic Training;Non-Existent
R-23-S03;R-23;No Lessons Learned;T-GOVGAP;2;3;2;2;2;Post-Mortem Review;Weak
R-24-S01;R-24;Backup Restoration Failure;T-DATALOSS;5;5;4;5;5;Restore Testing;Satisfactory
R-24-S02;R-24;No Disaster Recovery Plan;T-GOVGAP;5;5;4;5;5;DR Strategy;Weak
R-24-S03;R-24;ICT Continuity Failure;T-UTILITY;4;5;3;4;4;HA Architecture;Satisfactory
R-25-S01;R-25;GDPR / Privacy Violation;T-COMPLIANCE;5;3;5;4;3;Privacy Program;Satisfactory
R-25-S02;R-25;Intellectual Property Loss;T-INSIDER;4;3;4;3;5;IP Protection;Weak
R-25-S03;R-25;Records Management Failure;T-COMPLIANCE;2;2;4;2;2;Retention Policy;Weak
R-25-S04;R-25;No Independent Audit;T-GOVGAP;2;2;3;2;2;Internal Audit;Weak
R-26-S01;R-26;Critical Provider Concentration;T-CONCENTRATION;4;5;3;4;5;Exit Strategy;Weak
R-26-S02;R-26;Unmonitored Sub-outsourcing;T-SUPPLY;3;4;4;3;3;Audit Rights;Weak
R-27-S01;R-27;Missed 24h Early Warning;T-COMPLIANCE;3;2;5;4;2;Reporting Process;Satisfactory
R-27-S02;R-27;Inaccurate Reporting;T-COMPLIANCE;2;2;4;3;2;Incident Triage;Weak
R-28-S01;R-28;Breach of Impact Tolerance;T-DDOS;5;5;5;5;5;BCP;Satisfactory
R-29-S01;R-29;Executive Personal Liability;T-COMPLIANCE;3;4;5;5;5;Board Training;Weak
R-30-S01;R-30;TLPT / Red Team Failure;T-VULN;3;4;4;4;3;Red Teaming;Weak
R-31-S01;R-31;Shadow AI Data Leakage;T-SHADOW;4;2;5;4;5;AI Policy/DLP;Weak
R-31-S02;R-31;EU AI Act Non-Compliance;T-COMPLIANCE;5;3;5;5;4;AI Inventory;Non-Existent
R-31-S03;R-31;AI Copyright Infringement;T-COMPLIANCE;3;4;4;3;3;Code Scanning;Weak
R-32-S01;R-32;Prompt Injection;T-INJECTION;3;4;3;4;3;Input Validation;Weak
R-32-S02;R-32;AI Hallucination;T-NEGLIGENCE;4;3;5;4;4;Human Review;Satisfactory
R-32-S03;R-32;AI Model Theft;T-API;4;2;4;3;5;Rate Limiting;Weak"""

# ==============================================================================
# 3. THE LOGIC ENGINE
# ==============================================================================

# Load DataFrames
df_threats = pd.read_csv(io.StringIO(threat_csv), sep=";")
df_parents = pd.read_csv(io.StringIO(parent_csv), sep=";")
df_scenarios = pd.read_csv(io.StringIO(scenarios_csv), sep=";")

# --- Step A: Map Threat Frequency (F1) ---
threat_map = pd.Series(df_threats.Base_Likelihood.values, index=df_threats.Threat_ID).to_dict()
df_scenarios['F1_Threat_Freq'] = df_scenarios['Primary_Threat_ID'].map(threat_map)

# --- Step B: Calculate Inherent Likelihood ---
# Note: We use the Org defaults for F2/F3/F4 if they aren't provided (in this CSV they are missing F2/F3 cols for some, so we generate them)
# But wait, the CSV provided above DOES have F1/I1-I5, but NOT F2/F3 columns populated with specific numbers?
# Actually, the CSV string above DOES NOT have F2/F3 columns. It has I1-I5.
# We need to insert the columns with Default Values from the Org Profile first.

df_scenarios['F2_Vuln_Ease'] = DEF_F2
df_scenarios['F3_Attack_Surf'] = DEF_F3
df_scenarios['F4_History'] = DEF_F4

# Override F3 for Physical Security if Org is Cloud Native
if org.architecture_type == 'Cloud_Native':
    df_scenarios.loc[df_scenarios['Scenario_Title'].str.contains('Physical', case=False), 'F3_Attack_Surf'] = 1

# Calculate Formula: (F1*0.3 + F2*0.3 + F3*0.2 + F4*0.2)
df_scenarios['Inherent_Likelihood'] = (
    (df_scenarios['F1_Threat_Freq'] * 0.30) +
    (df_scenarios['F2_Vuln_Ease'] * 0.30) +
    (df_scenarios['F3_Attack_Surf'] * 0.20) +
    (df_scenarios['F4_History'] * 0.20)
).round(0).astype(int)

# --- Step C: Calculate Inherent Impact ---
impact_cols = ['I1_Financial', 'I2_Operational', 'I3_Legal', 'I4_Reputational', 'I5_Strategic']
df_scenarios['Inherent_Impact'] = df_scenarios[impact_cols].max(axis=1)

# --- Step D: Calculate Inherent Risk ---
df_scenarios['Inherent_Risk_Score'] = df_scenarios['Inherent_Likelihood'] * df_scenarios['Inherent_Impact']

# --- Step E: Calculate Residual Risk ---
df_scenarios['Reduction_Factor'] = df_scenarios['Control_Maturity'].map(REDUCTION_MAP)
df_scenarios['Residual_Risk_Score'] = (
    df_scenarios['Inherent_Risk_Score'] * (1 - df_scenarios['Reduction_Factor'])
).round(0).astype(int)

# --- Step F: Assign Ratings ---
def get_rating(score):
    if score >= 20: return "CRITICAL"
    if score >= 13: return "HIGH"
    if score >= 9:  return "MEDIUM"
    if score >= 5:  return "LOW"
    return "VERY LOW"

df_scenarios['Inherent_Rating'] = df_scenarios['Inherent_Risk_Score'].apply(get_rating)
df_scenarios['Residual_Rating'] = df_scenarios['Residual_Risk_Score'].apply(get_rating)

# --- Step G: Aggregate to Parent Risks ---
dashboard = df_scenarios.groupby('Parent_Risk_ID').agg(
    Max_Inherent_Score=('Inherent_Risk_Score', 'max'),
    Max_Residual_Score=('Residual_Risk_Score', 'max'),
    Scenario_Count=('Scenario_ID', 'count')
).reset_index()

dashboard = pd.merge(dashboard, df_parents, left_on='Parent_Risk_ID', right_on='Risk_ID', how='left')
dashboard['Aggregated_Rating'] = dashboard['Max_Residual_Score'].apply(get_rating)
dashboard = dashboard[['Risk_ID', 'Title', 'Regulatory_Relevance', 'Max_Inherent_Score', 'Max_Residual_Score', 'Aggregated_Rating', 'Scenario_Count']]

# ==============================================================================
# 4. EXCEL EXPORT
# ==============================================================================
fin_defs = pd.DataFrame([
    {"Level": "Negligible (1)", "Threshold": f"< ${org.annual_revenue * 0.001:,.0f} (0.1%)"},
    {"Level": "Minor (2)", "Threshold": f"${org.annual_revenue * 0.005:,.0f} (0.5%)"},
    {"Level": "Moderate (3)", "Threshold": f"${org.annual_revenue * 0.02:,.0f} (2.0%)"},
    {"Level": "Major (4)", "Threshold": f"${org.annual_revenue * 0.05:,.0f} (5.0%)"},
    {"Level": "Critical (5)", "Threshold": f"> ${org.annual_revenue * 0.10:,.0f} (10%)"},
])

output_file = 'Master_GRC_Risk_Register.xlsx'

with pd.ExcelWriter(output_file, engine='xlsxwriter') as writer:
    workbook = writer.book
    header_fmt = workbook.add_format({'bold': True, 'font_color': 'white', 'bg_color': '#366092', 'border': 1})
    center_fmt = workbook.add_format({'align': 'center'})

    # Conditional Formats
    fmt_crit = workbook.add_format({'bg_color': '#C00000', 'font_color': 'white'})
    fmt_high = workbook.add_format({'bg_color': '#FFC000'})
    fmt_med  = workbook.add_format({'bg_color': '#FFFF00'})
    fmt_low  = workbook.add_format({'bg_color': '#92D050'})

    # SHEET 1: DASHBOARD
    dashboard.to_excel(writer, sheet_name='Dashboard', index=False)
    worksheet = writer.sheets['Dashboard']
    worksheet.set_column('A:A', 10)
    worksheet.set_column('B:B', 40)
    worksheet.set_column('C:C', 20)
    worksheet.set_column('D:G', 15, center_fmt)
    worksheet.conditional_format('E2:E100', {'type': 'cell', 'criteria': '>=', 'value': 20, 'format': fmt_crit})
    worksheet.conditional_format('E2:E100', {'type': 'cell', 'criteria': 'between', 'minimum': 13, 'maximum': 19, 'format': fmt_high})
    worksheet.conditional_format('E2:E100', {'type': 'cell', 'criteria': 'between', 'minimum': 9, 'maximum': 12, 'format': fmt_med})
    worksheet.conditional_format('E2:E100', {'type': 'cell', 'criteria': '<', 'value': 9, 'format': fmt_low})

    # SHEET 2: SCENARIOS
    df_scenarios.to_excel(writer, sheet_name='Scenarios', index=False)
    worksheet = writer.sheets['Scenarios']
    worksheet.set_column('A:D', 15)
    worksheet.set_column('E:H', 5, center_fmt) # Factors
    worksheet.set_column('R:R', 10, center_fmt) # Res Risk
    worksheet.conditional_format('R2:R200', {'type': '3_color_scale'})

    # SHEET 3: DEFINITIONS
    fin_defs.to_excel(writer, sheet_name='Impact_Definitions', index=False)
    worksheet = writer.sheets['Impact_Definitions']
    worksheet.set_column('A:B', 30)

    # SHEET 4: THREATS
    df_threats.to_excel(writer, sheet_name='Threat_Catalog', index=False)

print(f"SUCCESS. File generated: {output_file}")
