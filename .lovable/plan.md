

# Top-Up Payment Without Extending Subscription

## Problem
Currently, both full subscription payments and top-up payments for new students reset the subscription dates (start = today, end = today + 1 year). When a school admin pays for new students mid-subscription, the expiry date should remain unchanged -- only the `student_count` should update.

## Solution

### 1. Track payment type in the flow
Pass a `payment_type` field ("renewal" or "topup") from the frontend through the entire payment pipeline so the verification function knows whether to update dates.

### 2. Frontend changes (`SubscriptionPage.tsx`)
- `handlePayment` (full/renewal): pass `paymentType: 'renewal'`
- `handleTopUp` (new students only): pass `paymentType: 'topup'`

### 3. Hook changes (`useRazorpay.ts`)
- Add `paymentType` to the `initiatePayment` params and forward it to the `create-razorpay-order` edge function body.

### 4. Edge function: `create-razorpay-order`
- Accept `paymentType` from the request body
- Store it in the Razorpay order `notes` so it flows through to verification
- Also store it in the `subscription_payments` table (requires a new column or use of an existing field)

### 5. Database migration
- Add a `payment_type` text column to `subscription_payments` table (default: `'renewal'`)

### 6. Edge function: `verify-razorpay-payment`
- Read the `payment_type` from the payment record
- If `payment_type = 'topup'`: only update `student_count` on the subscription, do NOT change `start_date`, `end_date`, or `status`
- If `payment_type = 'renewal'`: current behavior (set dates to now + 1 year, activate)

## Technical Details

**New column:**
```sql
ALTER TABLE subscription_payments ADD COLUMN payment_type text NOT NULL DEFAULT 'renewal';
```

**verify-razorpay-payment logic change (both webhook and direct paths):**
```
if payment_type === 'topup':
  -- Only update student_count on subscriptions table
  UPDATE subscriptions SET student_count = <new_count> WHERE id = ...
else:
  -- Full renewal: set dates, activate (existing behavior)
  UPDATE subscriptions SET status='active', start_date=now, end_date=now+1y, student_count=...
```

**create-razorpay-order change:**
- Store `paymentType` and `studentCount` in the `subscription_payments` record
- Forward to Razorpay order notes for traceability

## Files to modify
1. `src/pages/admin/SubscriptionPage.tsx` -- pass `paymentType` in both handlers
2. `src/hooks/useRazorpay.ts` -- accept and forward `paymentType`
3. `supabase/functions/create-razorpay-order/index.ts` -- store `payment_type` in payment record
4. `supabase/functions/verify-razorpay-payment/index.ts` -- conditional logic based on `payment_type`
5. Database migration -- add `payment_type` column to `subscription_payments`
