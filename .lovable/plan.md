

## Plan: PWA Install Module with QR Code Download

### Overview
Build a complete PWA install system across all roles (Admin, Teacher, Parent, Student) with school branding and a scannable QR code that links to the school's subdomain URL for easy app installation.

### 1. Install `vite-plugin-pwa` and configure

Update `vite.config.ts` to add the PWA plugin with:
- `registerType: 'autoUpdate'` for automatic service worker updates
- `navigateFallbackDenylist: [/^\/~oauth/]` to protect OAuth flows
- Minimal fallback manifest (overridden by `useDynamicManifest` at runtime)
- Workbox runtime caching for assets and API calls

### 2. Create `useInstallPrompt` hook

New file: `src/hooks/useInstallPrompt.ts`
- Captures `beforeinstallprompt` browser event
- Exposes `canInstall`, `triggerInstall()`, `isInstalled` (detects standalone mode)
- Dismissal state persisted in localStorage

### 3. Create `InstallAppBanner` component

New file: `src/components/pwa/InstallAppBanner.tsx`
- Floating bottom banner shown on mobile when app is not installed
- Displays school logo + name from `TenantContext`
- "Install" button and dismiss "X"
- Auto-hides when already installed or dismissed

### 4. Create `InstallAppPage` component with QR Code

New file: `src/components/pwa/InstallAppPage.tsx`

This is the main install guide page featuring:
- **School branding**: logo, name, primary color from TenantContext
- **Working QR code** using `qrcode.react` (already installed) that encodes the school's subdomain URL (e.g., `https://greenwood.ourschooltech.com`)
- **Platform detection**: shows native install button on Android, step-by-step "Add to Home Screen" instructions for iOS Safari
- **"Already Installed"** state when running in standalone mode
- **Feature highlights**: offline access, push notifications, fast loading

The QR code URL is constructed dynamically: `https://{school.code}.ourschooltech.com` -- so anyone scanning it on their phone lands on the school's branded landing page and can install from there.

### 5. Update `useDynamicManifest`

Add `id` field for better PWA identity tracking.

### 6. Integrate into all role settings/menus

- **Admin Settings** (`SettingsPage.tsx`): Add "App" tab with the install page + QR code
- **Teacher Settings** (`TeacherSettings.tsx`): Add "Install App" section with QR
- **Parent More** (`ParentMorePage.tsx`): Add "Install App" menu item; **Parent Settings** (`ParentSettings.tsx`): Add install section
- **Student Settings** (`StudentSettings.tsx`): Add install section
- **All dashboards**: Render `<InstallAppBanner />` globally in `App.tsx`

### 7. Clean up `main.tsx`

Remove old service worker unregister code -- `vite-plugin-pwa` handles SW lifecycle.

### Files to create
1. `src/hooks/useInstallPrompt.ts`
2. `src/components/pwa/InstallAppBanner.tsx`
3. `src/components/pwa/InstallAppPage.tsx`

### Files to modify
1. `vite.config.ts` -- add vite-plugin-pwa
2. `src/main.tsx` -- remove old SW cleanup
3. `src/hooks/useDynamicManifest.ts` -- add `id` field
4. `src/App.tsx` -- render InstallAppBanner
5. `src/pages/admin/SettingsPage.tsx` -- add App/Install tab
6. `src/pages/parent/ParentMorePage.tsx` -- add Install App link
7. `src/pages/parent/ParentSettings.tsx` -- add install section
8. `src/pages/student/StudentSettings.tsx` -- add install section
9. `src/pages/teacher/TeacherSettings.tsx` -- add install section

