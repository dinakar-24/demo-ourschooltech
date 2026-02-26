

## Plan: Auto-Detect Super Admin from Email Lookup

### What Changes
Remove the visible "Super Admin Access" button from the email step. Instead, when a user enters their email and clicks Continue, the system will check the role returned by `lookup_user_by_email`. If the role is `super_admin`, it will automatically route to the Super Admin OTP flow (pre-filling the email so they don't have to type it again).

### Steps

1. **Remove "Super Admin Access" button and `onSuperAdmin` prop from `EmailStep`** in `LoginPage.tsx`
   - Delete the button and the `onSuperAdmin` prop from the component signature

2. **Update `handleEmailSubmit` logic** in `LoginPage.tsx`
   - After the lookup RPC returns, check if `result.role === 'super_admin'`
   - If yes: set the step to `'superadmin'` instead of `'password'`
   - If no: proceed to password step as before

3. **Update `SuperAdminOTPLogin` component** to accept a pre-filled email
   - Add an `initialEmail` prop so the email from the login form carries over
   - Initialize the internal `email` state with `initialEmail`
   - If `initialEmail` is provided, auto-trigger OTP send on mount (skip the email entry step)

4. **Update the super admin section in `LoginPage`** to pass the email:
   - `<SuperAdminOTPLogin onBack={...} onSuccess={...} initialEmail={email} />`

### Technical Details

**File: `src/pages/LoginPage.tsx`**
- Remove `onSuperAdmin` prop from `EmailStep` component and its usage
- Remove `Shield` icon import if no longer needed
- In `handleEmailSubmit`: add `if (result.role === 'super_admin') { setStep('superadmin'); return; }` after the found check
- Pass `initialEmail={email}` to `SuperAdminOTPLogin`

**File: `src/components/auth/SuperAdminOTPLogin.tsx`**
- Add `initialEmail?: string` to props interface
- Initialize email state: `useState(initialEmail || '')`
- Add `useEffect` to auto-send OTP when `initialEmail` is provided (skip email step, go straight to OTP)

