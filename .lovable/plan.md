

## Add Permissions to Mobile Admin Cards

The "Permissions" action is currently only visible in the **desktop table view** of the School Admins page. The mobile `AdminCard` component only renders the `UserActionsMenu` (Edit Profile, Reset Password, Disable, Delete) — no Permissions option.

### Fix

**`src/components/super-admin/AdminCard.tsx`**
- Accept `schoolId` from the admin object
- Import and render `ManagePermissionsDialog` inside the `UserActionsMenu` area (next to the three-dot menu) when the admin has a `school_id`
- This matches the desktop layout where both the Permissions button and actions menu sit side-by-side

### Result
Mobile admin cards will show a small "Permissions" button (shield icon) next to the three-dot menu, consistent with the desktop table view.

