
# Parent Payment Submission and Admin Verification System

## The Problem
Currently, when a parent pays via PhonePe/UPI/Google Pay:
- There's no way for them to submit proof from their app
- Admin has to manually ask for UTR, then type it into the system
- No screenshot verification workflow exists

When a parent pays cash:
- Admin already can record it manually (this works)
- Receipts are generated (this works)

## What We'll Build

### For Parents (Mobile App)
- A **"Submit Payment"** button on each pending invoice in their fees page
- A form where parents enter: Amount paid, UTR/Transaction ID, Payment app (PhonePe/GPay/Paytm/Other), and upload a screenshot
- After submitting, the invoice shows **"Payment Verification Pending"** status
- Once admin approves, the receipt appears automatically

### For Admin (Fees Page)
- A new **"Pending Verifications"** tab/section showing all parent-submitted payments awaiting approval
- Each submission shows: Student name, amount, UTR number, payment app, and the uploaded screenshot
- Admin can **Approve** (which auto-records the payment and generates a receipt) or **Reject** (with a reason sent back to parent)

### Receipt Flow
- Cash payments: Admin records manually → receipt auto-generated (already works)
- UPI/Digital payments: Parent submits proof → Admin verifies UTR + screenshot → Approves → Receipt auto-generated
- Partial payments: Fully supported -- parent can submit any amount up to the balance

---

## Technical Plan

### 1. Database: New `payment_submissions` Table
```text
payment_submissions
├── id (uuid, PK)
├── school_id (uuid, NOT NULL)
├── invoice_id (uuid, NOT NULL)
├── student_id (uuid, NOT NULL)
├── submitted_by (uuid, NOT NULL) -- parent's user ID
├── amount (numeric, NOT NULL)
├── payment_method (text) -- 'phonepe', 'gpay', 'paytm', 'upi_other'
├── transaction_id (text, NOT NULL) -- UTR number
├── screenshot_url (text) -- storage path
├── status (text, default 'pending') -- pending/approved/rejected
├── rejection_reason (text)
├── reviewed_by (uuid)
├── reviewed_at (timestamptz)
├── created_at (timestamptz, default now())
└── notes (text)
```

**RLS Policies:**
- Parents: INSERT for own child's invoices, SELECT own submissions
- Admin: ALL for their school (to approve/reject)
- Students: SELECT own submissions

### 2. Storage: New `payment-proofs` Bucket
- Public: No (private bucket, accessed via signed URLs)
- RLS: Parents can upload, admins can read, for their school

### 3. New Files to Create

**`src/components/fees/SubmitPaymentDialog.tsx`** (Parent-side)
- Select payment app (PhonePe/GPay/Paytm/Other)
- Enter UTR/Transaction ID
- Enter amount (up to invoice balance)
- Upload screenshot (camera or gallery)
- Submit button

**`src/components/fees/PaymentVerificationPanel.tsx`** (Admin-side)
- List of pending submissions with student info
- View screenshot (opens in modal/lightbox)
- UTR number displayed prominently for easy verification
- Approve button → calls existing `record_fee_payment` RPC
- Reject button → asks for reason, updates status

**`src/hooks/usePaymentSubmissions.ts`**
- `usePaymentSubmissions()` -- fetch pending submissions (admin)
- `useParentPaymentSubmissions()` -- fetch own submissions (parent)
- `useSubmitPayment()` -- parent submits proof
- `useApproveSubmission()` -- admin approves (calls record_fee_payment RPC + updates submission status)
- `useRejectSubmission()` -- admin rejects with reason

### 4. Files to Modify

**`src/pages/parent/ParentFees.tsx`**
- Add "Submit Payment" button on each pending/partial invoice
- Show submission status ("Verification Pending" / "Rejected: reason")
- Import and wire up `SubmitPaymentDialog`

**`src/pages/admin/FeesPage.tsx`**
- Add a "Pending Verifications" badge/count in the toolbar
- Add a verification panel (collapsible section or tab) showing submissions
- Import `PaymentVerificationPanel`

### 5. Flow Summary

```text
Parent pays via PhonePe
        |
Parent opens app → taps "Submit Payment" on invoice
        |
Enters UTR + uploads screenshot → submits
        |
Admin sees notification/badge "3 Pending Verifications"
        |
Admin opens submission → views screenshot + UTR
        |
  ┌─────┴─────┐
Approve      Reject
  |             |
Calls RPC    Sends reason
(record_fee   back to
 payment)     parent
  |
Receipt auto-
generated
```
