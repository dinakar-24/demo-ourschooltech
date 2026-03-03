

# Overall Missing Updates Across All Portals

After a thorough audit of the entire codebase, here are the gaps and missing updates organized by portal.

---

## 1. Student Portal -- Missing Pages & Features

| Gap | Detail |
|-----|--------|
| **No Messages page** | Students have no `StudentMessages.tsx` -- they cannot message teachers or admin |
| **No Fees page** | Students cannot view their own fee invoices or payment status |
| **No Feedback page** | Students cannot submit feedback (parents can) |
| **No Queries page** | Students cannot raise help queries (parents can) |
| **No "More" page** | Unlike Parent portal, student has no overflow menu page -- the bottom nav "More" tab links to `/student/announcements` instead of a proper More page |
| **Missing i18n on bottom nav** | Student "More" tab goes to announcements, not a dedicated More page like parent |

**Fix**: Create `StudentMessages.tsx`, `StudentFees.tsx`, `StudentFeedback.tsx`, `StudentQueries.tsx`, `StudentMorePage.tsx` and add routes + sidebar/nav entries.

---

## 2. Teacher Portal -- Hardcoded Data & Missing Features

| Gap | Detail |
|-----|--------|
| **Hardcoded phone number** | `TeacherProfile.tsx` line 72: shows `+91 98765 43210` instead of fetching actual phone from `profiles` table |
| **Hardcoded stats** | `TeacherProfile.tsx` lines 85-99: Students=156, Classes=4, Subjects=2 are all hardcoded -- not fetched from DB |
| **Hardcoded schedule** | `TeacherDashboard.tsx` lines 70-75: `todayClasses` array is static dummy data, not from timetable_entries |
| **Hardcoded pending tasks** | `TeacherDashboard.tsx` lines 77-81: Static dummy pending tasks |
| **Menu items not navigating** | `TeacherProfile.tsx` menu buttons have no `onClick={() => navigate(item.href)}` -- they are dead buttons |
| **Invalid routes** | Teacher profile links to `/teacher/notifications`, `/teacher/schedule`, `/teacher/subjects` -- none of these routes exist |
| **No "More" page** | Teacher bottom nav "More" goes to `/teacher/announcements`, not a proper overflow menu |

**Fix**: Fetch real data from DB, wire up navigation, create missing routes or fix links to existing pages (e.g., `/teacher/timetable` instead of `/teacher/schedule`).

---

## 3. Parent Portal -- Missing i18n

| Gap | Detail |
|-----|--------|
| **No i18n translations** | `ParentDashboard.tsx` has all labels hardcoded in English ("Attendance", "Pending Fees", "Quick Actions", etc.) unlike Student dashboard which uses `t()` |
| **ParentProfile.tsx** | All labels hardcoded ("Profile", "Parent", "WARD DETAILS", "Feedback", "Settings", etc.) |
| **ParentMorePage.tsx** | All section titles and labels hardcoded in English |
| **No Homework section on dashboard** | Parent dashboard shows fees + attendance stats but no homework summary like student dashboard has |

**Fix**: Wrap all strings in `t()` calls matching the pattern used in Student portal.

---

## 4. Admin Portal -- Minor Gaps

| Gap | Detail |
|-----|--------|
| **Dashboard labels not translated** | `AdminDashboard.tsx` uses hardcoded "Good morning", "Students", "Teachers", "Quick Actions" instead of `t()` |
| **Holiday Calendar not in sidebar** | Holiday Calendar and Employee Attendance are in AdminLayout submenu but missing from `Sidebar.tsx` grouped nav |

**Fix**: Add i18n, add missing sidebar entries.

---

## 5. Super Admin Portal -- Minor Gaps

| Gap | Detail |
|-----|--------|
| **Dashboard not translated** | All labels hardcoded in English |
| **No Reports link in sidebar** | `SuperAdminReportsPage` exists but "Reports" is not in sidebar `menuConfig.super_admin` |

**Fix**: Add i18n, add Reports to sidebar.

---

## 6. Cross-Portal Issues

| Gap | Detail |
|-----|--------|
| **Bottom nav "More" inconsistency** | Parent has a proper `ParentMorePage`; Student and Teacher "More" tabs link to announcements |
| **Settings pages identical** | All 3 settings pages (Student, Parent, Teacher) are copy-paste identical -- could be a shared component |
| **No password change** | None of the profile pages allow users to change their password |
| **No dark mode toggle in Settings** | Theme provider exists but no UI toggle in any settings page |

---

## Implementation Plan

### Phase 1: Fix Critical Gaps (Student missing pages)
1. Create `StudentMorePage.tsx` with proper overflow menu (mirrors ParentMorePage)
2. Create `StudentFees.tsx` -- view invoices and payment status for the logged-in student
3. Create `StudentMessages.tsx` -- messaging page for students
4. Create `StudentFeedback.tsx` and `StudentQueries.tsx`
5. Add all new routes in `App.tsx`
6. Update student sidebar and bottom nav to include new pages

### Phase 2: Fix Teacher Hardcoded Data
7. Fetch real phone, stats (student count, class count, subject count) from DB in `TeacherProfile.tsx`
8. Replace hardcoded `todayClasses` with real timetable data in `TeacherDashboard.tsx`
9. Fix dead menu buttons in TeacherProfile -- wire `onClick` navigation, fix invalid routes
10. Create `TeacherMorePage.tsx`

### Phase 3: Add i18n to Parent & Admin
11. Add `t()` wrappers to `ParentDashboard.tsx`, `ParentProfile.tsx`, `ParentMorePage.tsx`
12. Add `t()` wrappers to `AdminDashboard.tsx`, `SuperAdminDashboard.tsx`

### Phase 4: Cross-Portal Improvements
13. Add "Reports" to super admin sidebar
14. Add Holiday Calendar / Employee Attendance to admin sidebar
15. Add dark mode toggle to all Settings pages
16. Add password change option to profile pages

---

## Technical Notes

- New student pages will follow existing patterns (e.g., `useStudentProfile` hook, `MobileLayout` wrapper)
- Student fees page will reuse `useParentInvoices` hook adapted for student's own ID
- Teacher real data will come from existing `timetable_entries` table and `get_teacher_dashboard_stats` RPC
- i18n keys will be added to `src/i18n/locales/en.ts` and other locale files
- No database migrations needed -- all data tables already exist

