
# Multi-Tenant Subdomain Architecture with Role-Based Separate PWAs

## Status: ✅ IMPLEMENTED

## What Was Done

### Database
- Created `get_school_by_code(code text)` RPC — SECURITY DEFINER, returns non-sensitive fields only, active schools only.

### New Files Created
| File | Purpose |
|------|---------|
| `src/contexts/TenantContext.tsx` | Subdomain detection, school lookup via RPC, CSS branding |
| `src/pages/login/RoleLoginPage.tsx` | Role-specific login page with unique gradients per role |
| `src/pages/login/SubdomainLanding.tsx` | Branded landing with 4 role navigation buttons |
| `src/pages/TenantErrorPage.tsx` | Error page for invalid/inactive subdomains |
| `src/hooks/useDynamicManifest.ts` | Runtime PWA manifest generation per school per role |

### Modified Files
| File | Change |
|------|--------|
| `src/App.tsx` | Wrapped in TenantProvider, tenant-aware routing with role entry points |
| `src/contexts/AuthContext.tsx` | Cross-tenant validation (sign out if school_id mismatch) |
| `src/components/auth/ProtectedRoute.tsx` | Subdomain-aware redirects on auth failure |
| `src/components/layout/Sidebar.tsx` | Dynamic school branding from tenant context |
| `src/components/layout/TopBar.tsx` | Dynamic school logo/name on subdomains |
| `src/hooks/useEffectiveSchoolId.ts` | Falls back to tenant school ID |
| `vite.config.ts` | PWA config note for dynamic manifest |

## How It Works

### On Subdomain (e.g., greenwood.ourschooltech.com)
- `/` → Branded landing with 4 role buttons
- `/admin` → Admin login (if not authenticated) or redirect to dashboard
- `/teacher` → Teacher login or dashboard
- `/parent` → Parent login or dashboard
- `/student` → Student login or dashboard
- `/super-admin/*` → Blocked with error page

### On Main Domain (ourschooltech.com)
- Everything works exactly as before
- `/super-admin/*` available

### Security
- RLS enforces school_id isolation (already in place)
- Post-login validation: user.school_id must match subdomain's school
- Mismatch → immediate sign-out + error

### DNS Setup (Per School)
1. Add A record: `schoolcode` → `185.158.133.1`
2. Add `schoolcode.ourschooltech.com` in project domain settings
3. SSL auto-provisions
