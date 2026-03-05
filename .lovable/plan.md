

## Plan: Hide Role Filter Chips on Mobile

The role filter chips (All, Super Admin, School Admin, Teacher, Parent, Student, No Role) are still showing on mobile and look cluttered. Since the mobile view already uses the hierarchical grouping (Platform Users → Schools → Role sub-groups), these filter chips are redundant on mobile.

### Change

**`src/pages/super-admin/AllUsersPage.tsx`** — Wrap the role filter chips container (lines 133-165) with `hidden sm:block` so they only appear on desktop where the flat table view needs filtering. The mobile hierarchical view already organizes by role, making the chips unnecessary.

### Files to modify
1. `src/pages/super-admin/AllUsersPage.tsx` — Add `hidden sm:block` to the filter chips wrapper div

