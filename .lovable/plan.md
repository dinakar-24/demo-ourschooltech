# Multi-Tenant Subdomain Architecture with Role-Based Separate PWAs

## Overview

Transform the app so each school gets its own subdomain (e.g., `greenwood.ourschooltech.com`) with 4 standalone role-based entry points (`/admin`, `/teacher`, `/parent`, `/student`). Each becomes a separately installable PWA. Super Admin remains on the main domain only.

## Implementation Steps

### Step 1: Database -- New RPC Function

Create a `get_school_by_code` function for exact-match school lookup by subdomain code. This is called before authentication, so it uses `SECURITY DEFINER` and returns only non-sensitive fields.

```text
get_school_by_code(code text)
  Returns: id, name, code, logo, primary_color, accent_color, is_active
  Accessible without auth
  Only returns active schools
```

### Step 2: TenantContext

New file: `src/contexts/TenantContext.tsx`

- On mount, reads `window.location.hostname`
- Extracts subdomain (everything before `.ourschooltech.com`)
- Calls `get_school_by_code` RPC to resolve school data
- Provides to all components: `tenant` (schoolId, name, logo, colors), `isSubdomain`, `isLoading`, `tenantError`
- Applies school's `primary_color` and `accent_color` as CSS custom properties on `:root`
- On main domain or localhost: tenant = null, existing flow preserved
- Configurable base domain via environment or constant

### Step 3: Role-Specific Login Page

New file: `src/pages/login/RoleLoginPage.tsx`

A reusable component receiving `role` as a prop:

- On subdomains: school is already known from TenantContext, shows school logo/name + email/password form directly. No school search, no role picker.
- Each role gets a unique gradient background:
  - Admin: Red/Orange
  - Teacher: Blue
  - Parent: Green
  - Student: Amber
- After login: validates `user.school_id === tenant.schoolId` and `user.role === expectedRole`. Mismatches trigger sign-out with error message.

### Step 4: Subdomain Landing Page

New file: `src/pages/login/SubdomainLanding.tsx`

When visiting subdomain root (`/`):

- Shows school logo and name (from TenantContext)
- 4 direct navigation buttons: Admin, Teacher, Parent, Student
- Each links to `/{role}` which renders the role login or dashboard
- This is simple navigation, not a role selector

### Step 5: Tenant Error Page

New file: `src/pages/TenantErrorPage.tsx`

Shown when:

- Subdomain doesn't match any active school
- Super Admin routes are accessed on a subdomain

### Step 6: Dynamic PWA Manifest

New file: `src/hooks/useDynamicManifest.ts`

- Generates a manifest JSON blob at runtime based on tenant + current role
- Sets `name` to "{School Name} - {Role}" (e.g., "Greenwood - Parent")
- Uses school logo URL as icon
- Uses school's `primary_color` as `theme_color`
- Sets `start_url` to the role-specific dashboard path
- Creates blob URL and replaces `<link rel="manifest">` in document head
- On main domain: falls back to the default static manifest
- Service worker cache keys include role path to avoid cross-role conflicts

### Step 7: Routing Updates (App.tsx)

The router becomes tenant-aware:

**When on a subdomain (tenant detected):**

- `/` -- SubdomainLanding (4 role buttons)
- `/admin` -- If authenticated as admin, show admin dashboard routes. If not, show RoleLoginPage(role=school_admin)
- `/teacher` -- Same pattern for teacher
- `/parent` -- Same pattern for parent
- `/student` -- Same pattern for student
- `/admin/*`, `/teacher/*`, `/parent/*`, `/student/*` -- Existing dashboard routes (unchanged)
- `/super-admin/*` -- Blocked, shows TenantErrorPage
- `/login` -- Redirect to `/`

**When on main domain (no tenant):**

- Everything works exactly as it does today (splash, school search, role selector, login)
- `/super-admin/*` available

### Step 8: Cross-Tenant Security (AuthContext.tsx)

After login, add validation:

1. If tenant context has a schoolId, compare with `user.school_id` -- mismatch triggers sign-out + error
2. Compare `user.role` with URL's expected role -- mismatch triggers sign-out + error

### Step 9: Layout Branding (Sidebar.tsx, TopBar.tsx)

- Read school name and logo from TenantContext when on a subdomain
- Fall back to current behavior on main domain

### Step 10: PWA Config (vite.config.ts)

- Adjust `vite-plugin-pwa` to not inject a static manifest link when dynamic manifest is active
- Keep service worker registration for offline support

---

## Files Summary

### New Files


| File                                   | Purpose                                             |
| -------------------------------------- | --------------------------------------------------- |
| `src/contexts/TenantContext.tsx`       | Subdomain detection, school lookup, CSS branding    |
| `src/pages/login/RoleLoginPage.tsx`    | Role-specific login page (reusable for all 4 roles) |
| `src/pages/login/SubdomainLanding.tsx` | Branded landing with 4 role navigation buttons      |
| `src/pages/TenantErrorPage.tsx`        | Error page for invalid subdomains                   |
| `src/hooks/useDynamicManifest.ts`      | Runtime PWA manifest generation per school per role |


### Modified Files


| File                                     | Change                                       |
| ---------------------------------------- | -------------------------------------------- |
| `src/App.tsx`                            | Wrap in TenantProvider, tenant-aware routing |
| `src/contexts/AuthContext.tsx`           | Cross-tenant + role validation after login   |
| `src/components/layout/Sidebar.tsx`      | Dynamic school branding from tenant          |
| `src/components/layout/TopBar.tsx`       | Dynamic school name/logo                     |
| `src/hooks/useEffectiveSchoolId.ts`      | Fall back to tenant school ID                |
| `src/components/auth/ProtectedRoute.tsx` | Redirect to subdomain login on auth failure  |
| `vite.config.ts`                         | PWA dynamic manifest adjustment              |


### Removed Files


| File                                         | Reason                             |
| -------------------------------------------- | ---------------------------------- |
| `src/components/login/LoginRoleSelector.tsx` | Role determined by URL, not picker |


### Database Changes


| Change                        | Details                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| New RPC: `get_school_by_code` | Exact match by school code, SECURITY DEFINER, no auth required |


---

## DNS Setup (Per School)

For each school onboarded:

1. Add A record: `schoolcode` pointing to `185.158.133.1`
2. Add `schoolcode.ourschooltech.com` in project domain settings
3. SSL provisions automatically

Manual step per school -- no wildcard auto-provisioning on this platform.

---

## Security Summary


| Layer                 | Protection                                                   |
| --------------------- | ------------------------------------------------------------ |
| Database RLS          | All tables enforce school_id filtering (already in place)    |
| Post-login validation | user.school_id must match subdomain's school                 |
| Role validation       | user.role must match URL's expected role                     |
| Super Admin isolation | Blocked on all subdomains                                    |
| Invalid subdomains    | Error page shown                                             |
| School code lookup    | Exact match, active schools only, no sensitive data returned |


---

## Result Per School

For school code "greenwood":


| URL                                 | Installable PWA Name |
| ----------------------------------- | -------------------- |
| greenwood.ourschooltech.com/admin   | Greenwood Admin      |
| greenwood.ourschooltech.com/teacher | Greenwood Teacher    |
| greenwood.ourschooltech.com/parent  | Greenwood Parent     |
| greenwood.ourschooltech.com/student | Greenwood Student    |


4 separately installable PWA apps per school, each with the school's own logo and colors.

Add this validation in TenantContext:

&nbsp;

If hostname equals base domain (no subdomain):

&nbsp;

tenant = null

isSubdomain = false

&nbsp;

&nbsp;

But if hostname has unexpected format (like test.evil.com via preview link):

&nbsp;

Block it.

&nbsp;

Example:

&nbsp;

If hostname does not end with .ourschooltech.com

→ Show error.