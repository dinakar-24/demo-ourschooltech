

## Plan: Hierarchical User Grouping on All Users Page

The current mobile view groups users by school name but shows all roles mixed together. The user wants a proper hierarchy:

```text
Platform Users
 └ Super Admins

School A
 ├ Admins
 ├ Teachers
 └ Students (with linked parent shown inline)

School B
 ├ Admins
 ├ Teachers
 └ Students (with linked parent shown inline)
```

Parents should not appear as a separate group -- instead, each student card should show the linked parent name/info directly on it.

### Changes

**1. Update `useAllUsers.ts` -- Enrich students with parent info (reverse direction)**
- Currently parents get `linked_students`. We also need students to get `linked_parent_name` and `linked_parent_email`.
- After fetching users, for student-role users, look up their email in the `students` table to get `parent_email`, then match that to a profile to get the parent's name.
- Add `linked_parent_name?: string` to the `UserWithRole` interface.

**2. Update mobile grouping in `AllUsersPage.tsx`**
- Replace the simple `groupedBySchool` with a hierarchical structure:
  - First group: "Platform Users" -- users with no `school_id` (super admins, no-role users)
  - Then per school: sub-group by role category: "Admins" (`school_admin`), "Teachers" (`teacher`), "Students" (`student`)
  - Parents are NOT shown as separate cards in the hierarchy -- instead their info is displayed on the student card
- Each sub-group gets a collapsible section header with role icon and count
- Use Collapsible component (already available) for expand/collapse per role group

**3. Update `UserCard.tsx` -- Show linked parent on student cards**
- For students: display linked parent name with a small "Parent:" label and contact icon
- Keep the existing linked_students display for parent cards (for desktop table view)

**4. Desktop table view**
- Keep as-is (table works well on desktop), but add a "Parent" column that shows for student rows

### Technical Details

- The `groupedBySchool` memo will become `hierarchicalGroups` producing: `Array<{ schoolName: string; roleGroups: Array<{ role: string; label: string; icon: Component; users: UserWithRole[] }> }>`
- Parent-student linking uses `students.parent_email` matched to `profiles.email` -- this query is already partially done; we just need the reverse lookup too
- Role sub-group order: Admins → Teachers → Students (parents hidden, shown on student cards)
- Each role sub-group header shows icon + label + count, with a chevron to collapse

### Files to modify
1. `src/hooks/useAllUsers.ts` -- add reverse parent lookup for students
2. `src/pages/super-admin/AllUsersPage.tsx` -- new hierarchical mobile grouping
3. `src/components/super-admin/UserCard.tsx` -- show parent info on student cards

