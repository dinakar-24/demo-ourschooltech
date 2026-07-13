# Port Our School Tech frontend → your new stack (web + backend)

Goal: reuse this Lovable frontend 1:1 on your `web/` (React 18 + Vite + TS + Tailwind + shadcn + TanStack Query + Zustand + React Router v6, Vercel) with backend `Node/Express + Prisma + Postgres + JWT` on Railway. Deliverable = (1) file-by-file migration guide, (2) Claude Code mega-prompt.

## Part 1 — Migration guide (what to copy, in order)

### Phase 0 — Parity setup in `web/`
Install into your `web/` project so pasted files compile:
```
bun add @tanstack/react-query zustand react-router-dom react-hook-form zod @hookform/resolvers axios date-fns lucide-react clsx tailwind-merge class-variance-authority sonner cmdk exceljs jspdf jspdf-autotable idb-keyval i18next react-i18next i18next-browser-languagedetector workbox-window
bun add -D vite-plugin-pwa @types/node
```
Copy shadcn base config: `components.json`, `tailwind.config.ts`, `postcss.config.js`.

### Phase 1 — Copy verbatim (no changes needed)
These are pure UI / utilities and have zero Supabase coupling:
- `src/index.css` + `src/App.css` (design tokens — deep teal #0F766E, dark mode, animations)
- `tailwind.config.ts`
- `src/components/ui/**` (all shadcn primitives)
- `src/lib/utils.ts`, `src/lib/indian-numbering.ts`, `src/lib/bulk-upload-utils.ts`
- `src/hooks/use-mobile.tsx`, `use-toast.ts`, `useDebounce.ts`, `usePagination.ts`, `useRefreshDetection.ts`, `useInstallPrompt.ts`
- `src/i18n/**` (8-language setup)
- `src/assets/**`
- `public/**` (PWA icons, manifest, service worker glue)

### Phase 2 — Replace the data layer (the actual work)
The whole app talks to `supabase` in exactly 3 shapes. Replace them once, and 90% of hooks compile:

1. **Auth** — `supabase.auth.*` → your JWT flow
   - Create `src/lib/api.ts`: axios instance with baseURL from `VITE_API_URL`, request interceptor that attaches `Authorization: Bearer <access>`, response interceptor that on 401 calls `/auth/refresh` with the refresh token, retries once.
   - Create `src/stores/authStore.ts` (Zustand, persisted to `idb-keyval`): `{ user, accessToken, refreshToken, schoolId, role, login(), logout(), refresh() }`.
   - Replace `src/integrations/supabase/client.ts` with a shim that re-exports `api` + auth helpers so downstream imports keep working during migration (`import { supabase } from "@/integrations/supabase/client"` → thin wrapper exposing `.auth.getSession()`, `.auth.signInWithPassword()` mapped to your endpoints). Delete the shim once all call sites are rewritten.

2. **CRUD** — `supabase.from("table").select/insert/update/delete()` → REST
   - Backend must expose conventional REST: `GET /api/students?classId=&page=&pageSize=`, `POST /api/students`, `PATCH /api/students/:id`, `DELETE /api/students/:id`. Tenant is derived server-side from subdomain + JWT (never from client body).
   - Rewrite each hook in `src/hooks/use*.ts` one module at a time. Order by dependency:
     1. `useSchools`, `useAcademicYears`, `useClasses`, `useSections` (foundational)
     2. `useStudents`, `useSchoolAdmins`, `useAllUsers`, `useManageUser`, `useCreateSchoolUser`
     3. `useAttendance`, `useAdminAttendance`, `useStudentAttendanceHistory`
     4. `useFees`, `useFeeInvoices`, `useParentInvoices`, `useStudentFeeInvoices`, `usePaymentConfig`, `usePaymentSubmissions`, `useOnlinePayments`, `useReceiptGeneration`, `useFeeReports`
     5. `useAnnouncements`, `useHomework`, `useExams`, `useGallery`, `useOnlineClasses`, `useFeedback`
     6. `useNotifications`, `usePushNotifications` (see Phase 4)
     7. `useCashfree`, `useRazorpay` (see Phase 5)
     8. `useReportGenerators`, `useSchoolReportStats`, `useParentData`, `useStudentData`
   - Keep every TanStack Query key shape identical — no component needs to change.

3. **RPC / edge functions** — `supabase.functions.invoke("name", { body })` → `POST /api/rpc/name` (or dedicated routes). Map each `supabase/functions/*` folder to a backend controller:
   | Edge function | New route |
   |---|---|
   | `create-school-user`, `create-student-with-accounts`, `create-super-admin`, `manage-user`, `delete-school-user` | `POST /api/admin/users/*` |
   | `bulk-upload`, `delete-all-students` | `POST /api/admin/bulk/*` |
   | `create-cashfree-order`, `cashfree-webhook`, `verify-receipt` | `POST /api/payments/cashfree/*` |
   | `create-razorpay-order`, `verify-razorpay-payment` | `POST /api/payments/razorpay/*` |
   | `send-password-reset-otp`, `verify-password-reset-otp`, `verify-otp-only`, `send-super-admin-otp`, `verify-super-admin-otp` | `POST /api/auth/otp/*` (MSG91) |
   | `send-push-notification`, `fee-due-reminder` | Web Push + Expo Notifications workers |
   | `og-metadata` | Express SSR middleware for crawler UA |
   | `delete-school`, `toggle-school-status`, `migrate-logos-to-storage`, `cleanup-audit-logs`, `keep-alive`, `process-jobs` | Cron jobs (Railway cron or `node-cron`) |

### Phase 3 — Copy pages/components (mostly verbatim after Phase 2)
Copy in this order, resolve imports as you go:
1. `src/contexts/**` (TenantContext, AuthContext, etc.) — adapt to Zustand store
2. `src/components/layout/**`, `MobileLayout`, sidebar, header
3. `src/pages/login/**` (SubdomainLanding, RoleLoginPage, LoginPage) — swap `supabase.auth.signInWithPassword` for `api.post('/auth/login')`
4. `src/pages/admin/**` (Dashboard, Students, Fees, Attendance, Announcements, Classes, Homework, Reports, Teachers, BulkUploadPage)
5. `src/pages/super-admin/**` (CreateSchool, Schools, Dashboard, Login)
6. `src/pages/parent/**`, `src/pages/student/**`, `src/pages/teacher/**`
7. `src/pages/PublicInstallPage.tsx`, `TenantErrorPage.tsx`, `NotFound.tsx`, `ReceiptVerificationPage.tsx`, `NotificationsPage.tsx`
8. `src/App.tsx` + `src/main.tsx` — wire router, QueryClient (offlineFirst + `idb-keyval` persister), TenantProvider, PWA registration

### Phase 4 — Push notifications
- Web: swap `usePushNotifications` to `POST /api/push/subscribe` with the `PushSubscription`. Backend stores in `push_subscriptions` table, uses `web-push` npm with VAPID keys.
- Mobile (Expo): `expo-notifications` — token POSTed to same endpoint with `platform: "expo"`.

### Phase 5 — Payments (Cashfree + Razorpay)
- Keep the exact client SDK usage in `useCashfree.ts` / `useRazorpay.ts`.
- Backend creates orders server-side with keys from env, verifies webhooks with HMAC.
- Add Razorpay for SaaS billing (new — schools paying you); Cashfree stays for parent fee payments.

### Phase 6 — Subdomain tenancy
- Vercel: add wildcard `*.ourschooltech.com` domain in project settings; Vercel handles it, no wildcard cert config needed.
- Client: keep existing subdomain-resolver in `src/lib/tenant.ts` — reads `window.location.hostname`, extracts subdomain, hits `GET /api/tenants/resolve?subdomain=xyz` (public route; returns `{ schoolId, name, logo, primaryColor }`). Backend caches with Redis or in-memory LRU.
- All authenticated requests include the resolved `schoolId` server-side via JWT, not from headers.

### Phase 7 — Storage (S3 instead of Supabase Storage)
- Backend adds `POST /api/uploads/sign` → returns S3 presigned PUT URL. Client PUTs the file, then POSTs the resulting URL to the entity endpoint.
- Rewrite `useAvatarUpload.ts` and the logo/gallery/announcement upload paths.

### Phase 8 — Cleanup
- Delete `src/integrations/supabase/` and the shim
- Delete `supabase/` folder
- Remove `@supabase/supabase-js` from package.json
- Delete `.env` Supabase vars, add `VITE_API_URL`, `VITE_VAPID_PUBLIC_KEY`, `VITE_CASHFREE_APP_ID`, `VITE_RAZORPAY_KEY_ID`

## Part 2 — Claude Code mega-prompt

Save as `MIGRATION_PROMPT.md` in your `web/` repo and paste into Claude Code:

```
You are porting an existing React 18 + Vite + TypeScript + Tailwind + shadcn frontend
from Lovable (Supabase backend) onto my new stack:

  Web:      React 18 + Vite 5 + TS + Tailwind + shadcn/ui + TanStack Query + Zustand
            + React Router v6, deployed to Vercel with wildcard *.ourschooltech.com
  Backend:  Node.js + Express + Prisma + Postgres + JWT (access + refresh) + RBAC
            deployed to Railway, base URL from VITE_API_URL
  Services: AWS S3, Resend, MSG91, web-push (VAPID), Expo Notifications,
            Cashfree (fee payments), Razorpay (SaaS billing), jsPDF, ExcelJS

Source frontend is in ./lovable-source/. Target is ./web/src/.

Rules:
1. Copy design tokens exactly: src/index.css, tailwind.config.ts, all src/components/ui/**.
   Never hardcode colors — always use semantic tokens (bg-primary, text-foreground, etc.).
2. Replace the data layer, not the UI:
   - Create src/lib/api.ts (axios, JWT interceptor, refresh-on-401).
   - Create src/stores/authStore.ts (Zustand + idb-keyval persist).
   - For every hook in src/hooks/use*.ts, replace supabase.from(...) with api.get/post/patch/delete,
     preserving the TanStack Query key shape so no component needs edits.
   - For every supabase.functions.invoke("name", { body }) call, replace with POST to the
     corresponding /api/... route (see mapping table below).
3. Tenant resolution: read subdomain from window.location.hostname, hit
   GET /api/tenants/resolve?subdomain=X (public). Never trust client-supplied schoolId —
   server derives it from JWT.
4. Auth flow: /api/auth/login → { accessToken, refreshToken, user }. Store both in Zustand
   + idb-keyval. Refresh on 401. Logout clears store and calls /api/auth/logout.
5. Push notifications: useWebPush hook POSTs PushSubscription to /api/push/subscribe.
6. Uploads: POST /api/uploads/sign returns S3 presigned URL; client PUTs; POSTs final URL to entity.
7. Payments: keep Cashfree client SDK; order creation + webhook verification on backend.
8. Preserve: mobile-first MobileLayout, Drawer max 85dvh, Indian numbering (1L/1K), i18n 8 langs,
   ExcelJS only (never xlsx), all images loading="lazy" with explicit dimensions.
9. Router: preserve all routes exactly — /login, /dashboard, /students, /fees, /attendance,
   /announcements, /parent/*, /student/*, /teacher/*, /super-admin/*.
10. Do not introduce Next.js, RSC, or any framework change. Vite only.

Route mapping (edge function → REST):
  create-school-user           → POST /api/admin/users
  create-student-with-accounts → POST /api/admin/students
  create-super-admin           → POST /api/super-admin/users
  manage-user                  → PATCH /api/admin/users/:id
  delete-school-user           → DELETE /api/admin/users/:id
  bulk-upload                  → POST /api/admin/bulk-upload
  delete-all-students          → DELETE /api/admin/students/all
  create-cashfree-order        → POST /api/payments/cashfree/order
  cashfree-webhook             → POST /api/webhooks/cashfree
  verify-receipt               → POST /api/receipts/verify
  create-razorpay-order        → POST /api/billing/razorpay/order
  verify-razorpay-payment      → POST /api/billing/razorpay/verify
  send-password-reset-otp      → POST /api/auth/otp/password-reset/send
  verify-password-reset-otp    → POST /api/auth/otp/password-reset/verify
  verify-otp-only              → POST /api/auth/otp/verify
  send-super-admin-otp         → POST /api/super-admin/otp/send
  verify-super-admin-otp       → POST /api/super-admin/otp/verify
  send-push-notification       → POST /api/push/send (server-side only)
  fee-due-reminder             → Railway cron
  og-metadata                  → Express crawler middleware
  delete-school                → DELETE /api/super-admin/schools/:id
  toggle-school-status         → PATCH /api/super-admin/schools/:id/status
  cleanup-audit-logs, keep-alive, process-jobs → Railway cron

Execution order:
  Phase 1: copy tokens + ui/ + i18n + assets + generic hooks (mechanical).
  Phase 2: build src/lib/api.ts + src/stores/authStore.ts + tenant resolver.
  Phase 3: rewrite hooks in the dependency order in the migration guide.
  Phase 4: copy pages verbatim; only imports change.
  Phase 5: wire App.tsx (router, QueryClient offlineFirst + idb-keyval persister, TenantProvider,
           PWA registration via vite-plugin-pwa).
  Phase 6: verify with `bun run build` + `bun run typecheck` after each phase.

After each phase, list files touched and pause for review.
```

## Technical notes

- **Two frontends, one backend**: your React Native app uses school-code tenant resolution instead of subdomain — expose both `GET /api/tenants/resolve?subdomain=X` and `GET /api/tenants/resolve?code=Y`.
- **RLS parity**: Postgres RLS in Prisma via `SET LOCAL app.current_school_id = ...` in a middleware wrapping every request, plus `USING (school_id = current_setting('app.current_school_id')::uuid)` policies on every tenant table.
- **Realtime fees**: this Lovable app uses Supabase Realtime for live fee sync. On your stack, use Socket.IO room per `schoolId` and emit `fees:updated` from the Cashfree webhook handler.
- **PWA cache-busting**: keep the `buildId` inline script in `index.html` — critical for pushing UI updates.
- **Do NOT copy** `src/integrations/supabase/`, `supabase/`, `SUPABASE_*` env vars, `@supabase/supabase-js`.
