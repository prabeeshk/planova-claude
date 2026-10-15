/**
 * Mock capability evaluator — VISUAL DEMONSTRATION ONLY.
 * Real enforcement must happen server-side (RBAC + scope evaluation) in a later phase.
 * Client-supplied scope must never be trusted by a future backend.
 */
import type { ID, Project, ProjectMember, Scope } from "@/lib/domain/types";

export const PERMISSIONS = [
  "project.view",
  "project.create",
  "project.edit",
  "project.archive",
  "task.view",
  "task.create",
  "task.edit",
  "milestone.manage",
  "raid.view",
  "raid.create",
  "raid.escalate",
  "raid.close",
  "change.view",
  "change.submit",
  "approval.view",
  "approval.decide",
  "governance.view",
  "governance.manage",
  "resource.view",
  "allocation.manage",
  "budget.view",
  "budget.edit",
  "cost.view",
  "forecast.edit",
  "actual.import",
  "time.enter",
  "time.approve",
  "leave.request",
  "leave.approve",
  "portfolio.view",
  "portfolio.manage",
  "release.view",
  "release.manage",
  "report.run",
  "report.export",
  "audit.view",
  "audit.export",
  "user.manage",
  "role.manage",
  "settings.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export interface RoleGrant {
  permission: Permission;
  scope: Scope;
  effect: "ALLOW" | "DENY";
}

export interface RoleDefinition {
  code: RoleCode;
  name: string;
  description: string;
  grants: RoleGrant[];
}

export type RoleCode =
  | "PROJECT_MANAGER"
  | "TEAM_MEMBER"
  | "SCRUM_MASTER"
  | "GOVERNANCE_ANALYST"
  | "GOVERNANCE_APPROVER"
  | "EXECUTIVE_VIEWER"
  | "RESOURCE_MANAGER"
  | "FINANCE_CONTROLLER"
  | "PLATFORM_ADMIN"
  | "AUDITOR";

const g = (scope: Scope, ...perms: Permission[]): RoleGrant[] =>
  perms.map((permission) => ({ permission, scope, effect: "ALLOW" as const }));

export const ROLES: Record<RoleCode, RoleDefinition> = {
  PROJECT_MANAGER: {
    code: "PROJECT_MANAGER",
    name: "Project Manager",
    description: "Plans and delivers projects they manage; reads organisation-wide project context.",
    grants: [
      ...g("ORGANISATION", "project.view", "project.create", "raid.view", "change.view", "portfolio.view", "release.view", "report.run", "task.view"),
      ...g("PROJECT", "project.edit", "project.archive", "task.create", "task.edit", "milestone.manage", "raid.create", "raid.escalate", "raid.close", "change.submit", "approval.view", "resource.view", "budget.view", "forecast.edit"),
      ...g("SELF", "time.enter", "leave.request"),
    ],
  },
  TEAM_MEMBER: {
    code: "TEAM_MEMBER",
    name: "Team Member",
    description: "Delivers assigned work; sees only projects they belong to. No finance capability.",
    grants: [
      ...g("ASSIGNED", "project.view", "task.view", "raid.view", "release.view", "change.view"),
      ...g("PROJECT", "task.create", "task.edit", "raid.create"),
      ...g("SELF", "time.enter", "leave.request"),
    ],
  },
  SCRUM_MASTER: {
    code: "SCRUM_MASTER",
    name: "Scrum Master",
    description: "Facilitates delivery flow and impediment triage on assigned teams.",
    grants: [
      ...g("ASSIGNED", "project.view", "task.view", "raid.view", "release.view"),
      ...g("PROJECT", "task.create", "task.edit", "raid.create", "raid.escalate"),
      ...g("SELF", "time.enter", "leave.request"),
    ],
  },
  GOVERNANCE_ANALYST: {
    code: "GOVERNANCE_ANALYST",
    name: "Governance Analyst",
    description: "Traces exceptions, runs reviews and challenges health statements.",
    grants: [
      ...g("ORGANISATION", "project.view", "task.view", "raid.view", "raid.escalate", "change.view", "approval.view", "governance.view", "governance.manage", "portfolio.view", "release.view", "report.run", "report.export"),
      ...g("SELF", "time.enter", "leave.request"),
    ],
  },
  GOVERNANCE_APPROVER: {
    code: "GOVERNANCE_APPROVER",
    name: "Governance Approver",
    description: "Decides changes, releases, budgets and critical closures with full evidence.",
    grants: [
      ...g("ORGANISATION", "project.view", "task.view", "raid.view", "change.view", "approval.view", "approval.decide", "governance.view", "budget.view", "portfolio.view", "release.view", "report.run"),
      ...g("SELF", "time.enter", "leave.request"),
    ],
  },
  EXECUTIVE_VIEWER: {
    code: "EXECUTIVE_VIEWER",
    name: "Executive Viewer",
    description: "Strategic read-only lens across portfolios.",
    grants: [
      ...g("ORGANISATION", "project.view", "task.view", "raid.view", "change.view", "portfolio.view", "governance.view", "budget.view", "release.view", "report.run"),
    ],
  },
  RESOURCE_MANAGER: {
    code: "RESOURCE_MANAGER",
    name: "Resource Manager",
    description: "Balances capacity and allocations; approves team time and leave. No cost-rate access.",
    grants: [
      ...g("ORGANISATION", "project.view", "task.view", "resource.view", "allocation.manage", "report.run", "portfolio.view"),
      ...g("TEAM", "time.approve", "leave.approve"),
      ...g("SELF", "time.enter", "leave.request"),
    ],
  },
  FINANCE_CONTROLLER: {
    code: "FINANCE_CONTROLLER",
    name: "Finance Controller",
    description: "Owns budgets, actuals and forecasts including sensitive cost rates.",
    grants: [
      ...g("ORGANISATION", "project.view", "task.view", "budget.view", "budget.edit", "cost.view", "forecast.edit", "actual.import", "portfolio.view", "report.run", "report.export", "resource.view", "approval.view"),
      ...g("SELF", "time.enter", "leave.request"),
    ],
  },
  PLATFORM_ADMIN: {
    code: "PLATFORM_ADMIN",
    name: "Platform Administrator",
    description: "Manages users, roles, grants and organisation settings.",
    grants: [
      ...g("ORGANISATION", "project.view", "user.manage", "role.manage", "settings.manage", "audit.view", "report.run"),
      ...g("SELF", "time.enter", "leave.request"),
    ],
  },
  AUDITOR: {
    code: "AUDITOR",
    name: "Auditor",
    description: "Verifies history and evidence without editing.",
    grants: [
      ...g("ORGANISATION", "project.view", "task.view", "raid.view", "change.view", "approval.view", "governance.view", "budget.view", "audit.view", "audit.export", "release.view", "report.run"),
    ],
  },
};

export type PersonaId =
  | "pm"
  | "member"
  | "governance"
  | "approver"
  | "executive"
  | "resource"
  | "finance"
  | "admin"
  | "auditor";

export interface Persona {
  id: PersonaId;
  label: string;
  roleCode: RoleCode;
  /** User that the persona impersonates in each demo organisation. */
  userIdByOrg: Record<string, ID>;
  blurb: string;
}

export const PERSONAS: Persona[] = [
  { id: "pm", label: "Project Manager", roleCode: "PROJECT_MANAGER", userIdByOrg: { "org-meridian": "u-layla", "org-northwind": "nw-u-ines" }, blurb: "Default lens — owns Aurora and Nimbus." },
  { id: "member", label: "Team Member", roleCode: "TEAM_MEMBER", userIdByOrg: { "org-meridian": "u-arjun", "org-northwind": "nw-u-tomas" }, blurb: "Engineer on Aurora & Nimbus. No finance access." },
  { id: "governance", label: "Governance Analyst", roleCode: "GOVERNANCE_ANALYST", userIdByOrg: { "org-meridian": "u-sofia", "org-northwind": "nw-u-ines" }, blurb: "Reviews exceptions and RAID." },
  { id: "approver", label: "Governance Approver", roleCode: "GOVERNANCE_APPROVER", userIdByOrg: { "org-meridian": "u-omar", "org-northwind": "nw-u-hana" }, blurb: "Has a decision waiting." },
  { id: "executive", label: "Executive Viewer", roleCode: "EXECUTIVE_VIEWER", userIdByOrg: { "org-meridian": "u-catherine", "org-northwind": "nw-u-hana" }, blurb: "Read-only portfolio lens." },
  { id: "resource", label: "Resource Manager", roleCode: "RESOURCE_MANAGER", userIdByOrg: { "org-meridian": "u-daniel", "org-northwind": "nw-u-hana" }, blurb: "Approves time & leave; no cost rates." },
  { id: "finance", label: "Finance Controller", roleCode: "FINANCE_CONTROLLER", userIdByOrg: { "org-meridian": "u-mei", "org-northwind": "nw-u-hana" }, blurb: "Budgets, actuals, forecasts." },
  { id: "admin", label: "Platform Admin", roleCode: "PLATFORM_ADMIN", userIdByOrg: { "org-meridian": "u-priya", "org-northwind": "nw-u-ines" }, blurb: "Users, roles, organisation." },
  { id: "auditor", label: "Auditor", roleCode: "AUDITOR", userIdByOrg: { "org-meridian": "u-henrik", "org-northwind": "nw-u-hana" }, blurb: "Read-only audit evidence." },
];

export function getPersona(id: PersonaId): Persona {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
}

export interface Session {
  personaId: PersonaId;
  organisationId: ID;
  userId: ID;
  roleCode: RoleCode;
}

export function sessionFor(personaId: PersonaId, organisationId: ID): Session {
  const persona = getPersona(personaId);
  return {
    personaId,
    organisationId,
    userId: persona.userIdByOrg[organisationId] ?? Object.values(persona.userIdByOrg)[0],
    roleCode: persona.roleCode,
  };
}

const SCOPE_RANK: Record<Scope, number> = {
  SELF: 1,
  ASSIGNED: 2,
  TEAM: 3,
  PROJECT: 4,
  DEPARTMENT: 5,
  PORTFOLIO: 6,
  ORGANISATION: 7,
};

export interface Evaluation {
  allowed: boolean;
  scope: Scope | null;
  reason: string;
  grants: RoleGrant[];
}

/** Explainable mock evaluation: widest ALLOW scope wins unless an explicit DENY exists. */
export function evaluate(roleCode: RoleCode, permission: Permission, extraGrants: RoleGrant[] = []): Evaluation {
  const role = ROLES[roleCode];
  const grants = [...role.grants, ...extraGrants].filter((gr) => gr.permission === permission);
  if (grants.some((gr) => gr.effect === "DENY")) {
    return { allowed: false, scope: null, reason: `Explicit DENY on ${permission}.`, grants };
  }
  if (grants.length === 0) {
    return { allowed: false, scope: null, reason: `${role.name} has no grant for ${permission}.`, grants };
  }
  const widest = grants.reduce((a, b) => (SCOPE_RANK[b.scope] > SCOPE_RANK[a.scope] ? b : a));
  return {
    allowed: true,
    scope: widest.scope,
    reason: `${role.name} → ${permission} at ${widest.scope} scope.`,
    grants,
  };
}

export function can(session: Session, permission: Permission): boolean {
  return evaluate(session.roleCode, permission).allowed;
}

/** Project-scoped check used by mock repositories. */
export function canOnProject(
  session: Session,
  permission: Permission,
  project: Pick<Project, "id" | "managerId" | "sponsorId">,
  members: Pick<ProjectMember, "projectId" | "userId">[],
): boolean {
  const ev = evaluate(session.roleCode, permission);
  if (!ev.allowed || !ev.scope) return false;
  if (SCOPE_RANK[ev.scope] >= SCOPE_RANK.DEPARTMENT) return true;
  const isManager = project.managerId === session.userId || project.sponsorId === session.userId;
  const isMember = members.some((m) => m.projectId === project.id && m.userId === session.userId);
  if (ev.scope === "PROJECT") return isManager || isMember;
  if (ev.scope === "ASSIGNED" || ev.scope === "TEAM") return isManager || isMember;
  return false;
}

/** Finer check: PROJECT-scope edit rights apply only to projects the user manages. */
export function canEditProject(
  session: Session,
  project: Pick<Project, "id" | "managerId" | "sponsorId">,
  members: Pick<ProjectMember, "projectId" | "userId" | "projectRole">[],
): boolean {
  const ev = evaluate(session.roleCode, "project.edit");
  if (!ev.allowed || !ev.scope) return false;
  if (SCOPE_RANK[ev.scope] >= SCOPE_RANK.DEPARTMENT) return true;
  return project.managerId === session.userId;
}
