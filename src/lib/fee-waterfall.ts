/**
 * Waterfall allocation: distributes paid_amount across components in order,
 * returning remaining balance per component.
 */
export interface FeeComponentBalance {
  id: string;
  fee_type: string;
  original_amount: number;
  paid: number;
  remaining: number;
}

export function computeComponentBalances(
  components: { id: string; fee_type: string; amount: number }[],
  paidAmount: number
): FeeComponentBalance[] {
  let remaining = paidAmount;

  return components.map(c => {
    const amt = Number(c.amount);
    const allocated = Math.min(remaining, amt);
    remaining -= allocated;
    return {
      id: c.id,
      fee_type: c.fee_type,
      original_amount: amt,
      paid: Math.round(allocated * 100) / 100,
      remaining: Math.round((amt - allocated) * 100) / 100,
    };
  });
}
