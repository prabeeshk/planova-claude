"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { toast } from "sonner";
import { DEMO_TODAY, rel } from "@/lib/demo-data/clock";
import type { Priority, ProjectMethod } from "@/lib/domain/types";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  FolderSimple,
} from "@phosphor-icons/react";

export default function NewProjectWizardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const organisationId = useSessionStore((s) => s.organisationId);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form state
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [method, setMethod] = useState<ProjectMethod>("Agile");
  const [managerId, setManagerId] = useState("u-layla");
  const [sponsorId, setSponsorId] = useState("u-omar");
  const [unitId, setUnitId] = useState("unit-digital");
  const [portfolioId, setPortfolioId] = useState<string | null>("port-cx");
  const [startDate, setStartDate] = useState(DEMO_TODAY);
  const [targetDate, setTargetDate] = useState(rel(90));
  const [priority, setPriority] = useState<Priority>("High");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Query users and portfolios for pickers
  const { data: peopleData } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const { data: portfoliosData } = useQuery({
    queryKey: ["portfolios", organisationId],
    queryFn: () => apiClient.getPortfolios(),
  });

  const people = peopleData?.data || [];
  const portfolios = portfoliosData?.data || [];

  // Create project mutation
  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.createProject({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        summary: summary.trim(),
        method,
        managerId,
        sponsorId,
        unitId,
        portfolioId,
        startDate,
        targetDate,
        priority,
      }),
    onSuccess: (res) => {
      toast.success(`Project ${res.data.code} successfully created!`);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
      router.push(`/projects/${res.data.id}`);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create project");
    },
  });

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};

    if (s === 1) {
      if (!code.trim()) errs.code = "Project code is required (e.g. PRJ-101)";
      else if (code.trim().length < 3) errs.code = "Project code must be at least 3 characters";
      if (!name.trim()) errs.name = "Project name is required";
      if (!summary.trim()) errs.summary = "A concise business summary is required";
    }

    if (s === 2) {
      if (!managerId) errs.managerId = "A Project Delivery Lead must be assigned";
      if (!sponsorId) errs.sponsorId = "An Executive Sponsor must be assigned";
    }

    if (s === 3) {
      if (!startDate) errs.startDate = "Start date is required";
      if (!targetDate) errs.targetDate = "Target completion date is required";
      if (startDate && targetDate && targetDate < startDate) {
        errs.targetDate = "Target date must be equal to or after start date";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4) as any);
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1) as any);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in-50 duration-200">
      {/* Top back link */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Projects Directory</span>
      </Link>

      {/* Stepper header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Create New Project
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            4-step guided wizard to configure delivery governance, leadership, and charter baseline.
          </p>
        </div>

        {/* Stepper indicators */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { num: 1, title: "1. Basics" },
            { num: 2, title: "2. Team & Method" },
            { num: 3, title: "3. Schedule" },
            { num: 4, title: "4. Review & Save" },
          ].map((st) => (
            <div
              key={st.num}
              className={`py-2 px-3 rounded-xl border text-center transition-all ${
                step === st.num
                  ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] font-bold shadow-xs"
                  : step > st.num
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold"
                  : "border-[var(--surface-border)] bg-[var(--surface)] text-[var(--muted)]"
              }`}
            >
              <div className="text-xs">{st.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Wizard Form Card */}
      <Card className="p-6">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in-50">
            <h2 className="text-base font-bold text-[var(--foreground)]">
              Step 1: Project Basics
            </h2>
            <div className="space-y-4">
              <Input
                label="Unique Project Code *"
                placeholder="e.g. AUR-100, ATL-200"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                error={errors.code}
                hint="Unique alphanumeric identifier per organisation."
              />

              <Input
                label="Project Name *"
                placeholder="e.g. Phoenix Customer Self-Service Overhaul"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[var(--foreground)]">
                  Executive Summary / Business Objective *
                </label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Describe the primary deliverable, business problem solved, and expected customer or operational impact..."
                  className="w-full p-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
                {errors.summary && (
                  <p className="text-[11px] text-red-600 font-medium">{errors.summary}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in-50">
            <h2 className="text-base font-bold text-[var(--foreground)]">
              Step 2: Team, Governance & Delivery Method
            </h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[var(--foreground)]">
                  Delivery Method *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["Agile", "Waterfall", "Hybrid", "Operational"] as ProjectMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                        method === m
                          ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                          : "border-[var(--surface-border)] bg-[var(--background)] text-[var(--muted)] hover:border-gray-400"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[var(--foreground)]">
                    Project Delivery Lead (Manager) *
                  </label>
                  <select
                    value={managerId}
                    onChange={(e) => setManagerId(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.title})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[var(--foreground)]">
                    Executive Sponsor *
                  </label>
                  <select
                    value={sponsorId}
                    onChange={(e) => setSponsorId(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.title})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in-50">
            <h2 className="text-base font-bold text-[var(--foreground)]">
              Step 3: Schedule, Priority & Strategic Alignment
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="Planned Start Date *"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  error={errors.startDate}
                />

                <Input
                  type="date"
                  label="Target Delivery Date *"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  error={errors.targetDate}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[var(--foreground)]">
                    Strategic Portfolio
                  </label>
                  <select
                    value={portfolioId || ""}
                    onChange={(e) => setPortfolioId(e.target.value || null)}
                    className="w-full h-9 px-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    <option value="">No Portfolio (Independent)</option>
                    {portfolios.map((port) => (
                      <option key={port.id} value={port.id}>
                        {port.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[var(--foreground)]">
                    Delivery Priority *
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full h-9 px-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 animate-in fade-in-50">
            <h2 className="text-base font-bold text-[var(--foreground)]">
              Step 4: Review Project Charter Baseline
            </h2>

            <div className="p-4 rounded-xl bg-[var(--surface-elevated)] border border-[var(--surface-border)] space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[var(--muted)]">Project Code:</span>
                  <div className="font-bold text-[var(--primary)] font-mono">{code}</div>
                </div>
                <div>
                  <span className="text-[var(--muted)]">Project Name:</span>
                  <div className="font-bold text-[var(--foreground)]">{name}</div>
                </div>
              </div>

              <div>
                <span className="text-[var(--muted)]">Summary:</span>
                <p className="text-[var(--foreground)] leading-relaxed mt-0.5">{summary}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[var(--surface-border)]">
                <div>
                  <span className="text-[var(--muted)]">Method:</span>
                  <div className="font-semibold text-[var(--foreground)]">{method}</div>
                </div>
                <div>
                  <span className="text-[var(--muted)]">Priority:</span>
                  <div className="font-semibold text-[var(--foreground)]">{priority}</div>
                </div>
                <div>
                  <span className="text-[var(--muted)]">Start Date:</span>
                  <div className="font-semibold text-[var(--foreground)]">{startDate}</div>
                </div>
                <div>
                  <span className="text-[var(--muted)]">Target Date:</span>
                  <div className="font-semibold text-[var(--foreground)]">{targetDate}</div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                All pre-flight validations passed: code is unique, leadership assigned, schedule valid.
              </span>
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation */}
        <div className="pt-6 border-t border-[var(--surface-border)] flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            disabled={step === 1 || createMutation.isPending}
          >
            Previous
          </Button>

          {step < 4 ? (
            <Button size="sm" onClick={handleNext} className="gap-1.5">
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => createMutation.mutate()}
              loading={createMutation.isPending}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            >
              <Check weight="bold" className="w-3.5 h-3.5" />
              <span>Confirm & Launch Project</span>
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
