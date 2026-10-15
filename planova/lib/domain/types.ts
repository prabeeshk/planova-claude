/**
 * PLANOVA domain types — FRONTEND REPRESENTATIONS ONLY.
 * These mirror the PRD §13–14 catalogue as typed client contracts.
 * No database, ORM or migrations exist in Phase 1.
 */

export type ID = string;
/** ISO-8601 UTC timestamp */
export type ISODateTime = string;
/** Local work date, YYYY-MM-DD */
export type LocalDate = string;

/** Money keeps decimal precision as a string amount + ISO 4217 code. */
export interface Money {
  amount: string;
  currencyCode: string;
}

export interface BaseRecord {
  id: ID;
  organisationId: ID;
  rowVersion: number;
  createdAt: ISODateTime;
  createdBy: ID;
  updatedAt: ISODateTime;
  updatedBy: ID;
  deletedAt?: ISODateTime | null;
}

/* ───────────── Identity ───────────── */

export interface Organisation {
  id: ID;
  code: string;
  name: string;
  timezone: string;
  currencyCode: string;
  featureFlags: Record<string, boolean>;
}

export interface OrganisationUnit {
  id: ID;
  organisationId: ID;
  name: string;
  parentId: ID | null;
}

export type Scope = "SELF" | "ASSIGNED" | "TEAM" | "PROJECT" | "DEPARTMENT" | "PORTFOLIO" | "ORGANISATION";

export interface User extends BaseRecord {
  name: string;
  email: string;
  title: string;
  unitId: ID;
  managerId: ID | null;
  active: boolean;
  locale: string;
  timezone: string;
  avatarUrl?: string;
  fte: number;
  weeklyCapacityHours: number;
  skills: string[];
  /** Sensitive — only visible with budget.view + cost capability. */
  costRate: Money;
  isEmergencyAdmin?: boolean;
}

export interface PrincipalRoleAssignment {
  id: ID;
  organisationId: ID;
  userId: ID;
  roleCode: string;
  scope: Scope;
  scopeRefId: ID | null;
  effectiveFrom: LocalDate;
  effectiveTo: LocalDate | null;
  delegatedBy?: ID | null;
}

/* ───────────── Projects ───────────── */

export type ProjectStatus = "Draft" | "Proposed" | "Active" | "On Hold" | "Completed" | "Cancelled" | "Archived";
export type ProjectMethod = "Agile" | "Waterfall" | "Hybrid" | "Operational";
export type Health = "On Track" | "At Risk" | "Critical" | "No Data";
export type Priority = "Low" | "Medium" | "High" | "Critical";
export type HealthDimension = "schedule" | "cost" | "scope" | "resource";

export interface DimensionHealth {
  health: Health;
  rationale: string;
}

export interface Project extends BaseRecord {
  code: string;
  name: string;
  summary: string;
  method: ProjectMethod;
  managerId: ID;
  sponsorId: ID;
  unitId: ID;
  portfolioId: ID | null;
  programId: ID | null;
  startDate: LocalDate;
  targetDate: LocalDate;
  forecastDate: LocalDate;
  status: ProjectStatus;
  health: Health;
  dimensions: Record<HealthDimension, DimensionHealth>;
  progress: number;
  priority: Priority;
  coverImage?: string;
  accent: string;
  scores: { strategicFit: number; value: number; riskExposure: number };
  objectiveIds: ID[];
}

export interface ProjectMember {
  id: ID;
  organisationId: ID;
  projectId: ID;
  userId: ID;
  projectRole: string;
  joinedAt: LocalDate;
}

export interface ProjectHealthUpdate {
  id: ID;
  organisationId: ID;
  projectId: ID;
  date: LocalDate;
  overall: Health;
  dimensions: Record<HealthDimension, DimensionHealth>;
  summary: string;
  authorId: ID;
  published: boolean;
}

export interface ProjectBaseline {
  id: ID;
  organisationId: ID;
  projectId: ID;
  version: number;
  status: "Draft" | "Approved" | "Superseded";
  approvedAt: ISODateTime | null;
  approvedBy: ID | null;
  /** Frozen snapshot. Never mutated once Approved. */
  snapshot: Readonly<{ startDate: LocalDate; targetDate: LocalDate; budget: Money; milestoneDates: Record<ID, LocalDate> }>;
}

/* ───────────── Work ───────────── */

export type TaskStatus = "Not Started" | "In Progress" | "Blocked" | "Completed" | "Cancelled";

export interface ChecklistItem {
  id: ID;
  label: string;
  done: boolean;
}

export interface Task extends BaseRecord {
  projectId: ID;
  parentTaskId: ID | null;
  milestoneId: ID | null;
  code: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId: ID | null;
  startDate: LocalDate;
  dueDate: LocalDate;
  progress: number;
  estimateHours: number;
  order: number;
  checklist: ChecklistItem[];
  completedAt: ISODateTime | null;
  completedBy: ID | null;
  blockedReason?: string;
}

export interface TaskDependency {
  id: ID;
  organisationId: ID;
  predecessorId: ID;
  successorId: ID;
  type: "FS" | "SS" | "FF";
}

export interface Milestone extends BaseRecord {
  projectId: ID;
  name: string;
  /** Zero-duration: a single target date. */
  targetDate: LocalDate;
  baselineDate: LocalDate;
  ownerId: ID;
  isKey: boolean;
  achievedAt: LocalDate | null;
}

export interface Comment {
  id: ID;
  organisationId: ID;
  entityType: EntityType;
  entityId: ID;
  authorId: ID;
  body: string;
  createdAt: ISODateTime;
}

export type Classification = "Public" | "Internal" | "Confidential" | "Restricted";

export interface Attachment {
  id: ID;
  organisationId: ID;
  projectId: ID;
  entityType: EntityType;
  entityId: ID;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  classification: Classification;
  uploadedBy: ID;
  uploadedAt: ISODateTime;
}

/* ───────────── RAID ───────────── */

export type RaidType = "Risk" | "Assumption" | "Issue" | "Dependency";
export type RaidStatus = "Draft" | "Open" | "Monitoring" | "Escalated" | "Resolved" | "Closed";
export type Severity = "Low" | "Medium" | "High" | "Critical";

export interface RaidReview {
  id: ID;
  reviewerId: ID;
  date: LocalDate;
  note: string;
  probability: number;
  impact: number;
}

export interface RaidItem extends BaseRecord {
  projectId: ID;
  code: string;
  type: RaidType;
  title: string;
  description: string;
  status: RaidStatus;
  probability: number;
  impact: number;
  /** Derived from the risk matrix — never typed in by users. */
  score: number;
  severity: Severity;
  ownerId: ID;
  response: string;
  reviewDate: LocalDate;
  closureReason: string | null;
  sourceRaidId: ID | null;
  linkedTaskIds: ID[];
  exposure: Money | null;
  reviews: RaidReview[];
  escalatedAt: ISODateTime | null;
}

/* ───────────── Changes & approvals ───────────── */

export type ChangeStatus =
  | "Draft"
  | "Assessing"
  | "Ready for Approval"
  | "In Approval"
  | "Approved"
  | "Rejected"
  | "Withdrawn"
  | "Implemented"
  | "Closed";

export interface ChangeImpact {
  scope: string;
  scheduleDays: number;
  cost: Money;
  resource: string;
  risk: string;
}

export interface ChangeRequest extends BaseRecord {
  projectId: ID;
  code: string;
  title: string;
  reason: string;
  status: ChangeStatus;
  requesterId: ID;
  currentVersion: number;
  impact: ChangeImpact;
  options: string;
  evidence: EvidenceRef[];
  linkedRaidIds: ID[];
  approvalId: ID | null;
  /** True when a submitted version was edited and needs resubmission. */
  pendingResubmission: boolean;
}

export interface ChangeVersion {
  id: ID;
  organisationId: ID;
  changeId: ID;
  version: number;
  submittedAt: ISODateTime;
  submittedBy: ID;
  hash: string;
  payload: Readonly<Pick<ChangeRequest, "title" | "reason" | "impact" | "options" | "evidence">>;
}

export type ApprovalStatus = "Pending" | "In Progress" | "Approved" | "Rejected" | "Withdrawn" | "Expired" | "Cancelled";
export type DecisionOutcome = "Approved" | "Rejected" | "Rework Requested" | "Delegated";

export interface ApprovalAssignment {
  id: ID;
  assigneeId: ID;
  delegatedToId: ID | null;
  status: "Pending" | "Decided" | "Skipped";
}

export interface ApprovalStage {
  id: ID;
  name: string;
  mode: "serial" | "parallel";
  quorum: number;
  status: "Waiting" | "Active" | "Approved" | "Rejected" | "Skipped";
  assignments: ApprovalAssignment[];
}

export interface ApprovalDecision {
  id: ID;
  stageId: ID;
  assignmentId: ID;
  actorId: ID;
  outcome: DecisionOutcome;
  comment: string;
  at: ISODateTime;
}

export interface EvidenceRef {
  label: string;
  entityType: EntityType;
  entityId: ID;
}

export interface ApprovalRequest extends BaseRecord {
  entityType: "Change" | "Budget" | "Release" | "RaidClosure";
  entityId: ID;
  entityVersion: number;
  versionHash: string;
  title: string;
  projectId: ID | null;
  status: ApprovalStatus;
  requesterId: ID;
  submittedAt: ISODateTime;
  dueAt: ISODateTime;
  stages: ApprovalStage[];
  /** Append-only. */
  decisions: ApprovalDecision[];
  evidence: EvidenceRef[];
  snapshot: Record<string, string | number>;
}

/* ───────────── Governance ───────────── */

export interface Finding {
  id: ID;
  title: string;
  severity: Severity;
  source: EvidenceRef;
  ownerId: ID;
  status: "Open" | "Remediating" | "Closed";
  dueDate: LocalDate;
}

export interface GovernanceReview extends BaseRecord {
  name: string;
  scope: string;
  periodStart: LocalDate;
  periodEnd: LocalDate;
  status: "Planned" | "In Review" | "Attested" | "Closed";
  chairId: ID;
  agenda: EvidenceRef[];
  findings: Finding[];
  attestedBy: ID | null;
}

export interface Policy {
  id: ID;
  organisationId: ID;
  code: string;
  name: string;
  version: string;
  effectiveFrom: LocalDate;
  summary: string;
  clauses: string[];
  attestationRequired: boolean;
  attestedCount: number;
  audienceCount: number;
}

export interface GovernanceException extends BaseRecord {
  title: string;
  policyId: ID;
  projectId: ID;
  source: EvidenceRef;
  ownerId: ID;
  severity: Severity;
  effectiveFrom: LocalDate;
  effectiveTo: LocalDate;
  remediationStatus: "Not Started" | "In Progress" | "Remediated" | "Accepted";
  comments: { authorId: ID; at: ISODateTime; body: string }[];
}

/* ───────────── Portfolio ───────────── */

export interface Portfolio {
  id: ID;
  organisationId: ID;
  name: string;
  description: string;
  ownerId: ID;
  accent: string;
  investment: Money;
  healthTrend: { period: string; onTrack: number; atRisk: number; critical: number }[];
}

export interface Program {
  id: ID;
  organisationId: ID;
  portfolioId: ID;
  name: string;
  purpose: string;
  managerId: ID;
}

export interface StrategicObjective {
  id: ID;
  organisationId: ID;
  portfolioId: ID;
  name: string;
  description: string;
}

export interface PortfolioSnapshot {
  id: ID;
  organisationId: ID;
  portfolioId: ID;
  takenAt: ISODateTime;
  label: string;
  projectCount: number;
  totalInvestment: Money;
  atRiskCount: number;
}

/* ───────────── Resources ───────────── */

export interface ResourceAllocation extends BaseRecord {
  projectId: ID;
  userId: ID;
  /** Percentage of the person's weekly available capacity. */
  percent: number;
  startDate: LocalDate;
  endDate: LocalDate;
  role: string;
}

export interface ResourceRequest extends BaseRecord {
  projectId: ID;
  role: string;
  skills: string[];
  percent: number;
  startDate: LocalDate;
  endDate: LocalDate;
  status: "Requested" | "Proposed" | "Fulfilled" | "Declined";
  requesterId: ID;
  justification: string;
}

export interface CapacityOverride {
  id: ID;
  organisationId: ID;
  userId: ID;
  weekStart: LocalDate;
  hours: number;
}

/* ───────────── Finance ───────────── */

export type BudgetVersionStatus = "Draft" | "Submitted" | "Approved" | "Superseded" | "Rejected";
export type CostCategory = "Labour" | "Software" | "Hardware" | "Vendors" | "Travel" | "Contingency";

export interface BudgetLine {
  id: ID;
  category: CostCategory;
  period: string; // YYYY-MM
  amount: string;
}

export interface BudgetVersion {
  id: ID;
  version: number;
  status: BudgetVersionStatus;
  total: Money;
  lines: BudgetLine[];
  submittedAt: ISODateTime | null;
  approvedAt: ISODateTime | null;
  approvalId: ID | null;
  note: string;
}

export interface Budget extends BaseRecord {
  projectId: ID;
  fiscalYear: number;
  currencyCode: string;
  versions: BudgetVersion[];
}

export interface ActualCost {
  id: ID;
  organisationId: ID;
  projectId: ID;
  date: LocalDate;
  category: CostCategory;
  amount: Money;
  source: "ERP" | "Expenses" | "Timesheet" | "Manual";
  externalKey: string;
  description: string;
  vendor: string;
}

export interface Commitment {
  id: ID;
  organisationId: ID;
  projectId: ID;
  vendor: string;
  description: string;
  amount: Money;
  date: LocalDate;
}

export interface ForecastLine {
  id: ID;
  organisationId: ID;
  projectId: ID;
  period: string; // YYYY-MM
  amount: Money;
  status: "Draft" | "Published";
}

/* ───────────── Workforce ───────────── */

export interface TimeEntry {
  id: ID;
  workDate: LocalDate;
  projectId: ID;
  taskId: ID | null;
  minutes: number;
  note: string;
}

export type TimesheetStatus = "Draft" | "Submitted" | "Approved" | "Rejected";

export interface Timesheet extends BaseRecord {
  userId: ID;
  weekStart: LocalDate;
  status: TimesheetStatus;
  version: number;
  lockedAt: ISODateTime | null;
  entries: TimeEntry[];
  decidedBy: ID | null;
  rejectionReason: string | null;
}

export type LeaveType = "Annual" | "Sick" | "Parental" | "Study" | "Unpaid";

export interface LeaveRequest extends BaseRecord {
  userId: ID;
  type: LeaveType;
  startDate: LocalDate;
  endDate: LocalDate;
  /** Private — only self and permitted reviewers. */
  reason: string;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  decidedBy: ID | null;
  decisionNote: string | null;
}

export interface Holiday {
  date: LocalDate;
  name: string;
}

/* ───────────── Releases ───────────── */

export type ReleaseStatus = "Draft" | "Planned" | "In Review" | "Approved" | "In Progress" | "Completed" | "Failed" | "Cancelled";

export interface ReleaseGate {
  id: ID;
  name: string;
  required: boolean;
  status: "Pending" | "Passed" | "Failed" | "Waived";
  evidence: string | null;
  approverId: ID;
}

export interface Release extends BaseRecord {
  projectId: ID;
  code: string;
  name: string;
  status: ReleaseStatus;
  riskLevel: Severity;
  windowStart: ISODateTime;
  windowEnd: ISODateTime;
  ownerId: ID;
  items: { id: ID; title: string; taskId: ID | null }[];
  dependencies: string[];
  gates: ReleaseGate[];
  emergency: boolean;
  emergencyReason: string | null;
  retrospectiveRequired: boolean;
  outcome: string | null;
  trail: { at: ISODateTime; actorId: ID; action: string }[];
}

/* ───────────── Platform ───────────── */

export type EntityType =
  | "Project"
  | "Task"
  | "Milestone"
  | "RaidItem"
  | "Change"
  | "Approval"
  | "Budget"
  | "Release"
  | "Timesheet"
  | "LeaveRequest"
  | "Allocation"
  | "User"
  | "Role"
  | "Review"
  | "Exception"
  | "Report"
  | "Organisation"
  | "Policy"
  | "Finding";

export interface Notification {
  id: ID;
  organisationId: ID;
  userId: ID;
  title: string;
  body: string;
  severity: "info" | "success" | "warning" | "critical";
  createdAt: ISODateTime;
  read: boolean;
  href: string;
}

export interface AuditEvent {
  id: ID;
  organisationId: ID;
  at: ISODateTime;
  actorId: ID;
  action: string;
  entityType: EntityType;
  entityId: ID;
  correlationId: string;
  changes: { field: string; before: string | null; after: string | null; redacted?: boolean }[];
}

export interface ActivityEvent {
  id: ID;
  organisationId: ID;
  projectId: ID | null;
  at: ISODateTime;
  actorId: ID;
  verb: string;
  entityType: EntityType;
  entityId: ID;
  summary: string;
}

export interface SavedReport {
  id: ID;
  organisationId: ID;
  name: string;
  description: string;
  dataset: "Projects" | "RAID" | "Financials" | "Resources" | "Approvals" | "Timesheets";
  audience: string;
  lastRefreshed: ISODateTime;
  schedule: string | null;
  ownerId: ID;
  template: boolean;
}

export interface IntegrationConnection {
  id: ID;
  name: string;
  kind: "Identity" | "HRIS" | "ERP" | "Calendar" | "Collaboration" | "Notifications";
  status: "Planned" | "Design" | "Not Connected";
  description: string;
  plannedPhase: string;
}

export interface ConfigChange {
  id: ID;
  organisationId: ID;
  at: ISODateTime;
  actorId: ID;
  summary: string;
}
