
# School ERP SaaS - Complete Production Implementation Plan

## Current Status Assessment

### What's Already Built (Completed)

| Area | Status | Details |
|------|--------|---------|
| **Multi-tenant Architecture** | Done | Database schema with school_id isolation, RLS policies |
| **Authentication** | Done | Email/password login, role-based routing for 5 roles |
| **Role System** | Done | Separate user_roles table with has_role() function |
| **Super Admin Panel** | Partial | Dashboard with real stats, Schools management (CRUD), School Admin creation |
| **School Admin Layout** | Done | Responsive sidebar, mobile navigation, real stats on dashboard |
| **Teacher Layout** | Done | Mobile-first with bottom navigation |
| **Parent Layout** | Done | Mobile-first PWA-style with bottom navigation |
| **Student Layout** | Done | Mobile-first PWA-style with bottom navigation |
| **Edge Functions** | Partial | create-school-user (working), create-super-admin |

### What Needs Implementation (Gaps)

| Component | Issue | Priority |
|-----------|-------|----------|
| Students Page | Uses mock data array | Critical |
| Classes Page | Uses mock data array | Critical |
| Fees Page | Uses mock data array | Critical |
| Attendance Page | Uses mock data, no DB save | Critical |
| Teacher Attendance | Shows toast but doesn't save to DB | Critical |
| Parent Dashboard | Static hardcoded data | High |
| Student Dashboard | Static hardcoded data | High |
| Subscription System | Not implemented | High |
| Razorpay Integration | Not implemented | High |
| Academic Year/Promotion | Not implemented | Medium |
| Classes/Sections Tables | Not in database | Critical |
| Homework Table | Not in database | Medium |

---

## Implementation Phases

### Phase 1: Database Schema Additions

**New Tables Required**

```
classes
├── id (uuid, PK)
├── school_id (uuid, FK -> schools)
├── name (text) - e.g., "Class 6", "Class 10"
├── display_order (integer) - for sorting
├── created_at, updated_at (timestamps)

sections
├── id (uuid, PK)
├── class_id (uuid, FK -> classes)
├── school_id (uuid, FK -> schools)
├── name (text) - e.g., "A", "B", "C"
├── class_teacher_id (uuid, FK -> teachers)
├── created_at, updated_at (timestamps)

homework
├── id (uuid, PK)
├── school_id (uuid, FK -> schools)
├── class_id (uuid, FK -> classes)
├── section_id (uuid, FK -> sections)
├── subject (text)
├── title (text)
├── description (text)
├── due_date (date)
├── assigned_by (uuid, FK -> auth.users)
├── attachments (text[])
├── created_at (timestamp)

academic_years
├── id (uuid, PK)
├── school_id (uuid, FK -> schools)
├── name (text) - e.g., "2024-25"
├── start_date (date)
├── end_date (date)
├── is_current (boolean)
├── created_at (timestamp)

subscriptions
├── id (uuid, PK)
├── school_id (uuid, FK -> schools, unique)
├── razorpay_account_id (text) - school's sub-account
├── plan_type (text) - 'yearly'
├── student_count (integer) - billable count
├── price_per_student (integer) - 250 INR
├── total_amount (integer)
├── status (text) - 'active', 'expired', 'pending'
├── start_date (date)
├── end_date (date)
├── created_at, updated_at (timestamps)

subscription_payments
├── id (uuid, PK)
├── subscription_id (uuid, FK -> subscriptions)
├── school_id (uuid, FK -> schools)
├── amount (integer)
├── razorpay_order_id (text)
├── razorpay_payment_id (text)
├── razorpay_signature (text)
├── status (text) - 'pending', 'success', 'failed'
├── paid_at (timestamp)
├── created_at (timestamp)

fee_structures
├── id (uuid, PK)
├── school_id (uuid, FK -> schools)
├── academic_year_id (uuid, FK -> academic_years)
├── class_id (uuid, FK -> classes)
├── fee_type (text)
├── base_amount (decimal)
├── frequency (text) - 'monthly', 'quarterly', 'yearly'
├── created_at (timestamp)

student_fee_overrides
├── id (uuid, PK)
├── student_id (uuid, FK -> students)
├── fee_structure_id (uuid, FK -> fee_structures)
├── override_amount (decimal)
├── reason (text) - 'concession', 'scholarship', 'extra'
├── approved_by (uuid)
├── created_at (timestamp)

student_promotions
├── id (uuid, PK)
├── student_id (uuid, FK -> students)
├── from_academic_year_id (uuid)
├── to_academic_year_id (uuid)
├── from_class_id (uuid)
├── to_class_id (uuid)
├── action (text) - 'promoted', 'detained', 'graduated', 'deactivated'
├── promoted_by (uuid)
├── created_at (timestamp)
```

**Schema Updates to Existing Tables**

```
schools (add columns):
├── razorpay_account_id (text) - linked sub-account
├── is_active (boolean, default true) - ERP access control
├── subscription_status (text) - 'active', 'expired', 'trial'
├── student_limit (integer) - max students allowed

students (add columns):
├── academic_year_id (uuid, FK -> academic_years)
├── status (text) - 'active', 'graduated', 'transferred', 'deactivated'
├── roll_number (integer)
```

---

### Phase 2: Connect Mock Data Pages to Database

**2.1 Students Page (src/pages/admin/StudentsPage.tsx)**

Changes:
- Create `useStudents` hook to fetch from students table
- Replace mockStudents with real database query
- Add real stats (total, active, new this month)
- Connect Add Student dialog to create-school-user edge function
- Implement edit and delete functionality
- Add parent account creation option

**2.2 Classes Page (src/pages/admin/ClassesPage.tsx)**

Changes:
- Create `useClasses` hook to fetch classes with sections
- Replace mockClasses with real database query
- Connect Add Class dialog to insert into classes/sections
- Display real class teacher assignments
- Show actual student counts per section

**2.3 Fees Page (src/pages/admin/FeesPage.tsx)**

Changes:
- Create `useFees` hook to fetch fee records
- Replace mockFeeRecords with real database query
- Calculate real collected/pending/overdue amounts
- Implement Record Payment functionality
- Add receipt generation

**2.4 Attendance Page (src/pages/admin/AttendancePage.tsx)**

Changes:
- Create `useAttendance` hook
- Fetch real attendance from database
- Display by class for selected date
- Add drill-down to individual students

---

### Phase 3: Teacher Module - Database Integration

**3.1 Teacher Attendance (src/pages/teacher/TeacherAttendance.tsx)**

Changes:
- Fetch real student list for selected class
- Check if attendance already marked for date
- Save attendance records to database on submit
- Show validation if already marked

**3.2 Teacher Homework (src/pages/teacher/TeacherHomework.tsx)**

Changes:
- Create homework records in database
- Display assigned homework list
- Add file attachment support

**3.3 Teacher Marks (src/pages/teacher/TeacherMarks.tsx)**

Changes:
- Fetch exams from exams table
- Enter marks into results table
- Calculate grades automatically

---

### Phase 4: Parent & Student Real Data

**4.1 Parent Dashboard (src/pages/parent/ParentDashboard.tsx)**

Changes:
- Fetch linked child from students table via parent_email
- Real attendance percentage from attendance table
- Real pending fees from fees table
- Real announcements

**4.2 Student Dashboard (src/pages/student/StudentDashboard.tsx)**

Changes:
- Fetch student profile via user_id
- Real homework from homework table
- Real attendance percentage
- Real exam results

---

### Phase 5: Razorpay Subscription System

**5.1 Database & Schema Setup**
- Add subscriptions and subscription_payments tables
- Add razorpay fields to schools table

**5.2 Edge Functions**

**create-razorpay-order**
- Validate school has razorpay_account_id
- Calculate amount = active_students × 250 INR
- Create Razorpay order using school's sub-account
- Return order_id to frontend

**verify-razorpay-payment (Webhook)**
- Verify webhook signature using raw body
- Update subscription_payments table
- If success: Set subscription status to 'active', set end_date to +1 year
- If failure: Log and keep status as 'pending'

**5.3 School Admin: Subscription Page**
- New page: `/admin/subscription`
- Show current subscription status
- Display amount calculation breakdown
- Razorpay checkout integration
- Payment history

**5.4 Subscription Enforcement**
- Check subscription status on protected routes
- If expired: Enable read-only mode
- Block create/update operations
- Show renewal prompt banner

**5.5 Super Admin: Subscription Management**
- New page: `/super-admin/subscriptions`
- List all schools with subscription status
- View payment history per school
- Configure razorpay_account_id per school
- Override/extend subscriptions manually

---

### Phase 6: Academic Year & Student Promotion

**6.1 Academic Year Management**
- Create academic_years table
- UI for School Admin to create new academic year
- Set current academic year

**6.2 Student Promotion System**
- Bulk promotion interface
- Options: Promote, Detain, Graduate, Deactivate
- Preserve previous year records
- Create new academic year records for promoted students
- Track promotion history

---

### Phase 7: Fee Management Enhancements

**7.1 Fee Structures**
- Create fee_structures table
- Define per-class, per-academic-year fee templates
- Allow changes for new academic year

**7.2 Student Fee Overrides**
- Create student_fee_overrides table
- Individual concession/scholarship management
- Approval workflow (approved_by)
- Audit trail for all changes

---

### Phase 8: Super Admin SaaS Features

**8.1 Revenue Dashboard**
- Total revenue across all schools
- Monthly/yearly charts using Recharts
- Per-school revenue breakdown

**8.2 Enhanced School Controls**
- Activate/suspend schools
- Set student limits
- View subscription details
- "Login as School Admin" impersonation

**8.3 Audit Logs**
- Track all admin actions
- Display in Super Admin dashboard

---

## New React Hooks

| Hook | Purpose | Tables Used |
|------|---------|-------------|
| `useStudents` | Fetch/manage students | students |
| `useClasses` | Fetch classes with sections | classes, sections |
| `useFees` | Fetch fee records | fees |
| `useAttendance` | Fetch attendance data | attendance |
| `useHomework` | Fetch homework | homework |
| `useAcademicYears` | Manage academic years | academic_years |
| `useSubscription` | Check subscription status | subscriptions |

---

## New Edge Functions

| Function | Purpose |
|----------|---------|
| `create-razorpay-order` | Create subscription payment order |
| `verify-razorpay-payment` | Webhook handler for payment verification |
| `create-student-with-parent` | Atomic student + parent creation |

---

## Files to Modify (Priority Order)

| Priority | File | Change |
|----------|------|--------|
| 1 | Database Migration | Add classes, sections, subscriptions tables |
| 2 | src/pages/admin/StudentsPage.tsx | Connect to database |
| 3 | src/pages/admin/ClassesPage.tsx | Connect to database |
| 4 | src/pages/admin/FeesPage.tsx | Connect to database |
| 5 | src/pages/admin/AttendancePage.tsx | Connect to database |
| 6 | src/pages/teacher/TeacherAttendance.tsx | Save to database |
| 7 | src/pages/parent/ParentDashboard.tsx | Fetch real data |
| 8 | src/pages/student/StudentDashboard.tsx | Fetch real data |
| 9 | Create SubscriptionsPage | New Super Admin page |
| 10 | Create Razorpay edge functions | Payment integration |

---

## Required API Keys/Secrets

Before implementing Razorpay integration:
1. **RAZORPAY_KEY_ID** - Razorpay API key
2. **RAZORPAY_KEY_SECRET** - Razorpay API secret
3. **RAZORPAY_WEBHOOK_SECRET** - For webhook signature verification

---

## Business Rules Summary

| Rule | Implementation |
|------|----------------|
| Rs 250/student/year | subscriptions.price_per_student = 250 |
| Yearly billing only | subscriptions.plan_type = 'yearly' |
| Direct to school bank | Razorpay Route sub-accounts |
| No parent payments | No payment UI for parents |
| Read-only on expiry | Check subscription before mutations |
| Academic year tracking | academic_years table |
| Fee audit trail | student_fee_overrides with timestamps |

---

## Recommended Implementation Order

**Week 1: Core Database & Students**
1. Run database migrations for new tables
2. Create useStudents hook
3. Connect StudentsPage to database
4. Add student creation with edge function

**Week 2: Classes & Fees**
5. Create useClasses hook
6. Connect ClassesPage to database
7. Create useFees hook
8. Connect FeesPage with payment recording

**Week 3: Attendance & Teacher**
9. Create useAttendance hook
10. Connect AttendancePage
11. Update TeacherAttendance to save to DB
12. Connect parent/student dashboards to real data

**Week 4: Subscriptions & Razorpay**
13. Add subscription tables
14. Create Razorpay edge functions
15. Build Super Admin subscription management
16. Implement subscription enforcement

**Week 5: Academic Year & Promotions**
17. Create academic year management
18. Build promotion interface
19. Implement fee structures
20. Add fee overrides with audit

---

## Security Considerations

- All new tables will have proper RLS policies
- Razorpay webhook signature verification is mandatory
- Subscription checks must be server-side (not just UI)
- Payment data isolated per school via Razorpay Route
- Audit logging for all admin actions
- Role validation in all edge functions
