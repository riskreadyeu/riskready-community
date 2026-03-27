"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcrypt = __importStar(require("bcryptjs"));
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var passwordHash, users, orgProfile, locations, departments, processes, dependencies, regulators, committee, memberships, meeting, decisions, actionItems, executives, champions, doraQuestions, nis2Questions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🌱 Starting database seed...');
                    return [4 /*yield*/, bcrypt.hash('password123', 10)];
                case 1:
                    passwordHash = _a.sent();
                    return [4 /*yield*/, Promise.all([
                            prisma.user.upsert({
                                where: { email: 'admin@riskready.com' },
                                update: {},
                                create: {
                                    email: 'admin@riskready.com',
                                    passwordHash: passwordHash,
                                    firstName: 'Admin',
                                    lastName: 'User',
                                    isActive: true,
                                },
                            }),
                            prisma.user.upsert({
                                where: { email: 'john.smith@riskready.com' },
                                update: {},
                                create: {
                                    email: 'john.smith@riskready.com',
                                    passwordHash: passwordHash,
                                    firstName: 'John',
                                    lastName: 'Smith',
                                    isActive: true,
                                },
                            }),
                            prisma.user.upsert({
                                where: { email: 'sarah.jones@riskready.com' },
                                update: {},
                                create: {
                                    email: 'sarah.jones@riskready.com',
                                    passwordHash: passwordHash,
                                    firstName: 'Sarah',
                                    lastName: 'Jones',
                                    isActive: true,
                                },
                            }),
                            prisma.user.upsert({
                                where: { email: 'mike.wilson@riskready.com' },
                                update: {},
                                create: {
                                    email: 'mike.wilson@riskready.com',
                                    passwordHash: passwordHash,
                                    firstName: 'Mike',
                                    lastName: 'Wilson',
                                    isActive: true,
                                },
                            }),
                            prisma.user.upsert({
                                where: { email: 'emma.brown@riskready.com' },
                                update: {},
                                create: {
                                    email: 'emma.brown@riskready.com',
                                    passwordHash: passwordHash,
                                    firstName: 'Emma',
                                    lastName: 'Brown',
                                    isActive: true,
                                },
                            }),
                        ])];
                case 2:
                    users = _a.sent();
                    console.log("\u2705 Created ".concat(users.length, " users"));
                    return [4 /*yield*/, prisma.organisationProfile.create({
                            data: {
                                name: 'Acme Corporation',
                                legalName: 'Acme Corporation Ltd.',
                                description: 'A leading technology company specializing in enterprise software solutions.',
                                industrySector: 'technology',
                                industrySubsector: 'Enterprise Software',
                                marketPosition: 'market_leader',
                                employeeCount: 250,
                                size: 'medium',
                                annualRevenue: 50000000,
                                revenueCurrency: 'USD',
                                revenueTrend: 'growing',
                                headquartersAddress: '123 Tech Park, Silicon Valley, CA 94025',
                                contactEmail: 'info@acme.com',
                                website: 'https://www.acme.com',
                                missionStatement: 'To empower businesses with innovative technology solutions.',
                                visionStatement: 'To be the global leader in enterprise software.',
                                coreValues: ['Innovation', 'Integrity', 'Customer Focus', 'Excellence'],
                                ismsScope: 'The ISMS covers all information assets, systems, and processes related to the development, delivery, and support of enterprise software solutions.',
                                ismsPolicy: 'Acme Corporation is committed to protecting the confidentiality, integrity, and availability of all information assets.',
                                isoCertificationStatus: 'in_progress',
                                riskAppetite: 'Moderate risk appetite with low tolerance for security and compliance risks.',
                                digitalTransformationStage: 'managed',
                                createdById: users[0].id,
                            },
                        })];
                case 3:
                    orgProfile = _a.sent();
                    console.log('✅ Created organisation profile');
                    return [4 /*yield*/, Promise.all([
                            prisma.location.create({
                                data: {
                                    name: 'Headquarters',
                                    address: '123 Tech Park',
                                    city: 'San Francisco',
                                    state: 'California',
                                    country: 'United States',
                                    postalCode: '94025',
                                    isActive: true,
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.location.create({
                                data: {
                                    name: 'European Office',
                                    address: '45 Innovation Street',
                                    city: 'London',
                                    state: 'Greater London',
                                    country: 'United Kingdom',
                                    postalCode: 'EC2A 4BX',
                                    isActive: true,
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.location.create({
                                data: {
                                    name: 'Asia Pacific Office',
                                    address: '88 Marina Bay',
                                    city: 'Singapore',
                                    country: 'Singapore',
                                    postalCode: '018984',
                                    isActive: true,
                                    createdById: users[0].id,
                                },
                            }),
                        ])];
                case 4:
                    locations = _a.sent();
                    console.log("\u2705 Created ".concat(locations.length, " locations"));
                    return [4 /*yield*/, Promise.all([
                            prisma.department.create({
                                data: {
                                    name: 'Executive Office',
                                    departmentCode: 'EXEC',
                                    description: 'Executive leadership and strategic management',
                                    departmentCategory: 'management',
                                    functionType: 'management',
                                    criticalityLevel: 'critical',
                                    headcount: 5,
                                    budget: 2000000,
                                    isActive: true,
                                    departmentHeadId: users[1].id,
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.department.create({
                                data: {
                                    name: 'Information Technology',
                                    departmentCode: 'IT',
                                    description: 'IT infrastructure, development, and support',
                                    departmentCategory: 'support_function',
                                    functionType: 'support',
                                    criticalityLevel: 'critical',
                                    headcount: 45,
                                    budget: 5000000,
                                    isActive: true,
                                    departmentHeadId: users[2].id,
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.department.create({
                                data: {
                                    name: 'Information Security',
                                    departmentCode: 'INFOSEC',
                                    description: 'Cybersecurity, risk management, and compliance',
                                    departmentCategory: 'compliance_regulatory',
                                    functionType: 'support',
                                    criticalityLevel: 'critical',
                                    headcount: 12,
                                    budget: 1500000,
                                    isActive: true,
                                    departmentHeadId: users[3].id,
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.department.create({
                                data: {
                                    name: 'Human Resources',
                                    departmentCode: 'HR',
                                    description: 'People management, recruitment, and employee relations',
                                    departmentCategory: 'support_function',
                                    functionType: 'support',
                                    criticalityLevel: 'medium',
                                    headcount: 15,
                                    budget: 800000,
                                    isActive: true,
                                    departmentHeadId: users[4].id,
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.department.create({
                                data: {
                                    name: 'Sales & Marketing',
                                    departmentCode: 'SALES',
                                    description: 'Revenue generation and market development',
                                    departmentCategory: 'revenue_generating',
                                    functionType: 'core_business',
                                    criticalityLevel: 'high',
                                    headcount: 60,
                                    budget: 3000000,
                                    isActive: true,
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.department.create({
                                data: {
                                    name: 'Product Development',
                                    departmentCode: 'PROD',
                                    description: 'Software product design and development',
                                    departmentCategory: 'revenue_generating',
                                    functionType: 'core_business',
                                    criticalityLevel: 'critical',
                                    headcount: 80,
                                    budget: 8000000,
                                    isActive: true,
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.department.create({
                                data: {
                                    name: 'Finance',
                                    departmentCode: 'FIN',
                                    description: 'Financial management and accounting',
                                    departmentCategory: 'support_function',
                                    functionType: 'support',
                                    criticalityLevel: 'high',
                                    headcount: 20,
                                    budget: 1200000,
                                    isActive: true,
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.department.create({
                                data: {
                                    name: 'Legal & Compliance',
                                    departmentCode: 'LEGAL',
                                    description: 'Legal affairs and regulatory compliance',
                                    departmentCategory: 'compliance_regulatory',
                                    functionType: 'support',
                                    criticalityLevel: 'high',
                                    headcount: 8,
                                    budget: 600000,
                                    isActive: true,
                                    createdById: users[0].id,
                                },
                            }),
                        ])];
                case 5:
                    departments = _a.sent();
                    console.log("\u2705 Created ".concat(departments.length, " departments"));
                    return [4 /*yield*/, Promise.all([
                            prisma.businessProcess.create({
                                data: {
                                    name: 'Software Development Lifecycle',
                                    processCode: 'PROC-001',
                                    description: 'End-to-end software development from requirements to deployment',
                                    processType: 'core',
                                    criticalityLevel: 'critical',
                                    departmentId: departments[5].id,
                                    processOwnerId: users[2].id,
                                    frequency: 'continuous',
                                    automationLevel: 'semi_automated',
                                    bcpEnabled: true,
                                    bcpCriticality: 'critical',
                                    recoveryTimeObjectiveMinutes: 240,
                                    recoveryPointObjectiveMinutes: 60,
                                    isActive: true,
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.businessProcess.create({
                                data: {
                                    name: 'Customer Onboarding',
                                    processCode: 'PROC-002',
                                    description: 'New customer setup and initial configuration',
                                    processType: 'core',
                                    criticalityLevel: 'high',
                                    departmentId: departments[4].id,
                                    frequency: 'daily',
                                    automationLevel: 'semi_automated',
                                    bcpEnabled: true,
                                    bcpCriticality: 'high',
                                    recoveryTimeObjectiveMinutes: 480,
                                    isActive: true,
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.businessProcess.create({
                                data: {
                                    name: 'Incident Management',
                                    processCode: 'PROC-003',
                                    description: 'Security incident detection, response, and recovery',
                                    processType: 'support',
                                    criticalityLevel: 'critical',
                                    departmentId: departments[2].id,
                                    processOwnerId: users[3].id,
                                    frequency: 'continuous',
                                    automationLevel: 'semi_automated',
                                    bcpEnabled: true,
                                    bcpCriticality: 'critical',
                                    recoveryTimeObjectiveMinutes: 30,
                                    isActive: true,
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.businessProcess.create({
                                data: {
                                    name: 'Payroll Processing',
                                    processCode: 'PROC-004',
                                    description: 'Monthly payroll calculation and disbursement',
                                    processType: 'support',
                                    criticalityLevel: 'high',
                                    departmentId: departments[3].id,
                                    processOwnerId: users[4].id,
                                    frequency: 'monthly',
                                    automationLevel: 'fully_automated',
                                    bcpEnabled: true,
                                    bcpCriticality: 'high',
                                    recoveryTimeObjectiveMinutes: 1440,
                                    isActive: true,
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.businessProcess.create({
                                data: {
                                    name: 'Vendor Management',
                                    processCode: 'PROC-005',
                                    description: 'Third-party vendor assessment and relationship management',
                                    processType: 'support',
                                    criticalityLevel: 'medium',
                                    departmentId: departments[2].id,
                                    frequency: 'quarterly',
                                    automationLevel: 'manual',
                                    isActive: true,
                                    createdById: users[0].id,
                                },
                            }),
                        ])];
                case 6:
                    processes = _a.sent();
                    console.log("\u2705 Created ".concat(processes.length, " business processes"));
                    return [4 /*yield*/, Promise.all([
                            prisma.externalDependency.create({
                                data: {
                                    name: 'Amazon Web Services',
                                    dependencyType: 'cloud_service_provider',
                                    description: 'Primary cloud infrastructure provider for all production workloads',
                                    criticalityLevel: 'critical',
                                    businessImpact: 'Complete service outage if unavailable',
                                    singlePointOfFailure: false,
                                    contractStart: new Date('2023-01-01'),
                                    contractEnd: new Date('2026-01-01'),
                                    annualCost: 500000,
                                    contactEmail: 'enterprise@aws.amazon.com',
                                    riskRating: 'low',
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.externalDependency.create({
                                data: {
                                    name: 'Salesforce',
                                    dependencyType: 'saas_application',
                                    description: 'Customer relationship management platform',
                                    criticalityLevel: 'high',
                                    businessImpact: 'Sales operations impacted',
                                    singlePointOfFailure: false,
                                    contractStart: new Date('2023-06-01'),
                                    contractEnd: new Date('2025-06-01'),
                                    annualCost: 120000,
                                    contactEmail: 'support@salesforce.com',
                                    riskRating: 'low',
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.externalDependency.create({
                                data: {
                                    name: 'Stripe',
                                    dependencyType: 'data_processor',
                                    description: 'Payment processing and billing',
                                    criticalityLevel: 'critical',
                                    businessImpact: 'Cannot process customer payments',
                                    singlePointOfFailure: true,
                                    contractStart: new Date('2022-01-01'),
                                    contractEnd: new Date('2025-01-01'),
                                    annualCost: 50000,
                                    contactEmail: 'enterprise@stripe.com',
                                    riskRating: 'medium',
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.externalDependency.create({
                                data: {
                                    name: 'Okta',
                                    dependencyType: 'saas_application',
                                    description: 'Identity and access management',
                                    criticalityLevel: 'critical',
                                    businessImpact: 'Users cannot authenticate to systems',
                                    singlePointOfFailure: true,
                                    contractStart: new Date('2023-03-01'),
                                    contractEnd: new Date('2026-03-01'),
                                    annualCost: 80000,
                                    contactEmail: 'support@okta.com',
                                    riskRating: 'low',
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.externalDependency.create({
                                data: {
                                    name: 'Deloitte',
                                    dependencyType: 'professional_service',
                                    description: 'External audit and compliance consulting',
                                    criticalityLevel: 'medium',
                                    businessImpact: 'Audit delays',
                                    singlePointOfFailure: false,
                                    contractStart: new Date('2024-01-01'),
                                    contractEnd: new Date('2025-01-01'),
                                    annualCost: 200000,
                                    contactEmail: 'audit@deloitte.com',
                                    riskRating: 'low',
                                    createdById: users[0].id,
                                },
                            }),
                        ])];
                case 7:
                    dependencies = _a.sent();
                    console.log("\u2705 Created ".concat(dependencies.length, " external dependencies"));
                    return [4 /*yield*/, Promise.all([
                            prisma.regulator.create({
                                data: {
                                    name: 'Information Commissioner\'s Office',
                                    acronym: 'ICO',
                                    regulatorType: 'data_protection_authority',
                                    jurisdiction: 'United Kingdom',
                                    jurisdictionLevel: 'national',
                                    description: 'UK data protection regulator',
                                    website: 'https://ico.org.uk',
                                    registrationStatus: 'registered',
                                    registrationNumber: 'ZA123456',
                                    reportingFrequency: 'annual',
                                    isActive: true,
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.regulator.create({
                                data: {
                                    name: 'European Union Agency for Cybersecurity',
                                    acronym: 'ENISA',
                                    regulatorType: 'government_agency',
                                    jurisdiction: 'European Union',
                                    jurisdictionLevel: 'regional',
                                    description: 'EU cybersecurity agency',
                                    website: 'https://www.enisa.europa.eu',
                                    registrationStatus: 'not_required',
                                    isActive: true,
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.regulator.create({
                                data: {
                                    name: 'ISO/IEC',
                                    acronym: 'ISO',
                                    regulatorType: 'standards_organization',
                                    jurisdiction: 'International',
                                    jurisdictionLevel: 'international',
                                    description: 'International standards organization',
                                    website: 'https://www.iso.org',
                                    registrationStatus: 'not_required',
                                    isActive: true,
                                    createdById: users[0].id,
                                },
                            }),
                        ])];
                case 8:
                    regulators = _a.sent();
                    console.log("\u2705 Created ".concat(regulators.length, " regulators"));
                    return [4 /*yield*/, prisma.securityCommittee.create({
                            data: {
                                name: 'Information Security Steering Committee',
                                committeeType: 'steering',
                                description: 'Executive oversight of information security strategy and governance',
                                chairId: users[1].id,
                                authorityLevel: 'Strategic decision-making authority for security investments and policies',
                                meetingFrequency: 'monthly',
                                nextMeetingDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                                isActive: true,
                                establishedDate: new Date('2023-01-15'),
                                createdById: users[0].id,
                            },
                        })];
                case 9:
                    committee = _a.sent();
                    console.log('✅ Created security committee');
                    return [4 /*yield*/, Promise.all([
                            prisma.committeeMembership.create({
                                data: {
                                    userId: users[1].id,
                                    committeeId: committee.id,
                                    role: 'chair',
                                    responsibilities: 'Chair meetings, set agenda, ensure decisions are implemented',
                                    votingRights: true,
                                    isActive: true,
                                    startDate: new Date('2023-01-15'),
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.committeeMembership.create({
                                data: {
                                    userId: users[2].id,
                                    committeeId: committee.id,
                                    role: 'member',
                                    responsibilities: 'Provide IT perspective on security matters',
                                    votingRights: true,
                                    isActive: true,
                                    startDate: new Date('2023-01-15'),
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.committeeMembership.create({
                                data: {
                                    userId: users[3].id,
                                    committeeId: committee.id,
                                    role: 'secretary',
                                    responsibilities: 'Present security reports, recommend policies, take minutes',
                                    votingRights: true,
                                    isActive: true,
                                    startDate: new Date('2023-01-15'),
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.committeeMembership.create({
                                data: {
                                    userId: users[4].id,
                                    committeeId: committee.id,
                                    role: 'member',
                                    responsibilities: 'Provide HR perspective on security awareness and training',
                                    votingRights: true,
                                    isActive: true,
                                    startDate: new Date('2023-06-01'),
                                    createdById: users[0].id,
                                },
                            }),
                        ])];
                case 10:
                    memberships = _a.sent();
                    console.log("\u2705 Created ".concat(memberships.length, " committee memberships"));
                    return [4 /*yield*/, prisma.committeeMeeting.create({
                            data: {
                                committeeId: committee.id,
                                meetingNumber: '2024-Q4-01',
                                title: 'Q4 Security Review Meeting',
                                meetingType: 'regular',
                                meetingDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                                startTime: '10:00',
                                endTime: '11:30',
                                durationMinutes: 90,
                                locationType: 'hybrid',
                                physicalLocation: 'Board Room A',
                                virtualMeetingLink: 'https://zoom.us/j/123456789',
                                agenda: '1. Review Q3 security metrics\n2. Discuss upcoming audit\n3. Approve security budget\n4. AOB',
                                objectives: 'Review security posture and approve Q1 initiatives',
                                minutes: 'Meeting opened at 10:00. All members present. Q3 metrics reviewed - 15% reduction in incidents. Audit preparation on track. Budget approved unanimously.',
                                chairId: users[1].id,
                                secretaryId: users[3].id,
                                expectedAttendeesCount: 4,
                                actualAttendeesCount: 4,
                                status: 'completed',
                                quorumAchieved: true,
                                quorumRequirement: 3,
                                createdById: users[0].id,
                            },
                        })];
                case 11:
                    meeting = _a.sent();
                    console.log('✅ Created committee meeting');
                    return [4 /*yield*/, Promise.all([
                            prisma.meetingDecision.create({
                                data: {
                                    meetingId: meeting.id,
                                    decisionNumber: 'DEC-2024-001',
                                    title: 'Approve Q1 2025 Security Budget',
                                    description: 'Approved security budget of $1.5M for Q1 2025, including new SIEM implementation',
                                    decisionType: 'approved',
                                    rationale: 'Critical for improving threat detection capabilities',
                                    voteType: 'unanimous',
                                    votesFor: 4,
                                    votesAgainst: 0,
                                    votesAbstain: 0,
                                    responsiblePartyId: users[3].id,
                                    effectiveDate: new Date('2025-01-01'),
                                    implementationDeadline: new Date('2025-03-31'),
                                    implemented: false,
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.meetingDecision.create({
                                data: {
                                    meetingId: meeting.id,
                                    decisionNumber: 'DEC-2024-002',
                                    title: 'Mandatory Security Awareness Training',
                                    description: 'All employees must complete updated security awareness training by end of Q1',
                                    decisionType: 'approved',
                                    rationale: 'Reduce human-factor security incidents',
                                    voteType: 'majority',
                                    votesFor: 4,
                                    votesAgainst: 0,
                                    votesAbstain: 0,
                                    responsiblePartyId: users[4].id,
                                    effectiveDate: new Date('2025-01-01'),
                                    implementationDeadline: new Date('2025-03-31'),
                                    implemented: false,
                                    createdById: users[0].id,
                                },
                            }),
                        ])];
                case 12:
                    decisions = _a.sent();
                    console.log("\u2705 Created ".concat(decisions.length, " meeting decisions"));
                    return [4 /*yield*/, Promise.all([
                            prisma.meetingActionItem.create({
                                data: {
                                    meetingId: meeting.id,
                                    actionNumber: 'ACT-2024-001',
                                    title: 'Prepare SIEM vendor shortlist',
                                    description: 'Research and prepare a shortlist of 3 SIEM vendors for evaluation',
                                    assignedToId: users[3].id,
                                    assignedById: users[1].id,
                                    priority: 'high',
                                    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                                    status: 'in_progress',
                                    progressPercentage: 60,
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.meetingActionItem.create({
                                data: {
                                    meetingId: meeting.id,
                                    actionNumber: 'ACT-2024-002',
                                    title: 'Update security awareness training content',
                                    description: 'Review and update training materials to include latest phishing techniques',
                                    assignedToId: users[4].id,
                                    assignedById: users[1].id,
                                    priority: 'medium',
                                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                                    status: 'open',
                                    progressPercentage: 0,
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.meetingActionItem.create({
                                data: {
                                    meetingId: meeting.id,
                                    actionNumber: 'ACT-2024-003',
                                    title: 'Schedule external penetration test',
                                    description: 'Coordinate with vendor to schedule annual penetration test for Q1',
                                    assignedToId: users[3].id,
                                    assignedById: users[1].id,
                                    priority: 'high',
                                    dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Overdue
                                    status: 'open',
                                    progressPercentage: 20,
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.meetingActionItem.create({
                                data: {
                                    meetingId: meeting.id,
                                    actionNumber: 'ACT-2024-004',
                                    title: 'Review access control policies',
                                    description: 'Annual review of access control policies and procedures',
                                    assignedToId: users[2].id,
                                    assignedById: users[3].id,
                                    priority: 'medium',
                                    dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
                                    status: 'open',
                                    progressPercentage: 0,
                                    createdById: users[0].id,
                                },
                            }),
                        ])];
                case 13:
                    actionItems = _a.sent();
                    console.log("\u2705 Created ".concat(actionItems.length, " action items"));
                    return [4 /*yield*/, Promise.all([
                            prisma.executivePosition.create({
                                data: {
                                    title: 'Chief Executive Officer',
                                    executiveLevel: 'ceo',
                                    personId: users[1].id,
                                    authorityLevel: 'strategic',
                                    securityResponsibilities: 'Ultimate accountability for information security',
                                    budgetAuthority: true,
                                    isActive: true,
                                    isCeo: true,
                                    isSecurityCommitteeMember: true,
                                    startDate: new Date('2020-01-01'),
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.executivePosition.create({
                                data: {
                                    title: 'Chief Information Security Officer',
                                    executiveLevel: 'ciso',
                                    personId: users[3].id,
                                    authorityLevel: 'strategic',
                                    securityResponsibilities: 'Lead information security program, risk management, and compliance',
                                    budgetAuthority: true,
                                    isActive: true,
                                    isSecurityCommitteeMember: true,
                                    startDate: new Date('2022-03-01'),
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.executivePosition.create({
                                data: {
                                    title: 'Chief Technology Officer',
                                    executiveLevel: 'cto',
                                    personId: users[2].id,
                                    authorityLevel: 'strategic',
                                    securityResponsibilities: 'Ensure security is embedded in technology decisions',
                                    budgetAuthority: true,
                                    isActive: true,
                                    isSecurityCommitteeMember: true,
                                    startDate: new Date('2021-06-01'),
                                    createdById: users[0].id,
                                },
                            }),
                        ])];
                case 14:
                    executives = _a.sent();
                    console.log("\u2705 Created ".concat(executives.length, " executive positions"));
                    return [4 /*yield*/, Promise.all([
                            prisma.securityChampion.create({
                                data: {
                                    userId: users[2].id,
                                    departmentId: departments[1].id,
                                    championLevel: 'primary',
                                    responsibilities: 'Promote security best practices within IT department',
                                    trainingCompleted: true,
                                    lastTrainingDate: new Date('2024-06-15'),
                                    isActive: true,
                                    startDate: new Date('2023-03-01'),
                                    createdById: users[0].id,
                                },
                            }),
                            prisma.securityChampion.create({
                                data: {
                                    userId: users[4].id,
                                    departmentId: departments[3].id,
                                    championLevel: 'primary',
                                    responsibilities: 'Security awareness liaison for HR department',
                                    trainingCompleted: true,
                                    lastTrainingDate: new Date('2024-06-15'),
                                    isActive: true,
                                    startDate: new Date('2023-06-01'),
                                    createdById: users[0].id,
                                },
                            }),
                        ])];
                case 15:
                    champions = _a.sent();
                    console.log("\u2705 Created ".concat(champions.length, " security champions"));
                    doraQuestions = [
                        { stepNumber: '1.1', stepCategory: 'JURISDICTION', questionText: 'Is your organization established in an EU/EEA Member State?', ifYes: 'Continue to Step 2', ifNo: 'STOP: DORA does not apply', legalReference: 'Art. 2(1)', sortOrder: 1 },
                        { stepNumber: '2.1', stepCategory: 'ENTITY TYPE', questionText: 'Is your organization a credit institution?', ifYes: 'DORA applies - Full regime', ifNo: 'Continue to 2.2', legalReference: 'Art. 2(1)(a)', sortOrder: 2 },
                        { stepNumber: '2.2', stepCategory: 'ENTITY TYPE', questionText: 'Is your organization a payment institution?', ifYes: 'DORA applies - Full regime', ifNo: 'Continue to 2.3', legalReference: 'Art. 2(1)(b)', sortOrder: 3 },
                        { stepNumber: '2.3', stepCategory: 'ENTITY TYPE', questionText: 'Is your organization an investment firm?', ifYes: 'DORA applies - Full regime', ifNo: 'Continue to 2.4', legalReference: 'Art. 2(1)(c)', sortOrder: 4 },
                        { stepNumber: '2.4', stepCategory: 'ENTITY TYPE', questionText: 'Is your organization an insurance or reinsurance undertaking?', ifYes: 'DORA applies - Full regime', ifNo: 'Continue to 2.5', legalReference: 'Art. 2(1)(d)', sortOrder: 5 },
                    ];
                    nis2Questions = [
                        { stepNumber: '1.1', stepCategory: 'JURISDICTION', questionText: 'Does your organization provide services or carry out activities within the European Union?', ifYes: 'Continue to Step 2', ifNo: 'STOP: NIS2 does not apply', legalReference: 'Art. 2(1)', sortOrder: 1 },
                        { stepNumber: '2.1', stepCategory: 'SECTOR - ANNEX I', questionText: 'Does your organization operate in the Energy sector?', ifYes: 'Continue to size assessment', ifNo: 'Continue to 2.2', legalReference: 'Annex I', sortOrder: 2 },
                        { stepNumber: '2.2', stepCategory: 'SECTOR - ANNEX I', questionText: 'Does your organization operate in the Transport sector?', ifYes: 'Continue to size assessment', ifNo: 'Continue to 2.3', legalReference: 'Annex I', sortOrder: 3 },
                        { stepNumber: '2.3', stepCategory: 'SECTOR - ANNEX I', questionText: 'Does your organization operate in the Banking sector?', ifYes: 'Continue to size assessment', ifNo: 'Continue to 2.4', legalReference: 'Annex I', sortOrder: 4 },
                        { stepNumber: '2.4', stepCategory: 'SECTOR - ANNEX I', questionText: 'Does your organization provide Digital infrastructure services?', ifYes: 'Continue to size assessment', ifNo: 'Continue to 2.5', legalReference: 'Annex I', sortOrder: 5 },
                    ];
                    return [4 /*yield*/, prisma.surveyQuestion.createMany({
                            data: __spreadArray(__spreadArray([], doraQuestions.map(function (q) { return (__assign(__assign({}, q), { surveyType: 'dora' })); }), true), nis2Questions.map(function (q) { return (__assign(__assign({}, q), { surveyType: 'nis2' })); }), true),
                            skipDuplicates: true,
                        })];
                case 16:
                    _a.sent();
                    console.log('✅ Created survey questions for DORA and NIS2');
                    console.log('\n🎉 Database seed completed successfully!');
                    console.log('\n📋 Summary:');
                    console.log("   - ".concat(users.length, " users"));
                    console.log("   - 1 organisation profile");
                    console.log("   - ".concat(locations.length, " locations"));
                    console.log("   - ".concat(departments.length, " departments"));
                    console.log("   - ".concat(processes.length, " business processes"));
                    console.log("   - ".concat(dependencies.length, " external dependencies"));
                    console.log("   - ".concat(regulators.length, " regulators"));
                    console.log("   - 1 security committee with ".concat(memberships.length, " members"));
                    console.log("   - 1 meeting with ".concat(decisions.length, " decisions and ").concat(actionItems.length, " action items"));
                    console.log("   - ".concat(executives.length, " executive positions"));
                    console.log("   - ".concat(champions.length, " security champions"));
                    console.log("   - 10 survey questions (5 DORA + 5 NIS2)");
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
