

## Plan: Add More Student Details to Fee Detail Page Header

### Current State
The student header card only shows: name, admission number, class-section, and fee totals. The query already fetches `parent_name`, `parent_email`, and `roll_number`. Additional fields like `parent_phone` and `avatar_url` are available on the students table.

### Changes

**1. Update `src/hooks/useStudentFeeInvoices.ts`**
- Add `parent_phone` and `avatar_url` to the student select fields

**2. Update `src/pages/admin/StudentFeesPage.tsx`**
- Enhance the student header card to show:
  - Student avatar (using Avatar component, fallback to initials)
  - Roll number alongside admission number and class
  - Parent name and phone number in a secondary info row below the student name
  - Use `Phone` and `Users` icons for parent details
- Layout: avatar on the left, student info in the middle, fee totals on the right (stacks vertically on mobile)

