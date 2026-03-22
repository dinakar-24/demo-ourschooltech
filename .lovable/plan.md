

# Fix: Mobile Drawer Scroll Blocked by Drag Gesture

## Problem

On mobile, the "Add Student" form opens in a Vaul Drawer. The form fields below "Section" (Roll Number, Gender, Blood Group, Parent info, DOB, etc.) exist but are **unreachable** because Vaul's drag-to-dismiss gesture intercepts vertical touch/scroll events on the inner content area. The user swipes up to scroll but the drawer tries to dismiss instead.

This affects **all 9 Drawer instances** in the app that have scrollable content (`overflow-y-auto flex-1 min-h-0`), including AddStudent, EditTeacher, CreateInvoice, ViewStudent, SubmitPayment, FeedbackPage, ParentQueries, ParentFeedback, and PaymentReceipt.

## Fix

Add `data-vaul-no-drag` attribute to every scrollable container div inside DrawerContent. This tells Vaul to **not** intercept drag gestures on that element, allowing normal scroll behavior.

### Files to modify (add `data-vaul-no-drag` to the scroll container div):

1. **`src/components/admin/AddStudentDialog.tsx`** — line 401 scroll div
2. **`src/components/admin/ViewStudentDialog.tsx`** — line 95 scroll div
3. **`src/components/admin/EditTeacherDialog.tsx`** — line 322 scroll div
4. **`src/components/fees/SubmitPaymentDialog.tsx`** — line 212 scroll div
5. **`src/components/fees/PaymentReceiptDialog.tsx`** — line 531 scroll div
6. **`src/components/fees/CreateInvoiceDialog.tsx`** — line 235 scroll div
7. **`src/pages/parent/ParentQueries.tsx`** — lines 145, 184 scroll divs
8. **`src/pages/parent/ParentFeedback.tsx`** — lines 108, 146 scroll divs
9. **`src/pages/admin/FeedbackPage.tsx`** — line 151 scroll div

### Example change (same pattern for all):
```tsx
// Before
<div className="overflow-y-auto flex-1 min-h-0 bg-background overscroll-contain pb-safe">

// After
<div data-vaul-no-drag className="overflow-y-auto flex-1 min-h-0 bg-background overscroll-contain pb-safe">
```

Each file gets a single attribute added to the scrollable `div` — no other changes needed.

