import { describe, it, expect, beforeEach } from "vitest";
import { MockApiClient } from "@/lib/mock-api/client";
import { MockApiError } from "@/lib/mock-api/types";

describe("MockApiClient & Enterprise Business Rules", () => {
  let client: MockApiClient;

  beforeEach(() => {
    // Reset fault config and store to ensure clean tests
    MockApiClient.setFaultConfig({
      simulateLatency: false,
      forceErrorStatus: null,
      simulateConflictOnVersionMismatch: true,
    });
    MockApiClient.resetAllData();
    client = new MockApiClient("org-meridian", "u-layla");
  });

  it("retrieves project directory with metadata", async () => {
    const res = await client.getProjects();
    expect(res.data.length).toBeGreaterThan(0);
    expect(res.data.some((p) => p.code === "AUR-100")).toBe(true);
  });

  it("filters projects by status", async () => {
    const res = await client.getProjects({ status: "Active" });
    expect(res.data.every((p) => p.status === "Active")).toBe(true);
  });

  it("creates a new project and retrieves it by ID", async () => {
    const created = await client.createProject({
      code: "PRJ-TEST-999",
      name: "Regulatory Sandboxing Platform",
      summary: "Test sandbox project",
      method: "Hybrid",
      portfolioId: "port-core-bank",
      sponsorId: "u-tariq",
      managerId: "u-layla",
      unitId: "unit-pmo",
      priority: "High",
      startDate: "2026-11-01",
      targetDate: "2027-04-30",
    });

    expect(created.data.id).toBeDefined();
    expect(created.data.name).toBe("Regulatory Sandboxing Platform");

    const fetched = await client.getProject(created.data.id);
    expect(fetched.data.code).toBe("PRJ-TEST-999");
  });

  it("handles legal task transitions and enforces invalid transition blocks", async () => {
    const tasksRes = await client.getTasks({ projectId: "proj-aurora" });
    expect(tasksRes.data.length).toBeGreaterThan(0);
    const notStartedTask = tasksRes.data.find((t) => t.status === "Not Started");
    expect(notStartedTask).toBeDefined();

    if (notStartedTask) {
      // Legal transition: Not Started -> In Progress
      const updated = await client.transitionTask(notStartedTask.id, "In Progress");
      expect(updated.data.status).toBe("In Progress");

      // Test a fresh Not Started task attempting to jump directly to "Completed"
      const anotherNotStarted = tasksRes.data.find((t) => t.status === "Not Started" && t.id !== notStartedTask.id);
      if (anotherNotStarted) {
        await expect(
          client.transitionTask(anotherNotStarted.id, "Completed")
        ).rejects.toThrowError(MockApiError);
      }
    }
  });

  it("strictly enforces POL-DEL-02: Self-Approval Prohibited", async () => {
    const approvalsRes = await client.getApprovals();
    // Find an approval where requester is Layla (u-layla)
    const laylaRequest = approvalsRes.data.find((a) => a.requesterId === "u-layla");
    expect(laylaRequest).toBeDefined();

    if (laylaRequest) {
      // Layla attempts to approve her own request
      client.setContext("org-meridian", "u-layla");
      await expect(
        client.decideApproval(laylaRequest.id, "Approved", "Self-approved changes")
      ).rejects.toThrowError(MockApiError);

      try {
        await client.decideApproval(laylaRequest.id, "Approved", "Self-approved changes");
      } catch (err: any) {
        expect(err.code).toBe("SELF_APPROVAL_BLOCKED");
        expect(err.status).toBe(403);
      }
    }
  });

  it("allows a designated reviewer who is not the requester to approve", async () => {
    const approvalsRes = await client.getApprovals();
    const pendingApp = approvalsRes.data.find(
      (a) => a.status === "Pending" && a.requesterId !== "u-tariq"
    );
    expect(pendingApp).toBeDefined();

    if (pendingApp) {
      // Act as Tariq (sponsor/executive) who is not the requester
      client.setContext("org-meridian", "u-tariq");
      const res = await client.decideApproval(
        pendingApp.id,
        "Approved",
        "Executive approval granted after governance review."
      );
      expect(res.data.status).toBe("Approved");
      expect(res.data.decisions.some((d) => d.actorId === "u-tariq")).toBe(true);
    }
  });

  it("mandates a minimum 5-character reason when rejecting an approval", async () => {
    const approvalsRes = await client.getApprovals();
    const pendingApp = approvalsRes.data.find((a) => a.requesterId !== "u-tariq");
    if (pendingApp) {
      client.setContext("org-meridian", "u-tariq");
      // Reject with short reason (less than 5 chars)
      await expect(
        client.decideApproval(pendingApp.id, "Rejected", "no")
      ).rejects.toThrowError(MockApiError);
    }
  });

  it("handles optimistic locking with rowVersion collision detection", async () => {
    const tasksRes = await client.getTasks({ projectId: "proj-aurora" });
    expect(tasksRes.data.length).toBeGreaterThan(0);
    const targetTask = tasksRes.data[0];

    // Client passes stale rowVersion (targetTask.rowVersion - 1)
    await expect(
      client.updateTask(targetTask.id, { title: "Concurrent Edit Conflict" }, targetTask.rowVersion - 1)
    ).rejects.toThrowError(MockApiError);
  });

  it("supports deterministic fault injection for simulated HTTP status codes", async () => {
    MockApiClient.setFaultConfig({ forceErrorStatus: 500 });
    await expect(client.getProjects()).rejects.toThrowError(MockApiError);

    try {
      await client.getProjects();
    } catch (err: any) {
      expect(err.status).toBe(500);
      expect(err.code).toBe("ERR_500");
    }

    // Clear fault config
    MockApiClient.setFaultConfig({ forceErrorStatus: null });
    const healthyRes = await client.getProjects();
    expect(healthyRes.data.length).toBeGreaterThan(0);
  });

  it("manages timesheets workflow: submit, review, and reopen", async () => {
    const timesheetsRes = await client.getTimesheets();
    expect(timesheetsRes.data.length).toBeGreaterThan(0);
    const ts = timesheetsRes.data[0];

    // Submit timesheet
    const submitted = await client.submitTimesheet(ts.id);
    expect(submitted.data.status).toBe("Submitted");

    // Manager decides timesheet (Approve)
    const approved = await client.decideTimesheet(ts.id, "Approved");
    expect(approved.data.status).toBe("Approved");

    // Reopen for corrections
    const reopened = await client.reopenTimesheet(ts.id);
    expect(reopened.data.status).toBe("Draft");
  });

  it("manages leave requests with approval decisions", async () => {
    const leaveRes = await client.requestLeave({
      type: "Annual",
      startDate: "2026-12-20",
      endDate: "2026-12-25",
      reason: "Year-end family leave",
    });
    expect(leaveRes.data.id).toBeDefined();
    expect(leaveRes.data.status).toBe("Pending");

    // Manager approval
    const approved = await client.decideLeave(leaveRes.data.id, "Approved");
    expect(approved.data.status).toBe("Approved");
  });

  it("updates release deployment gate readiness and transitions release status", async () => {
    const releasesRes = await client.getReleases();
    expect(releasesRes.data.length).toBeGreaterThan(0);
    const rel = releasesRes.data[0];
    const gate = rel.gates[0];

    // Update gate status
    const updatedGate = await client.updateReleaseGate(rel.id, gate.id, "Passed", "Evidence verified in test run");
    const foundGate = updatedGate.data.gates.find((g) => g.id === gate.id);
    expect(foundGate?.status).toBe("Passed");

    // Transition release
    const transitioned = await client.transitionRelease(rel.id, "Approved", "All CAB gates satisfied");
    expect(transitioned.data.status).toBe("Approved");
  });

  it("enforces multi-tenant data isolation between Meridian and Northwind", async () => {
    const meridianClient = new MockApiClient("org-meridian", "u-layla");
    const northwindClient = new MockApiClient("org-northwind", "nw-u-ines");

    const meridianProjects = await meridianClient.getProjects();
    const northwindProjects = await northwindClient.getProjects();

    expect(meridianProjects.data.every((p) => p.organisationId === "org-meridian")).toBe(true);
    expect(northwindProjects.data.every((p) => p.organisationId === "org-northwind")).toBe(true);

    const meridianCodes = meridianProjects.data.map((p) => p.code);
    const northwindCodes = northwindProjects.data.map((p) => p.code);

    // Ensure zero overlap between organizations
    const overlap = meridianCodes.filter((c) => northwindCodes.includes(c));
    expect(overlap.length).toBe(0);
  });
});
