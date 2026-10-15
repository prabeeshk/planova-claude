"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/formatting/format";
import type { Project, ProjectMethod, Priority, ProjectStatus } from "@/lib/domain/types";
import { PROJECT_TRANSITIONS } from "@/lib/domain/transitions";
import { toast } from "sonner";
import {
  GearSix,
  FloppyDisk,
  Archive,
  Warning,
  Lock,
  GitBranch,
  ShieldCheck,
  CheckCircle,
} from "@phosphor-icons/react";

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = params.projectId as string;
  const organisationId = useSessionStore((s) => s.organisationId);

  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [baselineModalOpen, setBaselineModalOpen] = useState(false);
  const [baselineRationale, setBaselineRationale] = useState("");

  const { data: projectRes, isLoading } = useQuery({
    queryKey: ["project", projectId, organisationId],
    queryFn: () => apiClient.getProject(projectId),
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const project = projectRes?.data;
  const people = peopleRes?.data || [];

  // Form state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [method, setMethod] = useState<ProjectMethod>("Agile");
  const [priority, setPriority] = useState<Priority>("High");
  const [status, setStatus] = useState<ProjectStatus>("Active");
  const [managerId, setManagerId] = useState("");
  const [sponsorId, setSponsorId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [formInitialized, setFormInitialized] = useState(false);

  // Initialize once project data loads
  if (project && !formInitialized) {
    setName(project.name);
    setCode(project.code);
    setMethod(project.method);
    setPriority(project.priority);
    setStatus(project.status);
    setManagerId(project.managerId);
    setSponsorId(project.sponsorId);
    setStartDate(project.startDate);
    setTargetDate(project.targetDate);
    setFormInitialized(true);
  }

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<Project>) => apiClient.updateProject(projectId, updates),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project settings saved");
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to update project");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => apiClient.archiveProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project archived");
      router.push("/projects");
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to archive project");
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.error("Name and Code are required");
      return;
    }
    updateMutation.mutate({
      name: name.trim(),
      code: code.trim(),
      method,
      priority,
      status,
      managerId,
      sponsorId,
      startDate,
      targetDate,
    });
  };

  const handleCreateBaseline = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Draft baseline v2.0 created. Submit for governance approval via Change Request.");
    setBaselineModalOpen(false);
    setBaselineRationale("");
  };

  if (!project) return null;

  const legalNextStatuses = PROJECT_TRANSITIONS[project.status] || [];

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      <ProjectHeader project={project} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
              Project Governance & Controls
            </h1>
            <p className="text-xs text-[var(--muted)] mt-1">
              Configure delivery charter, baseline schedule locks, active sponsors, and lifecycle state.
            </p>
          </div>
          <span className="text-xs font-mono font-medium px-2.5 py-1 rounded bg-[var(--surface-raised)] text-[var(--muted)]">
            v{project.rowVersion}
          </span>
        </div>

        {/* Main Settings Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <Card className="p-6 space-y-5">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <GearSix className="w-4 h-4 text-[var(--color-brand)]" />
              <span>Core Charter Details</span>
            </CardTitle>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-[var(--foreground)]">Project Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--foreground)]">Project Code</label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--foreground)]">Delivery Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as ProjectMethod)}
                  className="w-full text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-[var(--foreground)]"
                >
                  <option value="Agile">Agile</option>
                  <option value="Waterfall">Waterfall</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Operational">Operational</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--foreground)]">Priority Tier</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-[var(--foreground)]"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--foreground)]">Lifecycle State</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="w-full text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-[var(--foreground)] font-semibold"
                >
                  <option value={project.status}>{project.status} (Current)</option>
                  {legalNextStatuses.map((s) => (
                    <option key={s} value={s}>
                      Move to {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--foreground)]">Project Manager</label>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="w-full text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-[var(--foreground)]"
                >
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--foreground)]">Executive Sponsor</label>
                <select
                  value={sponsorId}
                  onChange={(e) => setSponsorId(e.target.value)}
                  className="w-full text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-[var(--foreground)]"
                >
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--foreground)]">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-[var(--foreground)] font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--foreground)]">Target Completion Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-[var(--foreground)] font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" disabled={updateMutation.isPending}>
                <FloppyDisk className="w-4 h-4 mr-1.5" />
                Save Charter Settings
              </Button>
            </div>
          </Card>
        </form>

        {/* Baseline Controls */}
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Approved Baseline Version</span>
              </CardTitle>
              <p className="text-xs text-[var(--muted)] mt-1">
                Approved baselines are immutable snapshots. Any baseline modification forks a new draft version.
              </p>
            </div>

            <Button variant="secondary" size="sm" onClick={() => setBaselineModalOpen(true)}>
              <GitBranch className="w-4 h-4 mr-1.5" />
              Fork New Baseline Draft
            </Button>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-raised)]/60 border border-[var(--border)] space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[var(--foreground)]">Baseline v1.0 (Active Official)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                Approved
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[var(--muted)]">
              <div>
                <span className="block text-[10px]">Locked Start:</span>
                <span className="font-mono text-[var(--foreground)] font-medium">{project.startDate}</span>
              </div>
              <div>
                <span className="block text-[10px]">Locked Target:</span>
                <span className="font-mono text-[var(--foreground)] font-medium">{project.targetDate}</span>
              </div>
              <div>
                <span className="block text-[10px]">Locked Cost Envelope:</span>
                <span className="font-mono text-[var(--foreground)] font-medium">3,450,000 AED</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Danger Zone: Archive */}
        <Card className="p-6 border-red-500/20 bg-red-500/5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-red-600 flex items-center gap-2">
                <Archive className="w-4 h-4" />
                <span>Archive Project</span>
              </h3>
              <p className="text-xs text-[var(--muted)] mt-1">
                Move this project to read-only archive state. All tasks, RAID items, and financial logs remain preserved for regulatory auditing.
              </p>
            </div>

            <Button
              variant="secondary"
              className="text-red-600 hover:bg-red-500/10 border-red-500/30"
              onClick={() => setArchiveModalOpen(true)}
              disabled={project.status === "Archived"}
            >
              {project.status === "Archived" ? "Archived" : "Archive Project"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Archive Modal */}
      <Modal
        open={archiveModalOpen}
        onOpenChange={setArchiveModalOpen}
        title={`Archive ${project.code}?`}
        description="This will lock all edits and freeze the project workspace. Historical data remains available in reports."
      >
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={() => setArchiveModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="bg-red-600 hover:bg-red-700"
            disabled={archiveMutation.isPending}
            onClick={() => archiveMutation.mutate()}
          >
            Confirm Archive
          </Button>
        </div>
      </Modal>

      {/* New Baseline Modal */}
      <Modal
        open={baselineModalOpen}
        onOpenChange={setBaselineModalOpen}
        title="Fork New Baseline Draft"
        description="In PLANOVA, official baselines are immutable. Creating an update generates Baseline Draft v2.0 which must be submitted through Change Control."
      >
        <form onSubmit={handleCreateBaseline} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)]">
              Justification for Rebaselining <span className="text-red-500">*</span>
            </label>
            <textarea
              value={baselineRationale}
              onChange={(e) => setBaselineRationale(e.target.value)}
              placeholder="e.g. Schedule adjustment resulting from approved Change Request CR-AUR-001..."
              rows={3}
              required
              className="w-full text-xs rounded-xl bg-[var(--surface-raised)] border border-[var(--border)] p-3 text-[var(--foreground)]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setBaselineModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Draft v2.0
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
