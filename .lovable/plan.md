

## Plan: Fix PWA Manifest — Correct Names, Proper Icons, Standalone App

### Problems Identified

1. **Name shows "DPS001"** — The `short_name` uses `tenant.code.toUpperCase()` (e.g., "DPS001") instead of a readable abbreviation. It should show role-specific names like "SSE Admin", "SSE Parent", etc.
2. **Logo not fitting** — The manifest declares the school logo as `purpose: 'any maskable'` combined in one entry. Maskable icons need safe-zone padding. Declaring a regular logo as maskable causes cropping/fitting issues.
3. **Chrome badge showing** — This happens when the PWA isn't properly installed via the manifest (likely because the dynamic manifest isn't applied correctly when not on a subdomain, or the static fallback manifest from vite-plugin-pwa takes over).
4. **Manifest only works on subdomain** — `useDynamicManifest` exits early with `if (!isSubdomain || !tenant) return;`, so when admin accesses via the main URL, the static "OurSchoolTech" manifest from `vite.config.ts` is used instead.

### Changes

#### 1. Fix `useDynamicManifest.ts`
- Remove the `if (!isSubdomain || !tenant) return;` guard — allow it to work for logged-in users even without subdomain by accepting school data as props
- Accept optional school branding props (name, logo, subdomain) as fallback when no tenant
- Fix `short_name` to use school abbreviation/subdomain + role (e.g., "SSE Admin", "SSE Parent") instead of the code
- Split icons into two entries: one with `purpose: 'any'` and one with `purpose: 'maskable'` — this prevents the cropping issue
- Add proper `categories` and `display_override` for better PWA behavior

#### 2. Update `src/App.tsx` (ManifestManager component)
- Pass school data from `useAuth()` to `useDynamicManifest` so it works even without subdomain/tenant context
- Fetch school branding (subdomain, logo, app_display_name) from DB when tenant is not available

#### 3. Update `vite.config.ts`
- Set `manifest: false` in vite-plugin-pwa config so the static manifest doesn't interfere with the dynamic one
- Keep service worker and workbox config as-is

### Files to Modify
1. `src/hooks/useDynamicManifest.ts` — accept school fallback, fix short_name, fix icon purpose
2. `src/App.tsx` — pass school branding to manifest hook
3. `vite.config.ts` — disable static manifest generation

