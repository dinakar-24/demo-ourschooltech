

# Cashfree Payment Integration — Multi-School System

## Overview
Replace the fee-payment flow with a dual-mode system: **Manual** (existing UTR submission) and **Online** (Cashfree Payment Gateway), controlled at both super-admin and school levels. Each school connects its own Cashfree account; payments go directly to their bank.

## Architecture

```text
┌─────────────────────────────────────────────────────┐
│  system_settings (existing table)                   │
│  key: "payment_config"                              │
│  value: {                                           │
│    online_enabled: true,                            │
│    manual_enabled: true,                            │
│    extra_charge_pct: 2.0                            │
│  }                                                  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  school_payment_config (NEW table)                  │
│  school_id (FK, unique)                             │
│  cashfree_app_id (encrypted text)                   │
│  cashfree_secret_key (encrypted text)               │
│  online_enabled (bool, default false)               │
│  manual_enabled (bool, default true)                │
│  is_connected (bool, default false)                 │
│  extra_charge_override (numeric, nullable)          │
│  super_admin_override_online (bool, nullable)       │
│  super_admin_override_manual (bool, nullable)       │
│  created_at, updated_at                             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  online_payments (NEW table)                        │
│  id, school_id, student_id, invoice_id              │
│  amount, extra_charge, total_charged                │
│  cf_order_id, cf_payment_id                         │
│  method (MANUAL / ONLINE)                           │
│  status (PENDING / SUCCESS / FAILED)                │
│  transaction_ref                                    │
│  created_at, verified_at                            │
└─────────────────────────────────────────────────────┘
```

## Implementation Steps

### 1. Database Migration
- Create `school_payment_config` table with RLS (school_admin can read/update own, super_admin full access)
- Create `online_payments` table for tracking all Cashfree transactions
- Add RLS policies for both tables
- Add `payment_config` key to existing `system_settings` table via insert

### 2. Edge Functions (2 new)

**`create-cashfree-order`** — Creates a Cashfree order using the school's credentials
- Validates: auth, school ownership, invoice exists, amount matches, no duplicate pending orders
- Fetches school's Cashfree credentials from `school_payment_config`
- Calculates extra charge based on super admin setting
- Calls Cashfree API `POST /orders` with school's credentials
- Returns `payment_session_id` + order details
- Inserts row into `online_payments` with status PENDING

**`cashfree-webhook`** — Receives Cashfree payment notifications (verify_jwt = false)
- Validates Cashfree signature using school's secret key
- On SUCCESS: calls `record_fee_payment` RPC, updates `online_payments` status
- On FAILED: updates `online_payments` status
- Prevents duplicate processing via idempotency check on `cf_order_id`

### 3. Frontend — Super Admin Settings
Add a **"Payments"** tab to `SystemSettingsPage.tsx`:
- Toggle: Enable/Disable online payments globally
- Toggle: Enable/Disable manual payments globally
- Input: Extra charge percentage (0-10%)
- Table: List of schools with Cashfree connection status
- Per-school override toggles

### 4. Frontend — School Admin Settings
Add a **"Payments"** section to `SettingsPage.tsx`:
- Show global status (enabled/disabled by platform)
- Toggle online/manual payments (if allowed by super admin)
- Cashfree connection form: App ID + Secret Key fields (masked)
- "Test Connection" button to verify credentials
- Connection status badge (Connected / Not Connected)

### 5. Frontend — Parent Payment Flow
Modify `ParentFees.tsx` and `SubmitPaymentDialog.tsx`:
- Fetch school's payment config to determine available methods
- Show method selector: "Pay Online" / "Manual Payment"
- If online selected:
  - Show amount + extra charge breakdown
  - "Pay Now" button → calls `create-cashfree-order` → loads Cashfree JS SDK → opens payment page
  - On success → show receipt
  - On failure → show retry option
- If manual selected → existing UTR submission flow (unchanged)
- Only show buttons for enabled methods

### 6. Hook: `usePaymentConfig`
New hook that fetches:
- Global payment settings from `system_settings`
- School-specific config from `school_payment_config`
- Resolves effective settings (super admin overrides > school settings)
- Returns: `{ onlineEnabled, manualEnabled, isConnected, extraChargePct }`

### 7. Hook: `useCashfree`
New hook similar to existing `useRazorpay`:
- Loads Cashfree JS SDK script
- `initiatePayment()` → calls edge function → opens Cashfree checkout
- Handles success/failure callbacks
- Updates React Query cache on success

## Files to Create
- `supabase/functions/create-cashfree-order/index.ts`
- `supabase/functions/cashfree-webhook/index.ts`
- `src/hooks/usePaymentConfig.ts`
- `src/hooks/useCashfree.ts`
- `src/components/fees/OnlinePaymentDialog.tsx`
- `src/components/super-admin/settings/PaymentSettings.tsx`
- `src/components/admin/PaymentConfigSection.tsx`

## Files to Modify
- `supabase/config.toml` — add `[functions.cashfree-webhook] verify_jwt = false`
- `src/pages/super-admin/SystemSettingsPage.tsx` — add Payments tab
- `src/pages/admin/SettingsPage.tsx` — add Payments section
- `src/pages/parent/ParentFees.tsx` — add online payment option
- `src/components/fees/SubmitPaymentDialog.tsx` — add method selector

## Security
- Cashfree credentials stored encrypted in DB, never exposed to frontend
- Webhook signature verification prevents spoofed callbacks
- Amount validation on backend prevents tampering
- Duplicate payment prevention via order status checks
- RLS ensures schools can only access their own config

