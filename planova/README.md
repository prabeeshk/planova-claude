# PLANOVA — Enterprise Project Delivery & Portfolio Governance Platform

> **A mission-critical enterprise web platform for project delivery, portfolio governance, financial stewardship, workforce capacity, and compliance automation.**  
> Built for highly regulated organizations adhering to rigorous regulatory frameworks, audit trails, multi-tenant boundaries, and state-machine business workflows.

---

## 1. Executive Summary

**PLANOVA** is a complete, enterprise-grade project delivery and portfolio governance platform built with **Next.js 15 App Router**, **React 19**, **Tailwind CSS v4**, and **TypeScript strict**.

The application is completely self-contained with **zero external backend dependencies**. It features a high-fidelity, deterministic in-memory mock API (`MockApiClient`) backed by `localStorage` persistence, realistic UAE Central Bank and global compliance scenarios, strict Role-Based Access Control (RBAC), and integrated fault injection for simulating real-world network conditions.

---

## 2. Technology Stack & Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Next.js 15                             │
│       React 19 Server & Client Components · Turbopack           │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────┴────────────────────────────────┐
│                    User Interface Layer                         │
│  Tailwind CSS v4 · Geist Typography · Phosphor Icons · Radix UI │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────┴────────────────────────────────┐
│                     Client State & Cache                        │
│     TanStack React Query v5 (Data Fetching & Cache Sync)        │
│          Zustand v5 (Active Persona, Org & UI State)            │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────┴────────────────────────────────┐
│             Domain Logic & Business Policy Guards               │
│    5x5 Risk Matrix · Decimal Money Math · State Machines        │
│    POL-DEL-02 Self-Approval Guard · POL-ADM-01 Admin Safety     │
│       Confidential Cost Masking · Peer Leave Privacy            │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────┴────────────────────────────────┐
│             Deterministic Mock API & Persistence                │
│    MockApiClient · LocalStorage Store · Fault Injector          │
│    (Simulated Latency, Concurrency rowVersion, HTTP 403-500)    │
└─────────────────────────────────────────────────────────────────┘
```

- **Framework**: Next.js 15.5+ (App Router, Turbopack, Standalone Static + Dynamic SSR routes).
- **Runtime**: React 19 with Concurrent Rendering and React Server Components.
- **Styling**: Tailwind CSS v4 with custom design tokens, dark glassmorphism, and responsive layouts.
- **Components & Accessibility**: Radix UI headless primitives (Dialog, DropdownMenu, Tabs, Checkbox, Switch, Popover, Tooltip) conforming to WCAG 2.1 AA.
- **Icons**: Phosphor Icons React (`@phosphor-icons/react`).
- **Data Fetching & Mutations**: TanStack React Query v5 with optimistic updates and cache invalidation.
- **Global State**: Zustand v5 for persona switcher, active tenant context, and side drawer controls.
- **Testing**: Vitest v5 with JSDOM and TypeScript path resolution.

---

## 3. Quick Start & Developer Guide

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher

### Installation
```bash
# Navigate to the planova project directory
cd planova

# Install dependencies
npm install
```

### Running Locally
```bash
# Start Turbopack development server
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Quality Verification Suite
```bash
# Run unit test suite (33 passing tests)
npm run test

# Run TypeScript strict typecheck (0 errors)
npm run typecheck

# Run ESLint compliance check (0 errors)
npm run lint

# Build production bundle (All 63 routes compiled)
npm run build
```

---

## 4. Multi-Tenancy & Demo Personas

PLANOVA ships with dual multi-tenant seed fixtures that can be hot-swapped instantly from the top-bar or Settings:

1. **Meridian Global Enterprises (`org-meridian`)**:
   - Base Currency: **AED** (UAE Dirham)
   - Timezone: **Asia/Dubai**
   - Regulated financial services and digital transformation programs (Project Aurora KYC, Atlas Core Banking, Nimbus Cloud).
2. **Northwind Dynamics (`org-northwind`)**:
   - Base Currency: **USD** ($)
   - Supply chain resilience, automated fulfillment, and warehouse IoT initiatives.

### The 9 Enterprise Personas

| Persona | Name | Role | Scope & Primary Focus |
|---|---|---|---|
| **pm** | Layla Al-Mansoor | Project Manager | Project lifecycle, WBS tasks, RAID triage, change formulation, project baselines |
| **sponsor** | Tariq Al-Hashimi | Executive Sponsor | Strategic portfolio oversight, change approval decisions, stage gate sign-off |
| **admin** | Priya Patel | Platform Administrator | Organization parameters, role permissions matrix, user lifecycle, emergency protocols |
| **risk** | Aisha Al-Zaabi | Risk & Compliance Officer | RAID matrix analysis, regulatory exceptions, audit trail inspection |
| **director** | Marcus Vance | Delivery Director | Cross-portfolio delivery health, resource contention, release deployment readiness |
| **architect** | Kenji Sato | Enterprise Architect | Architectural governance, technology radar, CAB release gate review |
| **finance** | Elena Rostova | Finance Controller | CapEx/OpEx budgets, actuals ingestion, cost rates, forecast variance (>10%) |
| **rm** | Mei-Ling Chen | Resource Manager | Capacity planning, workforce utilization heatmaps, project allocations |
| **member** | Omar Farooq | Team Member | Daily tasks, Kanban progress, 40-hour weekly timesheets, leave submissions |

---

## 5. Key Enterprise Capabilities & Business Guards

### 🛡️ Strict Governance & Business Guards
- **POL-DEL-02 (Self-Approval Prohibited)**: Requesters and Project Managers are strictly prevented from approving their own Change Requests or expense items. Self-approvals are blocked in both UI and `MockApiClient` with a `403 Forbidden` response.
- **POL-ADM-01 (Last Emergency Admin Protection)**: Prevents accidental enterprise lockout by disallowing the deactivation of Priya Patel as the sole registered emergency platform administrator.
- **Rejection Justification Requirement**: Any rejection or rework decision on approvals, timesheets, or leave requires a mandatory written reason (minimum 5 characters).
- **CAB Gate-Incomplete Blocker**: Releases cannot be moved to "Approved" or "In Progress" if mandatory release gates (e.g. security architecture sign-off, pen-test verification) are unfulfilled. Emergency bypasses log a mandatory audit trail.
- **Confidential Cost Rate Masking**: Team members and standard PMs without `cost.view` permissions see obfuscated cost rates (`••••••`) across forecasts and financial reports.
- **Employee Leave Privacy**: Peers see general availability blocks on team calendars, but confidential medical notes and reasons are strictly visible only to the requester and approving managers.

### 💰 Financial Stewardship
- Multi-currency ledger supporting high-precision minor-unit arithmetic (preventing IEEE 754 float drift).
- Multi-version CapEx and OpEx budgets (Draft, Submitted, Approved, Superseded).
- Actuals ledger with simulated bank CSV transaction statement preview.
- Monthly forecast projection matrix with automated >10% variance alert banners.

### 👥 Workforce Capacity & Time Tracking
- Interactive weekly timesheet submission with a 40-hour completeness progress indicator.
- Monthly workforce availability calendar featuring UAE public holidays and conflict detection.
- Cross-project team allocation heatmap highlighting over-allocated and under-utilized engineers.

### 🧪 Integrated Fault Injection System
Accessible via the **DevTools modal** (keyboard shortcut `Ctrl+Shift+D` or gear icon):
- **Latency Emulation**: Configurable delay between 120ms and 1500ms to preview realistic skeleton loaders.
- **Deterministic Error Status**: Force HTTP 403 (Forbidden), 404 (Not Found), 409 (Conflict), 422 (Validation), or 500 (Internal Server Error) to inspect platform resilience.
- **Optimistic Concurrency**: Simulates multi-user conflicts by comparing entity `rowVersion` tokens.
- **One-Click Fixture Reset**: Instantly restore all demo records back to baseline pristine state.

---

## 6. Complete Route Directory & Navigation Map

PLANOVA contains **63 distinct, fully implemented routes**:

### Core Shell & Intelligence
- `/welcome` — Onboarding briefing, persona introduction, and platform mission.
- `/home` — Executive command centre with Action Needed attention feed, health radar, and quick launch.
- `/pulse` — High-velocity enterprise pulse ticker with real-time delivery sentiment.
- `/work` — Personal "My Work" command centre for active task execution and timesheet shortcuts.
- `/insights` — AI Copilot intelligence dashboard with predictive signals and evidence trays.
- `/search` — Global cross-entity search index across projects, tasks, RAID, people, and governance.
- `/notifications` — Signal inbox with severity filters and unread status tracking.
- `/settings` — Multi-tenant organization switcher, persona selector, and fault injection controls.
- `/design-system` — Token showcase of Geist typography scale, button variants, chips, and modals.

### Projects & Delivery (PM Golden Path)
- `/projects` — Searchable project directory with status filters, health badges, and portfolio tags.
- `/projects/new` — 4-step project creation wizard with budget estimation and stakeholder assignment.
- `/projects/[projectId]` — Project summary dashboard with progress metric cards and health trends.
- `/projects/[projectId]/tasks` — Task table view with inline search, priority pills, and status filtering.
- `/projects/[projectId]/tasks/[taskId]` — Task detail drawer with subtasks, checklist, and audit history.
- `/projects/[projectId]/board` — Interactive Drag-and-Drop Kanban board across workflow states.
- `/projects/[projectId]/timeline` — Interactive Gantt chart with month/quarter views and critical milestones.
- `/projects/[projectId]/milestones` — Key stage-gate milestones with key gate flags and achievement dates.
- `/projects/[projectId]/team` — Resource allocations, assigned roles, and FTE percentages.
- `/projects/[projectId]/files` — Project document repository with metadata, file size, and upload simulation.
- `/projects/[projectId]/health` — Health assessment update form with dimensional ratings and history.
- `/projects/[projectId]/activity` — Append-only chronological stream of project actions.
- `/projects/[projectId]/settings` — Project configuration, governance baselines, and archival controls.
- `/projects/[projectId]/briefing` — AI-generated executive briefing generator with copyable summaries.
- `/projects/[projectId]/raid` — Project-scoped RAID register with risk scoring.
- `/projects/[projectId]/changes` — Project-scoped change request log.

### Portfolio, Resources & Financials
- `/portfolio` — Executive portfolio directory and strategic alignment matrix.
- `/portfolio/[portfolioId]` — Strategic portfolio overview, health distribution, and project rollups.
- `/portfolio/programs/[programId]` — Multi-project program coordination view.
- `/resources` — Resource directory and global workforce overview.
- `/resources/people` — Staff profile directory with department, FTE, and skill tags.
- `/resources/capacity` — Enterprise capacity planner and utilization radar.
- `/resources/allocations` — Cross-project allocation grid with conflict markers.
- `/financials` — Corporate financials hub with portfolio CapEx/OpEx burn charts.
- `/financials/budgets` — Versioned project budget directory with approval statuses.
- `/financials/budgets/[budgetId]` — Detailed budget line item editor with version history.
- `/financials/actuals` — Incurred cost ledger with simulated bank CSV statement preview.
- `/financials/forecasts` — Forecast matrix with inline edit, publish action, and variance alerts.

### RAID, Changes & Approvals
- `/governance` — Governance directory with regulatory policies and committee reviews.
- `/governance/raid` — Enterprise 5x5 RAID matrix, heatmap cells, and register.
- `/governance/raid/[itemId]` — Detailed RAID triage view with escalation actions.
- `/changes` — Change Request directory with cost, schedule, and scope impact tags.
- `/changes/[changeId]` — 5-tab impact assessment view (Overview, Schedule, Financials, Resources, RAID).
- `/approvals` — Centralized approval inbox with pending/completed tabs.
- `/approvals/[approvalId]` — Approval decision modal with self-approval guards and decision audit log.
- `/governance/reviews` — Scheduled Stage Gate and Architectural Review Board agendas.
- `/governance/exceptions` — Compliance waivers and regulatory exception register.
- `/governance/policies` — Enterprise policy manual (e.g. POL-DEL-02, POL-ADM-01, POL-SEC-01).

### Workforce, Releases & Administration
- `/workforce/timesheets` — Weekly timesheet logger with 40-hour target bar and manager approvals.
- `/workforce/leave` — Employee leave request form, overlap detection, and holiday calendar.
- `/workforce/calendar` — Team availability calendar with peer privacy masking.
- `/releases` — Release directory with CAB risk ratings and planned deployment windows.
- `/releases/[releaseId]` — Release gate verification view with strict CAB approval guards.
- `/reports` — Standard report gallery with simulated CSV export.
- `/reports/[reportId]` — Dynamic report dataset view with executive summary toggle.
- `/administration` — Platform administration command centre.
- `/administration/users` — User directory, profile modal, and emergency admin safety guard.
- `/administration/roles` — Interactive 40+ permission verbs × 10 roles matrix.
- `/administration/organisation` — Organization hierarchy tree and corporate settings.
- `/administration/audit` — Immutable audit trail with actor tags and correlation IDs.
- `/administration/integrations` — Architectural preview of Okta, Workday, SAP, Jira, and Teams integrations.

---

## 7. Testing & Quality Assurance Summary

The codebase has undergone full verification:

- **Unit Testing**: Vitest suite covering 5x5 risk calculations, decimal arithmetic, state machines, RBAC permissions evaluation, self-approval policy enforcement, optimistic locking, fault injection, timesheet management, and multi-tenant isolation.
- **Type Safety**: TypeScript 5 in strict mode with zero `any` leaks in core domains and 0 type errors.
- **Linting**: ESLint 9 configured for Next.js 15 App Router best practices.
- **Production Build**: Zero build errors across all static prerenders and dynamic routes.

---

## 8. License & Intellectual Property

Proprietary enterprise software built for Meridian Global Enterprises & Northwind Dynamics. All rights reserved.
