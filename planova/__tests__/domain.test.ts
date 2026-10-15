import { describe, it, expect } from "vitest";
import { deriveRisk, riskScore, severityFromScore, buildMatrix } from "@/lib/domain/risk";
import { toMinor, fromMinor, sumMoney, subtractMoney, percentOf, money } from "@/lib/domain/money";
import {
  canTransition,
  TASK_TRANSITIONS,
  RAID_TRANSITIONS,
  CHANGE_TRANSITIONS,
  PROJECT_TRANSITIONS,
} from "@/lib/domain/transitions";
import {
  evaluate,
  can,
  sessionFor,
  ROLES,
  PERSONAS,
} from "@/lib/access/permissions";

describe("Risk Matrix & Severity Calculations", () => {
  it("calculates probability × impact accurately", () => {
    expect(riskScore(1, 1)).toBe(1);
    expect(riskScore(3, 4)).toBe(12);
    expect(riskScore(5, 5)).toBe(25);
  });

  it("clamps out-of-range probability and impact values between 1 and 5", () => {
    expect(riskScore(0, 10)).toBe(5); // 1 * 5
    expect(riskScore(-2, 7)).toBe(5); // 1 * 5
  });

  it("determines correct severity based on policy thresholds", () => {
    // Thresholds: critical >= 15, high >= 10, medium >= 5, else low
    expect(severityFromScore(25)).toBe("Critical");
    expect(severityFromScore(15)).toBe("Critical");
    expect(severityFromScore(12)).toBe("High");
    expect(severityFromScore(10)).toBe("High");
    expect(severityFromScore(6)).toBe("Medium");
    expect(severityFromScore(5)).toBe("Medium");
    expect(severityFromScore(4)).toBe("Low");
    expect(severityFromScore(1)).toBe("Low");
  });

  it("derives combined score and severity via deriveRisk", () => {
    const res = deriveRisk(4, 4); // 16
    expect(res.score).toBe(16);
    expect(res.severity).toBe("Critical");

    const lowRes = deriveRisk(1, 2); // 2
    expect(lowRes.score).toBe(2);
    expect(lowRes.severity).toBe("Low");
  });

  it("builds a full 5x5 matrix with 25 cells", () => {
    const matrix = buildMatrix();
    expect(matrix.length).toBe(5);
    expect(matrix[0].length).toBe(5);
    const totalCells = matrix.flat().length;
    expect(totalCells).toBe(25);
    expect(matrix[0][0].probability).toBe(5);
    expect(matrix[0][4].score).toBe(25);
  });
});

describe("Decimal Precision & Money Arithmetic", () => {
  it("converts decimal strings to minor integer units safely", () => {
    expect(toMinor("100.50")).toBe(10050n);
    expect(toMinor("0.05")).toBe(5n);
    expect(toMinor("-250.75")).toBe(-25075n);
  });

  it("converts minor units back to 2-decimal formatted strings", () => {
    expect(fromMinor(10050n)).toBe("100.50");
    expect(fromMinor(5n)).toBe("0.05");
    expect(fromMinor(-25075n)).toBe("-250.75");
  });

  it("adds and subtracts money amounts without float drift", () => {
    const m1 = money("1000000.10", "AED");
    const m2 = money("2000000.20", "AED");
    const total = sumMoney([m1, m2], "AED");
    expect(total.amount).toBe("3000000.30");

    const diff = subtractMoney(total, m1);
    expect(diff.amount).toBe("2000000.20");
  });

  it("throws on currency mismatch", () => {
    const m1 = money("100.00", "AED");
    const m2 = money("100.00", "USD");
    expect(() => sumMoney([m1, m2], "AED")).toThrow("Currency mismatch");
  });

  it("calculates percentage accurately", () => {
    const part = money("25.00", "AED");
    const whole = money("100.00", "AED");
    expect(percentOf(part, whole)).toBe(25);
  });
});

describe("State Machine Legal Transitions", () => {
  it("allows legal task transitions and blocks invalid ones", () => {
    expect(canTransition(TASK_TRANSITIONS, "Not Started", "In Progress")).toBe(true);
    expect(canTransition(TASK_TRANSITIONS, "In Progress", "Completed")).toBe(true);
    expect(canTransition(TASK_TRANSITIONS, "Not Started", "Completed")).toBe(false);
  });

  it("allows legal RAID transitions", () => {
    expect(canTransition(RAID_TRANSITIONS, "Draft", "Open")).toBe(true);
    expect(canTransition(RAID_TRANSITIONS, "Open", "Escalated")).toBe(true);
    expect(canTransition(RAID_TRANSITIONS, "Resolved", "Closed")).toBe(true);
    expect(canTransition(RAID_TRANSITIONS, "Closed", "Open")).toBe(false);
  });

  it("allows legal Change Request workflow transitions", () => {
    expect(canTransition(CHANGE_TRANSITIONS, "Draft", "Assessing")).toBe(true);
    expect(canTransition(CHANGE_TRANSITIONS, "Assessing", "Ready for Approval")).toBe(true);
    expect(canTransition(CHANGE_TRANSITIONS, "Ready for Approval", "In Approval")).toBe(true);
    expect(canTransition(CHANGE_TRANSITIONS, "In Approval", "Approved")).toBe(true);
    expect(canTransition(CHANGE_TRANSITIONS, "Draft", "Approved")).toBe(false);
  });

  it("allows legal Project lifecycle transitions", () => {
    expect(canTransition(PROJECT_TRANSITIONS, "Draft", "Proposed")).toBe(true);
    expect(canTransition(PROJECT_TRANSITIONS, "Proposed", "Active")).toBe(true);
    expect(canTransition(PROJECT_TRANSITIONS, "Active", "Completed")).toBe(true);
    expect(canTransition(PROJECT_TRANSITIONS, "Completed", "Archived")).toBe(true);
    expect(canTransition(PROJECT_TRANSITIONS, "Archived", "Active")).toBe(false);
  });
});

describe("RBAC Permissions Evaluator & Scopes", () => {
  it("grants Project Manager access to project edit and forecast edit", () => {
    const evProjectEdit = evaluate("PROJECT_MANAGER", "project.edit");
    expect(evProjectEdit.allowed).toBe(true);
    expect(evProjectEdit.scope).toBe("PROJECT");

    const evForecast = evaluate("PROJECT_MANAGER", "forecast.edit");
    expect(evForecast.allowed).toBe(true);
  });

  it("denies Team Member cost.view capability", () => {
    const evCost = evaluate("TEAM_MEMBER", "cost.view");
    expect(evCost.allowed).toBe(false);
    expect(evCost.reason).toContain("has no grant");
  });

  it("grants Finance Controller cost.view and budget.edit at ORGANISATION scope", () => {
    const evCost = evaluate("FINANCE_CONTROLLER", "cost.view");
    expect(evCost.allowed).toBe(true);
    expect(evCost.scope).toBe("ORGANISATION");

    const evBudget = evaluate("FINANCE_CONTROLLER", "budget.edit");
    expect(evBudget.allowed).toBe(true);
  });

  it("grants Platform Admin user and role management capabilities", () => {
    const evUser = evaluate("PLATFORM_ADMIN", "user.manage");
    expect(evUser.allowed).toBe(true);

    const evRole = evaluate("PLATFORM_ADMIN", "role.manage");
    expect(evRole.allowed).toBe(true);
  });

  it("correctly resolves sessions for personas across organisations", () => {
    const sessionMeridian = sessionFor("pm", "org-meridian");
    expect(sessionMeridian.userId).toBe("u-layla");
    expect(sessionMeridian.roleCode).toBe("PROJECT_MANAGER");

    const sessionNorthwind = sessionFor("pm", "org-northwind");
    expect(sessionNorthwind.userId).toBe("nw-u-ines");
  });

  it("evaluates can helper accurately", () => {
    const session = sessionFor("finance", "org-meridian");
    expect(can(session, "cost.view")).toBe(true);
    expect(can(session, "budget.edit")).toBe(true);

    const memberSession = sessionFor("member", "org-meridian");
    expect(can(memberSession, "cost.view")).toBe(false);
  });
});
