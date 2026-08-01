# OurSchoolTech — Enterprise Expansion Roadmap (7 Phases)

All new modules are additive. No existing module is rebuilt or modified. Every new module follows the existing conventions: multi-tenant `school_id` scoping, RLS + GRANTs, `admin_permissions` module keys, MobileLayout/Drawer on mobile and Dialog/two-column on desktop, deep teal design tokens, React Query with server-side pagination, and push/notification triggers.

## Working agreement

- One phase is built completely before the next begins. Each phase ships in reviewable chunks (database migration -> APIs/edge functions -> UI -> analytics/reports -> permissions/notifications).
- Every module gets: schema + relationships, RLS + role permissions, list/detail/create/edit UI, a dashboard tile or page, at least one report (ExcelJS or PDF), validation, settings, and notification hooks.
- Each phase adds its module keys to `admin_permissions` and its nav entries to the sidebar, gated per role.

---

## Phase 1 — AI Suite

Extends the existing `ai-chat` function, `ai_conversations`/`ai_messages` tables, and `schools.ai_settings`.

- Role-aware assistants: School Admin, Teacher, Parent, Student — each with its own tool set, data scope, and suggestion chips. Server-side tool calling replaces today's static context injection so the AI can query attendance, fees, results, and timetable on demand.
- AI generators: Homework, Circular, Notice, Report Card remarks, Timetable draft (constraint-aware: teacher load, subject periods, lunch, clash detection). Each generator produces a draft that a human edits and approves before publishing.
- Prediction engines (nightly `pg_cron` job + `jobs` queue): fee-defaulter risk, student performance trajectory, attendance dropout risk. Scores stored in `ai_predictions` with reason codes, surfaced as risk lists with drill-down.
- AI Analytics Dashboard: natural-language question box over school data, plus auto-generated weekly insight cards.
- Governance: per-school token budgets, usage log, model/tone config (already partly in `ai_settings`), audit of every generated artifact.

New tables: `ai_predictions`, `ai_generations`, `ai_usage_ledger`.

## Phase 2 — Transport & Safety

Extends existing `transport_routes` / `student_transport`.

- Full transport management: vehicles, drivers/attendants, stops with geocoordinates, trip schedules (AM/PM), student stop assignment.
- Driver portal (PWA route, phone-based GPS): trip start/end, live location ping with battery-aware throttling, student board/deboard marking, SOS button. A vendor webhook endpoint is included so an IoT tracker can push to the same pipeline later.
- Parent live tracking: map with bus position, current stop, and progress.
- Smart ETA: computed from live position + stop sequence + historical timing; push notification at configurable distance/minute thresholds, plus delay and arrival alerts.
- Driver attendance, trip logs, route optimization suggestions (stop ordering), and transport analytics (on-time rate, utilization, fuel/cost per route, delay heatmap).

New tables: `transport_vehicles`, `transport_drivers`, `transport_stops`, `transport_trips`, `transport_trip_events`, `transport_locations`, `transport_alerts`.

## Phase 3 — Operations Suite

- Hostel: blocks, rooms, beds, allocation, occupancy dashboard, in/out register, hostel attendance (roll call), leave/outpass, complaints.
- Mess: menu planner, meal attendance, mess fee linkage, feedback, consumption analytics.
- Library: catalog, copies with QR/barcode, issue/return, fines, reservations, reading history. Digital library for e-books/PDFs with access rules. Barcode scanning via device camera.
- Inventory & Assets: stock items, purchase entries, issue/consumption, reorder alerts; asset register with tags, assignment, depreciation, maintenance schedule.
- Visitor & Gate Pass: pre-registration, QR check-in, photo capture, host approval, student early-exit gate pass with parent approval and guard verification.
- Medical & Health: student health profile, allergies, vaccination, clinic visit log, medication administered, incident report with parent notification.

## Phase 4 — People & Money

- HR: employee master (beyond the teacher table), documents, contracts, onboarding/exit checklists, org chart.
- Payroll: salary structures, allowances/deductions, attendance-linked payroll run, payslip PDF, statutory heads (PF/ESI/TDS), payroll register export.
- Leave management: policies, balances, apply/approve chain, leave calendar, substitution assignment.
- Employee performance: KPI templates, self/manager review cycles, classroom observation forms, ratings dashboard.
- Online admissions: public inquiry -> application form -> document upload -> application fee payment (Cashfree) -> shortlist/interview -> offer -> enrollment that creates the student record.
- Alumni portal: profiles, batch directory, events, donations, mentorship opt-in.
- Executive analytics + finance analytics: revenue vs collection, ageing buckets, concession leakage, forecast, class-wise profitability, board-level KPI dashboard.

## Phase 5 — Communication

- Parent-Teacher chat: scoped 1:1 and class-group threads with school-hours windows, moderation, read receipts, attachments, realtime via Postgres changes.
- Internal staff chat: department/role channels, announcements pinning.
- Video meeting scheduler: slot booking for PTMs, availability calendar, links, reminders, attendance capture.
- Unified notification center and communication dashboard: delivery status across push/email/SMS/WhatsApp, templates, scheduling, engagement analytics.

## Phase 6 — Enterprise SaaS

- White-label management, custom domain management (verification + status), and expanded school branding (themes, email templates, PWA assets).
- Certificate designer: drag-and-drop template builder (bonafide, TC, character, sports), merge fields, bulk generation, verification QR (reusing the receipt-verification pattern).
- Document management: folders, versioning, retention rules, role-scoped sharing, e-sign request flow.
- Platform plumbing: feature flags per school/plan, API keys with scopes and rate limits, outbound webhooks with retries and delivery log.

## Phase 7 — Smart Campus

- Biometric attendance integration: device registry, punch ingestion API, mapping to staff/students, reconciliation.
- Face recognition attendance: enrollment, capture, review queue, and confidence thresholds (UI + workflow; recognition provider pluggable).
- QR attendance: rotating class QR, student scan, geofence and time-window validation.
- LMS: courses, units, lessons, resources, progress tracking, discussions.
- Online exams / CBT: question bank with tags and difficulty, paper blueprint, timed delivery, auto-grading for objective items, rubric-based subjective grading, proctoring signals, results publishing into the existing results flow.
- Assignment evaluation: submission, plagiarism-signal check, AI-assisted rubric grading with teacher override.

---

## Additions beyond your list (gaps vs Entab / LEAD / Teachmint)

Slotted into the phases above where they fit best:

- Sibling / family accounts with a single parent login and combined fee cart (Phase 4).
- Multi-branch school groups with a group-level rollup dashboard (Phase 4).
- Fee reconciliation automation: bank statement import, auto-match to payments, exception queue (Phase 4).
- Offline-first teacher mode for attendance and marks in low-connectivity campuses (Phase 7).
- WhatsApp Business channel as a notification transport (Phase 5).
- Parent NPS and satisfaction pulse surveys (Phase 5).
- Compliance pack: CBSE/State board report formats, UDISE+ export, RTE quota tracking (Phase 4).
- Data export / DPDP-style consent and retention controls (Phase 6).
- Emergency broadcast with acknowledgement tracking (Phase 5).

---

## Technical notes

- Every new public table follows the mandated order: CREATE TABLE, GRANT, ENABLE RLS, CREATE POLICY; helper access via `has_role` / `get_user_school_id` security-definer functions to avoid recursive RLS.
- Heavy dashboards use security-definer aggregate RPCs (matching `get_admin_dashboard_full`) rather than client-side aggregation, so the app stays fast at scale.
- Background work (predictions, ETA recomputation, payroll runs, notification fanout) goes through the existing `jobs` queue with `pg_cron`, not synchronous requests.
- AI calls run server-side only through the Lovable AI Gateway; no keys reach the browser. Generated content is always human-approved before publishing.
- Realtime features (bus location, chat) use scoped Postgres change subscriptions with channel teardown on unmount, and RLS-restricted payloads.
- New routes are lazy-loaded and added to the existing chunking strategy to keep the initial bundle flat.

## Phase 1 kickoff

On approval I start Phase 1 with the database migration for `ai_predictions`, `ai_generations`, and `ai_usage_ledger`, then the tool-calling upgrade to the `ai-chat` function, then the role assistants and generator UIs, then predictions + the AI analytics dashboard.
