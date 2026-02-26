

# Timetable Redesign: Data-Driven Grid + Image Upload

## Overview
Transform the admin timetable page from image-only to a full data-driven timetable grid (like the reference screenshots), where admins can view and edit periods with subject, teacher, and time slots for each day. The existing image upload feature will be preserved as a secondary tab.

## Database Changes

### New Table: `timetable_entries`
Stores individual period slots in the timetable grid.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| school_id | uuid | Multi-tenant isolation |
| class_name | text | e.g. "Class 10" |
| section | text | e.g. "A" |
| period_number | integer | 1, 2, 3... |
| day_of_week | text | Monday-Saturday |
| subject | text | e.g. "Mathematics" |
| teacher_id | uuid | FK to teachers table (nullable) |
| start_time | text | e.g. "08:00" |
| end_time | text | e.g. "08:30" |
| is_lunch | boolean | default false |
| created_at | timestamptz | |
| updated_at | timestamptz | |

- Unique constraint on (school_id, class_name, section, period_number, day_of_week)
- RLS: Admins can manage, school users can view

### New Table: `timetable_periods`
Defines the period structure (number of periods, their default times) per school.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| school_id | uuid | |
| period_number | integer | |
| start_time | text | |
| end_time | text | |
| is_lunch | boolean | default false |
| label | text | e.g. "Period 1", "LUNCH" |
| created_at | timestamptz | |

- Unique constraint on (school_id, period_number)
- RLS: Admins can manage, school users can view

## Admin Timetable Page Redesign

### Two-Tab Layout
1. **Timetable Grid** (default) - Data-driven view/edit
2. **Upload Image** - Existing image upload feature (preserved as-is)

### Tab 1: Timetable Grid

**Top Bar:**
- Class dropdown + Section dropdown (existing)
- "View" / "Edit" mode toggle button

**View Mode:**
- Table grid: rows = periods (Period 1, Period 2..., LUNCH, Period 7...), columns = Monday through Saturday
- Each cell shows: Subject name (bold), Teacher name (small), Time range (small/muted)
- LUNCH rows displayed as colored badges spanning columns
- Matches the reference screenshot style

**Edit Mode:**
- Clicking any cell opens a "Choose Details" dialog (like reference image-166/167):
  - Start Time / End Time inputs
  - Teacher dropdown (from school's teachers)
  - Subject dropdown (from teacher's subjects or free text)
  - "Is Lunch" checkbox
  - "Change for complete week" checkbox (applies same entry to all days for that period)
  - Cancel / Save buttons
- Empty cells show a "+" button to add
- Filled cells show an "x" delete icon on hover
- Period rows can be added/removed via "Add Period" button

### Tab 2: Upload Image
- Existing image upload/view/delete functionality moved here unchanged

## Student & Teacher Timetable Pages

### Student Timetable (`StudentTimetable.tsx`)
- Add a tab system: "Schedule" (grid view from `timetable_entries`) and "Image" (existing image view)
- Grid is read-only, auto-filtered to student's class/section
- Falls back gracefully if no data entries exist

### Teacher Timetable (`TeacherTimetable.tsx`)
- Same two-tab approach
- Grid view with class/section selector (existing dropdowns)
- Read-only grid view

## New Files

| File | Purpose |
|------|---------|
| `src/hooks/useTimetableEntries.ts` | Hook to fetch/mutate timetable_entries and timetable_periods |
| `src/components/timetable/TimetableGrid.tsx` | Reusable grid component (view mode) |
| `src/components/timetable/TimetableEditor.tsx` | Admin edit mode wrapper |
| `src/components/timetable/PeriodEditDialog.tsx` | Dialog for editing a single cell |

## Modified Files

| File | Change |
|------|--------|
| `src/pages/admin/TimetablePage.tsx` | Add tabs, integrate grid + editor, keep image upload in tab 2 |
| `src/pages/student/StudentTimetable.tsx` | Add tab for grid view alongside image |
| `src/pages/teacher/TeacherTimetable.tsx` | Add tab for grid view alongside image |

## Implementation Order

1. Create database migration (2 new tables with RLS)
2. Build `useTimetableEntries` hook
3. Build `TimetableGrid` component (view mode)
4. Build `PeriodEditDialog` component
5. Build `TimetableEditor` component (edit mode with dialog)
6. Redesign `TimetablePage.tsx` with tabs
7. Update `StudentTimetable.tsx` and `TeacherTimetable.tsx` with grid tab

