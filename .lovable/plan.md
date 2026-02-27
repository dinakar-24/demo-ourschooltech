
# Fees Management - New Features Plan

## Overview
Adding 4 major features to the Fees Management system: Bulk Invoice Creation, Export Reports, Send Fee Reminders, and Fee Discounts/Concessions.

---

## Feature 1: Bulk Invoice Creation

Create invoices for an entire class/section at once instead of one student at a time.

**What you'll see:**
- A new "Bulk Create" button next to the existing "Create Invoice" button
- A dialog where you select a Class, Section, Term, Due Date, and Fee Components
- The system will automatically create invoices for ALL active students in that class/section
- A progress indicator showing how many invoices are being created

**Technical details:**
- New `BulkCreateInvoiceDialog` component with class/section selector
- New `useCreateBulkInvoices` mutation hook that creates invoices in batch
- Fetches active students for the selected class/section, then creates one invoice per student with identical fee components

---

## Feature 2: Export Reports (Excel/PDF)

Download fee collection data as Excel spreadsheets.

**What you'll see:**
- A "Download Report" button with a dropdown menu offering:
  - **Fee Summary Report** - Overview by class with totals (collected, pending, overdue)
  - **Pending Fees List** - All students with outstanding balances
  - **Payment History** - All recorded payments with receipt numbers
- Downloads as `.xlsx` Excel file (using the already-installed `exceljs` library)

**Technical details:**
- New `useFeeReports` hook with functions to generate each report type
- Uses ExcelJS (already in dependencies) to create professionally formatted spreadsheets with:
  - School header, date range, formatted currency columns
  - Auto-width columns and frozen header rows

---

## Feature 3: Send Fee Reminders

Send push notification reminders to parents of students with pending/overdue fees.

**What you'll see:**
- A "Send Reminders" button in the toolbar area
- Option to send to: All pending students, Only overdue students, or a specific student
- Confirmation dialog showing how many parents will be notified
- Uses the existing push notification system (no SMS/email cost)

**Technical details:**
- New `SendReminderDialog` component
- Uses existing `sendNotification` utility to push notifications to parent and student user IDs
- Queries `fee_invoices` for pending/overdue balances, then resolves parent user IDs via `students.parent_email` joined to `profiles`

---

## Feature 4: Fee Discounts/Concessions

Apply discounts or scholarships to specific student invoices.

**What you'll see:**
- An "Apply Discount" button visible when expanding a student's invoice details
- Dialog to enter: Discount amount, Reason (e.g., Scholarship, Sibling Discount, Staff Ward), and optional notes
- The discount reduces the invoice balance immediately
- Discounts are tracked and visible in the expanded invoice view with the reason displayed

**Technical details:**
- The `student_fee_overrides` table already exists in the database with columns: `student_id`, `fee_structure_id`, `override_amount`, `reason`, `notes`, `approved_by`
- New `fee_discounts` table will be created (linked to invoices) since the existing overrides table is linked to fee_structures, not invoices
- Migration: Create `fee_discounts` table with columns: `id`, `school_id`, `invoice_id`, `student_id`, `discount_amount`, `reason`, `notes`, `applied_by`, `created_at`
- RLS policies: Admin full access, parent/student read-only for their own records
- New `ApplyDiscountDialog` component
- When a discount is applied, the invoice's `total_amount` and `balance` are reduced accordingly via an RPC function to maintain atomicity

---

## Files to Create
1. `src/components/fees/BulkCreateInvoiceDialog.tsx` - Bulk invoice creation dialog
2. `src/components/fees/SendReminderDialog.tsx` - Fee reminder sending dialog
3. `src/components/fees/ApplyDiscountDialog.tsx` - Discount/concession dialog
4. `src/hooks/useFeeReports.ts` - Excel report generation hooks

## Files to Modify
1. `src/pages/admin/FeesPage.tsx` - Add new action buttons and integrate all dialogs
2. `src/hooks/useFeeInvoices.ts` - Add bulk creation mutation and discount-related hooks

## Database Changes
1. New `fee_discounts` table with RLS policies
2. New `apply_fee_discount` RPC function for atomic discount application
