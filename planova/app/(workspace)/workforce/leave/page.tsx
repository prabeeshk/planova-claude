"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { sessionFor, can } from "@/lib/access/permissions";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/formatting/format";
import type { LeaveRequest, LeaveType, User, Holiday } from "@/lib/domain/types";
import {
  CalendarBlank,
  CalendarCheck,
  Plus,
  CheckCircle,
  XCircle,
  Warning,
  Lock,
  LockOpen,
  Info,
  Clock,
  AirplaneTilt,
  Sun,
} from "@phosphor-icons/react";

const HOLIDAYS: Holiday[] = [
  { date: "2026-11-30", name: "Commemoration / Martyr's Day" },
  { date: "2026-12-02", name: "UAE National Day (Day 1)" },
  { date: "2026-12-03", name: "UAE National Day (Day 2)" },
  { date: "2027-01-01", name: "New Year's Day" },
  { date: "2027-03-10", name: "Eid Al Fitr (Estimated)" },
];

export default function LeaveManagementPage() {
  const queryClient = useQueryClient();
  const organisationId = useSessionStore((s) => s.organisationId);
  const personaId = useSessionStore((s) => s.personaId);
  const session = sessionFor(personaId, organisationId);

  const canApproveLeave = can(session, "leave.approve");

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingLeaveId, setRejectingLeaveId] = useState<string | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New leave form state
  const [leaveType, setLeaveType] = useState<LeaveType>("Annual");
  const [startDate, setStartDate] = useState("2026-11-15");
  const [endDate, setEndDate] = useState("2026-11-20");
  const [reason, setReason] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const { data: leaveRes } = useQuery({
    queryKey: ["leaveRequests", organisationId],
    queryFn: () => apiClient.getLeaveRequests(),
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const leaveRequests = leaveRes?.data || [];
  const people = peopleRes?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (input: { type: LeaveType; startDate: string; endDate: string; reason: string }) =>
      apiClient.requestLeave(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaveRequests", organisationId] });
      setRequestModalOpen(false);
      setReason("");
      showToast("Leave request submitted for manager review.");
    },
  });

  const decideMutation = useMutation({
    mutationFn: ({ id, outcome, reason }: { id: string; outcome: "Approved" | "Rejected"; reason?: string }) =>
      apiClient.decideLeave(id, outcome, reason),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["leaveRequests", organisationId] });
      setRejectModalOpen(false);
      setDecisionNote("");
      showToast(`Leave request ${vars.outcome.toLowerCase()}.`);
    },
  });

  // Calculate days for request
  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.max(0, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    return isNaN(diff) ? 1 : diff;
  };

  // Overlap warning check for form
  const overlapWarning = useMemo(() => {
    if (!startDate || !endDate) return null;
    const overlaps = leaveRequests.filter(
      (r) =>
        r.status === "Approved" &&
        r.userId !== session.userId &&
        ((startDate >= r.startDate && startDate <= r.endDate) ||
          (endDate >= r.startDate && endDate <= r.endDate))
    );
    if (overlaps.length > 0) {
      const names = overlaps
        .map((r) => people.find((p) => p.id === r.userId)?.name || "Colleague")
        .join(", ");
      return `Potential capacity contention: ${names} already has approved absence in this window.`;
    }
    return null;
  }, [startDate, endDate, leaveRequests, session.userId, people]);

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) return;
    createMutation.mutate({
      type: leaveType,
      startDate,
      endDate,
      reason,
    });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-emerald-900 border border-emerald-700 px-4 py-3 text-sm text-emerald-100 shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/work" className="hover:text-foreground transition-colors">
              My Work
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Leave & Absence</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <AirplaneTilt className="h-7 w-7 text-indigo-500" />
            Leave & Absence Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Submit leave requests, review team absence schedules, and manage statutory holidays.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/workforce/calendar">
            <Button variant="outline" size="sm">
              <CalendarBlank className="h-4 w-4 mr-1.5" />
              Team Calendar
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setRequestModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Request Absence
          </Button>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="rounded-xl border border-border bg-card/60 p-4 flex items-start gap-3">
        <Lock className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground space-y-1">
          <span className="font-semibold text-foreground block">
            Enterprise Privacy Protocol Enforced
          </span>
          <p>
            Private reasons for sick leave, bereavement, or personal time are restricted strictly to the requesting
            employee and their direct authorized approving manager (<code>leave.approve</code>). Peered colleagues
            view absence blocks without private medical or personal disclosures.
          </p>
        </div>
      </div>

      {/* Main Grid: Requests on Left, Corporate Holidays on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leave Requests Table (Col-span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Absence & Leave Register</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Full list of team leave bookings and approvals.
                </p>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                Total: {leaveRequests.length} requests
              </span>
            </div>

            {leaveRequests.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No leave requests filed yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {leaveRequests.map((req) => {
                  const person = people.find((p) => p.id === req.userId);
                  const days = calculateDays(req.startDate, req.endDate);
                  const isSelf = req.userId === session.userId;
                  const canSeePrivateReason = isSelf || canApproveLeave;

                  return (
                    <div
                      key={req.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-muted/20 transition-colors"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">
                            {person?.name || req.userId}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">
                            ({person?.title || "Team Member"})
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                            {req.type}
                          </span>
                          <StatusChip
                            status={
                              req.status === "Approved"
                                ? "Approved"
                                : req.status === "Pending"
                                ? "In Review"
                                : req.status === "Rejected"
                                ? "Critical"
                                : "Cancelled"
                            }
                          />
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            {formatDate(req.startDate)} &rarr; {formatDate(req.endDate)}
                          </span>
                          <span className="font-semibold text-foreground font-mono">
                            {days} working {days === 1 ? "day" : "days"}
                          </span>
                        </div>

                        {/* Private Reason (Restricted) */}
                        <div className="text-xs pt-1">
                          {canSeePrivateReason ? (
                            <p className="text-muted-foreground/90 italic">
                              &ldquo;{req.reason}&rdquo;
                            </p>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground/50 bg-muted/40 px-2 py-0.5 rounded">
                              <Lock className="h-3 w-3" /> [Private Reason Hidden]
                            </span>
                          )}
                        </div>

                        {/* Decision note if present */}
                        {req.decisionNote && (
                          <div className="text-[11px] text-indigo-300 bg-indigo-950/20 px-2.5 py-1 rounded border border-indigo-900/40 mt-1">
                            <strong>Approver Note:</strong> {req.decisionNote}
                          </div>
                        )}
                      </div>

                      {/* Approver Actions */}
                      {canApproveLeave && req.status === "Pending" && (
                        <div className="flex items-center gap-2 shrink-0 pt-1">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              decideMutation.mutate({ id: req.id, outcome: "Approved" })
                            }
                            disabled={decideMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-1 text-emerald-300" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setRejectingLeaveId(req.id);
                              setRejectModalOpen(true);
                            }}
                            disabled={decideMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-1 text-rose-400" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Corporate Statutory Holidays Sidebar (Col-span 1) */}
        <div className="space-y-6">
          <Card className="border-border bg-card p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Sun className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">Statutory Public Holidays</h3>
                <span className="text-[11px] text-muted-foreground">United Arab Emirates (2026-2027)</span>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              {HOLIDAYS.map((h, i) => (
                <div
                  key={i}
                  className="p-3 bg-muted/30 rounded-lg border border-border flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-semibold text-foreground block">{h.name}</span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {formatDate(h.date)}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                    Official Off
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Balance Card */}
          <Card className="border-border bg-card p-5 space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              My Annual Entitlement
            </h4>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-muted/40 rounded-lg border border-border">
                <span className="text-2xl font-bold font-mono text-foreground">30</span>
                <span className="text-[11px] text-muted-foreground block mt-0.5">Total Days</span>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg border border-border">
                <span className="text-2xl font-bold font-mono text-emerald-400">22</span>
                <span className="text-[11px] text-muted-foreground block mt-0.5">Remaining</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Request Leave Modal */}
      <Modal
        open={requestModalOpen}
        onOpenChange={(open: boolean) => setRequestModalOpen(open)}
        title="Request Leave of Absence"
      >
        <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-foreground block mb-1">Leave Type *</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="Annual">Annual Paid Leave</option>
              <option value="Sick">Sick / Medical Leave</option>
              <option value="Study">Study & Professional Development</option>
              <option value="Parental">Parental Leave</option>
              <option value="Unpaid">Unpaid Personal Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground block mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-foreground block mb-1">End Date *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>
          </div>

          {/* Overlap alert warning if detected */}
          {overlapWarning && (
            <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs flex items-start gap-2">
              <Warning className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{overlapWarning}</span>
            </div>
          )}

          <div>
            <label className="font-semibold text-foreground block mb-1">
              Private Reason *
              <span className="text-[10px] text-muted-foreground font-normal ml-1">
                (Strictly restricted to you & your approving manager)
              </span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the purpose of this leave request..."
              className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRequestModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={createMutation.isPending || !reason.trim()}
            >
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reject Leave Modal */}
      <Modal
        open={rejectModalOpen}
        onOpenChange={(open: boolean) => setRejectModalOpen(open)}
        title="Reject Leave Request"
      >
        <div className="space-y-4 text-xs">
          <p className="text-muted-foreground">
            Provide guidance or operational justification for declining this absence request.
          </p>
          <textarea
            required
            rows={3}
            value={decisionNote}
            onChange={(e) => setDecisionNote(e.target.value)}
            placeholder="e.g. Critical release freeze scheduled during this sprint period..."
            className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRejectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!decisionNote.trim() || decideMutation.isPending}
              onClick={() => {
                if (rejectingLeaveId) {
                  decideMutation.mutate({
                    id: rejectingLeaveId,
                    outcome: "Rejected",
                    reason: decisionNote,
                  });
                }
              }}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
