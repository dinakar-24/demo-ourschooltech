
# Fees Management -- Missing Features and Enhancements

## ✅ ALL ITEMS COMPLETED

### 1. ✅ Class and Section Filter on Admin Fees Page
Added Class and Section dropdown filters to the admin FeesPage toolbar. Class filter is passed to both `useFeeInvoices` and `useFees` hooks. Section filter works client-side on grouped results.

### 2. ✅ Parent Fees Page -- Show Invoice-Based Fees
Rewrote `ParentFees.tsx` to fetch and display invoice-based fees (`fee_invoices`) with components, payments, discounts, and progress bars. Legacy fees kept as fallback.

### 3. ✅ Parent Receipt Viewing
Added `PaymentReceiptDialog` to parent fees page. Parents can tap any payment to view/print the receipt.

### 4. ✅ Discount Visibility on Parent/Student Side
Parent fees page now fetches `fee_discounts` for each invoice and displays discount details (amount, reason).

### 5. ✅ Section Filter for Bulk Invoice Creation
Already working -- no changes needed.

### 6. ✅ Partial Payment Progress Bar on Admin Page
Added progress bars in both mobile cards and desktop table rows showing payment completion percentage.
