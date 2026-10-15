"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { sessionFor } from "@/lib/access/permissions";
import { StatusChip } from "@/components/ui/StatusChip";
import { PriorityPill } from "@/components/ui/PriorityPill";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/formatting/format";
import type { Release, ReleaseGate, ReleaseStatus } from "@/lib/domain/types";
import {
  RocketLaunch,
  CheckCircle,
  XCircle,
  Warning,
  Clock,
  ShieldCheck,
  ArrowLeft,
  CheckSquare,
  Flame,
  ChatCircleText,
  User,
  GitCommit,
  Check,
} from "@phosphor-icons/react";

export default function ReleaseDetailPage() {
  const params = useParams();
  const releaseId = params.releaseId as string;
  const queryClient = useQueryClient();

  const organisationId = useSessionStore((s) => s.organisationId);
  const personaId = useSessionStore((s) => s.personaId);
  const session = sessionFor(personaId, organisationId);

  const [gateModalOpen, setGateModalOpen] = useState(false);
  const [selectedGate, setSelectedGate] = useState<ReleaseGate | null>(null);
  const [gateStatus, setGateStatus] = useState<"Pending" | "Passed" | "Failed" | "Waived">("Passed");
  const [gateEvidence, setGateEvidence] = useState("");

  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const { data: releaseRes, isLoading } = useQuery({
    queryKey: ["release", releaseId, organisationId],
    queryFn: () => apiClient.getRelease(releaseId),
  });

  const { data: projectsRes } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const release = releaseRes?.data;
  const projects = projectsRes?.data || [];
  const people = peopleRes?.data || [];

  const project = projects.find((p) => p.id === release?.projectId);
  const owner = people.find((p) => p.id === release?.ownerId);

  // Mutations
  const updateGateMutation = useMutation({
    mutationFn: ({ gateId, status, evidence }: { gateId: string; status: any; evidence?: string }) =>
      apiClient.updateReleaseGate(releaseId, gateId, status, evidence),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["release", releaseId, organisationId] });
      queryClient.invalidateQueries({ queryKey: ["releases", organisationId] });
      setGateModalOpen(false);
      showToast("Release gate verification updated.");
    },
  });

  const transitionMutation = useMutation({
    mutationFn: ({ status, note }: { status: ReleaseStatus; note?: string }) =>
      apiClient.transitionRelease(releaseId, status, note),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["release", releaseId, organisationId] });
      queryClient.invalidateQueries({ queryKey: ["releases", organisationId] });
      showToast(`Release transitioned to ${vars.status}.`);
    },
  });

  if (isLoading || !release) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        <div className="h-12 w-96 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  // Gates logic
  const requiredGates = release.gates.filter((g) => g.required);
  const incompleteRequiredGates = requiredGates.filter((g) => g.status !== "Passed" && g.status !== "Waived");
  const canApprove = incompleteRequiredGates.length === 0;

  const passedCount = release.gates.filter((g) => g.status === "Passed").length;
  const totalGates = release.gates.length;

  return (
    <div className="space-y-8 pb-16">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-emerald-900 border border-emerald-700 px-4 py-3 text-sm text-emerald-100 shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb & Navigation */}
      <div>
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <Link href="/releases" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Releases
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium font-mono">{release.code}</span>
        </nav>

        {/* Release Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded border border-primary/20">
                {release.code}
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{release.name}</h1>
              <StatusChip status={release.status} />
              <PriorityPill priority={release.riskLevel} />
              {release.emergency && (
                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30">
                  <Flame className="h-3.5 w-3.5" /> Emergency Release
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 flex-wrap">
              <span>
                Project:{" "}
                <Link
                  href={`/projects/${project?.id}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {project?.name || release.projectId}
                </Link>
              </span>
              <span>•</span>
              <span>
                Release Owner: <strong className="text-foreground">{owner?.name || release.ownerId}</strong>
              </span>
              <span>•</span>
              <span>
                Window:{" "}
                <strong className="text-foreground font-mono">
                  {formatDate(release.windowStart)} &rarr; {formatDate(release.windowEnd)}
                </strong>
              </span>
            </div>
          </div>

          {/* Action Transitions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {release.status === "Planned" && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => transitionMutation.mutate({ status: "In Review" })}
                disabled={transitionMutation.isPending}
              >
                Submit for CAB Review
              </Button>
            )}

            {release.status === "In Review" && (
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => transitionMutation.mutate({ status: "Approved" })}
                  disabled={!canApprove || transitionMutation.isPending}
                  title={!canApprove ? "All required governance gates must be Passed or Waived" : undefined}
                >
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  Approve for Deployment
                </Button>

                {!release.emergency && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-400 hover:text-rose-300 border-rose-800"
                    onClick={() => setEmergencyModalOpen(true)}
                  >
                    <Flame className="h-4 w-4 mr-1" />
                    Declare Emergency
                  </Button>
                )}
              </div>
            )}

            {release.status === "Approved" && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => transitionMutation.mutate({ status: "In Progress" })}
                disabled={transitionMutation.isPending}
              >
                <RocketLaunch className="h-4 w-4 mr-1.5" />
                Initiate Deployment Run
              </Button>
            )}

            {release.status === "In Progress" && (
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => transitionMutation.mutate({ status: "Completed", note: "Production smoke test passed" })}
                  disabled={transitionMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-1.5" />
                  Mark Completed
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-rose-400 hover:text-rose-300"
                  onClick={() => transitionMutation.mutate({ status: "Failed", note: "Rollback triggered due to health check timeout" })}
                  disabled={transitionMutation.isPending}
                >
                  Mark Failed (Rollback)
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Emergency Notice Banner */}
      {release.emergency && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4 text-rose-200 text-xs space-y-1">
          <div className="flex items-center gap-2 font-semibold text-rose-300 text-sm">
            <Flame className="h-4 w-4 text-rose-400" />
            <span>Emergency Deployment Path Active</span>
          </div>
          <p>
            <strong>Justification:</strong> {release.emergencyReason || "Expedited hotfix clearance."}
          </p>
          <span className="block text-[11px] text-rose-300/80 pt-1">
            Mandatory Retrospective Review is required within 48 hours post-deployment.
          </span>
        </div>
      )}

      {/* Gate Incompletion Blocker Banner */}
      {release.status === "In Review" && !canApprove && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200 text-xs flex items-start gap-3">
          <Warning className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm text-amber-300">CAB Approval Blocked by Gate Status</h4>
            <p className="mt-0.5 text-amber-200/90">
              There {incompleteRequiredGates.length === 1 ? "is 1 required gate" : `are ${incompleteRequiredGates.length} required gates`} still pending verification (
              {incompleteRequiredGates.map((g) => g.name).join(", ")}).
              Enterprise compliance requires all mandatory gates to be verified before final deployment sign-off.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Gates & Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 col): Gates & Deliverable Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Governance Gates Section */}
          <Card className="border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-indigo-500" />
                  <span>CAB Governance Quality Gates</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Verification criteria required before initiating deployment into production.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-foreground">
                {passedCount} / {totalGates} Passed
              </span>
            </div>

            <div className="divide-y divide-border">
              {release.gates.map((gate) => {
                const approver = people.find((p) => p.id === gate.approverId);

                return (
                  <div
                    key={gate.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{gate.name}</span>
                        {gate.required ? (
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30">
                            Required
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                            Optional
                          </span>
                        )}
                        <StatusChip
                          status={
                            gate.status === "Passed"
                              ? "Approved"
                              : gate.status === "Pending"
                              ? "In Review"
                              : gate.status === "Failed"
                              ? "Critical"
                              : "On Track"
                          }
                        />
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Approver: {approver?.name || gate.approverId}</span>
                        {gate.evidence ? (
                          <span className="text-foreground/90 font-mono text-[11px] bg-muted/50 px-2 py-0.5 rounded border border-border">
                            Evidence: {gate.evidence}
                          </span>
                        ) : (
                          <span className="italic text-muted-foreground/60">No evidence attached</span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedGate(gate);
                          setGateStatus(gate.status);
                          setGateEvidence(gate.evidence || "");
                          setGateModalOpen(true);
                        }}
                      >
                        Update Verification
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Deliverables / Scope Items */}
          <Card className="border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-emerald-500" />
              <span>Included Scope Items & Deliverables</span>
            </h3>

            <div className="divide-y divide-border">
              {release.items.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-primary font-medium">{item.id}</span>
                    <span className="text-foreground">{item.title}</span>
                  </div>
                  {item.taskId && (
                    <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      Linked: {item.taskId}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Deployment Dependencies */}
          <Card className="border-border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Upstream Deployment Dependencies</h3>
            <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
              {release.dependencies.map((dep, i) => (
                <li key={i} className="text-foreground/90">
                  {dep}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Right Column (1 col): Decision Trail & Audit Events */}
        <div className="space-y-6">
          <Card className="border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <GitCommit className="h-4 w-4 text-indigo-500" />
              <span>Release Decision & Audit Trail</span>
            </h3>

            <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {release.trail.map((t, i) => {
                const actor = people.find((p) => p.id === t.actorId);

                return (
                  <div key={i} className="flex items-start gap-3 relative pl-6 text-xs">
                    <div className="absolute left-1 top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                    <div className="space-y-0.5">
                      <span className="font-medium text-foreground block">{t.action}</span>
                      <div className="text-[11px] text-muted-foreground">
                        {actor?.name || t.actorId} • {formatDate(t.at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Update Gate Modal */}
      <Modal
        open={gateModalOpen}
        onOpenChange={(open: boolean) => setGateModalOpen(open)}
        title={`Verify Gate: ${selectedGate?.name}`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-foreground block mb-1">Gate Verification Outcome *</label>
            <select
              value={gateStatus}
              onChange={(e) => setGateStatus(e.target.value as any)}
              className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="Passed">Passed (Criteria Verified)</option>
              <option value="Pending">Pending Evidence</option>
              <option value="Waived">Waived (CAB Exception)</option>
              <option value="Failed">Failed (Does Not Meet Standard)</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">Evidence Reference / Audit Note</label>
            <textarea
              rows={3}
              value={gateEvidence}
              onChange={(e) => setGateEvidence(e.target.value)}
              placeholder="e.g. Automated test run report #8490 passed with 100% coverage; signed off by QA lead..."
              className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setGateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={updateGateMutation.isPending || !selectedGate}
              onClick={() => {
                if (selectedGate) {
                  updateGateMutation.mutate({
                    gateId: selectedGate.id,
                    status: gateStatus,
                    evidence: gateEvidence,
                  });
                }
              }}
            >
              Save Verification
            </Button>
          </div>
        </div>
      </Modal>

      {/* Emergency Release Declaration Modal */}
      <Modal
        open={emergencyModalOpen}
        onOpenChange={(open: boolean) => setEmergencyModalOpen(open)}
        title="Declare Emergency Release"
      >
        <div className="space-y-4 text-xs">
          <p className="text-muted-foreground">
            Emergency releases bypass standard CAB lead time but require formal operational justification and
            mandatory retrospective audit review within 48 hours.
          </p>

          <div>
            <label className="font-semibold text-foreground block mb-1">Emergency Justification *</label>
            <textarea
              required
              rows={3}
              value={emergencyReason}
              onChange={(e) => setEmergencyReason(e.target.value)}
              placeholder="e.g. Critical zero-day vulnerability patch or production payment gateway outage..."
              className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEmergencyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white"
              disabled={!emergencyReason.trim() || transitionMutation.isPending}
              onClick={() => {
                setEmergencyModalOpen(false);
                transitionMutation.mutate({
                  status: "In Review",
                  note: `Emergency declared: ${emergencyReason}`,
                });
              }}
            >
              Confirm Emergency Declaration
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
