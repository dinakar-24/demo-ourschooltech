

# Fees Page: Replace Bulk Create with Import/Export + Mobile Fix + Enhancements

## Overview
Remove the "Bulk Create Invoices" feature (which applies same fees to all students -- impractical) and replace it with Excel Import/Export. Fix the mobile UI layout and add useful enhancements.

## Changes

### 1. Remove Bulk Create Invoices
- Delete `src/components/fees/BulkCreateInvoiceDialog.tsx`
- Remove `useCreateBulkInvoices` hook from `src/hooks/useFeeInvoices.ts` (lines 216-298)
- Remove all references from `FeesPage.tsx` (import, state, button, dialog component)

### 2. Add Import from Excel Button
- Add an "Import" button in the action bar that navigates to `/admin/bulk-upload` with `state: { tab: 'fees' }` to use the existing bulk upload infrastructure
- The existing bulk upload page already supports fee imports with per-student admission number, fee type, amount, due date

### 3. Improve Excel Export (Auto-Adjusted Column Widths)
- The `useFeeReports.ts` already has `autoWidth()` function but improve it to better calculate widths including header text length and currency formatting
- Add proper column headers with word-wrap enabled for better readability

### 4. Fix Mobile UI on FeesPage
- Reorganize action buttons: on mobile, show only "Create Invoice" as primary + a "More" dropdown containing Reminders, Import, Export, and Verify buttons
- This prevents the cramped button row visible in the screenshot
- Filters should stack properly (search on top, class/section/status row below)

### 5. Additional Useful Features
- **Export All Invoices**: Add a new export option that downloads all current filtered invoice data (not just summary/pending/history) with complete student + component details and auto-adjusted column widths
- **Quick date filter chips**: Add "This Month", "Last 30 Days", "This Year" quick filter chips for faster navigation
- **Student count badge**: Show total student count and filtered count in the header area

## Files Modified
- `src/pages/admin/FeesPage.tsx` -- Remove bulk dialog, add import button, reorganize mobile action buttons, add date filter chips, student count
- `src/hooks/useFeeInvoices.ts` -- Remove `useCreateBulkInvoices` hook
- `src/hooks/useFeeReports.ts` -- Add "Export All Invoices" function with better auto-width, word-wrap on headers

## Files Deleted
- `src/components/fees/BulkCreateInvoiceDialog.tsx`

## Technical Details

### Mobile Action Bar (new layout)
```text
Desktop: [Verify (if pending)] [Reminders] [Export v] [Import] [+ Create Invoice]
Mobile:  [+ Create Invoice]  [... More dropdown]
                               - Send Reminders
                               - Import from Excel
                               - Export >
                                 - Fee Summary
                                 - Pending List  
                                 - Payment History
                                 - All Invoices (new)
                               - Verify Payments (if pending)
```

### Import Navigation
```typescript
navigate('/admin/bulk-upload', { state: { tab: 'fees' } })
```
The existing BulkUploadPage already accepts fees tab with columns: admission_number, fee_type, amount, due_date (optional), status, payment_method, paid_date, transaction_id.

### Enhanced autoWidth in Excel exports
```typescript
function autoWidth(ws: ExcelJS.Worksheet) {
  ws.columns.forEach(col => {
    let max = 12;
    col.eachCell?.({ includeEmpty: false }, cell => {
      const len = String(cell.value || '').length + 4;
      if (len > max) max = len;
    });
    col.width = Math.min(max, 45);
  });
  // Enable word wrap on header row
  ws.getRow(4).alignment = { wrapText: true, vertical: 'middle' };
}
```

### New "Export All Invoices" function
Exports the currently visible/filtered fee data with columns: Student, Admission No, Class, Section, Fee Components (comma-joined), Total Amount, Paid, Balance, Due Date, Status -- all with auto-adjusted widths and frozen header row.

