# CLAUDE CODE MASTER IMPLEMENTATION PROMPT — PLANOVA
**Version:** 1.0 · **Approved product discovery:** 14 October 2026  
**Deliverable:** A complete, polished, running **frontend-only** enterprise project delivery web application.
**Canonical product reference:** `PLANOVA_PRD.md` (7 October 2026, Build baseline 1.0). Read it completely before implementation. If available, also read `01_Dev_Product_Discovery_Framework.md` and `03_Claude_Code_Prompt_Template.md`.

> **Execute this specification; do not respond with a generic plan, a static mockup, or a list of TODOs.** Build a production-quality React UI with working, in-browser experiences, typed mock API seams, rich seeded scenarios, a coherent design system, and tested user journeys. The product is called **PLANOVA**. Its tagline is **“Plan smarter. Deliver together.”**

---

## 0. Non-negotiable phase boundary

**PHASE 1 = FRONTEND ONLY.** Build Next.js 15 + React 19 UI, interactive client-side prototypes, fixtures and a mock service layer. **DO NOT BUILD** a production backend, database, migrations, ORM, server-side business service, real authentication/OIDC/MFA/SCIM, payment/billing, external integration, email delivery, or an AI inference service. Do not add secrets or real user data. Route handlers, if used, must serve **mock responses only** and be clearly marked; an in-memory mock adapter is equally acceptable. No accidental live calls.

Build coherent **demonstration simulations** of create/edit/submit/approve/reject/allocate/record-time flows with state held in the mock data layer and optional versioned localStorage persistence. This is **not** production-grade enforcement. Client-side permission checks, audit lists and workflow rules are interface demonstrations only; README and UI must say server-side enforcement is required later. No simulated approval may be represented as a legally operative decision. AI insights and chatbot replies must be labelled **Demo insight / Simulated AI** with traceable input examples; do not fabricate a confidence percentage or claim an ML model was run.

Deliver a codebase that starts via documented commands, builds cleanly, and runs without network-dependent imagery or API keys. Do not silently omit modules; implement a meaningful index, detail and primary interaction for each module specified below.

---

## 1. Mission, vision, business context and success

### Mission
Make enterprise project delivery feel as effortless as premium personal productivity software while preserving understandable enterprise governance concepts.

### Business context
PLANOVA begins as an **internal enterprise deployment** and is intended to become **multi-organisation commercial SaaS** later. Use organisation-scoped data models, tenant-aware route/context design, role/capability-aware UI composition and no organisation data leakage in seeded scenarios. Do not build SaaS tenancy provisioning, billing, identity or persistent enforcement yet.

### Positioning
“PLANOVA is an AI-native enterprise delivery platform that combines intelligent project management, effortless execution, and comprehensive enterprise oversight in one beautifully connected workspace.”

### Differentiation
- **Premium simplicity:** design quality inspired by Apple, Linear, Notion and Airbnb, without copying their proprietary UI.
- **Actionable intelligence:** insight → evidence → decision → action, all inside the relevant project context.
- **Enterprise completeness:** project delivery, portfolio, governance, resources, budgets, workforce, releases, reporting, and administration share one record model.

### Product strategy
Project Managers are primary. Team Members and Scrum Masters contribute the day-to-day source data. Governance, Approvers, Executives, Resource Managers, Finance, Admins and Auditors use scoped lenses on those same records. **Do not implement five separate role-based applications.** Corporate job title is distinct from PLANOVA permission assignments.

### Measures to demonstrate in demo widgets (targets, not guaranteed outcomes)
- 95% projects with current health, manager, dates and baseline.
- 95% critical risks with owner, response, review date.
- 100% decision/approval audit history completeness.
- 90% requests within configured SLA.
- 0 unauthorised cross-scope access in eventual backend tests.
- 70% monthly active core-workflow completion after rollout.
- Operational dashboard freshness under five minutes **when backend exists**.
Show these as configurable enterprise goals or seeded example metrics, not verified production telemetry.

---

## 2. Golden user journeys and signature experiences

### Journey A: Project creation → plan → execution → health
Project Manager opens Home → creates project in an inviting 3–4 step guided sheet → configures name, unique code, method (Agile / Waterfall / Hybrid / Operational), owner, sponsor, priority, dates, department, portfolio → adds members → creates milestones and tasks → works through Board/List/Timeline → views health, resources and budget → publishes mock status update → shares a simulated executive briefing. Preserve draft entries on accidental sheet dismissal.

### Journey B: Detect risk → evidence → decision → resolution
On Project Pulse a health alert highlights delayed milestone and critical RAID item → open contextual evidence drawer showing relevant tasks, owner, exposure and date → choose *Review risk* or *Raise change* → complete impact assessment and submit → authorised sample Approver switches demo persona, opens inbox, sees immutable submitted version and evidence → approves/rejects with rationale → source project's change and approval views update from same mock entities → activity feed shows sequence. Prevent self-approval according to seeded policy. Show history and version changes explicitly.

### Signature system: PLANOVA Pulse + Flow + Intelligence
**Pulse — Understand:** A Project Command Centre where overall health, trend, risks, upcoming milestones, overdue work, capacity, budget and decisions lead to clear next actions. **Pulse’s “Needs Your Attention”** is the memorable centre of the application, never a wall of arbitrary KPIs.

**Flow — Execute:** Lightning-fast work management (Board, List, Timeline); drag/drop, keyboard actions, quick add, bulk actions, contextual detail sheets, checklists, comments, milestones and dependency indicators. Tasks and milestones are source records, not separate copies per view.

**Intelligence — Anticipate:** Contextual risk/health/resource alerts, simulated project briefings and an always-available right-side **PLANOVA Copilot**. Each insight cites its seeded underlying records, says why it appeared, and offers a safe navigation or *review draft* action. No hidden autonomous state mutations.

**The experiential rule:** a user can traverse insight → source record → action in at most three intentional interactions from the alert.

---

## 3. Personas, goals, permissions and demo personas

| Persona | Primary need / pain | Main surfaces / success |
|---|---|---|
| Project Manager (default) | Clear health, unblock delivery, avoid manual reporting | Project Pulse, Flow, RAID, Change; knows what to do within 30 sec |
| Team Member | Know top priorities, update work quickly | My Work, task detail, notifications; complete tasks in few steps |
| Scrum Master | Surface blockers and delivery throughput | Board, filtered workload, sprint-style lenses; fast impediment triage |
| Governance Analyst | Trace exceptions and challenge health statements | Governance queues, reviews, findings; each exception links to source |
| Governance Approver | Decide with complete evidence | Approvals inbox; view version and rationale before action |
| Resource Manager | Avoid over-allocation | People, allocation timeline, capacity heatmap |
| Finance Controller | Explain budget and forecast variance | Financials and versions, approvals; sensitive data isolated in demo |
| Executive Viewer | Strategic read-only decisions | Enterprise overview and portfolio pulse |
| Platform Administrator | Explain effective access | Users, roles, permission grants, feature flags |
| Auditor | Verify history without editing | Audit search and read-only evidence |

Seed at least 10 distinct people with believable names, teams, headshots (use resilient remote Unsplash/Pexels URLs with local fallback initials), roles, time zones and sample membership. Add a **Demo role switcher** in development/demo UI, clearly **not login**, for Project Manager, Team Member, Governance, Executive, Resource Manager, Finance Controller, Approver, Admin, Auditor. Include a **demo organisation switch** using separate fixture namespaces to demonstrate scope isolation. Navigation hides inaccessible surfaces; direct access shows a distinct demo `403`, unknown resources a distinct `404`. Never call this security enforcement.

Source PRD permission verbs include `project.view`, `project.create`, `project.edit`, `task.view`, `task.create`, `task.edit`, `raid.view`, `raid.escalate`, `change.submit`, `approval.decide`, `governance.view`, `resource.view`, `allocation.manage`, `budget.view`, `forecast.edit`, `time.enter`, `leave.approve`, `portfolio.view`, `release.view`, `report.run`, `audit.view`, `user.manage`, `role.manage`, `settings.manage`; model remaining catalogue from PRD as typed constants. Scopes: `SELF`, `ASSIGNED`, `TEAM`, `PROJECT`, `DEPARTMENT`, `PORTFOLIO`, `ORGANISATION`. Effective capability preview is an explainable mock calculation; never treat client-supplied scope as trustworthy in future backend.

---

## 4. Stack, tooling, project hygiene

Use the approved defaults with stable mutually compatible versions:
- Next.js **15** App Router, React **19**, TypeScript strict.
- Tailwind CSS **v4**, shadcn/ui primitives composed into a unique PLANOVA design system.
- Motion / Framer Motion for page transitions, spring microinteractions and shared transitions.
- Phosphor Icons; **no emoji used as UI icons**.
- Zustand for ephemeral UI state (active panes, layout choice, theme preference, drawer state).
- TanStack Query for **all mock remote queries and mutations**, invalidation and loading/error/retry states.
- React Hook Form + Zod for all forms; date/currency formatting via Intl.
- `dnd-kit` (or similarly maintained accessible alternative) for Kanban and sortable widgets.
- A deliberate chart library (e.g. Recharts) wrapped in accessible PLANOVA components; textual table equivalents.
- date-fns where useful; Playwright for end-to-end and Vitest/Testing Library for units/components.
- PWA-ready manifest and responsive install-safe icon assets; Vercel-ready static/server shell. No real push service.
- ESLint/Prettier and typecheck scripts. Pin and document dependency versions; if the stack’s versions conflict, use compatible releases without silently upgrading the product architecture.

Build actual UI, not generated images of screens. Use high-quality **human imagery** only where meaningful: project banner, team avatars, onboarding illustration; prefer documented images from Unsplash or Pexels, with local CSS-gradient/placeholders as **fallbacks** if image service fails. Avoid Lorem Ipsum, “John Doe”, repeated stock-looking cards, meaningless percentages and mock labels like “Project A”.

---

## 5. Visual design system — premium, emotional, functional

### Visual personality
“Calm enterprise confidence.” Sophisticated off-white surfaces in light mode, deep charcoal/navy in dark mode, restrained ink text, electric-indigo/periwinkle brand accents, soft jade success, amber attention, crimson critical. Never convey severity by colour alone. Avoid generic admin templates, Material-default styling, heavy borders, gradients everywhere, glassmorphism that hurts legibility, enormous metric cards, Bootstrap layouts and decorative charts without decisions.

### Tokens (implement CSS variables, light/dark and high-contrast validation)
- Background: warm mist white `#F7F8FA`; primary surface `#FFFFFF`; elevated subtle gray `#F0F2F6`; ink `#131722`; muted ink `#687182`.
- Dark: canvas `#101218`, surface `#181C25`, raised `#222833`, foreground `#F3F5FA`, secondary `#A8B1C0`.
- Accent family: violet/indigo approximately `#6558E8`, hover/focus states tuned to WCAG; do **not** use this as all-purpose chart colour.
- Semantic colours with text labels and accessible contrast.
- Corner radii: 10/14/18/24px hierarchy; chip fully rounded; soft controlled shadows.
- Typography: Geist/Inter or equivalent variable sans, readable numerals, `clamp` for responsive display title; clear 12/14/16/20/28/36 scale.
- Spacing: 4px system, 8/12/16/24/32/48 rhythm; content max widths chosen per workflow; density toggle for large tables.
- Focus ring always visible; 44×44px touch targets; reduced-motion preference honoured.

### App shell
Desktop ≥1280: fixed/collapsible 250px left rail, contextual project subnav, 64px top bar, 13–15-inch laptop-optimised content, optional 360–420px Copilot or record drawer. Tablet 768–1279: compact icon rail, responsive content, drawers overlay rather than squeeze charts. Mobile <768: purpose-led 4–5-item floating bottom nav (Home, Work, Projects, Alerts, More), safe-area insets, search and Copilot affordances in header, full-screen sheets. No horizontal page scroll; dense tables convert to responsive cards or selectively scroll within table viewport with sticky headers.

Navigation capabilities control visibility and access. Sidebar groups: **Home**, **Workspace** (My Work, Projects, Milestones), **Intelligence** (Pulse, Insights), **Enterprise** (Portfolio, Governance, Resources, Financials, Workforce, Releases), **Management** (Approvals, Reports, Administration), **Personal** (Notifications, Settings). Surface domain subnavigation within projects. Keep familiar global keyboard command search (`⌘/Ctrl+K`) and create button. Add breadcrumbs and remembered filters.

### Content design
Use realistic enterprise examples: “Aurora Customer Experience Modernisation”, “Atlas Finance Transformation”, “Nimbus Cloud Migration”, “Helios Operations Rollout”, “Meridian Digital Workplace”, “Orion Data Platform”. Seed believable time windows relative to demo reference date, names, budgets in AED or USD with ISO codes, genuine-sounding meeting notes and approval rationale. Explicitly indicate dataset is illustrative. Ensure health labels and calculations are internally consistent.

---

## 6. Screen-by-screen product specification

**Every route** must support: page purpose, visible decision/action, meaningful sample data, back navigation, keyboard focus, responsive adaptation, loading skeleton, empty-state action, mock error retry, permission-denied where relevant, and success/error feedback via accessible toast. Any creation wizard uses validation, review and save; destructive actions use confirmation and undo when suitable.

### 6.1 Foundation and onboarding
- `/welcome`: editorial product intro with understated project imagery, value proposition, **Explore demo workspace** CTA; this is not a registration or login screen. Optional first-run three-card onboarding for Pulse, Flow, Intelligence, skip/replay.
- `/` redirects to `/home`; `/home`: role-specific greeting, summary with “Needs Your Attention” prioritised ranked list; My Projects status grid, next milestones, work due, alerts, approval callouts, recent activity; inline drill-through. Avoid showing inaccessible counts.
- `/search`: global command palette and full results with grouping Projects / Tasks / RAID / Milestones / Changes / People; keyboard shortcuts, recent searches, no-results suggestions; results filtered by demo scope.
- `/notifications`: timeline grouped by today/earlier, severity, read/unread, preferences and deep links.
- `/settings`: profile, appearance, timezone/locale, notification channels (demo only), density, accessibility and saved dashboard layout.
- Error routes: `403` no-permission, `404` not found, global error recovery and offline/mock API failure state.

### 6.2 PLANOVA Pulse / project dashboard
- `/pulse`: across-accessible-projects attention feed ranked by severity, deadline and impact; selectable view by project; concise explanation and action button on each insight.
- `/projects`: searchable/filterable/sortable gallery + table toggle, status/health/method/owner/portfolio filters, pinned projects, progress, next milestone; create new.
- `/projects/new`: 4-step wizard: Basics → Team & method → Schedule & portfolio → Review. Validate unique code per org, dates, manager/sponsor active; show human-friendly errors and data preview.
- `/projects/[projectId]`: **Project Command Centre**, hero status + health trend, baseline vs actual dates, progress, top risk, finance delta, allocation summary, next milestones, prioritised actions, recent decisions and collaborative activity. Quick links into relevant details. Card reordering and compact/comfortable modes.
- `/projects/[projectId]/health`: status history and editable update with explanatory rationale, per-dimension schedule/cost/scope/resource health.
- `/projects/[projectId]/settings`: project details, manager/sponsor, members, method and baseline controls; archive confirmation. Project states: Draft, Proposed, Active, On Hold, Completed, Cancelled, Archived. Baselines shown as frozen versions; an edit creates a new draft, not mutation of existing baseline.
- `/projects/[projectId]/activity`: chronological collaborative events with actor, object and time; distinct from immutable audit evidence.

### 6.3 PLANOVA Flow — working screens
- `/work`: My Work today/upcoming/later, assignment queues, completion checklists, priorities, workload and meaningful empty state.
- `/projects/[projectId]/board`: five default columns **Not Started, In Progress, Blocked, Completed, Cancelled**; drag between allowed statuses, drag reorder, keyboard-accessible alternative status menu, optimistic state update/rollback, card preview assignee, due, priority, comments, dependency risk. Board view remembers filters.
- `/projects/[projectId]/tasks`: grouped list with sort/filter/search, inline edit for approved fields, multi-select, bulk change, pagination/simulated cursor, row details, task create and child tasks. No arbitrary status edits bypassing mock transition selector.
- `/projects/[projectId]/tasks/[taskId]`: desktop side panel or mobile full page; title, owner, checklist, detail, dependencies, estimate, comments, attachments metadata, activity, progress and valid next-state actions; finish records actor/time; soft-delete with recovery demonstration.
- `/projects/[projectId]/timeline`: visual date-range/Gantt-like display with milestones, linked dependencies, overdue indicators, zoom day/week/month, drag edit with date validation and optimistic rollback, accessible table equivalent.
- `/milestones` and `/projects/[projectId]/milestones`: milestone list, key dates, ownership, baseline vs current date and key milestone cards; create/update with 0-duration rule.
- `/projects/[projectId]/team`: named membership, allocation summary, team roles, member picker, member detail drawer; members link to People when authorised.
- `/projects/[projectId]/files`: classified document metadata, contextual attachment chips, simulated upload selecting local file name/size only and preview state. No real file upload/storage or signed URL.

### 6.4 PLANOVA Intelligence
- `/insights`: cards for Schedule, Delivery, Risk, Resource and Financial signals; severity and “Why am I seeing this?” evidence tray, linked records, acknowledge/snooze locally, prepare a draft action.
- `/projects/[projectId]/briefing`: beautiful executive-ready briefing: health in one sentence, progress since prior update, milestones, top risks, decisions required, suggested next steps, sources; “Regenerate” chooses a deterministic wording variant, copy/export simulated briefing.
- **Copilot drawer globally accessible**: contextual conversation with sample prompts, typing animation with reduced-motion handling, message history per demo project, follow-up chips, inline citation pills linking to source tasks/risks. Example prompts: “Why is Aurora at risk?”, “What needs attention this week?”, “Summarise my critical risks”, “Who is overallocated?”. Implement constrained intent matching against typed mock datasets, provide transparent unsupported response and “This is a simulated response based on demo data.” Never claim model inference. Copilot may navigate or prefill a draft but never independently approve, submit or alter governed records.

### 6.5 RAID, changes and approvals
- `/governance/raid`: unified enterprise list of **Risks, Assumptions, Issues, Dependencies** sourced from `raidItems`, scoped filters; matrix heatmap, critical/overdue queues, score context. Project equivalent `/projects/[projectId]/raid` filters **same entity collection**.
- `/governance/raid/[itemId]`: detail, probability × impact with matrix-derived score, owner, response, review date, historical reviews, escalation banner; create/update/escalate/close with reason. Critical closure prompts simulated approval when policy says so; risk→issue conversion preserves original link.
- `/changes`: all accessible changes + submitted status; `/projects/[projectId]/changes`: scoped view; `/changes/[changeId]`: impact tabs Scope, Schedule, Cost, Resource, Risk, Options and Evidence. Create Draft → Assessing → Ready for Approval → In Approval → Approved/Rejected/Withdrawn → Implemented → Closed using explicit mock commands. On submit, freeze payload version; subsequent edit forks next version and warns of resubmission.
- `/approvals`: **My Decisions** actionable inbox with overdue badge, SLA, evidence completeness; alternate All Permitted History. `/approvals/[approvalId]`: submitted snapshot, version hash short reference, serial/parallel stages, quorum, assignees, comments, decision actions Approve / Reject / Request rework (where workflow permits), delegation demo and evidence. Require decision comment for reject. Block owner self-approval according to mock policy. Append-only decision history array. No repeated decision on same assignment.
- `/governance`: enterprise overview from the same RAID/changes/projects, critical exceptions, controls, reviews, executive-ready overview.
- `/governance/reviews`: review periods, agenda items and findings; detail drawers for start/review/attest/close with evidence.
- `/governance/exceptions`: exception queue with owner, policy, effective dates, severity, remediation status; linked source record and review comments.
- `/governance/policies`: read-first catalogue of versioned policy and attestation previews.

### 6.6 Portfolio, resources and finances
- `/portfolio`: current portfolios, strategic health trends, drill-through project mosaic, aggregate from accessible source projects. `/portfolio/[portfolioId]`: programs, portfolio projects, objectives, investment and prioritisation data; **scenario simulation** in UI only, with snapshot preview (immutable sample).
- `/portfolio/programs/[programId]`: program purpose, related projects, milestone alignment, health.
- `/resources/people`: filterable people gallery/table, team, skill chips, availability, allocation; respect demo privacy/cost-rate permissions.
- `/resources/capacity`: weekly capacity heatmap, assigned hours vs available; over-allocation highlighted, legend plus text; project filters and editable sample capacity.
- `/resources/allocations`: time-grid resource planner, drag/change percentage or date with inline warnings; new allocation and resource request forms; explanations of how % relates to weekly available capacity.
- `/financials`: summary with budget baselines, actual, forecast, commitments, variance and trend; show exact ISO currency, period and sign conventions.
- `/financials/budgets`: budget listing and status/version; `/financials/budgets/[budgetId]`: version picker, immutable approved baseline, line category editor on draft only, submit action and approval reference.
- `/financials/actuals`: imported-looking cost entries with source/external ID; simulate CSV selection and validated preview only; deterministic duplicate warning, no real import.
- `/financials/forecasts`: period-based table/chart and editable draft projection; threshold alert with source. If persona lacks cost capability, redact sensitive figures **and** avoid leaking hidden sum into other dashboard totals.

### 6.7 Workforce and releases
- `/workforce/timesheets`: my weekly timesheet, work date and minutes/hours entries, project/task picker, completeness indicator, submit, manager approve/reject from permissioned queue, approved period locked; rejection rationale and controlled re-open demo.
- `/workforce/leave`: request leave, leave type, date range, private reason, status and decision queue; overlap warnings, holidays; private reason only self/permitted reviewer.
- `/workforce/calendar`: team availability and absence blocks, hide private leave reason for peers, keyboard-friendly date navigation.
- `/releases`: release portfolio, planned windows, risk and gate status; `/releases/[releaseId]`: items, owner, dependencies, gate evidence, decision trail, post-release outcome. Do not mark release Approved while required gate is incomplete. Emergency path requires reason and retrospective review marker. No CI/CD integration or real deployment.

### 6.8 Reports and administration
- `/reports`: saved report gallery with dataset, audience, last refreshed sample timestamp, schedule indicator and templates; filter, inspect, simulated CSV download of **visible filtered rows only** with demo label, notification toast.
- `/reports/[reportId]`: relevant chart + accessible detailed table, named metrics and filters; print-friendly executive summary, export request progress simulation.
- `/administration`: admin overview: active users, groups, scoped access exceptions, reference data, mock integration states and recent config changes.
- `/administration/users`: person table, role assignments, status, project scopes; create/edit demo users; deactivation preserves attribution.
- `/administration/roles`: role catalogue, permission matrix, scoped grant editor and effective access preview with explanation; time-bounded/delegated grants demo.
- `/administration/organisation`: hierarchy tree, departments, default currency, timezone, feature flags; **prevent last emergency admin removal** in simulated interaction.
- `/administration/audit`: read-only audit search (actor/action/entity/time/correlation ID, redacted changes), separate from user activity feed; simulated export guarded by `audit.export`.
- `/administration/integrations`: configuration/status **demo placeholders with meaningful read-only descriptions** of planned OIDC, HRIS, ERP, calendar, Teams and notifications. No integration setup that suggests live connectivity.

**Do not replace any requested screen with “Coming soon.”** Where deep enterprise configuration exceeds Phase 1, implement an informative read-only screen + real mock examples and visually distinguish preview-only behavior.

---

## 7. Interaction contracts, feedback and animation

Define a reusable interaction catalogue:
1. **Create:** prominent CTA → validated modal/sheet/wizard → optimistic mock mutation → toast with view action → query invalidation → new record visible in lists/detail/metrics.
2. **Edit:** field-level editing or form sheet; dirty prompt; compare server-mock `rowVersion`; simulated `409` conflict option to reload/compare; form error focus.
3. **Transition:** only legal next actions exposed; reason required on closure/rejection/escalation; confirmation for high-impact changes; audit demo event recorded.
4. **Delete/archive:** clear archive semantics, confirmation and undo where possible; soft-delete where activity exists.
5. **Filter/search:** visible active filter chips, saved view, reset, count matching authorised mock rows, stable sort, accessible pagination and URL query-state for shareable searches.
6. **Drag/drop:** elevation + spring snap + live-region announcement; keyboard alternative; blocked/cancelled transitions obey mock transition rules.
7. **Chart drilldown:** keyboard-clickable series/legend, tooltip includes units and sample timestamp, accompanying data table and click-to-filter.
8. **AI signal:** source-linked evidence → explanation → safe navigation or prefilled draft; acknowledgment does not mutate original risk score.
9. **Approvals:** decision drawer displays submitted version, approver identity, confirmation, result timeline; never automatically approve.
10. **Error:** inject mock network/403/404/409/500 and slow mode from a visible development/demo settings menu, retry with clear nontechnical text.

Motion: page enters 180–260ms easing, hover lift 1–2px, 180–240ms sheets, spring reorder, project selection shared-element transitions where reliable, stagger short ≤40ms and never block controls. Framer Motion variants centralised; all motion disabled/reduced under `prefers-reduced-motion`.

Always support skeletons (not flashing spinners), zero state with “Create first…”, meaningful edge cases, snackbars with undo/action, destructive safeguards, and mobile interaction parity.

---

## 8. Type-safe data model and relationships — frontend representations only

Read the PRD §13–14 table catalogue. Implement interfaces/types, zod parsing for boundaries, fake repositories, factories and denormalised *selectors*. **Do not create SQL/Prisma/ORM/migrations**.

Shared fields on mutable records: `id`, `organisationId`, `rowVersion`, `createdAt`, `createdBy`, `updatedAt`, `updatedBy`, optional `deletedAt`. Timestamp ISO UTC; local work dates `YYYY-MM-DD`; money `{ amount: string, currencyCode: string }` to preserve decimal precision; user timezone IANA. Distinguish immutable version/snapshot records.

Core models and field expectations:

| Domain | Typed models and required relationships |
|---|---|
| Identity | Organisation(code, timezone, currency), OrganisationUnit(parentId), User(email, active status, title, locale), Role(code), Permission(resource/action), RoleGrant(effect, scope, scopeRefId), PrincipalRoleAssignment(effective dates), Delegation |
| Projects | Project(code/name/type/method/manager/sponsor/unit/portfolio/start/target/status/health/progress), ProjectMember, ProjectHealthUpdate(per-dimension rationale), ProjectBaseline(version, approved snapshot), ProjectStatusHistory |
| Work | Task(projectId, parentTaskId, code, title, status, priority, due, progress, estimate, assignments), TaskDependency(predecessor/successor,type), ChecklistItem, Milestone(projectId, zero-duration target date, owner), Comment, Attachment metadata |
| RAID | RaidItem(projectId,type,status,probability,impact,score,severity,owner,review,closure reason,source link), RaidResponse, RaidReview, RiskMatrix and RiskMatrixCell |
| Changes/Approval | ChangeRequest(projectId, impact fields, currentVersion), ChangeVersion(immutable submitted payload/hash), WorkflowDefinition/Stage, ApprovalRequest(entity/version/status), StageInstance, Assignment, Decision(append only), Escalation |
| Governance | GovernanceReview(scope/period/snapshot), ReviewItem(source entity reference), Finding, Policy(version), Attestation, Exception, GovernanceSnapshot |
| Resources | Person(userId/unit/manager/FTE), Team/TeamMember, Skill/PersonSkill, WorkCalendar, CapacityPeriod, ResourceAllocation(projectId/personId/%/dates), ResourceRequest |
| Finance | Budget(projectId/year/currency), BudgetVersion(status/total), BudgetLine(category/period/amount), ActualCost(source+externalKey), Commitment, Forecast/ForecastLine, sensitive CostRate, ExchangeRate |
| Workforce | Timesheet(person/period/version/status/lockedAt), TimeEntry(local workDate/task/project/minutes), LeaveType, LeaveRequest(private reason), Holiday |
| Portfolio | Portfolio, Program, PortfolioProject membership, StrategicObjective, ProjectObjective, ScoringModel/Criteria, ProjectScore, immutable PortfolioSnapshot |
| Releases | Release(project/risk/status/windows), ReleaseItem, ReleaseGate, GateDefinition, ReleaseEvidence metadata, DeploymentWindow |
| Platform | Notification, Preference, AuditEvent(actor/action/entity/correlation/changes redacted), ActivityEvent, File metadata, SavedReport, ExportJob, ReferenceSet/Value, IntegrationConnection mock status |

Relationships are by stable IDs. A project shown on Portfolio, Project Pulse and Governance has **one project object**; risks are not copied to governance; approval decisions are append-only; work activity and audit are different collections. Preserve only one active source-of-truth mock repository per domain. Derived metrics computed with selectors and deterministic fixtures. Demo mode may reset to a documented seed.

### State machines in mock services
- Project: Draft, Proposed, Active, On Hold, Completed, Cancelled, Archived.
- Task: Not Started, In Progress, Blocked, Completed, Cancelled.
- RAID: Draft, Open, Monitoring, Escalated, Resolved, Closed.
- Change: Draft, Assessing, Ready for Approval, In Approval, Approved, Rejected, Withdrawn, Implemented, Closed.
- Approval: Pending, In Progress, Approved, Rejected, Withdrawn, Expired, Cancelled.
- Budget version: Draft, Submitted, Approved, Superseded, Rejected.
- Release: Draft, Planned, In Review, Approved, In Progress, Completed, Failed, Cancelled.

Store a well-defined transition map for each entity. Avoid unsafe `setStatus(any)` APIs; use explicit mock commands `submitChange`, `decideApproval`, `archiveProject`, `escalateRaid` etc. These simulate expected frontend feedback; actual backend will enforce policy.

### Demo fixture design
Provide at least:
- 2 mock organisations, 3 portfolios, 4 programs, 12 projects across Active/On Hold/Proposed/Completed and all delivery methods.
- 20+ people, multiple realistic project teams, 100+ tasks (including blocked and overdue), 25+ milestones, dependency graph without cycles.
- 35+ RAID items covering all 4 types, 12+ change requests, 15+ approvals with pending/approved/rejected outcomes.
- Monthly finance/forecast entries, differentiated baseline versions, 20+ allocations with overcapacity, timesheets, leave, releases and gates, comments, notifications, audit events.
- Deliberate demos: Aurora amber health with critical risk due for review, Atlas budget variance, Nimbus overallocated engineer, one rejected change with explanation, one decision awaiting the Governance Approver, a user with insufficient cost permission and a second organisation record that does not appear when scoped to the first.
- Coherent dates anchored to `DEMO_TODAY` (declare configurable; use 2026-10-14 initially), with deterministic derived due-soon/overdue indicators.

Seed amounts consistent with summaries. No random runtime regeneration that makes tests flaky. Names, project updates, approval rationale, conversations, task titles, reports and notifications must feel authentic, not filler.

---

## 9. Mock API specification and contracts

Expose a repository adapter abstraction (`MockApiClient`) consumed by TanStack Query. Keep all simulated persistence in one mock domain store per demo organisation; use a seed reset action. Promise-based methods simulate 180–650ms latency, deterministic errors via dev toggles, pagination and safe filtering.

Shape responses after PRD REST `/api/v1/{resources}` conventions **as contracts, not real backend endpoints**. Use explicit action methods mirroring commands, e.g.:

| Mock collection/query | Mutations / state changes |
|---|---|
| `/api/v1/projects`, `/projects/{id}`, `/projects/{id}/health`, `/projects/{id}/baselines` | `createProject`, `updateProject`, `updateHealth`, `createBaselineDraft`, `archiveProject` |
| `/api/v1/tasks`, `/tasks/{id}`, `/milestones` | `createTask`, `updateTask`, `transitionTask`, `setAssignment`, `setDependency`, `createMilestone` |
| `/api/v1/raid-items`, `/raid-items/{id}/reviews` | `createRaid`, `reviewRaid`, `escalateRaid`, `closeRaid` |
| `/api/v1/changes`, `/changes/{id}/versions` | `draftChange`, `assessChange`, `submitChange`, `withdrawChange`, `resubmitChange` |
| `/api/v1/approvals`, `/approvals/{id}` | `decideApproval`, `delegateApproval` |
| `/api/v1/governance/reviews`, `/governance/exceptions` | `recordFinding`, `closeReview`, `requestRemediation` |
| `/api/v1/people`, `/allocations`, `/capacity` | `createAllocation`, `updateAllocation`, `requestResource` |
| `/api/v1/budgets`, `/actuals`, `/forecasts` | `saveDraftBudget`, `submitBudget`, `previewActualImport`, `updateForecast` |
| `/api/v1/timesheets`, `/leave-requests` | `saveTimeEntry`, `submitTimesheet`, `decideTimesheet`, `requestLeave`, `decideLeave` |
| `/api/v1/portfolios`, `/programs`, `/releases`, `/reports`, `/notifications`, `/users`, `/roles`, `/audit-events` | relevant typed create/update/transition methods scoped to persona |

List envelope `{ data, pageInfo: { nextCursor, hasMore }, meta: { demo: true, generatedAt } }`. Problem details-like mock errors `{ type, title, status, code, correlationId, detail, fieldErrors? }`; render `403`, `404`, `409`, validation `422` and `500` distinctly. Mutating methods accept `expectedRowVersion` for conflict simulation, optional idempotency key for submit/create and return updated entity + affected selectors. For costly exports show asynchronous job progress simulation only; CSV from visible mock records may be downloaded locally. Do not mimic secured or encrypted exports as real.

A later backend replacement should require changing adapters, not rewriting page components. API data is validated with Zod at fake boundaries; never expose raw mock implementation directly in components. Ensure a mutation on one surface rehydrates all related cards, lists, approval queues and activity; avoid separately hard-coded widget totals.

---

## 10. State, architecture and folder structure

Use feature/domain modules, shared platform components and app route shells. Suggested structure (refine only if objectively clearer):

```text
planova/
├── app/
│   ├── (marketing)/welcome/page.tsx
│   ├── (workspace)/layout.tsx
│   ├── (workspace)/home/page.tsx
│   ├── (workspace)/work/page.tsx
│   ├── (workspace)/pulse/page.tsx
│   ├── (workspace)/insights/page.tsx
│   ├── (workspace)/projects/...  # overview, settings, team, tasks, board, timeline, milestones, raid, changes, briefing, activity, files
│   ├── (workspace)/portfolio/...
│   ├── (workspace)/governance/...
│   ├── (workspace)/resources/...
│   ├── (workspace)/financials/...
│   ├── (workspace)/workforce/...
│   ├── (workspace)/releases/...
│   ├── (workspace)/approvals/...
│   ├── (workspace)/reports/...
│   ├── (workspace)/administration/...
│   ├── (workspace)/notifications/page.tsx
│   ├── (workspace)/settings/page.tsx
│   ├── (workspace)/search/page.tsx
│   ├── globals.css
│   ├── error.tsx
│   └── not-found.tsx
├── components/
│   ├── ui/                     # shadcn-derived accessible primitives
│   ├── shell/                  # nav, header, mobile tabs, breadcrumbs, command palette
│   ├── data-display/           # KPI, charts, tables, status chips, risk matrix
│   ├── forms/                  # field wrappers, currency/date/team selectors
│   ├── feedback/               # loaders, empty/errors, permission states, toast
│   └── motion/                 # variants and reduced-motion helpers
├── features/
│   ├── projects/ work/ raid/ approval/ governance/
│   ├── resources/ financials/ workforce/ portfolio/ releases/
│   ├── reporting/ administration/ intelligence/ notifications/
│   └── identity/
│       # per domain: types.ts, schema.ts, api.ts, queries.ts, selectors.ts,
│       # components/, forms/, hooks/, tests/
├── lib/
│   ├── mock-api/               # adapter, latency, fault injection, error contract
│   ├── demo-data/              # deterministic fixtures, DEMO_TODAY, reset
│   ├── access/                 # mock capability evaluator and scope selectors
│   ├── formatting/             # currency/date/timezone
│   └── utils/
├── stores/                     # Zustand UI stores only
├── public/                     # manifest, icons, image fallbacks
├── tests/                      # Playwright journeys, access, responsive, visual
├── docs/                       # UI decisions, mock-vs-live boundary, known limitations
└── README.md
```

Data responsibility: TanStack Query owns mock remote server-state, Zustand only owns view state. No large unsynchronised global duplicate arrays. Derived data selectors pure and tested. Client/server component boundary intentional, avoid `use client` everywhere. Shared error boundary; forms validate twice (client plus mock adapter demonstration). Put non-sensitive layout/view preferences in localStorage; test clean restore/reset.

---

## 11. Navigation, design patterns and component library

Build a distinctive component showcase route in development (`/design-system`) or Storybook-like page with:
- App shell, collapsible nav, mobile floating nav, breadcrumb, global command overlay.
- Avatar/AvatarStack, project icon/cover, project card, portfolio tile, owner selector.
- ProjectHealthBadge and legend (On Track / At Risk / Critical / No Data), PriorityPill, StatusChip, ProgressRing + readable number, TrendDelta with period.
- ActionableInsightCard, AttentionFeed, EvidenceDrawer, AuditTimeline, ActivityTimeline, DecisionStageStepper.
- KanbanCard/Column, TaskDetailSheet, editable DataTable, FilterBar, SavedViewPicker, BulkActionBar, TimelineGrid, MilestoneMarker.
- ResourceHeatmap, AllocationBar, RiskMatrix, BudgetVarianceCard, CurrencyAmount, AccessibleChartWrapper.
- Multi-step CreationWizard, structured form fields, accessible ConfirmDialog, ToastAction, EmptyState, Skeleton, ErrorPanel, NoAccess.
- CopilotLauncher, CopilotPanel, MessageBubble, EvidenceCitation, SuggestedQuestionChip, SimulatedAIIndicator.
- PermissionGate is for **visual demonstration only**; source data filtered at mock repository boundaries as well.
For each, document props, sizes, states, responsive behavior, semantics and interaction rules. Use compositional consistency across modules.

---

## 12. Responsive, accessibility, privacy and performance

### Responsive test matrix
Test 375×812 and 390×844 mobile, 768×1024 tablet, 1024×768 landscape, 1440×900 and 1920×1080 desktop. Mobile users can create tasks, resolve mock approvals, view risk context, submit timesheets and open Copilot without forced desktop UI. Adapt data tables thoughtfully. Sticky actions must not hide content or keyboard.

### Accessibility
WCAG 2.2 AA intent: proper landmarks, headings, accessible names, skip-to-content, visible focus, keyboard drag/drop alternatives, labelled charts/table equivalents, live-region mutation announcements, 4.5:1 body contrast where applicable, focus trap and restore in dialogs, reduced-motion support, 200% text zoom, escape key behavior, screen reader verification for high-use screens. Non-colour icons/text for health. Avoid indiscriminate ARIA.

### Data sensitivity and trust
Never show hidden sensitive cost rates to insufficiently-permitted demo roles; never expose second organisation’s seeded records via UI selectors/search/drill-through. Support privacy of leave reason. `AuditEvent` displays redacted before/after summaries; activity feed can be conversational. Mock UI **cannot guarantee security**; explicitly call out need for backend RBAC, data security, MFA, encryption, audit integrity and workflow validation in production.

### Performance
Target shell visually ready ~2s on normal developer machine, avoid cumulative layout shifts, lazy load expensive chart and timeline sections, virtualise large lists as needed, memoise derived selectors, defer non-essential imagery, use `next/image` where viable. Page navigations and interactions remain fluid with hundreds of fixture records. Model planned production targets (10k users, 2k projects, 2m tasks, 50m audit) as **future backend requirements**, not achievable claims for a frontend demo.

### i18n
English strings centralised for later translation; Intl currency and timezone formatting, ISO currency codes, RTL-ready layout; use a neutral demo timezone default such as Asia/Dubai, with individual user preferences.

---

## 13. Tests, acceptance criteria and definition of done

### Automated checks
- `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass.
- Component tests for status chips, permission-gated nav, dialog keyboard support, AI simulation disclaimer and health source labels.
- Unit tests for derived health indicators, over-allocation, due dates, currency-safe totals, risk matrix, stable filter/pagination, scope filtering, legal transitions, no dependency cycles and approved baseline immutability in mock contract.
- Form tests for dates, missing project code, member eligibility, leave overlap, required rejection rationale, edit collision `409`, duplicate external actual key.
- Playwright user journeys on desktop and mobile:
  1. Project Manager creates project, members, task and milestone; all project surfaces reconcile.
  2. Drag task to In Progress, then Blocked; keyboard equivalent works; task details and Pulse reflect changes.
  3. Critical RAID created, escalated; Governance shows exact same ID, no shadow copies.
  4. Draft change submitted; submitted version preserved; Approver approves; Project Manager sees linked updated status and history.
  5. Resource allocation creates overcapacity warning; edit resolves it.
  6. Finance Controller sees budget data; Team Member without finance capability does not.
  7. Team Member submits time; manager approves and locks; later edit blocked by mock contract.
  8. Executive persona sees scoped read-only portfolio; forbidden deep link shows no-access state.
  9. Switching organisation does not expose other organisation data in search, insights, dashboards or reports.
  10. Copilot question returns labelled simulated response with clickable real fixture references; unsupported question gives transparent fallback.
  11. Mock timeout/error/retry and optimistic conflict revert correctly.
  12. Responsive, dark mode, high contrast and reduced motion remain usable.
- Run automated axe checks for core screens and verify keyboard focus manually; test Chrome and mobile viewport. Use screenshots for visual QA and rectify clipping, overlap, overflow and weak contrast.

### Detailed release acceptance
- All screens listed in §6 load with meaningful content and primary interaction; no dead-end links.
- All sidebar routes have stable responsive navigation and valid breadcrumb hierarchy.
- No desktop-only core action; accessible mobile sheets and bottom bar.
- At least 2 robust signature flows (creation to delivery; risk to decision).
- Cross-module record and aggregate consistency from shared mock repositories.
- Light/dark themes complete, not merely inverted backgrounds.
- All CRUD-like UX has validation, loading, success/error, and appropriate undo/confirmation.
- Seed record dates, sums and statuses reconcile and are repeatable on reset.
- Approvals, finance, scope and audit previews are labelled as mock/demonstration.
- No real auth, DB, AI or external integration and no server secrets.
- README includes setup, architecture, demo personas, fixture reset, mocked behavior, URL map, scripts, environment assumptions, known limits and the next-phase adapter seams.

---

## 14. Implementation order for Claude Code

**Do the work in vertical slices and validate as you go; do not stop at a wireframe.**

1. Inspect repo and PRD. Create Next.js stack, scripts, formatting, core tokens, fonts/icons, shell, theme and responsive navigation.
2. Implement typed shared models, deterministic seed repositories, permission/scope adapter, mock API client, TanStack Query providers and error/fault injection.
3. Build Project Manager golden path: project directory, project wizard, Project Pulse, Board/List/Task details, milestones and activity, with mobile parity.
4. Add RAID → change requests → approval queue and linked decision history using shared entities.
5. Add Intelligence (contextual cards, briefing and simulated Copilot), evidence links and “Needs Your Attention”.
6. Implement remaining scoped modules: Portfolio, Governance reviews, Resources, Financials, Workforce, Releases, Reports, Administration.
7. Polish every screen for light/dark/mobile, zero/error/loading states, animation, realistic copy and data visualisations.
8. Test, fix problems, document mock boundaries and deliver.

**Completion report required in README and final response:** list route coverage; demonstrate both signature journeys; commands for run/build/test; deliberate frontend-only omissions; known limitations; tests performed. Do not say “production secure”, “real-time backend” or “AI-powered predictions” when those are mocked.

---

## 15. Explicit product and architecture guardrails from PRD

The original enterprise PRD describes the **future real platform** as a modular monolith with strict domain ownership, identity/RBAC scope evaluation, immutable approval decisions and baselines, idempotent imports, governed financials, append-only audit, REST versioning, event outbox and eventual integrations. These are **not Phase 1 implementation instructions** to build infrastructure. They are constraints guiding frontend contracts and realistic UI states.

Respect these crucial rules in mocked workflows:
- Same project/task/RAID/change record wherever displayed. No role-specific cloned app.
- Manager/sponsor active, project code unique per organisation, end date ≥ start date.
- No task dependency cycle; completion records actor/time; milestone zero-duration.
- Risk score derives from policy matrix; closure requires explanation; critical escalation/closure may require approval.
- Submit change freezes reviewed version; approval references exact evidence/version; owner cannot approve where prohibited.
- Decision history append-only; governance adds findings linked to source rather than copying source objects.
- Capacity allocation periods and percent/hours normalisation; warn over-allocation.
- Approved budget baseline immutable; cost rate sensitive; actual source keys unique.
- Timesheets use local work dates and approved period locks; leave privacy by persona.
- Required release gates must be satisfied before “Approved”.
- Audit is distinct from social/project activity, export only authorised visible rows.
- State transitions explicit with reason, actor/time and optimistic concurrency concept.

If PRD has an unresolved detail, prefer a clearly labelled, sensible UI demo assumption over inventing an operational enterprise rule. Record the assumption in `docs/assumptions.md`. Future backend semantics remain owned by the PRD and enterprise review.

---

## 16. Final instruction

**Build PLANOVA now, as a complete beautiful interactive frontend.** The test for success is not the number of components: a Project Manager should land in PLANOVA, immediately understand project health and risk, move work forward, and resolve an exception via an auditable-looking **mock** decision journey. A Team Member should accomplish their work without enterprise clutter, while governance and executive users should see coherent source-linked oversight.

The UI must feel unusually refined and emotionally engaging but never sacrifice legibility, accessibility, domain integrity or responsible representation of simulated AI and security. Deliver a running application with realistic data and all specified major enterprise modules — **frontend only**.
