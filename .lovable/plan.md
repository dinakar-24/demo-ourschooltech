

## Plan: Redesign Subscription Billing Interface for Clarity

### Problem
The main plan card shows `₹{dynamicTotal}/year` (recalculated from all active students), which confuses schools that already paid for some students. The price appears to jump when new students are added.

### Changes (single file: `src/pages/admin/SubscriptionPage.tsx`)

**1. Replace the large price display in the main plan card**

Currently shows `₹{dynamicTotal}/year` (e.g., ₹450 for 3 students). Replace with:
- When active & no upgrade needed: Show the **already paid amount** (`₹{totalAmount}/year`) as the headline, with "for {paidStudentCount} students" subtitle.
- When upgrade needed: Show a **breakdown layout** instead of a single big number:

```text
┌─────────────────────────────────┐
│  Annual Plan            Active  │
│                                 │
│  Price per student   ₹150/year  │
│  Paid students              2   │
│  Active students            3   │
│  Additional students        1   │
│  ─────────────────────────────  │
│  Additional payment    ₹150     │
│                                 │
│  [ Upgrade Plan — Pay ₹150 ]   │
└─────────────────────────────────┘
```

- When expired/trial/pending: Show `₹{dynamicTotal}/year` as before (since it's a fresh activation).

**2. Remove the duplicate "Upgrade Required" block** (lines 607-653)

Since the main card now contains all upgrade info clearly, the separate upgrade block becomes redundant. Remove it entirely.

**3. Update the Plan Details card** (lines 584-605)

Remove `Total Plan Amount` row (was showing the confusing recalculated total). Replace with:
- Amount Paid: `₹{totalAmount}` (what they've already paid)
- Keep: Plan type, Start, Expiry, Paid Students, Active Students, Price Per Student

**4. Simplify the Stats Row** (lines 556-580)

Change the 3-column stats to:
- **Paid Students** (instead of "Active Students" — shows paidStudentCount)
- **Expiry** (unchanged)
- **Per Student** (unchanged)

**5. Clean up the upgrade alert banner** (lines 421-435)

Keep it but simplify the text to: "Upgrade required — {extraStudents} new student{s}. Pay ₹{topUpAmount} to upgrade."

**6. Additional improvements**
- Add a "Top-Up" badge label next to payment amounts in the history that were top-up payments (using `payment.payment_type`)
- Show "Paid for X students" in the main card when no upgrade is needed as a reassuring confirmation

