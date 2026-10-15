"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { formatDate } from "@/lib/formatting/format";
import type { ResourceAllocation, ResourceRequest } from "@/lib/domain/types";
import { toast } from "sonner";
import {
  CalendarBlank,
  ArrowLeft,
  Plus,
  Trash,
  PencilSimple,
  Warning,
  CheckCircle,
  FolderSimple,
  User,
  Info,
  Clock,
  Sparkle,
} from "@phosphor-icons/react";

export default function AllocationsPlannerPage() {
  const queryClient = useQueryClient();
  const organisationId = useSessionStore((s) => s.organisationId);

  const [activeTab, setActiveTab] = useState<"allocations" | "requests">("allocations");
  const [newAllocModalOpen, setNewAllocModalOpen] = useState(false);
  const [newReqModalOpen, setNewReqModalOpen] = useState(false);

  // New allocation form
  const [allocProjectId, setAllocProjectId] = useState("");
  const [allocUserId, setAllocUserId] = useState("");
  const [allocRole, setAllocRole] = useState("Full Stack Engineer");
  const [allocPercent, setAllocPercent] = useState(50);
  const [allocStartDate, setAllocStartDate] = useState("2026-10-15");
  const [allocEndDate, setAllocEndDate] = useState("2026-12-31");

  // New resource request form
  const [reqProjectId, setReqProjectId] = useState("");
  const [reqRole, setReqRole] = useState("Cloud Security Engineer");
  const [reqSkills, setReqSkills] = useState("AWS, EKS, Zero Trust");
  const [reqPercent, setReqPercent] = useState(100);
  const [reqStartDate, setReqStartDate] = useState("2026-11-01");
  const [reqEndDate, setReqEndDate] = useState("2027-02-28");
  const [reqJustification, setReqJustification] = useState("");

  const { data: allocationsRes, isLoading: loadingAllocs } = useQuery({
    queryKey: ["allocations", "all", organisationId],
    queryFn: () => apiClient.getAllocations(),
  });

  const { data: requestsRes, isLoading: loadingReqs } = useQuery({
    queryKey: ["resourceRequests", organisationId],
    queryFn: () => apiClient.getResourceRequests(),
  });

  const { data: peopleRes } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const { data: projectsRes } = useQuery({
    queryKey: ["projects", organisationId],
    queryFn: () => apiClient.getProjects(),
  });

  const allocations = allocationsRes?.data || [];
  const requests = requestsRes?.data || [];
  const people = peopleRes?.data || [];
  const projects = projectsRes?.data || [];

  // Compute total committed percent per user
  const userTotalMap: Record<string, number> = {};
  allocations.forEach((a) => {
    userTotalMap[a.userId] = (userTotalMap[a.userId] || 0) + a.percent;
  });

  const updateAllocMutation = useMutation({
    mutationFn: ({ id, percent }: { id: string; percent: number }) =>
      apiClient.updateAllocation(id, percent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
      toast.success("Allocation percentage updated");
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to update allocation");
    },
  });

  const deleteAllocMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteAllocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
      toast.success("Allocation removed");
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to delete allocation");
    },
  });

  const createAllocMutation = useMutation({
    mutationFn: (input: any) => apiClient.createAllocation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
      toast.success("Resource successfully allocated");
      setNewAllocModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to create allocation");
    },
  });

  const createReqMutation = useMutation({
    mutationFn: (input: any) => apiClient.createResourceRequest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resourceRequests"] });
      toast.success("Staffing request raised successfully");
      setNewReqModalOpen(false);
      setReqJustification("");
    },
    onError: (err: any) => {
      toast.error(err.detail || "Failed to create staffing request");
    },
  });

  const handleCreateAlloc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocProjectId || !allocUserId) {
      toast.error("Please select a project and a team member");
      return;
    }
    createAllocMutation.mutate({
      projectId: allocProjectId,
      userId: allocUserId,
      role: allocRole,
      percent: Number(allocPercent),
      startDate: allocStartDate,
      endDate: allocEndDate,
    });
  };

  const handleCreateReq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqProjectId || !reqJustification.trim()) {
      toast.error("Please fill in project and business justification");
      return;
    }
    createReqMutation.mutate({
      projectId: reqProjectId,
      role: reqRole,
      skills: reqSkills.split(",").map((s) => s.trim()).filter(Boolean),
      percent: Number(reqPercent),
      startDate: reqStartDate,
      endDate: reqEndDate,
      justification: reqJustification.trim(),
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/resources" className="hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1">
          <ArrowLeft size={16} />
          Workforce & Capacity
        </Link>
        <span>/</span>
        <span className="text-slate-700 dark:text-slate-300 font-medium">Allocations & Staffing Requests</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarBlank size={26} className="text-purple-500" />
            Time-Grid Allocations & Staffing Requests
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Assign specialists to projects, configure commitment percentages, and request additional squads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setNewReqModalOpen(true)} className="flex items-center gap-1.5">
            <Plus size={16} />
            Raise Staffing Request
          </Button>
          <Button variant="primary" onClick={() => setNewAllocModalOpen(true)} className="flex items-center gap-1.5">
            <Plus size={16} />
            New Allocation
          </Button>
        </div>
      </div>

      {/* Mathematical Capacity Explanation Box */}
      <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-xl flex items-start gap-3 text-xs text-purple-900 dark:text-purple-300">
        <Info size={20} className="shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
        <div className="space-y-1">
          <p className="font-semibold text-sm">How Allocation Percentage Relates to Weekly Available Capacity</p>
          <p className="leading-relaxed text-purple-800/90 dark:text-purple-300/90">
            A <strong>100% allocation</strong> represents a standard 40-hour weekly commitment. <strong>50% allocation = 20 hours/week</strong>. When an individual’s total concurrent project commitments exceed 100%, the system flags an over-allocation contention warning.
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab("allocations")}
          className={`pb-3 px-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "allocations"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          Active Project Allocations ({allocations.length})
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`pb-3 px-3 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "requests"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          Staffing Requests Queue ({requests.length})
        </button>
      </div>

      {/* Tab 1: Allocations Table */}
      {activeTab === "allocations" && (
        <Card className="overflow-x-auto p-4">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-mono uppercase text-slate-500">
                <th className="py-3 px-3">Team Member</th>
                <th className="py-3 px-3">Project</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Timeframe</th>
                <th className="py-3 px-3">Commitment %</th>
                <th className="py-3 px-3">Weekly Hours</th>
                <th className="py-3 px-3">Total Workload</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {allocations.map((a) => {
                const person = people.find((p) => p.id === a.userId);
                const project = projects.find((p) => p.id === a.projectId);
                const totalPct = userTotalMap[a.userId] || a.percent;
                const isOver = totalPct > 100;

                return (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {person?.name || a.userId}
                      </div>
                      <div className="text-xs text-slate-400">{person?.title}</div>
                    </td>

                    <td className="py-3 px-3">
                      {project ? (
                        <Link
                          href={`/projects/${project.id}`}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <FolderSimple size={14} />
                          {project.name}
                        </Link>
                      ) : (
                        <span className="font-mono text-xs">{a.projectId}</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-xs text-slate-700 dark:text-slate-300">
                      {a.role}
                    </td>

                    <td className="py-3 px-3 font-mono text-xs text-slate-500">
                      {formatDate(a.startDate)} to {formatDate(a.endDate)}
                    </td>

                    <td className="py-3 px-3 font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                      <select
                        value={a.percent}
                        onChange={(e) =>
                          updateAllocMutation.mutate({ id: a.id, percent: Number(e.target.value) })
                        }
                        className="py-1 px-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                      >
                        <option value={25}>25% (10h)</option>
                        <option value={50}>50% (20h)</option>
                        <option value={75}>75% (30h)</option>
                        <option value={100}>100% (40h)</option>
                      </select>
                    </td>

                    <td className="py-3 px-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                      {(a.percent * 0.4).toFixed(0)}h / wk
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          isOver
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                        }`}
                      >
                        {totalPct}% total {isOver && "⚠️ Over"}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAllocMutation.mutate(a.id)}
                        disabled={deleteAllocMutation.isPending}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <Trash size={16} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Tab 2: Requests Queue */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <Card className="p-12 text-center text-slate-500">
              No staffing requests currently in queue.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requests.map((req) => {
                const project = projects.find((p) => p.id === req.projectId);
                const requester = people.find((p) => p.id === req.requesterId);

                return (
                  <Card key={req.id} className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-500">{req.id}</span>
                          <StatusChip status={req.status} />
                          <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                            {req.percent}% ({req.percent * 0.4}h/wk)
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mt-1">
                          {req.role}
                        </h3>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded border border-slate-200/60 dark:border-slate-800">
                      &ldquo;{req.justification}&rdquo;
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {req.skills.map((sk, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {project && <span>Project: <strong>{project.name}</strong></span>}
                      <span>Requested by: {requester?.name || req.requesterId}</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* New Allocation Modal */}
      <Modal
        open={newAllocModalOpen}
        onOpenChange={setNewAllocModalOpen}
        title="Assign Team Member to Project"
      >
        <form onSubmit={handleCreateAlloc} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Project <span className="text-rose-500">*</span>
            </label>
            <select
              value={allocProjectId}
              onChange={(e) => setAllocProjectId(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select target project...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Team Member <span className="text-rose-500">*</span>
            </label>
            <select
              value={allocUserId}
              onChange={(e) => setAllocUserId(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select person...</option>
              {people.map((p) => {
                const total = userTotalMap[p.id] || 0;
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.title}) — Current: {total}%
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Role in Project
            </label>
            <Input
              value={allocRole}
              onChange={(e) => setAllocRole(e.target.value)}
              placeholder="E.g. Lead Integration Engineer"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Commitment Percentage
              </label>
              <select
                value={allocPercent}
                onChange={(e) => setAllocPercent(Number(e.target.value))}
                className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100"
              >
                <option value={25}>25% (10h/week)</option>
                <option value={50}>50% (20h/week)</option>
                <option value={75}>75% (30h/week)</option>
                <option value={100}>100% (40h/week)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={allocStartDate}
                onChange={(e) => setAllocStartDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setNewAllocModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createAllocMutation.isPending}>
              {createAllocMutation.isPending ? "Allocating..." : "Confirm Allocation"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Raise Staffing Request Modal */}
      <Modal
        open={newReqModalOpen}
        onOpenChange={setNewReqModalOpen}
        title="Raise Staffing Request to Resource Management"
      >
        <form onSubmit={handleCreateReq} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Project <span className="text-rose-500">*</span>
            </label>
            <select
              value={reqProjectId}
              onChange={(e) => setReqProjectId(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select project needing resource...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Role Required
            </label>
            <Input
              value={reqRole}
              onChange={(e) => setReqRole(e.target.value)}
              placeholder="E.g. Senior Security Pen-Tester"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Key Skills Required (comma-separated)
            </label>
            <Input
              value={reqSkills}
              onChange={(e) => setReqSkills(e.target.value)}
              placeholder="E.g. FIDO2, HSM, OAuth2"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Business Justification <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reqJustification}
              onChange={(e) => setReqJustification(e.target.value)}
              placeholder="Explain deliverables, timeline pressure, or regulatory drivers requiring staffing..."
              rows={3}
              className="w-full text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setNewReqModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={createReqMutation.isPending}>
              {createReqMutation.isPending ? "Submitting..." : "Submit Staffing Request"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
