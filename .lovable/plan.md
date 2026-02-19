
# Multi-Tenant Subdomain Architecture — Production SaaS

## Status: ✅ IMPLEMENTED (v2 - Single Login)

## Architecture Summary

### Single Login Flow (v2)
- Subdomains show ONE login form (no role buttons)
- After auth, role is auto-detected and user is redirected to correct dashboard
- Cross-tenant validation enforces school_id match

### Database Enhancements
- Extended `schools` table: `secondary_color`, `background_color`, `splash_screen_image_url`, `app_display_name`, `app_short_name`
- Performance indexes on: `attendance(school_id, date)`, `fees(school_id, status)`, `students(school_id, class_name)`, `students(school_id, status)`, `fee_invoices(school_id, student_id)`, `homework(school_id, class_id)`, `exams(school_id, class_name)`
- Unique index on `schools.code` (subdomain)
- Updated `get_school_by_code` RPC with all new fields

### Dynamic Branding
- CSS variables: `--primary`, `--accent`, `--secondary` injected per tenant
- Dynamic favicon, page title, theme-color meta tag
- Splash screen component (`SchoolSplashScreen`) for PWA standalone mode
- Dynamic PWA manifest with `app_display_name` and `app_short_name`

### Security
- RLS enforces school_id isolation on all tables
- Post-login validation: user.school_id must match subdomain school
- Super Admin blocked on all subdomains
- Single login prevents role enumeration

### Files
| File | Purpose |
|------|---------|
| `src/contexts/TenantContext.tsx` | Subdomain detection, branding, favicon, title |
| `src/pages/login/SubdomainLanding.tsx` | Single login form (no role buttons) |
| `src/components/splash/SchoolSplashScreen.tsx` | PWA splash screen per school |
| `src/hooks/useDynamicManifest.ts` | Runtime manifest with app_display_name support |
| `src/components/auth/ProtectedRoute.tsx` | Redirects to `/` on subdomain when unauthenticated |
