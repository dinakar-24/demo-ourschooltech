# Claude Code — Our School Tech Migration Prompt

Paste the block below into Claude Code (in your `web/` repo, with the Lovable source checked out at `./lovable-source/`).

---

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

RULES

1. Copy design tokens exactly: src/index.css, tailwind.config.ts, all src/components/ui/**.
   Never hardcode colors — always use semantic tokens (bg-primary, text-foreground, etc.).
   Deep teal (#0F766E) is primary. Preserve dark mode variables.

2. Replace the data layer, not the UI:
   - Create src/lib/api.ts (axios, JWT interceptor, refresh-on-401, single-flight refresh).
   - Create src/stores/authStore.ts (Zustand + idb-keyval persist).
   - For every hook in src/hooks/use*.ts, replace supabase.from(...) with api.get/post/patch/delete,
     preserving the TanStack Query key shape so no component needs edits.
   - For every supabase.functions.invoke("name", { body }) call, replace with POST to the
     corresponding /api/... route (see mapping table below).

3. Tenant resolution: read subdomain from window.location.hostname, hit
   GET /api/tenants/resolve?subdomain=X (public). Never trust client-supplied schoolId —
   server derives it from JWT.

4. Auth flow: POST /api/auth/login → { accessToken, refreshToken, user }. Store both in
   Zustand + idb-keyval. Refresh on 401. Logout clears store and calls /api/auth/logout.

5. Push notifications: useWebPush hook POSTs PushSubscription to /api/push/subscribe.

6. Uploads: POST /api/uploads/sign returns S3 presigned URL; client PUTs; POSTs final URL to entity.

7. Payments: keep Cashfree + Razorpay client SDKs; order creation + webhook verification on backend.

8. Preserve: mobile-first MobileLayout, Drawer max 85dvh, Indian numbering (1L/1K), i18n 8 langs,
   ExcelJS only (never xlsx), all images loading="lazy" with explicit dimensions,
   PWA install prompt behavior, buildId cache-busting script in index.html.

9. Router: preserve all routes exactly — /login, /dashboard, /students, /fees, /attendance,
   /announcements, /parent/*, /student/*, /teacher/*, /super-admin/*, /install, /receipt/verify.

10. Do not introduce Next.js, RSC, or any framework change. Vite only.

ROUTE MAPPING (edge function → REST)

  create-school-user           → POST   /api/admin/users
  create-student-with-accounts → POST   /api/admin/students
  create-super-admin           → POST   /api/super-admin/users
  manage-user                  → PATCH  /api/admin/users/:id
  delete-school-user           → DELETE /api/admin/users/:id
  bulk-upload                  → POST   /api/admin/bulk-upload
  delete-all-students          → DELETE /api/admin/students/all
  create-cashfree-order        → POST   /api/payments/cashfree/order
  cashfree-webhook             → POST   /api/webhooks/cashfree
  verify-receipt               → POST   /api/receipts/verify
  create-razorpay-order        → POST   /api/billing/razorpay/order
  verify-razorpay-payment      → POST   /api/billing/razorpay/verify
  send-password-reset-otp      → POST   /api/auth/otp/password-reset/send
  verify-password-reset-otp    → POST   /api/auth/otp/password-reset/verify
  verify-otp-only              → POST   /api/auth/otp/verify
  send-super-admin-otp         → POST   /api/super-admin/otp/send
  verify-super-admin-otp       → POST   /api/super-admin/otp/verify
  send-push-notification       → POST   /api/push/send  (server-side only)
  fee-due-reminder             → Railway cron
  og-metadata                  → Express crawler middleware (User-Agent check)
  delete-school                → DELETE /api/super-admin/schools/:id
  toggle-school-status         → PATCH  /api/super-admin/schools/:id/status
  cleanup-audit-logs, keep-alive, process-jobs, migrate-logos-to-storage → Railway cron

EXECUTION ORDER

  Phase 1: copy tokens + ui/ + i18n + assets + generic hooks (mechanical).
  Phase 2: build src/lib/api.ts + src/stores/authStore.ts + tenant resolver.
  Phase 3: rewrite hooks in dependency order:
           schools → academic years → classes → sections →
           students → users → attendance → fees → invoices → payments →
           announcements → homework → exams → gallery → online classes → feedback →
           notifications → push → reports.
  Phase 4: copy pages verbatim; only imports change.
  Phase 5: wire App.tsx (router, QueryClient offlineFirst + idb-keyval persister,
           TenantProvider, PWA registration via vite-plugin-pwa).
  Phase 6: run `bun run build` + `bunx tsgo --noEmit` after each phase; fix errors before continuing.

After each phase, list files touched and pause for review.

DO NOT copy: src/integrations/supabase/**, supabase/**, @supabase/supabase-js,
             VITE_SUPABASE_* env vars.
```