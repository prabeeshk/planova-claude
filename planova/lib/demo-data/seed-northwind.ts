import type {
  Organisation,
  OrganisationUnit,
  User,
  Project,
  ProjectMember,
  Task,
  Milestone,
  RaidItem,
  ChangeRequest,
  ApprovalRequest,
  Portfolio,
  Program,
  StrategicObjective,
  ResourceAllocation,
  Budget,
  Timesheet,
  AuditEvent,
  ActivityEvent,
} from "@/lib/domain/types";
import { base, dims, m, pastMonths, budgetVersion, buildTasks, TaskTuple } from "./builders";
import { rel, relIso } from "./clock";
import { deriveRisk } from "@/lib/domain/risk";
import { shortHash } from "@/lib/utils/ids";

export const ORG_NORTHWIND: Organisation = {
  id: "org-northwind",
  code: "NORTHWIND",
  name: "Northwind Global Holdings",
  timezone: "America/New_York",
  currencyCode: "USD",
  featureFlags: {
    copilotIntelligence: true,
    capacityHeatmap: true,
    costRateMasking: true,
    strictApprovals: true,
    governanceAttestation: false,
  },
};

export const UNITS_NORTHWIND: OrganisationUnit[] = [
  { id: "nw-unit-exec", organisationId: "org-northwind", name: "Corporate Headquarters", parentId: null },
  { id: "nw-unit-digital", organisationId: "org-northwind", name: "Americas Digital Solutions", parentId: "nw-unit-exec" },
  { id: "nw-unit-infra", organisationId: "org-northwind", name: "Global Cloud Engineering", parentId: "nw-unit-exec" },
];

export const USERS_NORTHWIND: User[] = [
  {
    ...base("org-northwind", "nw-u-ines", -300, "nw-u-hana"),
    name: "Ines Silva",
    email: "ines.silva@northwind.global",
    title: "Senior Delivery Director",
    unitId: "nw-unit-digital",
    managerId: "nw-u-hana",
    active: true,
    locale: "en-US",
    timezone: "America/New_York",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    fte: 1.0,
    weeklyCapacityHours: 40,
    skills: ["Portfolio Delivery", "Scaled Agile", "Executive Reporting"],
    costRate: m("145.00", "USD"),
  },
  {
    ...base("org-northwind", "nw-u-tomas", -300, "nw-u-ines"),
    name: "Tomas Lind",
    email: "tomas.lind@northwind.global",
    title: "Staff Infrastructure Engineer",
    unitId: "nw-unit-infra",
    managerId: "nw-u-ines",
    active: true,
    locale: "en-US",
    timezone: "America/New_York",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    fte: 1.0,
    weeklyCapacityHours: 40,
    skills: ["Terraform", "Google Cloud", "Distributed SQL", "Go"],
    costRate: m("125.00", "USD"),
  },
  {
    ...base("org-northwind", "nw-u-hana", -500, "nw-u-hana"),
    name: "Hana Takahashi",
    email: "hana.takahashi@northwind.global",
    title: "Executive Vice President of Technology",
    unitId: "nw-unit-exec",
    managerId: null,
    active: true,
    locale: "en-US",
    timezone: "America/New_York",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    fte: 1.0,
    weeklyCapacityHours: 40,
    skills: ["Enterprise Architecture", "Capital Allocation", "Board Governance"],
    costRate: m("220.00", "USD"),
  },
];

export const PORTFOLIOS_NORTHWIND: Portfolio[] = [
  {
    id: "nw-port-core",
    organisationId: "org-northwind",
    name: "Northwind Americas Digital Platform",
    description: "North American supply chain logistics and partner portal modernisation.",
    ownerId: "nw-u-hana",
    accent: "#0284C7",
    investment: m("4200000.00", "USD"),
    healthTrend: [
      { period: "Q1", onTrack: 2, atRisk: 0, critical: 0 },
      { period: "Q2", onTrack: 2, atRisk: 0, critical: 0 },
      { period: "Q3", onTrack: 2, atRisk: 0, critical: 0 },
      { period: "Q4", onTrack: 2, atRisk: 0, critical: 0 },
    ],
  },
];

export const PROGRAMS_NORTHWIND: Program[] = [
  { id: "nw-prog-logistics", organisationId: "org-northwind", portfolioId: "nw-port-core", name: "Next-Gen Freight Logistics", purpose: "Automate cross-border freight clearing.", managerId: "nw-u-ines" },
];

export const OBJECTIVES_NORTHWIND: StrategicObjective[] = [
  { id: "nw-obj-1", organisationId: "org-northwind", portfolioId: "nw-port-core", name: "Reduce Freight Processing Time by 50%", description: "Electronic customs manifest submission and real-time shipment tracking." },
];

export const PROJECTS_NORTHWIND: Project[] = [
  {
    ...base("org-northwind", "nw-proj-borealis", -150, "nw-u-ines"),
    code: "NW-BOR-10",
    name: "Project Borealis Cloud Analytics",
    summary: "Northwind automated inventory forecasting and predictive freight demand engine.",
    method: "Agile",
    managerId: "nw-u-ines",
    sponsorId: "nw-u-hana",
    unitId: "nw-unit-digital",
    portfolioId: "nw-port-core",
    programId: "nw-prog-logistics",
    startDate: rel(-100),
    targetDate: rel(60),
    forecastDate: rel(60),
    status: "Active",
    health: "On Track",
    dimensions: dims(
      ["On Track", "Demand forecasting models validated against historical manifests."],
      ["On Track", "GCP BigQuery compute spend within monthly allocation."],
      ["On Track", "Milestone 2 acceptance criteria signed off."],
      ["On Track", "Technical squad operating at expected capacity."]
    ),
    progress: 70,
    priority: "High",
    coverImage: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop&q=80",
    accent: "#0284C7",
    scores: { strategicFit: 90, value: 88, riskExposure: 35 },
    objectiveIds: ["nw-obj-1"],
  },
  {
    ...base("org-northwind", "nw-proj-polaris", -90, "nw-u-ines"),
    code: "NW-POL-20",
    name: "Polaris Carrier Integration API",
    summary: "Standardised EDI and REST API gateway for third-party maritime carriers.",
    method: "Hybrid",
    managerId: "nw-u-ines",
    sponsorId: "nw-u-hana",
    unitId: "nw-unit-infra",
    portfolioId: "nw-port-core",
    programId: "nw-prog-logistics",
    startDate: rel(-60),
    targetDate: rel(90),
    forecastDate: rel(90),
    status: "Active",
    health: "On Track",
    dimensions: dims(
      ["On Track", "EDI standard 214 mapping completed."],
      ["On Track", "API gateway infrastructure provisioned."],
      ["On Track", "Pilot carrier onboarding scheduled."],
      ["On Track", "Team staffed."]
    ),
    progress: 45,
    priority: "Medium",
    coverImage: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80",
    accent: "#10B981",
    scores: { strategicFit: 85, value: 80, riskExposure: 25 },
    objectiveIds: ["nw-obj-1"],
  },
];

export const PROJECT_MEMBERS_NORTHWIND: ProjectMember[] = [
  { id: "nw-pm-1", organisationId: "org-northwind", projectId: "nw-proj-borealis", userId: "nw-u-ines", projectRole: "Project Manager", joinedAt: rel(-100) },
  { id: "nw-pm-2", organisationId: "org-northwind", projectId: "nw-proj-borealis", userId: "nw-u-tomas", projectRole: "Lead Cloud Engineer", joinedAt: rel(-100) },
  { id: "nw-pm-3", organisationId: "org-northwind", projectId: "nw-proj-polaris", userId: "nw-u-ines", projectRole: "Delivery Lead", joinedAt: rel(-60) },
  { id: "nw-pm-4", organisationId: "org-northwind", projectId: "nw-proj-polaris", userId: "nw-u-tomas", projectRole: "Integration Specialist", joinedAt: rel(-60) },
];

export const MILESTONES_NORTHWIND: Milestone[] = [
  { ...base("org-northwind", "nw-m-1", -100, "nw-u-ines"), projectId: "nw-proj-borealis", name: "Data Warehouse Foundation Sign-Off", targetDate: rel(-40), baselineDate: rel(-40), ownerId: "nw-u-tomas", isKey: true, achievedAt: rel(-38) },
  { ...base("org-northwind", "nw-m-2", -100, "nw-u-ines"), projectId: "nw-proj-borealis", name: "Predictive Demand ML Pilot Go-Live", targetDate: rel(30), baselineDate: rel(30), ownerId: "nw-u-ines", isKey: true, achievedAt: null },
];

const BOREALIS_TUPLES: TaskTuple[] = [
  ["Deploy BigQuery schemas for shipping container manifests", "C", "H", "tomas", -90, -70, 40],
  ["Implement daily data ingestion pipeline with dbt Cloud", "C", "H", "tomas", -65, -45, 35],
  ["Build shipment delay prediction model in Vertex AI", "P", "H", "tomas", -20, 20, 50],
  ["Deliver executive dashboard for port throughput metrics", "P", "M", "ines", -10, 25, 30],
];

export const TASKS_NORTHWIND: Task[] = [
  ...buildTasks("org-northwind", "nw-proj-borealis", "NW-BOR", "nw-u-", BOREALIS_TUPLES, "nw-u-ines"),
];

export const RAID_NORTHWIND: RaidItem[] = [
  {
    ...base("org-northwind", "nw-raid-1", -50, "nw-u-ines"),
    projectId: "nw-proj-borealis",
    code: "NW-RAID-01",
    type: "Risk",
    title: "Maritime Carrier EDI Format Non-Standard Variants",
    description: "Regional shipping lines using proprietary EDI extensions requiring custom parser adapters.",
    status: "Monitoring",
    probability: 3,
    impact: 3,
    ...deriveRisk(3, 3),
    ownerId: "nw-u-tomas",
    response: "Implemented flexible schema translation rule engine in pipeline ingest layer.",
    reviewDate: rel(20),
    closureReason: null,
    sourceRaidId: null,
    linkedTaskIds: ["nw-proj-borealis-t1"],
    exposure: m("40000.00", "USD"),
    reviews: [],
    escalatedAt: null,
  },
];

export const CHANGES_NORTHWIND: ChangeRequest[] = [];
export const APPROVALS_NORTHWIND: ApprovalRequest[] = [];
export const ALLOCATIONS_NORTHWIND: ResourceAllocation[] = [
  { ...base("org-northwind", "nw-alloc-1", -100, "nw-u-ines"), projectId: "nw-proj-borealis", userId: "nw-u-tomas", percent: 60, startDate: rel(-100), endDate: rel(60), role: "Cloud Architect" },
  { ...base("org-northwind", "nw-alloc-2", -60, "nw-u-ines"), projectId: "nw-proj-polaris", userId: "nw-u-tomas", percent: 40, startDate: rel(-60), endDate: rel(90), role: "Integration Engineer" },
];
export const BUDGETS_NORTHWIND: Budget[] = [
  {
    ...base("org-northwind", "nw-bgt-bor", -100, "nw-u-ines"),
    projectId: "nw-proj-borealis",
    fiscalYear: 2026,
    currencyCode: "USD",
    versions: [
      budgetVersion("nw-bgt-bor", 1, "Approved", "850000.00", "USD", pastMonths(rel(-100)), -100, null, "Approved Project Borealis budget."),
    ],
  },
];
export const TIMESHEETS_NORTHWIND: Timesheet[] = [];
export const AUDIT_EVENTS_NORTHWIND: AuditEvent[] = [];
export const ACTIVITY_EVENTS_NORTHWIND: ActivityEvent[] = [];
