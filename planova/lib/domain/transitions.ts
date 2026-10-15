import type {
  ApprovalStatus,
  BudgetVersionStatus,
  ChangeStatus,
  ProjectStatus,
  RaidStatus,
  ReleaseStatus,
  TaskStatus,
} from "./types";

/**
 * Explicit state machines. Mock services use these to expose ONLY legal next actions.
 * A future backend must enforce the same rules server-side — these are UI demonstrations.
 */
export type TransitionMap<S extends string> = Readonly<Record<S, readonly S[]>>;

export const PROJECT_TRANSITIONS: TransitionMap<ProjectStatus> = {
  Draft: ["Proposed", "Cancelled"],
  Proposed: ["Active", "Draft", "Cancelled"],
  Active: ["On Hold", "Completed", "Cancelled"],
  "On Hold": ["Active", "Cancelled"],
  Completed: ["Archived"],
  Cancelled: ["Archived"],
  Archived: [],
};

export const TASK_TRANSITIONS: TransitionMap<TaskStatus> = {
  "Not Started": ["In Progress", "Blocked", "Cancelled"],
  "In Progress": ["Blocked", "Completed", "Not Started", "Cancelled"],
  Blocked: ["In Progress", "Cancelled"],
  Completed: ["In Progress"],
  Cancelled: ["Not Started"],
};

export const RAID_TRANSITIONS: TransitionMap<RaidStatus> = {
  Draft: ["Open"],
  Open: ["Monitoring", "Escalated", "Resolved"],
  Monitoring: ["Open", "Escalated", "Resolved"],
  Escalated: ["Monitoring", "Resolved"],
  Resolved: ["Closed", "Open"],
  Closed: [],
};

export const CHANGE_TRANSITIONS: TransitionMap<ChangeStatus> = {
  Draft: ["Assessing", "Withdrawn"],
  Assessing: ["Ready for Approval", "Draft", "Withdrawn"],
  "Ready for Approval": ["In Approval", "Assessing", "Withdrawn"],
  "In Approval": ["Approved", "Rejected", "Withdrawn", "Assessing"],
  Approved: ["Implemented"],
  Rejected: ["Closed", "Assessing"],
  Withdrawn: ["Closed"],
  Implemented: ["Closed"],
  Closed: [],
};

export const APPROVAL_TRANSITIONS: TransitionMap<ApprovalStatus> = {
  Pending: ["In Progress", "Withdrawn", "Expired", "Cancelled"],
  "In Progress": ["Approved", "Rejected", "Withdrawn", "Expired", "Cancelled"],
  Approved: [],
  Rejected: [],
  Withdrawn: [],
  Expired: [],
  Cancelled: [],
};

export const BUDGET_VERSION_TRANSITIONS: TransitionMap<BudgetVersionStatus> = {
  Draft: ["Submitted"],
  Submitted: ["Approved", "Rejected"],
  Approved: ["Superseded"],
  Superseded: [],
  Rejected: [],
};

export const RELEASE_TRANSITIONS: TransitionMap<ReleaseStatus> = {
  Draft: ["Planned", "Cancelled"],
  Planned: ["In Review", "Cancelled"],
  "In Review": ["Approved", "Planned", "Cancelled"],
  Approved: ["In Progress", "Cancelled"],
  "In Progress": ["Completed", "Failed"],
  Completed: [],
  Failed: ["Planned"],
  Cancelled: [],
};

export function canTransition<S extends string>(map: TransitionMap<S>, from: S, to: S): boolean {
  return map[from]?.includes(to) ?? false;
}

export function nextStates<S extends string>(map: TransitionMap<S>, from: S): readonly S[] {
  return map[from] ?? [];
}

/** Transitions that require a written reason. */
export const REASON_REQUIRED = {
  task: ["Blocked", "Cancelled"] as TaskStatus[],
  raid: ["Escalated", "Closed"] as RaidStatus[],
  change: ["Withdrawn", "Rejected"] as ChangeStatus[],
};
