import type {
  ID,
  Project,
  Task,
  TaskStatus,
  Milestone,
  RaidItem,
  RaidStatus,
  ChangeRequest,
  ChangeImpact,
  ChangeStatus,
  ApprovalRequest,
  DecisionOutcome,
  ResourceAllocation,
  ResourceRequest,
  Budget,
  BudgetVersion,
  CostCategory,
  ActualCost,
  ForecastLine,
  Timesheet,
  TimeEntry,
  LeaveRequest,
  Release,
  ReleaseStatus,
  Organisation,
  SavedReport,
  Notification,
  AuditEvent,
  ActivityEvent,
  User,
  Portfolio,
  Program,
  StrategicObjective,
  GovernanceReview,
  GovernanceException,
  Policy,
  Health,
  DimensionHealth,
  HealthDimension,
  Priority,
  ProjectMethod,
} from "@/lib/domain/types";
import {
  type ApiListResponse,
  type ApiSingleResponse,
  type FaultInjectionConfig,
  MockApiError,
} from "./types";
import { getFixtureStore, saveFixtureStore, resetFixtureStore } from "./store";
import { correlationId, newId, shortHash } from "@/lib/utils/ids";
import { DEMO_NOW_ISO, DEMO_TODAY, rel, relIso } from "@/lib/demo-data/clock";
import { canTransition, TASK_TRANSITIONS, RAID_TRANSITIONS, CHANGE_TRANSITIONS } from "@/lib/domain/transitions";
import { deriveRisk } from "@/lib/domain/risk";
import { m } from "@/lib/demo-data/builders";

const defaultFaultConfig: FaultInjectionConfig = {
  simulateLatency: true,
  minLatencyMs: 120,
  maxLatencyMs: 320,
  forceErrorStatus: null,
  simulateConflictOnVersionMismatch: true,
};

let activeFaultConfig: FaultInjectionConfig = { ...defaultFaultConfig };

export class MockApiClient {
  private orgId: ID;
  private currentUserId: ID;

  constructor(orgId: ID = "org-meridian", currentUserId: ID = "u-layla") {
    this.orgId = orgId;
    this.currentUserId = currentUserId;
  }

  public setContext(orgId: ID, currentUserId: ID) {
    this.orgId = orgId;
    this.currentUserId = currentUserId;
  }

  public static getFaultConfig(): FaultInjectionConfig {
    return { ...activeFaultConfig };
  }

  public static setFaultConfig(config: Partial<FaultInjectionConfig>) {
    activeFaultConfig = { ...activeFaultConfig, ...config };
  }

  public static resetAllData() {
    resetFixtureStore();
  }

  private async simulateTransport<T>(operation: () => T): Promise<T> {
    const latency = activeFaultConfig.simulateLatency
      ? Math.floor(
          Math.random() * (activeFaultConfig.maxLatencyMs - activeFaultConfig.minLatencyMs + 1) +
            activeFaultConfig.minLatencyMs
        )
      : 0;

    if (latency > 0) {
      await new Promise((resolve) => setTimeout(resolve, latency));
    }

    if (activeFaultConfig.forceErrorStatus) {
      const status = activeFaultConfig.forceErrorStatus;
      const titles: Record<number, string> = {
        403: "Forbidden: Mock Permission Denied",
        404: "Not Found: Mock Resource Missing",
        409: "Conflict: Optimistic Locking RowVersion Collision",
        422: "Unprocessable Entity: Validation Error",
        500: "Internal Server Error: Simulated Fault Injection",
      };
      throw new MockApiError({
        type: `https://planova.corp/errors/${status}`,
        title: titles[status] || "Simulated Error",
        status,
        code: `ERR_${status}`,
        correlationId: correlationId(),
        detail:
          activeFaultConfig.forceErrorMessage ||
          `This error was deterministically triggered by the active demo fault injector (Status ${status}).`,
      });
    }

    return operation();
  }

  private wrapList<T>(data: T[]): ApiListResponse<T> {
    return {
      data,
      pageInfo: {
        nextCursor: null,
        hasMore: false,
        totalCount: data.length,
      },
      meta: {
        demo: true,
        generatedAt: DEMO_NOW_ISO,
        simulatedLatencyMs: activeFaultConfig.simulateLatency ? 150 : 0,
      },
    };
  }

  private wrapSingle<T>(data: T): ApiSingleResponse<T> {
    return {
      data,
      meta: {
        demo: true,
        generatedAt: DEMO_NOW_ISO,
        simulatedLatencyMs: activeFaultConfig.simulateLatency ? 150 : 0,
      },
    };
  }

  private logActivity(projectId: ID | null, verb: string, entityType: any, entityId: ID, summary: string) {
    const store = getFixtureStore();
    const act: ActivityEvent = {
      id: newId("act"),
      organisationId: this.orgId,
      projectId,
      at: new Date().toISOString(),
      actorId: this.currentUserId,
      verb,
      entityType,
      entityId,
      summary,
    };
    store.activityEvents.unshift(act);
    saveFixtureStore(store);
  }

  private logAudit(action: string, entityType: any, entityId: ID, changes: { field: string; before: string | null; after: string | null }[]) {
    const store = getFixtureStore();
    const aud: AuditEvent = {
      id: newId("aud"),
      organisationId: this.orgId,
      at: new Date().toISOString(),
      actorId: this.currentUserId,
      action,
      entityType,
      entityId,
      correlationId: correlationId(),
      changes,
    };
    store.auditEvents.unshift(aud);
    saveFixtureStore(store);
  }

  /* ─────────────── Projects ─────────────── */

  public async getProjects(filter?: { status?: string; portfolioId?: string }): Promise<ApiListResponse<Project>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      let list = store.projects.filter((p) => p.organisationId === this.orgId);
      if (filter?.status) {
        list = list.filter((p) => p.status === filter.status);
      }
      if (filter?.portfolioId) {
        list = list.filter((p) => p.portfolioId === filter.portfolioId);
      }
      return this.wrapList(list);
    });
  }

  public async getProject(id: ID): Promise<ApiSingleResponse<Project>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const proj = store.projects.find((p) => p.id === id && p.organisationId === this.orgId);
      if (!proj) {
        throw new MockApiError({
          type: "https://planova.corp/errors/404",
          title: "Project Not Found",
          status: 404,
          code: "NOT_FOUND",
          correlationId: correlationId(),
          detail: `Project with ID ${id} does not exist in current organisation scope (${this.orgId}).`,
        });
      }
      return this.wrapSingle(proj);
    });
  }

  public async createProject(input: {
    code: string;
    name: string;
    summary: string;
    method: ProjectMethod;
    managerId: ID;
    sponsorId: ID;
    unitId: ID;
    portfolioId: ID | null;
    startDate: string;
    targetDate: string;
    priority: Priority;
  }): Promise<ApiSingleResponse<Project>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      // Check code uniqueness per org
      if (store.projects.some((p) => p.organisationId === this.orgId && p.code.toLowerCase() === input.code.toLowerCase())) {
        throw new MockApiError({
          type: "https://planova.corp/errors/422",
          title: "Project Code Conflict",
          status: 422,
          code: "DUPLICATE_CODE",
          correlationId: correlationId(),
          detail: `A project with code '${input.code}' already exists in organisation ${this.orgId}.`,
        });
      }

      const id = newId("proj");
      const defaultDims: Record<HealthDimension, DimensionHealth> = {
        schedule: { health: "On Track", rationale: "Newly initialized project." },
        cost: { health: "On Track", rationale: "Initial budget baseline awaiting spend." },
        scope: { health: "On Track", rationale: "Scope baseline confirmed in charter." },
        resource: { health: "On Track", rationale: "Staffing assigned per project proposal." },
      };

      const newProj: Project = {
        id,
        organisationId: this.orgId,
        rowVersion: 1,
        createdAt: new Date().toISOString(),
        createdBy: this.currentUserId,
        updatedAt: new Date().toISOString(),
        updatedBy: this.currentUserId,
        code: input.code,
        name: input.name,
        summary: input.summary,
        method: input.method,
        managerId: input.managerId,
        sponsorId: input.sponsorId,
        unitId: input.unitId,
        portfolioId: input.portfolioId,
        programId: null,
        startDate: input.startDate,
        targetDate: input.targetDate,
        forecastDate: input.targetDate,
        status: "Active",
        health: "On Track",
        dimensions: defaultDims,
        progress: 0,
        priority: input.priority,
        coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
        accent: "#6558E8",
        scores: { strategicFit: 85, value: 85, riskExposure: 30 },
        objectiveIds: [],
      };

      store.projects.unshift(newProj);
      // Auto-assign manager as member
      store.projectMembers.push({
        id: newId("pm"),
        organisationId: this.orgId,
        projectId: id,
        userId: input.managerId,
        projectRole: "Project Manager",
        joinedAt: DEMO_TODAY,
      });

      saveFixtureStore(store);
      this.logActivity(id, "created", "Project", id, `created project ${newProj.code}: ${newProj.name}`);
      this.logAudit("PROJECT_CREATE", "Project", id, [
        { field: "code", before: null, after: newProj.code },
        { field: "status", before: null, after: newProj.status },
      ]);
      return this.wrapSingle(newProj);
    });
  }

  public async updateProject(id: ID, updates: Partial<Project>): Promise<ApiSingleResponse<Project>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const proj = store.projects.find((p) => p.id === id && p.organisationId === this.orgId);
      if (!proj) throw new Error("Project not found");

      Object.assign(proj, updates, {
        updatedAt: new Date().toISOString(),
        updatedBy: this.currentUserId,
        rowVersion: proj.rowVersion + 1,
      });

      saveFixtureStore(store);
      this.logActivity(id, "updated settings of", "Project", id, `updated project details`);
      return this.wrapSingle(proj);
    });
  }

  public async archiveProject(id: ID): Promise<ApiSingleResponse<Project>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const proj = store.projects.find((p) => p.id === id && p.organisationId === this.orgId);
      if (!proj) throw new Error("Project not found");

      proj.status = "Archived";
      proj.updatedAt = new Date().toISOString();
      proj.updatedBy = this.currentUserId;
      proj.rowVersion += 1;

      saveFixtureStore(store);
      this.logActivity(id, "archived", "Project", id, `archived project ${proj.code}`);
      this.logAudit("PROJECT_ARCHIVE", "Project", id, [{ field: "status", before: "Active", after: "Archived" }]);
      return this.wrapSingle(proj);
    });
  }

  public async updateProjectHealth(
    id: ID,
    overall: Health,
    dimensions: Record<HealthDimension, DimensionHealth>,
    summary: string
  ): Promise<ApiSingleResponse<Project>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const proj = store.projects.find((p) => p.id === id && p.organisationId === this.orgId);
      if (!proj) throw new Error("Project not found");

      const oldHealth = proj.health;
      proj.health = overall;
      proj.dimensions = dimensions;
      proj.updatedAt = new Date().toISOString();
      proj.updatedBy = this.currentUserId;
      proj.rowVersion += 1;

      saveFixtureStore(store);
      this.logActivity(id, "updated health of", "Project", id, `updated health to ${overall}: ${summary}`);
      this.logAudit("PROJECT_HEALTH_UPDATE", "Project", id, [
        { field: "health", before: oldHealth, after: overall },
      ]);
      return this.wrapSingle(proj);
    });
  }

  /* ─────────────── Tasks & Flow ─────────────── */

  public async getTasks(filter?: { projectId?: string; assigneeId?: string; status?: TaskStatus }): Promise<ApiListResponse<Task>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      let list = store.tasks.filter((t) => t.organisationId === this.orgId);
      if (filter?.projectId) list = list.filter((t) => t.projectId === filter.projectId);
      if (filter?.assigneeId) list = list.filter((t) => t.assigneeId === filter.assigneeId);
      if (filter?.status) list = list.filter((t) => t.status === filter.status);
      return this.wrapList(list);
    });
  }

  public async getTask(id: ID): Promise<ApiSingleResponse<Task>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const task = store.tasks.find((t) => t.id === id && t.organisationId === this.orgId);
      if (!task) {
        throw new MockApiError({
          type: "https://planova.corp/errors/404",
          title: "Task Not Found",
          status: 404,
          code: "NOT_FOUND",
          correlationId: correlationId(),
          detail: `Task ${id} was not found.`,
        });
      }
      return this.wrapSingle(task);
    });
  }

  public async createTask(input: {
    projectId: ID;
    title: string;
    description: string;
    priority: Priority;
    assigneeId: ID | null;
    startDate: string;
    dueDate: string;
    estimateHours: number;
  }): Promise<ApiSingleResponse<Task>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const proj = store.projects.find((p) => p.id === input.projectId);
      const prefix = proj ? proj.code : "TSK";
      const count = store.tasks.filter((t) => t.projectId === input.projectId).length;

      const newTask: Task = {
        id: newId("task"),
        organisationId: this.orgId,
        rowVersion: 1,
        createdAt: new Date().toISOString(),
        createdBy: this.currentUserId,
        updatedAt: new Date().toISOString(),
        updatedBy: this.currentUserId,
        projectId: input.projectId,
        parentTaskId: null,
        milestoneId: null,
        code: `${prefix}-${100 + count + 1}`,
        title: input.title,
        description: input.description,
        status: "Not Started",
        priority: input.priority,
        assigneeId: input.assigneeId,
        startDate: input.startDate,
        dueDate: input.dueDate,
        progress: 0,
        estimateHours: input.estimateHours,
        order: count,
        checklist: [
          { id: newId("chk"), label: "Acceptance criteria clarified", done: false },
          { id: newId("chk"), label: "Implementation and code review", done: false },
          { id: newId("chk"), label: "Testing and sign-off", done: false },
        ],
        completedAt: null,
        completedBy: null,
      };

      store.tasks.unshift(newTask);
      saveFixtureStore(store);
      this.logActivity(input.projectId, "created task", "Task", newTask.id, `created task ${newTask.code}: ${newTask.title}`);
      return this.wrapSingle(newTask);
    });
  }

  public async updateTask(id: ID, updates: Partial<Task>, expectedRowVersion?: number): Promise<ApiSingleResponse<Task>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const task = store.tasks.find((t) => t.id === id && t.organisationId === this.orgId);
      if (!task) throw new Error("Task not found");

      if (expectedRowVersion !== undefined && activeFaultConfig.simulateConflictOnVersionMismatch && task.rowVersion !== expectedRowVersion) {
        throw new MockApiError({
          type: "https://planova.corp/errors/409",
          title: "Conflict Detected",
          status: 409,
          code: "CONCURRENCY_CONFLICT",
          correlationId: correlationId(),
          detail: `Task ${task.code} was modified by another user (expected rowVersion ${expectedRowVersion}, found ${task.rowVersion}). Please reload and re-apply changes.`,
        });
      }

      Object.assign(task, updates, {
        updatedAt: new Date().toISOString(),
        updatedBy: this.currentUserId,
        rowVersion: task.rowVersion + 1,
      });

      saveFixtureStore(store);
      return this.wrapSingle(task);
    });
  }

  public async transitionTask(id: ID, nextStatus: TaskStatus, reason?: string): Promise<ApiSingleResponse<Task>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const task = store.tasks.find((t) => t.id === id && t.organisationId === this.orgId);
      if (!task) throw new Error("Task not found");

      if (!canTransition(TASK_TRANSITIONS, task.status, nextStatus)) {
        throw new MockApiError({
          type: "https://planova.corp/errors/422",
          title: "Illegal Status Transition",
          status: 422,
          code: "ILLEGAL_TRANSITION",
          correlationId: correlationId(),
          detail: `Cannot transition task ${task.code} from '${task.status}' to '${nextStatus}'.`,
        });
      }

      const oldStatus = task.status;
      task.status = nextStatus;
      if (nextStatus === "Completed") {
        task.progress = 100;
        task.completedAt = new Date().toISOString();
        task.completedBy = this.currentUserId;
        task.checklist.forEach((c) => (c.done = true));
      } else if (nextStatus === "In Progress" && task.progress === 0) {
        task.progress = 25;
      }

      if (nextStatus === "Blocked") {
        task.blockedReason = reason || "Blocked pending external dependency";
      } else {
        task.blockedReason = undefined;
      }

      task.updatedAt = new Date().toISOString();
      task.updatedBy = this.currentUserId;
      task.rowVersion += 1;

      saveFixtureStore(store);
      this.logActivity(task.projectId, "moved task to", "Task", task.id, `moved ${task.code} from ${oldStatus} to ${nextStatus}`);
      return this.wrapSingle(task);
    });
  }

  /* ─────────────── Milestones ─────────────── */

  public async getMilestones(filter?: ID | { projectId?: ID }): Promise<ApiListResponse<Milestone>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const projId = typeof filter === "string" ? filter : filter?.projectId;
      let list = store.milestones.filter((m) => m.organisationId === this.orgId);
      if (projId) list = list.filter((m) => m.projectId === projId);
      return this.wrapList(list);
    });
  }

  public async createMilestone(input: {
    projectId: ID;
    name: string;
    targetDate: string;
    ownerId: ID;
    isKey: boolean;
  }): Promise<ApiSingleResponse<Milestone>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const m: Milestone = {
        id: newId("m"),
        organisationId: this.orgId,
        rowVersion: 1,
        createdAt: new Date().toISOString(),
        createdBy: this.currentUserId,
        updatedAt: new Date().toISOString(),
        updatedBy: this.currentUserId,
        projectId: input.projectId,
        name: input.name,
        targetDate: input.targetDate,
        baselineDate: input.targetDate,
        ownerId: input.ownerId,
        isKey: input.isKey,
        achievedAt: null,
      };
      store.milestones.push(m);
      saveFixtureStore(store);
      return this.wrapSingle(m);
    });
  }

  /* ─────────────── RAID ─────────────── */

  public async getRaidItems(filter?: { projectId?: string; type?: string; status?: RaidStatus }): Promise<ApiListResponse<RaidItem>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      let list = store.raidItems.filter((r) => r.organisationId === this.orgId);
      if (filter?.projectId) list = list.filter((r) => r.projectId === filter.projectId);
      if (filter?.type) list = list.filter((r) => r.type === filter.type);
      if (filter?.status) list = list.filter((r) => r.status === filter.status);
      return this.wrapList(list);
    });
  }

  public async getRaidItem(id: ID): Promise<ApiSingleResponse<RaidItem>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const item = store.raidItems.find((r) => r.id === id && r.organisationId === this.orgId);
      if (!item) throw new Error("RAID item not found");
      return this.wrapSingle(item);
    });
  }

  public async createRaidItem(input: {
    projectId: ID;
    type: any;
    title: string;
    description: string;
    probability: number;
    impact: number;
    ownerId: ID;
    response: string;
    reviewDate: string;
    exposureAmount?: string;
  }): Promise<ApiSingleResponse<RaidItem>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const count = store.raidItems.length + 1;
      const { score, severity } = deriveRisk(input.probability, input.impact);
      const org = store.organisations.find((o) => o.id === this.orgId);
      const curr = org?.currencyCode ?? "AED";

      const newItem: RaidItem = {
        id: newId("raid"),
        organisationId: this.orgId,
        rowVersion: 1,
        createdAt: new Date().toISOString(),
        createdBy: this.currentUserId,
        updatedAt: new Date().toISOString(),
        updatedBy: this.currentUserId,
        projectId: input.projectId,
        code: `RAID-${count.toString().padStart(3, "0")}`,
        type: input.type,
        title: input.title,
        description: input.description,
        status: "Open",
        probability: input.probability,
        impact: input.impact,
        score,
        severity,
        ownerId: input.ownerId,
        response: input.response,
        reviewDate: input.reviewDate,
        closureReason: null,
        sourceRaidId: null,
        linkedTaskIds: [],
        exposure: input.exposureAmount ? m(input.exposureAmount, curr) : null,
        reviews: [],
        escalatedAt: null,
      };

      store.raidItems.unshift(newItem);
      saveFixtureStore(store);
      this.logActivity(input.projectId, "raised RAID item", "RaidItem", newItem.id, `raised ${newItem.type} ${newItem.code}: ${newItem.title}`);
      return this.wrapSingle(newItem);
    });
  }

  public async reviewRaidItem(id: ID, note: string, probability: number, impact: number): Promise<ApiSingleResponse<RaidItem>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const item = store.raidItems.find((r) => r.id === id && r.organisationId === this.orgId);
      if (!item) throw new Error("RAID item not found");

      const { score, severity } = deriveRisk(probability, impact);
      item.probability = probability;
      item.impact = impact;
      item.score = score;
      item.severity = severity;
      item.reviewDate = rel(14); // Next review in 2 weeks
      item.reviews.unshift({
        id: newId("rev"),
        reviewerId: this.currentUserId,
        date: DEMO_TODAY,
        note,
        probability,
        impact,
      });
      item.rowVersion += 1;
      item.updatedAt = new Date().toISOString();

      saveFixtureStore(store);
      this.logActivity(item.projectId, "reviewed", "RaidItem", item.id, `conducted risk review on ${item.code} (Score: ${score}, ${severity})`);
      return this.wrapSingle(item);
    });
  }

  public async escalateRaidItem(id: ID, reason: string): Promise<ApiSingleResponse<RaidItem>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const item = store.raidItems.find((r) => r.id === id && r.organisationId === this.orgId);
      if (!item) throw new Error("RAID item not found");

      item.status = "Escalated";
      item.escalatedAt = new Date().toISOString();
      item.rowVersion += 1;
      item.reviews.unshift({
        id: newId("rev"),
        reviewerId: this.currentUserId,
        date: DEMO_TODAY,
        note: `Escalated to Governance: ${reason}`,
        probability: item.probability,
        impact: item.impact,
      });

      saveFixtureStore(store);
      this.logActivity(item.projectId, "escalated", "RaidItem", item.id, `escalated ${item.code} to Governance: ${reason}`);
      this.logAudit("RAID_ESCALATE", "RaidItem", item.id, [{ field: "status", before: "Open", after: "Escalated" }]);
      return this.wrapSingle(item);
    });
  }

  public async closeRaidItem(id: ID, reason: string): Promise<ApiSingleResponse<RaidItem>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const item = store.raidItems.find((r) => r.id === id && r.organisationId === this.orgId);
      if (!item) throw new Error("RAID item not found");

      item.status = "Closed";
      item.closureReason = reason;
      item.rowVersion += 1;
      item.updatedAt = new Date().toISOString();

      saveFixtureStore(store);
      this.logActivity(item.projectId, "closed", "RaidItem", item.id, `closed ${item.code}: ${reason}`);
      return this.wrapSingle(item);
    });
  }

  /* ─────────────── Changes & Approvals ─────────────── */

  public async getChanges(filter?: { projectId?: string }): Promise<ApiListResponse<ChangeRequest>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      let list = store.changes.filter((c) => c.organisationId === this.orgId);
      if (filter?.projectId) list = list.filter((c) => c.projectId === filter.projectId);
      return this.wrapList(list);
    });
  }

  public async getChange(id: ID): Promise<ApiSingleResponse<ChangeRequest>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const chg = store.changes.find((c) => c.id === id && c.organisationId === this.orgId);
      if (!chg) throw new Error("Change not found");
      return this.wrapSingle(chg);
    });
  }

  public async createChange(input: {
    projectId: ID;
    title: string;
    reason: string;
    scope: string;
    scheduleDays: number;
    costAmount: string;
    options?: string;
    linkedRaidIds?: ID[];
  }): Promise<ApiSingleResponse<ChangeRequest>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const project = store.projects.find((p) => p.id === input.projectId);
      const prefix = project ? project.code.slice(0, 3).toUpperCase() : "CHG";
      const count = store.changes.length + 1;
      const org = store.organisations.find((o) => o.id === this.orgId);
      const curr = org?.currencyCode ?? "AED";

      const newChg: ChangeRequest = {
        id: newId("cr"),
        organisationId: this.orgId,
        rowVersion: 1,
        createdAt: new Date().toISOString(),
        createdBy: this.currentUserId,
        updatedAt: new Date().toISOString(),
        updatedBy: this.currentUserId,
        projectId: input.projectId,
        code: `CR-${prefix}-${count.toString().padStart(3, "0")}`,
        title: input.title,
        reason: input.reason,
        status: "Draft",
        requesterId: this.currentUserId,
        currentVersion: 1,
        impact: {
          scope: input.scope,
          scheduleDays: input.scheduleDays,
          cost: { amount: input.costAmount, currencyCode: curr },
          resource: "Team capacity reallocation",
          risk: "Delivery timeline adjustments",
        },
        options: input.options || "Option A: Proceed with requested budget/timeline scope adjustment.",
        evidence: [],
        linkedRaidIds: input.linkedRaidIds || [],
        approvalId: null,
        pendingResubmission: false,
      };

      store.changes.unshift(newChg);
      saveFixtureStore(store);
      this.logActivity(input.projectId, "drafted change", "Change", newChg.id, `drafted Change Request ${newChg.code}: ${newChg.title}`);
      return this.wrapSingle(newChg);
    });
  }

  public async submitChange(id: ID): Promise<ApiSingleResponse<ChangeRequest>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const chg = store.changes.find((c) => c.id === id && c.organisationId === this.orgId);
      if (!chg) throw new Error("Change not found");

      chg.status = "In Approval";
      chg.rowVersion += 1;

      // Create an associated ApprovalRequest if none exists
      if (!chg.approvalId) {
        const approvalId = newId("appr");
        chg.approvalId = approvalId;
        const approval: ApprovalRequest = {
          id: approvalId,
          organisationId: this.orgId,
          rowVersion: 1,
          createdAt: new Date().toISOString(),
          createdBy: this.currentUserId,
          updatedAt: new Date().toISOString(),
          updatedBy: this.currentUserId,
          entityType: "Change",
          entityId: chg.id,
          entityVersion: chg.currentVersion,
          versionHash: shortHash(chg),
          title: `Change Approval: ${chg.code} ${chg.title}`,
          projectId: chg.projectId,
          status: "Pending",
          requesterId: this.currentUserId,
          submittedAt: new Date().toISOString(),
          dueAt: relIso(3, 17),
          stages: [
            {
              id: newId("stg"),
              name: "Governance Approval",
              mode: "serial",
              quorum: 1,
              status: "Active",
              assignments: [
                { id: newId("asg"), assigneeId: "u-omar", delegatedToId: null, status: "Pending" },
              ],
            },
          ],
          decisions: [],
          evidence: chg.evidence,
          snapshot: {
            code: chg.code,
            title: chg.title,
            cost: chg.impact.cost.amount,
          },
        };
        store.approvals.unshift(approval);
      }

      saveFixtureStore(store);
      this.logActivity(chg.projectId, "submitted for approval", "Change", chg.id, `submitted Change Request ${chg.code}`);
      return this.wrapSingle(chg);
    });
  }

  public async updateChange(
    id: ID,
    input: {
      title?: string;
      reason?: string;
      options?: string;
      impact?: Partial<ChangeImpact>;
    }
  ): Promise<ApiSingleResponse<ChangeRequest>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const chg = store.changes.find((c) => c.id === id && c.organisationId === this.orgId);
      if (!chg) throw new Error("Change not found");

      // If change was in approval or ready for approval, edit forks version
      if (chg.status === "In Approval" || chg.status === "Ready for Approval" || chg.status === "Approved") {
        chg.currentVersion += 1;
        chg.pendingResubmission = true;
      }

      if (input.title !== undefined) chg.title = input.title;
      if (input.reason !== undefined) chg.reason = input.reason;
      if (input.options !== undefined) chg.options = input.options;
      if (input.impact) {
        chg.impact = {
          ...chg.impact,
          ...input.impact,
          cost: input.impact.cost ?? chg.impact.cost,
        };
      }

      chg.rowVersion += 1;
      chg.updatedAt = new Date().toISOString();
      chg.updatedBy = this.currentUserId;

      saveFixtureStore(store);
      this.logActivity(chg.projectId, "updated change", "Change", chg.id, `updated Change Request ${chg.code}`);
      return this.wrapSingle(chg);
    });
  }

  public async transitionChange(
    id: ID,
    nextStatus: ChangeStatus,
    reason?: string
  ): Promise<ApiSingleResponse<ChangeRequest>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const chg = store.changes.find((c) => c.id === id && c.organisationId === this.orgId);
      if (!chg) throw new Error("Change not found");

      if (!canTransition(CHANGE_TRANSITIONS, chg.status, nextStatus)) {
        throw new MockApiError({
          type: "https://planova.corp/errors/422",
          title: "Illegal Change Transition",
          status: 422,
          code: "INVALID_TRANSITION",
          correlationId: correlationId(),
          detail: `Cannot transition Change Request ${chg.code} from '${chg.status}' to '${nextStatus}'.`,
        });
      }

      if (nextStatus === "In Approval") {
        return this.submitChange(id);
      }

      const prev = chg.status;
      chg.status = nextStatus;
      chg.rowVersion += 1;
      chg.updatedAt = new Date().toISOString();
      chg.updatedBy = this.currentUserId;
      if (nextStatus === "Assessing") {
        chg.pendingResubmission = false;
      }

      saveFixtureStore(store);
      this.logActivity(
        chg.projectId,
        `transitioned to ${nextStatus}`,
        "Change",
        chg.id,
        reason ? `transitioned ${chg.code} to ${nextStatus}: ${reason}` : `transitioned ${chg.code} to ${nextStatus}`
      );
      return this.wrapSingle(chg);
    });
  }

  public async getApprovals(filter?: { status?: string; entityId?: string }): Promise<ApiListResponse<ApprovalRequest>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      let list = store.approvals.filter((a) => a.organisationId === this.orgId);
      if (filter?.status) list = list.filter((a) => a.status === filter.status);
      if (filter?.entityId) list = list.filter((a) => a.entityId === filter.entityId);
      return this.wrapList(list);
    });
  }

  public async getApproval(id: ID): Promise<ApiSingleResponse<ApprovalRequest>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const app = store.approvals.find((a) => a.id === id && a.organisationId === this.orgId);
      if (!app) throw new Error("Approval not found");
      return this.wrapSingle(app);
    });
  }

  public async decideApproval(id: ID, outcome: DecisionOutcome, comment: string): Promise<ApiSingleResponse<ApprovalRequest>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const app = store.approvals.find((a) => a.id === id && a.organisationId === this.orgId);
      if (!app) throw new Error("Approval not found");

      // Check self-approval rule
      if (app.requesterId === this.currentUserId) {
        throw new MockApiError({
          type: "https://planova.corp/errors/403",
          title: "Self-Approval Prohibited",
          status: 403,
          code: "SELF_APPROVAL_BLOCKED",
          correlationId: correlationId(),
          detail: "Policy POL-DEL-02 strictly prohibits project managers or requesters from approving their own requests.",
        });
      }

      // Check if rejection requires comment
      if (outcome === "Rejected" && (!comment || comment.trim().length < 5)) {
        throw new MockApiError({
          type: "https://planova.corp/errors/422",
          title: "Decision Comment Required",
          status: 422,
          code: "COMMENT_REQUIRED",
          correlationId: correlationId(),
          detail: "A written explanation of at least 5 characters is mandatory when rejecting or requesting rework.",
        });
      }

      const activeStage = app.stages.find((s) => s.status === "Active") || app.stages[0];
      const assignment = activeStage.assignments[0];

      app.status = outcome === "Approved" ? "Approved" : outcome === "Rejected" ? "Rejected" : "In Progress";
      activeStage.status = outcome === "Approved" ? "Approved" : outcome === "Rejected" ? "Rejected" : "Active";
      assignment.status = "Decided";

      // Append-only decision record
      app.decisions.push({
        id: newId("dec"),
        stageId: activeStage.id,
        assignmentId: assignment.id,
        actorId: this.currentUserId,
        outcome,
        comment,
        at: new Date().toISOString(),
      });

      app.rowVersion += 1;
      app.updatedAt = new Date().toISOString();

      // Synchronise the underlying entity if it is a ChangeRequest
      if (app.entityType === "Change") {
        const chg = store.changes.find((c) => c.id === app.entityId);
        if (chg) {
          chg.status = outcome === "Approved" ? "Approved" : "Rejected";
          chg.rowVersion += 1;
        }
      }

      saveFixtureStore(store);
      this.logActivity(app.projectId, `decided (${outcome})`, "Approval", app.id, `${outcome} ${app.title}: "${comment}"`);
      this.logAudit("APPROVAL_DECIDE", "Approval", app.id, [
        { field: "status", before: "Pending", after: app.status },
        { field: "outcome", before: null, after: outcome },
      ]);
      return this.wrapSingle(app);
    });
  }

  public async delegateApproval(id: ID, delegateToId: ID, reason: string): Promise<ApiSingleResponse<ApprovalRequest>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const app = store.approvals.find((a) => a.id === id && a.organisationId === this.orgId);
      if (!app) throw new Error("Approval not found");

      const activeStage = app.stages.find((s) => s.status === "Active") || app.stages[0];
      const assignment = activeStage.assignments[0];
      assignment.delegatedToId = delegateToId;

      app.decisions.push({
        id: newId("dec"),
        stageId: activeStage.id,
        assignmentId: assignment.id,
        actorId: this.currentUserId,
        outcome: "Delegated",
        comment: reason || "Delegated authority for evaluation",
        at: new Date().toISOString(),
      });

      app.rowVersion += 1;
      app.updatedAt = new Date().toISOString();

      saveFixtureStore(store);
      this.logActivity(app.projectId, "delegated approval", "Approval", app.id, `delegated approval to user ${delegateToId}: ${reason}`);
      return this.wrapSingle(app);
    });
  }

  /* ─────────────── Resources & Capacity ─────────────── */

  public async getPeople(): Promise<ApiListResponse<User>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const list = store.users.filter((u) => u.organisationId === this.orgId);
      return this.wrapList(list);
    });
  }

  public async getAllocations(filter?: { projectId?: string; userId?: string }): Promise<ApiListResponse<ResourceAllocation>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      let list = store.allocations.filter((a) => a.organisationId === this.orgId);
      if (filter?.projectId) list = list.filter((a) => a.projectId === filter.projectId);
      if (filter?.userId) list = list.filter((a) => a.userId === filter.userId);
      return this.wrapList(list);
    });
  }

  public async updateAllocation(id: ID, percent: number): Promise<ApiSingleResponse<ResourceAllocation>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const alloc = store.allocations.find((a) => a.id === id && a.organisationId === this.orgId);
      if (!alloc) throw new Error("Allocation not found");

      alloc.percent = percent;
      alloc.rowVersion += 1;
      alloc.updatedAt = new Date().toISOString();

      saveFixtureStore(store);
      return this.wrapSingle(alloc);
    });
  }

  public async createAllocation(input: {
    projectId: ID;
    userId: ID;
    role: string;
    percent: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiSingleResponse<ResourceAllocation>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const newAlloc: ResourceAllocation = {
        id: newId("alloc"),
        organisationId: this.orgId,
        rowVersion: 1,
        createdAt: new Date().toISOString(),
        createdBy: this.currentUserId,
        updatedAt: new Date().toISOString(),
        updatedBy: this.currentUserId,
        projectId: input.projectId,
        userId: input.userId,
        role: input.role,
        percent: input.percent,
        startDate: input.startDate || "2026-10-15",
        endDate: input.endDate || "2026-12-31",
      };

      store.allocations.push(newAlloc);
      saveFixtureStore(store);
      return this.wrapSingle(newAlloc);
    });
  }

  public async deleteAllocation(id: ID): Promise<ApiSingleResponse<{ success: boolean }>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      store.allocations = store.allocations.filter((a) => !(a.id === id && a.organisationId === this.orgId));
      saveFixtureStore(store);
      return this.wrapSingle({ success: true });
    });
  }

  /* ─────────────── Financials ─────────────── */

  public async getBudgets(projectId?: ID): Promise<ApiListResponse<Budget>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      let list = store.budgets.filter((b) => b.organisationId === this.orgId);
      if (projectId) list = list.filter((b) => b.projectId === projectId);
      return this.wrapList(list);
    });
  }

  public async getBudget(id: ID): Promise<ApiSingleResponse<Budget>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const b = store.budgets.find((bg) => bg.id === id && bg.organisationId === this.orgId);
      if (!b) throw new Error("Budget not found");
      return this.wrapSingle(b);
    });
  }

  public async updateBudgetLine(budgetId: ID, lineId: ID, amount: string): Promise<ApiSingleResponse<Budget>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const b = store.budgets.find((bg) => bg.id === budgetId && bg.organisationId === this.orgId);
      if (!b) throw new Error("Budget not found");

      // Find line in draft or current version
      const draftVersion = b.versions.find((v) => v.status === "Draft") || b.versions[0];
      const line = draftVersion.lines.find((l) => l.id === lineId);
      if (line) {
        line.amount = amount;
        // Recalculate total
        const newTotal = draftVersion.lines.reduce((acc, l) => acc + (parseFloat(l.amount) || 0), 0);
        draftVersion.total = { amount: newTotal.toFixed(2), currencyCode: b.currencyCode };
      }
      b.rowVersion += 1;
      b.updatedAt = new Date().toISOString();

      saveFixtureStore(store);
      return this.wrapSingle(b);
    });
  }

  public async getActuals(projectId?: ID): Promise<ApiListResponse<ActualCost>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      let list = store.actuals.filter((a) => a.organisationId === this.orgId);
      if (projectId) list = list.filter((a) => a.projectId === projectId);
      return this.wrapList(list);
    });
  }

  public async getForecasts(projectId?: ID): Promise<ApiListResponse<ForecastLine>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      let list = store.forecasts.filter((f) => f.organisationId === this.orgId);
      if (projectId) list = list.filter((f) => f.projectId === projectId);
      return this.wrapList(list);
    });
  }

  public async updateForecast(id: ID, amount: string): Promise<ApiSingleResponse<ForecastLine>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const line = store.forecasts.find((f) => f.id === id && f.organisationId === this.orgId);
      if (!line) throw new Error("Forecast line not found");
      line.amount = { ...line.amount, amount };
      saveFixtureStore(store);
      return this.wrapSingle(line);
    });
  }

  public async publishForecast(projectId: ID): Promise<ApiListResponse<ForecastLine>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const lines = store.forecasts.filter((f) => f.projectId === projectId && f.organisationId === this.orgId);
      lines.forEach((l) => {
        l.status = "Published";
      });
      saveFixtureStore(store);
      return this.wrapList(lines);
    });
  }

  /* ─────────────── Workforce (Timesheets & Leave) ─────────────── */

  public async getTimesheets(userId?: ID): Promise<ApiListResponse<Timesheet>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      let list = store.timesheets.filter((t) => t.organisationId === this.orgId);
      if (userId) list = list.filter((t) => t.userId === userId);
      return this.wrapList(list);
    });
  }

  public async submitTimesheet(id: ID): Promise<ApiSingleResponse<Timesheet>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const ts = store.timesheets.find((t) => t.id === id && t.organisationId === this.orgId);
      if (!ts) throw new Error("Timesheet not found");

      ts.status = "Submitted";
      ts.rowVersion += 1;
      saveFixtureStore(store);
      return this.wrapSingle(ts);
    });
  }

  public async updateTimesheetEntries(id: ID, entries: TimeEntry[]): Promise<ApiSingleResponse<Timesheet>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const ts = store.timesheets.find((t) => t.id === id && t.organisationId === this.orgId);
      if (!ts) throw new Error("Timesheet not found");
      ts.entries = entries;
      ts.rowVersion += 1;
      ts.updatedAt = new Date().toISOString();
      saveFixtureStore(store);
      return this.wrapSingle(ts);
    });
  }

  public async decideTimesheet(id: ID, outcome: "Approved" | "Rejected", reason?: string): Promise<ApiSingleResponse<Timesheet>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const ts = store.timesheets.find((t) => t.id === id && t.organisationId === this.orgId);
      if (!ts) throw new Error("Timesheet not found");
      ts.status = outcome;
      ts.decidedBy = this.currentUserId;
      ts.rejectionReason = outcome === "Rejected" ? (reason || "Rejected by manager") : null;
      ts.lockedAt = outcome === "Approved" ? new Date().toISOString() : null;
      ts.rowVersion += 1;
      ts.updatedAt = new Date().toISOString();
      saveFixtureStore(store);
      return this.wrapSingle(ts);
    });
  }

  public async reopenTimesheet(id: ID): Promise<ApiSingleResponse<Timesheet>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const ts = store.timesheets.find((t) => t.id === id && t.organisationId === this.orgId);
      if (!ts) throw new Error("Timesheet not found");
      ts.status = "Draft";
      ts.lockedAt = null;
      ts.rejectionReason = null;
      ts.rowVersion += 1;
      ts.updatedAt = new Date().toISOString();
      saveFixtureStore(store);
      return this.wrapSingle(ts);
    });
  }

  public async getLeaveRequests(): Promise<ApiListResponse<LeaveRequest>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const list = store.leaveRequests.filter((l) => l.organisationId === this.orgId);
      return this.wrapList(list);
    });
  }

  public async requestLeave(input: {
    type: any;
    startDate: string;
    endDate: string;
    reason: string;
  }): Promise<ApiSingleResponse<LeaveRequest>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const lr: LeaveRequest = {
        id: newId("leave"),
        organisationId: this.orgId,
        rowVersion: 1,
        createdAt: new Date().toISOString(),
        createdBy: this.currentUserId,
        updatedAt: new Date().toISOString(),
        updatedBy: this.currentUserId,
        userId: this.currentUserId,
        type: input.type,
        startDate: input.startDate,
        endDate: input.endDate,
        reason: input.reason,
        status: "Pending",
        decidedBy: null,
        decisionNote: null,
      };
      store.leaveRequests.unshift(lr);
      saveFixtureStore(store);
      return this.wrapSingle(lr);
    });
  }

  public async decideLeave(id: ID, outcome: "Approved" | "Rejected", reason?: string): Promise<ApiSingleResponse<LeaveRequest>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const lr = store.leaveRequests.find((l) => l.id === id && l.organisationId === this.orgId);
      if (!lr) throw new Error("Leave request not found");
      lr.status = outcome;
      lr.decidedBy = this.currentUserId;
      lr.decisionNote = reason || null;
      lr.rowVersion += 1;
      lr.updatedAt = new Date().toISOString();
      saveFixtureStore(store);
      return this.wrapSingle(lr);
    });
  }

  /* ─────────────── Governance ─────────────── */

  public async getReviews(): Promise<ApiListResponse<GovernanceReview>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const list = store.reviews.filter((r) => r.organisationId === this.orgId);
      return this.wrapList(list);
    });
  }

  public async attestReview(id: ID): Promise<ApiSingleResponse<GovernanceReview>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const rev = store.reviews.find((r) => r.id === id && r.organisationId === this.orgId);
      if (!rev) throw new Error("Review not found");

      rev.status = "Attested";
      rev.attestedBy = this.currentUserId;
      rev.rowVersion += 1;
      rev.updatedAt = new Date().toISOString();

      saveFixtureStore(store);
      this.logActivity(null, "attested review", "Policy", rev.id, `attested governance review: ${rev.name}`);
      return this.wrapSingle(rev);
    });
  }

  public async getExceptions(): Promise<ApiListResponse<GovernanceException>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const list = store.exceptions.filter((e) => e.organisationId === this.orgId);
      return this.wrapList(list);
    });
  }

  public async updateExceptionRemediation(
    id: ID,
    status: GovernanceException["remediationStatus"],
    comment?: string
  ): Promise<ApiSingleResponse<GovernanceException>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const exc = store.exceptions.find((e) => e.id === id && e.organisationId === this.orgId);
      if (!exc) throw new Error("Exception not found");

      exc.remediationStatus = status;
      if (comment) {
        exc.comments.push({
          authorId: this.currentUserId,
          at: new Date().toISOString(),
          body: comment,
        });
      }
      exc.rowVersion += 1;
      exc.updatedAt = new Date().toISOString();

      saveFixtureStore(store);
      this.logActivity(exc.projectId, `updated exception remediation (${status})`, "Policy", exc.id, `updated ${exc.title}`);
      return this.wrapSingle(exc);
    });
  }

  public async getPolicies(): Promise<ApiListResponse<Policy>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const list = store.policies.filter((p) => p.organisationId === this.orgId);
      return this.wrapList(list);
    });
  }

  public async attestPolicy(id: ID): Promise<ApiSingleResponse<Policy>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const pol = store.policies.find((p) => p.id === id && p.organisationId === this.orgId);
      if (!pol) throw new Error("Policy not found");

      if (pol.attestedCount < pol.audienceCount) {
        pol.attestedCount += 1;
      }

      saveFixtureStore(store);
      this.logActivity(null, "attested compliance", "Policy", pol.id, `attested compliance with policy ${pol.code}`);
      return this.wrapSingle(pol);
    });
  }

  /* ─────────────── Portfolio & Releases ─────────────── */

  public async getPortfolios(): Promise<ApiListResponse<Portfolio>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const list = store.portfolios.filter((p) => p.organisationId === this.orgId);
      return this.wrapList(list);
    });
  }

  public async getPortfolio(id: ID): Promise<ApiSingleResponse<Portfolio>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const port = store.portfolios.find((p) => p.id === id && p.organisationId === this.orgId);
      if (!port) throw new Error("Portfolio not found");
      return this.wrapSingle(port);
    });
  }

  public async getPrograms(portfolioId?: ID): Promise<ApiListResponse<Program>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      let list = store.programs.filter((p) => p.organisationId === this.orgId);
      if (portfolioId) list = list.filter((p) => p.portfolioId === portfolioId);
      return this.wrapList(list);
    });
  }

  public async getProgram(id: ID): Promise<ApiSingleResponse<Program>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const prog = store.programs.find((p) => p.id === id && p.organisationId === this.orgId);
      if (!prog) throw new Error("Program not found");
      return this.wrapSingle(prog);
    });
  }

  public async getObjectives(portfolioId?: ID): Promise<ApiListResponse<StrategicObjective>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      let list = store.objectives.filter((o) => o.organisationId === this.orgId);
      if (portfolioId) list = list.filter((o) => o.portfolioId === portfolioId);
      return this.wrapList(list);
    });
  }

  public async getResourceRequests(projectId?: ID): Promise<ApiListResponse<ResourceRequest>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      let list = store.resourceRequests.filter((r) => r.organisationId === this.orgId);
      if (projectId) list = list.filter((r) => r.projectId === projectId);
      return this.wrapList(list);
    });
  }

  public async createResourceRequest(input: {
    projectId: ID;
    role: string;
    skills: string[];
    percent: number;
    startDate: string;
    endDate: string;
    justification: string;
  }): Promise<ApiSingleResponse<ResourceRequest>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const newReq: ResourceRequest = {
        id: newId("req"),
        organisationId: this.orgId,
        rowVersion: 1,
        createdAt: new Date().toISOString(),
        createdBy: this.currentUserId,
        updatedAt: new Date().toISOString(),
        updatedBy: this.currentUserId,
        projectId: input.projectId,
        role: input.role,
        skills: input.skills,
        percent: input.percent,
        startDate: input.startDate,
        endDate: input.endDate,
        status: "Requested",
        requesterId: this.currentUserId,
        justification: input.justification,
      };
      store.resourceRequests.unshift(newReq);
      saveFixtureStore(store);
      return this.wrapSingle(newReq);
    });
  }

  public async getReleases(projectId?: ID): Promise<ApiListResponse<Release>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      let list = store.releases.filter((r) => r.organisationId === this.orgId);
      if (projectId) list = list.filter((r) => r.projectId === projectId);
      return this.wrapList(list);
    });
  }

  /* ─────────────── Audit & Activity ─────────────── */

  public async getAuditEvents(): Promise<ApiListResponse<AuditEvent>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const list = store.auditEvents.filter((a) => a.organisationId === this.orgId);
      return this.wrapList(list);
    });
  }

  public async getActivityEvents(projectId?: ID): Promise<ApiListResponse<ActivityEvent>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      let list = store.activityEvents.filter((a) => a.organisationId === this.orgId);
      if (projectId) list = list.filter((a) => a.projectId === projectId);
      return this.wrapList(list);
    });
  }

  public async getRelease(id: ID): Promise<ApiSingleResponse<Release>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const r = store.releases.find((rel) => rel.id === id && rel.organisationId === this.orgId);
      if (!r) throw new Error("Release not found");
      return this.wrapSingle(r);
    });
  }

  public async updateReleaseGate(
    releaseId: ID,
    gateId: ID,
    status: "Pending" | "Passed" | "Failed" | "Waived",
    evidence?: string
  ): Promise<ApiSingleResponse<Release>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const r = store.releases.find((rel) => rel.id === releaseId && rel.organisationId === this.orgId);
      if (!r) throw new Error("Release not found");
      const gate = r.gates.find((g) => g.id === gateId);
      if (gate) {
        gate.status = status;
        if (evidence) gate.evidence = evidence;
      }
      r.rowVersion += 1;
      r.updatedAt = new Date().toISOString();
      r.trail.unshift({
        at: new Date().toISOString(),
        actorId: this.currentUserId,
        action: `Gate ${gate?.name || gateId} set to ${status}`,
      });
      saveFixtureStore(store);
      return this.wrapSingle(r);
    });
  }

  public async transitionRelease(id: ID, status: ReleaseStatus, note?: string): Promise<ApiSingleResponse<Release>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const r = store.releases.find((rel) => rel.id === id && rel.organisationId === this.orgId);
      if (!r) throw new Error("Release not found");
      r.status = status;
      r.rowVersion += 1;
      r.updatedAt = new Date().toISOString();
      r.trail.unshift({
        at: new Date().toISOString(),
        actorId: this.currentUserId,
        action: `Status transitioned to ${status}${note ? `: ${note}` : ""}`,
      });
      saveFixtureStore(store);
      return this.wrapSingle(r);
    });
  }

  /* ─────────────── Reports & Integrations ─────────────── */

  public async getReports(): Promise<ApiListResponse<SavedReport>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const list = store.reports.filter((r) => r.organisationId === this.orgId);
      return this.wrapList(list);
    });
  }

  public async getReport(id: ID): Promise<ApiSingleResponse<SavedReport>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const r = store.reports.find((rep) => rep.id === id && rep.organisationId === this.orgId);
      if (!r) throw new Error("Report not found");
      return this.wrapSingle(r);
    });
  }

  /* ─────────────── Administration ─────────────── */

  public async getOrganisation(): Promise<ApiSingleResponse<Organisation>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const org = store.organisations.find((o) => o.id === this.orgId) || store.organisations[0];
      return this.wrapSingle(org);
    });
  }

  public async updateOrganisation(updates: Partial<Organisation>): Promise<ApiSingleResponse<Organisation>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const org = store.organisations.find((o) => o.id === this.orgId) || store.organisations[0];
      Object.assign(org, updates);
      saveFixtureStore(store);
      return this.wrapSingle(org);
    });
  }

  public async updateUser(id: ID, updates: Partial<User>): Promise<ApiSingleResponse<User>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const u = store.users.find((user) => user.id === id && user.organisationId === this.orgId);
      if (!u) throw new Error("User not found");
      Object.assign(u, updates);
      u.rowVersion += 1;
      u.updatedAt = new Date().toISOString();
      saveFixtureStore(store);
      return this.wrapSingle(u);
    });
  }

  public async createUser(input: {
    name: string;
    email: string;
    title: string;
    unitId: ID;
    managerId: ID | null;
    active: boolean;
    locale: string;
    timezone: string;
    fte: number;
    weeklyCapacityHours: number;
    skills: string[];
    costRate: { amount: string; currencyCode: string };
  }): Promise<ApiSingleResponse<User>> {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      const newUser: User = {
        ...input,
        id: newId("u"),
        organisationId: this.orgId,
        rowVersion: 1,
        createdAt: new Date().toISOString(),
        createdBy: this.currentUserId,
        updatedAt: new Date().toISOString(),
        updatedBy: this.currentUserId,
      };
      store.users.unshift(newUser);
      saveFixtureStore(store);
      return this.wrapSingle(newUser);
    });
  }

  public async getNotifications(): Promise<ApiListResponse<Notification>> {
    return this.simulateTransport(() => {
      const list: Notification[] = [
        {
          id: "notif-01",
          organisationId: this.orgId,
          userId: this.currentUserId,
          title: "CAB Review Scheduled: REL-AUR-2026.4",
          body: "Aurora Consumer Portal Canary Release is pending Security Architecture Sign-Off before final CAB sign-off.",
          severity: "warning",
          createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          read: false,
          href: "/releases/rel-aur-24",
        },
        {
          id: "notif-02",
          organisationId: this.orgId,
          userId: this.currentUserId,
          title: "Approval Decision Required: CR-ATL-001",
          body: "Budget Amendment for SAP Advisory Cost Variance is awaiting executive quorum decision.",
          severity: "critical",
          createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
          read: false,
          href: "/approvals/appr-chg-02",
        },
        {
          id: "notif-03",
          organisationId: this.orgId,
          userId: this.currentUserId,
          title: "Attestation Signed: CBUAE Stored Value Compliance",
          body: "Quarterly attestation cycle successfully completed by Sofia Rossi with 0 non-remediated exceptions.",
          severity: "success",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
          read: true,
          href: "/governance/policies",
        },
        {
          id: "notif-04",
          organisationId: this.orgId,
          userId: this.currentUserId,
          title: "Weekly Capacity Contention Detected",
          body: "Arjun Mehta has exceeded 120% allocated effort across Aurora and Nimbus sprint streams.",
          severity: "warning",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          read: true,
          href: "/resources/capacity",
        },
        {
          id: "notif-05",
          organisationId: this.orgId,
          userId: this.currentUserId,
          title: "Timesheet Approved for Period W41",
          body: "Your weekly timesheet submission was approved by Daniel Vance.",
          severity: "info",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
          read: true,
          href: "/workforce/timesheets",
        },
      ];
      return this.wrapList(list);
    });
  }

  public async getIntegrations() {
    return this.simulateTransport(() => {
      const store = getFixtureStore();
      return this.wrapList(store.integrations);
    });
  }
}

// Global client singleton
export const apiClient = new MockApiClient();
