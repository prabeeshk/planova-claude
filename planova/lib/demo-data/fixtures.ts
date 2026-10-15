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
  GovernanceReview,
  Policy,
  GovernanceException,
  Portfolio,
  Program,
  StrategicObjective,
  ResourceAllocation,
  ResourceRequest,
  Budget,
  ActualCost,
  Commitment,
  ForecastLine,
  Timesheet,
  LeaveRequest,
  Release,
  SavedReport,
  IntegrationConnection,
  AuditEvent,
  ActivityEvent,
} from "@/lib/domain/types";

import {
  ORG_MERIDIAN,
  UNITS_MERIDIAN,
  USERS_MERIDIAN,
  PORTFOLIOS_MERIDIAN,
  PROGRAMS_MERIDIAN,
  OBJECTIVES_MERIDIAN,
  PROJECTS_MERIDIAN,
  PROJECT_MEMBERS_MERIDIAN,
  MILESTONES_MERIDIAN,
  TASKS_MERIDIAN,
  RAID_MERIDIAN,
  CHANGES_MERIDIAN,
  APPROVALS_MERIDIAN,
  POLICIES_MERIDIAN,
  GOVERNANCE_EXCEPTIONS_MERIDIAN,
  GOVERNANCE_REVIEWS_MERIDIAN,
  ALLOCATIONS_MERIDIAN,
  RESOURCE_REQUESTS_MERIDIAN,
  BUDGETS_MERIDIAN,
  ACTUALS_MERIDIAN,
  FORECASTS_MERIDIAN,
  TIMESHEETS_MERIDIAN,
  LEAVE_REQUESTS_MERIDIAN,
  RELEASES_MERIDIAN,
  SAVED_REPORTS_MERIDIAN,
  INTEGRATIONS_MERIDIAN,
  AUDIT_EVENTS_MERIDIAN,
  ACTIVITY_EVENTS_MERIDIAN,
} from "./seed-meridian";

import {
  ORG_NORTHWIND,
  UNITS_NORTHWIND,
  USERS_NORTHWIND,
  PORTFOLIOS_NORTHWIND,
  PROGRAMS_NORTHWIND,
  OBJECTIVES_NORTHWIND,
  PROJECTS_NORTHWIND,
  PROJECT_MEMBERS_NORTHWIND,
  MILESTONES_NORTHWIND,
  TASKS_NORTHWIND,
  RAID_NORTHWIND,
  CHANGES_NORTHWIND,
  APPROVALS_NORTHWIND,
  ALLOCATIONS_NORTHWIND,
  BUDGETS_NORTHWIND,
  TIMESHEETS_NORTHWIND,
  AUDIT_EVENTS_NORTHWIND,
  ACTIVITY_EVENTS_NORTHWIND,
} from "./seed-northwind";

export interface DemoFixtureStore {
  organisations: Organisation[];
  units: OrganisationUnit[];
  users: User[];
  portfolios: Portfolio[];
  programs: Program[];
  objectives: StrategicObjective[];
  projects: Project[];
  projectMembers: ProjectMember[];
  milestones: Milestone[];
  tasks: Task[];
  raidItems: RaidItem[];
  changes: ChangeRequest[];
  approvals: ApprovalRequest[];
  policies: Policy[];
  exceptions: GovernanceException[];
  reviews: GovernanceReview[];
  allocations: ResourceAllocation[];
  resourceRequests: ResourceRequest[];
  budgets: Budget[];
  actuals: ActualCost[];
  forecasts: ForecastLine[];
  timesheets: Timesheet[];
  leaveRequests: LeaveRequest[];
  releases: Release[];
  reports: SavedReport[];
  integrations: IntegrationConnection[];
  auditEvents: AuditEvent[];
  activityEvents: ActivityEvent[];
}

export function createInitialFixtures(): DemoFixtureStore {
  return {
    organisations: [ORG_MERIDIAN, ORG_NORTHWIND],
    units: [...UNITS_MERIDIAN, ...UNITS_NORTHWIND],
    users: [...USERS_MERIDIAN, ...USERS_NORTHWIND],
    portfolios: [...PORTFOLIOS_MERIDIAN, ...PORTFOLIOS_NORTHWIND],
    programs: [...PROGRAMS_MERIDIAN, ...PROGRAMS_NORTHWIND],
    objectives: [...OBJECTIVES_MERIDIAN, ...OBJECTIVES_NORTHWIND],
    projects: [...PROJECTS_MERIDIAN, ...PROJECTS_NORTHWIND],
    projectMembers: [...PROJECT_MEMBERS_MERIDIAN, ...PROJECT_MEMBERS_NORTHWIND],
    milestones: [...MILESTONES_MERIDIAN, ...MILESTONES_NORTHWIND],
    tasks: [...TASKS_MERIDIAN, ...TASKS_NORTHWIND],
    raidItems: [...RAID_MERIDIAN, ...RAID_NORTHWIND],
    changes: [...CHANGES_MERIDIAN, ...CHANGES_NORTHWIND],
    approvals: [...APPROVALS_MERIDIAN, ...APPROVALS_NORTHWIND],
    policies: [...POLICIES_MERIDIAN],
    exceptions: [...GOVERNANCE_EXCEPTIONS_MERIDIAN],
    reviews: [...GOVERNANCE_REVIEWS_MERIDIAN],
    allocations: [...ALLOCATIONS_MERIDIAN, ...ALLOCATIONS_NORTHWIND],
    resourceRequests: [...RESOURCE_REQUESTS_MERIDIAN],
    budgets: [...BUDGETS_MERIDIAN, ...BUDGETS_NORTHWIND],
    actuals: [...ACTUALS_MERIDIAN],
    forecasts: [...FORECASTS_MERIDIAN],
    timesheets: [...TIMESHEETS_MERIDIAN, ...TIMESHEETS_NORTHWIND],
    leaveRequests: [...LEAVE_REQUESTS_MERIDIAN],
    releases: [...RELEASES_MERIDIAN],
    reports: [...SAVED_REPORTS_MERIDIAN],
    integrations: [...INTEGRATIONS_MERIDIAN],
    auditEvents: [...AUDIT_EVENTS_MERIDIAN, ...AUDIT_EVENTS_NORTHWIND],
    activityEvents: [...ACTIVITY_EVENTS_MERIDIAN, ...ACTIVITY_EVENTS_NORTHWIND],
  };
}

export function cloneFixtures(store: DemoFixtureStore): DemoFixtureStore {
  return JSON.parse(JSON.stringify(store));
}
