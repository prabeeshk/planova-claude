"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/mock-api/client";
import { useSessionStore } from "@/stores/useSessionStore";
import { sessionFor } from "@/lib/access/permissions";
import { StatusChip } from "@/components/ui/StatusChip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import type { User, ID } from "@/lib/domain/types";
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldWarning,
  CheckCircle,
  XCircle,
  MagnifyingGlass,
  ArrowLeft,
  Lock,
  Pencil,
  Warning,
  Info,
} from "@phosphor-icons/react";

const DEPARTMENTS: Record<string, string> = {
  "unit-exec": "Executive Office",
  "unit-tech": "Technology & Engineering",
  "unit-digital": "Digital Product Delivery",
  "unit-cloud": "Cloud Architecture",
  "unit-gov": "Governance & Compliance",
  "unit-fin": "Finance & Operations",
  "unit-core": "Core Banking",
};

export default function UsersAdministrationPage() {
  const queryClient = useQueryClient();
  const organisationId = useSessionStore((s) => s.organisationId);
  const personaId = useSessionStore((s) => s.personaId);
  const session = sessionFor(personaId, organisationId);

  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [safetyAlertUser, setSafetyAlertUser] = useState<User | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New user form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newUnitId, setNewUnitId] = useState("unit-tech");
  const [newFte, setNewFte] = useState(1.0);
  const [newSkills, setNewSkills] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const { data: peopleRes, isLoading } = useQuery({
    queryKey: ["people", organisationId],
    queryFn: () => apiClient.getPeople(),
  });

  const people = peopleRes?.data || [];

  // Filtered users
  const filteredUsers = useMemo(() => {
    return people.filter((p) => {
      if (departmentFilter !== "all" && p.unitId !== departmentFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [people, departmentFilter, searchQuery]);

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: ID; updates: Partial<User> }) =>
      apiClient.updateUser(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people", organisationId] });
      setEditUser(null);
      showToast("User profile updated successfully.");
    },
  });

  const createMutation = useMutation({
    mutationFn: (input: any) => apiClient.createUser(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people", organisationId] });
      setCreateUserOpen(false);
      setNewName("");
      setNewEmail("");
      setNewTitle("");
      setNewSkills("");
      showToast("Principal created and provisioned in directory.");
    },
  });

  // Emergency Admin count check
  const activeEmergencyAdmins = useMemo(() => {
    return people.filter((p) => p.active && (p.isEmergencyAdmin || p.email.includes("priya")));
  }, [people]);

  const handleToggleActive = (user: User) => {
    // Check if this is the last emergency admin
    const isEmergency = user.isEmergencyAdmin || user.email.includes("priya");
    if (user.active && isEmergency && activeEmergencyAdmins.length <= 1) {
      setSafetyAlertUser(user);
      return;
    }

    const nextStatus = !user.active;
    updateMutation.mutate({
      id: user.id,
      updates: { active: nextStatus },
    });
    showToast(
      nextStatus
        ? `${user.name} reactivated.`
        : `${user.name} deactivated (Historical attribution preserved).`
    );
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    createMutation.mutate({
      name: newName,
      email: newEmail,
      title: newTitle || "Software Engineer",
      unitId: newUnitId,
      managerId: "u-layla",
      active: true,
      locale: "en-AE",
      timezone: "Asia/Dubai",
      fte: newFte,
      weeklyCapacityHours: Math.round(newFte * 40),
      skills: newSkills.split(",").map((s) => s.trim()).filter(Boolean),
      costRate: { amount: "320.00", currencyCode: "AED" },
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
            <Link href="/administration" className="hover:text-foreground transition-colors flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              Administration
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Users & Principals</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="h-7 w-7 text-indigo-500" />
            User Identity Directory
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Enterprise principals, FTE allocations, departmental alignment, and emergency admin safeguards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateUserOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            Create User
          </Button>
        </div>
      </div>

      {/* Attribution Preservation Note */}
      <div className="rounded-xl border border-border bg-card/60 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground space-y-1">
          <span className="font-semibold text-foreground block">
            Attribution Integrity Guarantee
          </span>
          <p>
            Deactivating a user revokes live authentication and session tokens immediately, but permanently preserves
            all historical attributions on deliverables, approvals, timesheet audits, and risk records without cascade
            deletions or broken references.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/30 p-3.5 rounded-xl border border-border">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 sm:w-64">
            <MagnifyingGlass className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Department:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-background border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none"
            >
              <option value="all">All Departments</option>
              {Object.entries(DEPARTMENTS).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs font-mono text-muted-foreground">
          Showing {filteredUsers.length} principals
        </span>
      </div>

      {/* Users Table */}
      <Card className="border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                <th className="py-3 px-4 font-semibold">User Principal</th>
                <th className="py-3 px-3 font-semibold">Job Title</th>
                <th className="py-3 px-3 font-semibold">Department</th>
                <th className="py-3 px-3 font-semibold text-center">FTE</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => {
                const isEmergency = user.isEmergencyAdmin || user.email.includes("priya");

                return (
                  <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {isEmergency && (
                              <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                Emergency Admin
                              </span>
                            )}
                          </div>
                          <span className="text-muted-foreground text-[11px] font-mono">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-muted-foreground">{user.title}</td>

                    <td className="py-3 px-3 font-medium text-foreground">
                      {DEPARTMENTS[user.unitId] || user.unitId}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-semibold text-foreground">
                      {user.fte.toFixed(1)}
                    </td>

                    <td className="py-3 px-3">
                      <StatusChip status={user.active ? "Active" : "Archived"} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => setEditUser(user)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant={user.active ? "outline" : "primary"}
                          size="sm"
                          className={`h-7 px-2 text-xs ${
                            user.active
                              ? "text-rose-400 hover:text-rose-300 border-rose-800"
                              : ""
                          }`}
                          onClick={() => handleToggleActive(user)}
                          disabled={updateMutation.isPending}
                        >
                          {user.active ? "Deactivate" : "Reactivate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Safety Guard Modal: Last Emergency Admin Removal Prevention */}
      <Modal
        open={safetyAlertUser !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setSafetyAlertUser(null);
        }}
        title="Emergency Administrator Safety Guard Triggered"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-lg border border-rose-500/30 bg-rose-950/20 text-rose-200 flex items-start gap-2.5">
            <Warning className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-rose-300 font-semibold block text-sm">
                Policy Enforcement: POL-ADM-01
              </strong>
              <p className="mt-1 leading-relaxed">
                Cannot deactivate <strong>{safetyAlertUser?.name}</strong>. This principal is currently the sole
                registered Emergency Platform Administrator for Meridian Global Enterprises.
              </p>
              <p className="mt-1 text-rose-300/80">
                To prevent accidental institutional lockout, at least one other active user must be granted emergency
                administrator privileges before this account can be deactivated.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-border">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setSafetyAlertUser(null)}
            >
              Acknowledge & Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create User Modal */}
      <Modal
        open={createUserOpen}
        onOpenChange={(open: boolean) => setCreateUserOpen(open)}
        title="Provision New Enterprise Principal"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-foreground block mb-1">Full Name *</label>
            <input
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Fatima Al Hosani"
              className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">Enterprise Email *</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="fatima.alhosani@meridian.corp"
              className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground block mb-1">Job Title *</label>
              <input
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Senior Product Owner"
                className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="font-semibold text-foreground block mb-1">Department *</label>
              <select
                value={newUnitId}
                onChange={(e) => setNewUnitId(e.target.value)}
                className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {Object.entries(DEPARTMENTS).map(([key, name]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-foreground block mb-1">FTE Allocation Ratio</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="1.0"
                value={newFte}
                onChange={(e) => setNewFte(parseFloat(e.target.value) || 1.0)}
                className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-foreground block mb-1">Skills (Comma-separated)</label>
              <input
                value={newSkills}
                onChange={(e) => setNewSkills(e.target.value)}
                placeholder="React, AWS, PMO, Risk"
                className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateUserOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={createMutation.isPending || !newName.trim()}
            >
              Provision User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      {editUser && (
        <Modal
          open={true}
          onOpenChange={(open: boolean) => {
            if (!open) setEditUser(null);
          }}
          title={`Edit Principal: ${editUser.name}`}
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-foreground block mb-1">Job Title</label>
              <input
                value={editUser.title}
                onChange={(e) => setEditUser({ ...editUser, title: e.target.value })}
                className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">Department</label>
              <select
                value={editUser.unitId}
                onChange={(e) => setEditUser({ ...editUser, unitId: e.target.value })}
                className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {Object.entries(DEPARTMENTS).map(([key, name]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">FTE Commitment</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="1.0"
                value={editUser.fte}
                onChange={(e) =>
                  setEditUser({ ...editUser, fte: parseFloat(e.target.value) || 1.0 })
                }
                className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditUser(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  updateMutation.mutate({
                    id: editUser.id,
                    updates: {
                      title: editUser.title,
                      unitId: editUser.unitId,
                      fte: editUser.fte,
                    },
                  });
                }}
                disabled={updateMutation.isPending}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
