# Our School Tech — Frontend Migration Guide

Port this Lovable frontend 1:1 onto your new stack:

- **Web:** React 18 + Vite 5 + TS + Tailwind + shadcn/ui + TanStack Query + Zustand + React Router v6, Vercel (`*.ourschooltech.com`)
- **Backend:** Node.js + Express + Prisma + Postgres + JWT + RBAC + RLS, Railway
- **Services:** AWS S3, Resend, MSG91, web-push (VAPID), Expo Notifications, Cashfree, Razorpay, jsPDF, ExcelJS

---

## Phase 0 — Parity setup in `web/`

```bash
bun add @tanstack/react-query zustand react-router-dom react-hook-form zod \
  @hookform/resolvers axios date-fns lucide-react clsx tailwind-merge \
  class-variance-authority sonner cmdk exceljs jspdf jspdf-autotable \
  idb-keyval i18next react-i18next i18next-browser-languagedetector workbox-window
bun add -D vite-plugin-pwa @types/node
```

Copy shadcn config from Lovable source: `components.json`, `tailwind.config.ts`, `postcss.config.js`.

---

## Phase 1 — Copy verbatim (zero Supabase coupling)

| From (Lovable) | To (`web/`) |
|---|---|
| `src/index.css`, `src/App.css` | same path — design tokens (deep teal `#0F766E`) |
| `tailwind.config.ts` | same path |
| `src/components/ui/**` | same path — all shadcn primitives |
| `src/lib/utils.ts`, `indian-numbering.ts`, `bulk-upload-utils.ts` | same path |
| `src/hooks/use-mobile.tsx`, `use-toast.ts`, `useDebounce.ts`, `usePagination.ts`, `useRefreshDetection.ts`, `useInstallPrompt.ts` | same path |
| `src/i18n/**` | same path — 8 languages |
| `src/assets/**` | same path |
| `public/**` | same path — PWA icons, manifest |

---

## Phase 2 — Replace the data layer (the real work)

The whole app touches Supabase in **3 shapes only**. Rewire them once and 90% of hooks compile untouched.

### 2.1 Auth (`supabase.auth.*` → JWT)

Create `src/lib/api.ts`:

```ts
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use((cfg) => {
  const t = useAuthStore.getState().accessToken;
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

let refreshing: Promise<void> | null = null;
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      refreshing ||= useAuthStore.getState().refresh().finally(() => (refreshing = null));
      await refreshing;
      return api(err.config);
    }
    throw err;
  }
);
```

Create `src/stores/authStore.ts` (Zustand + `idb-keyval` persistence): `{ user, accessToken, refreshToken, schoolId, role, login(), logout(), refresh() }`.

**Migration shim:** replace `src/integrations/supabase/client.ts` with a thin wrapper exposing `.auth.signInWithPassword`, `.auth.getSession`, `.from(table)` proxied to REST — lets you migrate incrementally without breaking every import. Delete once all hooks are rewritten.

### 2.2 CRUD (`supabase.from(...)` → REST)

Backend must expose conventional REST. Tenant `schoolId` is **always** derived server-side from JWT — never accept it from the client body.

```
GET    /api/students?classId=&page=&pageSize=
POST   /api/students
PATCH  /api/students/:id
DELETE /api/students/:id
```

Rewrite hooks in this **dependency order** (preserve TanStack Query keys so components need zero edits):

1. `useSchools`, `useAcademicYears`, `useClasses`, `useSections`
2. `useStudents`, `useSchoolAdmins`, `useAllUsers`, `useManageUser`, `useCreateSchoolUser`
3. `useAttendance`, `useAdminAttendance`, `useStudentAttendanceHistory`
4. `useFees`, `useFeeInvoices`, `useParentInvoices`, `useStudentFeeInvoices`, `usePaymentConfig`, `usePaymentSubmissions`, `useOnlinePayments`, `useReceiptGeneration`, `useFeeReports`
5. `useAnnouncements`, `useHomework`, `useExams`, `useGallery`, `useOnlineClasses`, `useFeedback`
6. `useNotifications`, `usePushNotifications`
7. `useCashfree`, `useRazorpay`
8. `useReportGenerators`, `useSchoolReportStats`, `useParentData`, `useStudentData`

### 2.3 Edge functions → REST routes

| Lovable edge function | New Express route |
|---|---|
| `create-school-user` | `POST /api/admin/users` |
| `create-student-with-accounts` | `POST /api/admin/students` |
| `create-super-admin` | `POST /api/super-admin/users` |
| `manage-user` | `PATCH /api/admin/users/:id` |
| `delete-school-user` | `DELETE /api/admin/users/:id` |
| `bulk-upload` | `POST /api/admin/bulk-upload` |
| `delete-all-students` | `DELETE /api/admin/students/all` |
| `create-cashfree-order` | `POST /api/payments/cashfree/order` |
| `cashfree-webhook` | `POST /api/webhooks/cashfree` |
| `verify-receipt` | `POST /api/receipts/verify` |
| `create-razorpay-order` | `POST /api/billing/razorpay/order` |
| `verify-razorpay-payment` | `POST /api/billing/razorpay/verify` |
| `send-password-reset-otp` | `POST /api/auth/otp/password-reset/send` |
| `verify-password-reset-otp` | `POST /api/auth/otp/password-reset/verify` |
| `verify-otp-only` | `POST /api/auth/otp/verify` |
| `send-super-admin-otp` | `POST /api/super-admin/otp/send` |
| `verify-super-admin-otp` | `POST /api/super-admin/otp/verify` |
| `send-push-notification` | `POST /api/push/send` (server-only) |
| `og-metadata` | Express crawler middleware (checks UA) |
| `delete-school` | `DELETE /api/super-admin/schools/:id` |
| `toggle-school-status` | `PATCH /api/super-admin/schools/:id/status` |
| `fee-due-reminder`, `cleanup-audit-logs`, `keep-alive`, `process-jobs`, `migrate-logos-to-storage` | Railway cron jobs |

---

## Phase 3 — Copy pages/components

After Phase 2, pages copy over almost verbatim. Order:

1. `src/contexts/**` → adapt TenantContext/AuthContext to read from Zustand
2. `src/components/layout/**`, `MobileLayout`, sidebar, header
3. `src/pages/login/**` — swap `supabase.auth.signInWithPassword` for `api.post('/auth/login')`
4. `src/pages/admin/**` (Dashboard, Students, Fees, Attendance, Announcements, Classes, Homework, Reports, Teachers, BulkUploadPage)
5. `src/pages/super-admin/**`
6. `src/pages/parent/**`, `student/**`, `teacher/**`
7. `PublicInstallPage.tsx`, `TenantErrorPage.tsx`, `NotFound.tsx`, `ReceiptVerificationPage.tsx`, `NotificationsPage.tsx`
8. `src/App.tsx` + `src/main.tsx` — wire Router, QueryClient (offlineFirst + idb-keyval persister), TenantProvider, PWA registration

---

## Phase 4 — Push notifications

- **Web:** rewrite `usePushNotifications` to `POST /api/push/subscribe` with the browser `PushSubscription`. Backend stores in `push_subscriptions` table, uses `web-push` npm with VAPID keys.
- **Mobile (Expo):** `expo-notifications` — Expo token POSTed to `/api/push/subscribe` with `platform: "expo"`. Backend fans out via Expo Push API for expo tokens, `web-push` for browser subs.

---

## Phase 5 — Payments

- Keep the client-side Cashfree SDK usage in `useCashfree.ts` and Razorpay SDK in `useRazorpay.ts` — only the order-creation and verification calls swing to your backend.
- Backend: create orders with server-side keys; verify webhooks with HMAC signature check.
- **Cashfree** stays for parent fee payments. **Razorpay** is new — for schools paying you SaaS fees.

---

## Phase 6 — Subdomain tenancy

- **Vercel:** add wildcard `*.ourschooltech.com` in project domains. Vercel provisions the wildcard cert automatically.
- **Client:** `src/lib/tenant.ts` reads `window.location.hostname`, extracts subdomain, calls public `GET /api/tenants/resolve?subdomain=xyz` → `{ schoolId, name, logo, primaryColor }`. Cache with in-memory LRU or Redis on backend.
- **Mobile:** same endpoint but `?code=xyz` (school code instead of subdomain).
- All authenticated requests derive `schoolId` from the JWT payload server-side — never trust client-supplied tenant.

---

## Phase 7 — Storage (S3)

- Backend: `POST /api/uploads/sign` → S3 presigned PUT URL (5-min expiry, scoped key like `schools/{schoolId}/avatars/{uuid}.jpg`).
- Client: PUT the file directly to S3, then POST the resulting URL to the entity endpoint.
- Rewrite `useAvatarUpload.ts` + logo/gallery/announcement upload paths.

---

## Phase 8 — Cleanup

- Delete `src/integrations/supabase/` and the shim
- Delete `supabase/` folder
- Remove `@supabase/supabase-js` from `package.json`
- Env: remove `VITE_SUPABASE_*`, add `VITE_API_URL`, `VITE_VAPID_PUBLIC_KEY`, `VITE_CASHFREE_APP_ID`, `VITE_RAZORPAY_KEY_ID`

---

## Backend parity notes

- **RLS in Prisma:** wrap every request in a middleware that runs `SET LOCAL app.current_school_id = $1`, then Postgres policies enforce isolation:
  ```sql
  CREATE POLICY tenant_isolation ON students
    USING (school_id = current_setting('app.current_school_id')::uuid);
  ```
- **Realtime fees:** Lovable uses Supabase Realtime. On your stack, use Socket.IO with a room per `schoolId`; emit `fees:updated` from the Cashfree webhook handler. Frontend `useFeeRealtime.ts` swaps the channel API for `socket.on()`.
- **PWA cache-busting:** keep the `buildId` inline script in `index.html` — critical for pushing UI updates across installed PWAs.
- **Do NOT copy:** `src/integrations/supabase/`, `supabase/`, any `SUPABASE_*` env var, `@supabase/supabase-js`.