

## Plan: Fix Mobile Layout for All Users Page

The current mobile view wraps everything in a single Card with an "All System Users" header, and the hierarchical collapsibles are nested inside it. This looks cluttered. The fix is to remove the wrapping Card on mobile and instead show each section (Platform Users, each School) as its own standalone Card.

### Changes to `src/pages/super-admin/AllUsersPage.tsx`

1. **Remove wrapping Card on mobile** -- On mobile, instead of one big Card containing all collapsibles, render Platform Users and each School as separate Cards with their own headers.

2. **Simplify mobile structure**:
   - **Platform Users card** -- Own Card with ShieldAlert icon, contains super admin user cards
   - **Per-school cards** -- Each school gets its own Card with Building2 icon + school name as header, then role sub-groups (Admins, Teachers, Students) as collapsible sections inside
   - Each student card shows linked parent name inline

3. **Keep desktop unchanged** -- The table view with filter chips remains exactly as-is

### Files to modify
1. `src/pages/super-admin/AllUsersPage.tsx` -- Restructure mobile layout to use separate Cards per section instead of one wrapping Card

