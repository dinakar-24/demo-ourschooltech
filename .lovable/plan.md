

## Plan: Move Student Fee Details to a Dedicated Page

### Problem
When a student row is expanded on the Fees page, invoices, components, payments, and receipts all render inline. With many students and many small payments, the list becomes very long and cluttered.

### Solution
Create a new **Student Fee Detail Page** at `/admin/fees/:studentId`. Clicking a student row navigates to this page instead of expanding inline. The main fees list becomes a clean, scannable table with no expandable content.

### Changes

**1. Create `src/pages/admin/StudentFeesPage.tsx`** (new file)
- Receives `studentId` from URL params
- Fetches that student's invoices via `useFeeInvoices` filtered by student
- Displays student info header (name, class, admission number, totals)
- Shows invoices with components, payment history (collapsible), and action buttons (Pay, Discount, Receipt)
- Includes all dialogs (RecordPayment, PaymentReceipt, ApplyDiscount, etc.)
- Back button to navigate to `/admin/fees`
- Reuses the existing `renderExpandedContent` logic but laid out on a full page with better spacing

**2. Update `src/App.tsx`**
- Add route: `/admin/fees/:studentId` pointing to the new `StudentFeesPage`
- Wrap with same guards (ProtectedRoute, SubscriptionGuard, AdminPermissionGuard)

**3. Simplify `src/pages/admin/FeesPage.tsx`**
- Remove the `Collapsible` expand/collapse behavior and `renderExpandedContent`
- Remove `expandedId` state and `PaymentsList` component
- Remove dialog states for payment/receipt/discount (moved to detail page)
- Student rows become clickable links that navigate to `/admin/fees/:studentId`
- Keep: stats cards, filters, search, export, create invoice, verification panel, reminder dialog
- The table/card list remains but is now a simple flat list — each row shows name, class, total, paid, balance, progress, status

**4. Create `src/hooks/useStudentFeeInvoices.ts`** (new hook)
- Fetches invoices for a single student by ID
- Similar to `useFeeInvoices` but filtered to one student without pagination

### Technical Details
- Navigation: `navigate(/admin/fees/${g.studentId})` on row click
- The detail page reuses existing components: `RecordPaymentDialog`, `PaymentReceiptDialog`, `ApplyDiscountDialog`, `FeeReceiptDialog`
- `PaymentsList` sub-component moves to the detail page
- Mobile: detail page uses `MobileLayout` or `AdminLayout` with a back button

