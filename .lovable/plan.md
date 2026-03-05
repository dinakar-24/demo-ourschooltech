

## Plan: PWA Install Module + Logo Standardization + Branding Cleanup

Three workstreams: (1) PWA install infrastructure, (2) logo rendering fixes, (3) subdomain text removal.

---

### 1. PWA Install Infrastructure

**New files to create:**

**`src/hooks/useDynamicManifest.ts`**
- Generates a runtime manifest JSON blob using tenant data (name, logo, colors) and user role
- Sets `start_url` based on role (`/admin/dashboard`, `/teacher/dashboard`, etc.)
- Creates blob URL, injects `<link rel="manifest">` into `<head>`
- Cleans up on unmount

**`src/hooks/useInstallPrompt.ts`**
- Captures `beforeinstallprompt` event
- Exposes `canInstall`, `isInstalled` (standalone detection), `isIOS`, and `promptInstall()`
- Persists dismiss state in localStorage

**`src/pages/admin/InstallAppPage.tsx`**
- Admin page at `/admin/install-app` route
- Shows school logo + name (no subdomain)
- Large "Install App" button triggering native prompt (Android/Desktop)
- iOS instructions (Share → Add to Home Screen)
- QR code (using `qrcode.react`) pointing to current origin
- Wrapped in `AdminLayout`

**`src/components/pwa/DynamicManifestHandler.tsx`**
- Thin component that calls `useDynamicManifest` with tenant + user role
- Rendered globally in `AppRoutes`

**Files to edit:**

**`src/App.tsx`**
- Add lazy import for `InstallAppPage`
- Add route: `/admin/install-app`
- Render `DynamicManifestHandler` inside `AppRoutes` (after tenant loads)

**`src/components/admin/AdminQuickActions.tsx`**
- Add "Install App" tile with `Smartphone` icon linking to `/admin/install-app`
- Replace the existing "Add User" tile (redundant with Students page)

---

### 2. Logo Display Standardization

Fix all logo `<img>` tags to use `object-contain` and remove decorative styling. Every logo follows this pattern:

```tsx
<div className="w-X h-X flex items-center justify-center overflow-hidden shrink-0">
  <img src={logo} alt={name} className="max-w-full max-h-full object-contain" />
</div>
```

| File | Line | Fix |
|------|------|-----|
| `SchoolCard.tsx` | 61 | `object-cover` → `object-contain`, remove `bg-primary/10 rounded-lg` from container |
| `SchoolsTable.tsx` | 81 | `object-cover` → `object-contain`, remove `bg-primary/10 rounded-lg` from container |
| `AdminLayout.tsx` | 325 | `object-cover` → `object-contain`, remove `rounded-lg` |
| `MobileLayout.tsx` | 116 | Remove `rounded-full bg-white/20` |
| `TopBar.tsx` | 29 | Remove `rounded-lg` |
| `SubdomainLanding.tsx` | 74 | Remove `rounded-2xl shadow-lg ring-1 ring-black/5` |
| `AdminDashboard.tsx` | 108 | Remove `rounded-xl bg-muted/50 p-1` |
| `SchoolSplashScreen.tsx` | 24 | Remove `rounded-2xl` |
| `LoginPage.tsx` | 398 | `object-cover` → `object-contain`, remove `rounded-xl` from container |

---

### 3. Remove Subdomain Display

Remove any visible subdomain text (e.g., `sse.ourschooltech.com`) from the UI. The `SubdomainLanding.tsx` footer already shows `{tenant.name} School Portal` (no subdomain). Verify no other files display the subdomain string to users.

---

### Files Summary

**Create (4 files):**
1. `src/hooks/useDynamicManifest.ts`
2. `src/hooks/useInstallPrompt.ts`
3. `src/pages/admin/InstallAppPage.tsx`
4. `src/components/pwa/DynamicManifestHandler.tsx`

**Edit (11 files):**
1. `src/App.tsx` — route + manifest handler
2. `src/components/admin/AdminQuickActions.tsx` — add Install App tile
3. `src/components/super-admin/schools/SchoolCard.tsx` — logo fix
4. `src/components/super-admin/schools/SchoolsTable.tsx` — logo fix
5. `src/components/layout/AdminLayout.tsx` — logo fix
6. `src/components/layout/MobileLayout.tsx` — logo fix
7. `src/components/layout/TopBar.tsx` — logo fix
8. `src/pages/login/SubdomainLanding.tsx` — logo fix
9. `src/pages/admin/AdminDashboard.tsx` — logo fix
10. `src/components/splash/SchoolSplashScreen.tsx` — logo fix
11. `src/pages/LoginPage.tsx` — logo fix

