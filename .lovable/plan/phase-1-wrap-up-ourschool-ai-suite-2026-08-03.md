# Phase 1 Wrap-Up — OurSchool AI Suite

Everything else in Phase 1 is live (tables, `ai-chat` with tool calling, `ai-generate`, `ai-predict`, AI Studio, AI Insights, sidebar + permissions, role-specific suggestion chips). Three items remain.

## 1. Nightly automatic risk scoring

Today risk scores only update when an admin presses "Run analysis". Make it run on its own every night.

- Add a `CRON_SECRET` value the scheduler uses to authenticate against `ai-predict` (the function already accepts it).
- New scheduler function `ai-predict-cron`: loops over active schools whose AI is enabled and queues one prediction run per school through the existing background job queue, so a large number of schools never blocks a single request.
- Schedule it nightly (about 1:30 AM IST) with the database scheduler.
- AI Insights shows the last scored time plus a "scheduled nightly" note, so admins know it is automatic.

## 2. AI Analytics — natural-language question box

A new page at `/admin/ai-analytics`:

- One question box ("How many students have pending fees above 10,000 in Class 8?") answered from live school data via the existing AI tools, with the data it used shown under the answer.
- Auto-generated weekly insight cards (collection trend, attendance dip, top risk movement), regenerated on demand.
- Starter question chips, mobile Drawer / desktop two-column layout, deep teal tokens, Indian numbering.
- Sidebar entry under "OurSchool AI" plus a new `ai_analytics` permission module.

## 3. Risk-list actions

Small but high value: from AI Insights, let an admin act on a high-risk student — send a fee reminder or a push notification — using the existing reminder and notification paths, instead of only reading the list.

## Technical notes

- New edge function `ai-analytics` (answers + weekly insights) reusing `_shared/ai-core.ts` and `_shared/ai-tools.ts`; every call logged to `ai_usage_ledger` so cost tracking stays accurate.
- Scheduling uses `pg_cron` + `pg_net` against the existing `jobs` queue; `process-jobs` gains an `ai_predict` job handler.
- No schema changes needed beyond adding the `ai_analytics` module key to admin permission defaults.
- All AI calls stay server-side through the Lovable AI Gateway.

After this, Phase 1 is closed and Phase 2 (Transport & Safety) can start.