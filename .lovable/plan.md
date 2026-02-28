

# Parent Fees Page - Compact Redesign

## Problems Identified
1. Summary card is too tall - the "Pay via UPI..." info box adds unnecessary height
2. Quick stats cards (Paid This Year / Payment Progress) take too much vertical space with large icons
3. Progress bar still blends visually with the purple background
4. Too much spacing between sections overall
5. The fee invoice card is oversized with large text (₹55,000 in 2xl)

## Changes (single file: `src/pages/parent/ParentFees.tsx`)

### 1. Compact Summary Card
- Remove the "Pay via UPI..." info box entirely (move to invoice action area if needed)
- Reduce padding from `p-4` to `p-3`
- Make progress bar more visible with `bg-white` fill instead of `bg-white/70`
- Keep amount at `text-xl` instead of `text-2xl`

### 2. Inline Quick Stats
- Convert the 2-column grid into a single horizontal row with smaller inline items instead of separate cards with icons
- Show as: "Paid: ₹5,000 | Progress: 9%" in a compact bar-style layout
- Remove the large icon circles entirely

### 3. Tighter Invoice Cards
- Reduce font size for amounts from `text-2xl` to `text-lg`
- Reduce padding from `p-4` to `p-3`
- Make progress bar thinner (`h-1`)
- Tighter internal spacing

### 4. Overall Spacing
- Reduce main container spacing from `space-y-3` to `space-y-2.5`
- Reduce section header margins

## Technical Details
- Only `src/pages/parent/ParentFees.tsx` needs modification
- No database or hook changes needed - all data is real and correct
- The student "dinu" has 1 invoice: ₹55,000 total, ₹5,000 paid, ₹50,000 balance (all from database)

