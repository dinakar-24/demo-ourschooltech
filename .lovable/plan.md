

## Redesign Fees Page: Student-Grouped View

### Current Problem
The fees page has two separate tabs (Invoices and Legacy Fees) showing flat lists of individual fee records. This is confusing and hard to navigate, especially on mobile.

### New Design
Replace the tabbed layout with a single, unified view where fees are **grouped by student**. Each student appears once as a card/row, and expanding it reveals all their fee items (both invoices and legacy fees) inside.

### Layout

**Desktop**: A table where each row is a student with summary info (total due, total paid, balance). Clicking expands to show individual fee items (invoices + legacy fees) underneath.

**Mobile**: Cards per student showing name, class, admission number, and total balance. Tapping expands to show all fee items as a nested list.

### What stays
- Stats cards at the top (Collected, Pending, Overdue, Collection Rate)
- Search by student name/admission number
- Status filter (All, Paid, Pending, Overdue)
- Term filter (for invoice-based fees)
- "Add Term" and "Create Invoice" buttons
- All payment and receipt dialogs

### What changes
- Remove the Tabs component (no more Invoices/Fees separation)
- Fetch both invoices and legacy fees, then group them client-side by `student_id`
- Each student group shows:
  - Student name, admission number, class-section
  - Summary: total amount, total paid, total balance
  - Status badge based on overall balance
- Expanded view shows:
  - Invoice items (with components, payments, pay button)
  - Legacy fee items (with receipt links)

### Technical Details

**File: `src/pages/admin/FeesPage.tsx`** (rewrite)
1. Remove `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` usage
2. Fetch both `useFeeInvoices` and `useFees` simultaneously
3. Create a `groupByStudent()` utility that merges records by `student_id`:
   ```text
   Map<student_id, {
     student: { name, admission, class, section },
     invoices: FeeInvoice[],
     legacyFees: FeeRecord[],
     totalAmount, totalPaid, totalBalance
   }>
   ```
4. Desktop: Expandable table rows per student
5. Mobile: Expandable cards per student
6. Inside each expanded student, show two sections:
   - "Invoices" with term name, components, payments, pay button
   - "Fee Records" with fee type, amount, status, receipt
7. Keep all existing dialog integrations (CreateTerm, CreateInvoice, RecordPayment, receipts)

