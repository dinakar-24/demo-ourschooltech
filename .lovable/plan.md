
# Fees Management -- Missing Features and Enhancements

## Summary of Gaps Found

After thorough analysis, here are the missing features and improvements needed:

### 1. Class and Section Filter on Admin Fees Page
**Current state:** Admin can filter by Term and Status but NOT by Class or Section.
**Fix:** Add Class and Section dropdown filters to the toolbar, passing `className` to the query hook (which already supports it but isn't wired up).

### 2. Parent Fees Page -- Show Invoice-Based Fees (Not Just Legacy)
**Current state:** `ParentFees` only queries the legacy `fees` table. It does NOT show the new invoice-based fees (`fee_invoices`) at all. Parents cannot see invoices, payment history with receipts, or partial payment status.
**Fix:** Rewrite `ParentFees` to also fetch `fee_invoices` with components and payments for the parent's child. Show both invoice-based and legacy fees, display receipt numbers, payment method, partial payment progress, and a "Download Receipt" button for each payment.

### 3. Parent Receipt Viewing
**Current state:** Parents have no way to view or download payment receipts.
**Fix:** Add the `PaymentReceiptDialog` to the parent fees page so they can tap on a payment to view/print the receipt.

### 4. Discount Visibility on Parent/Student Side
**Current state:** Discounts applied by admin are not visible to parents or students.
**Fix:** Fetch `fee_discounts` for each invoice and show discount details (amount, reason) in the parent view.

### 5. Section Filter for Bulk Invoice Creation
**Current state:** The BulkCreateInvoiceDialog already supports section filtering -- this is working.

### 6. Partial Payment Progress Bar on Admin Page
**Current state:** The admin page shows paid/balance numbers but no visual progress indicator at the student group level.
**Fix:** Add a small progress bar in each student row showing payment completion percentage.

---

## Technical Plan

### File: `src/pages/admin/FeesPage.tsx`
- Add `selectedClass` and `selectedSection` state variables
- Add Class dropdown (using `useClasses` hook) and Section dropdown to the filter bar
- Pass `className` filter to `useFeeInvoices` and `useFees` hooks
- Filter `studentGroups` by section client-side
- Add a progress bar (div with percentage width) in each student row/card

### File: `src/pages/parent/ParentFees.tsx` (major rewrite)
- Import and use `useFeeInvoices` (with student_id filter via the existing RLS) to fetch invoice-based fees
- Import `PaymentReceiptDialog` for receipt viewing
- Show invoices grouped by term with:
  - Fee components breakdown
  - Payment progress bar (paid vs total)
  - Each payment entry with receipt number (tappable to view receipt)
  - Discount entries if any
- Keep legacy fees section as fallback
- Add "Download Receipt" functionality using existing `PaymentReceiptDialog`

### File: `src/hooks/useParentData.ts`
- Add a new `useParentInvoices` hook that fetches `fee_invoices` with components, payments, and discounts for the parent's child
- This uses existing RLS policies (parents can view child invoices/payments/discounts)

### File: `src/hooks/useFeeInvoices.ts`
- No changes needed -- already supports className filter and the RLS allows parent access

### Files unchanged
- Database: No schema changes needed -- all tables and RLS policies are already in place
- `PaymentReceiptDialog`: Already works for both admin and parent contexts
