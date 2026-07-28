import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ParentInvoice {
  id: string;
  student_id: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: string;
  due_date: string;
  components?: { id: string; fee_type: string; amount: number }[];
  payments?: {
    id: string;
    amount: number;
    payment_method: string;
    payment_date: string;
    receipt_number: string;
    transaction_id: string | null;
    notes: string | null;
    created_at: string;
  }[];
  discounts?: {
    id: string;
    discount_amount: number;
    reason: string;
    notes: string | null;
    created_at: string;
  }[];
}

export function useParentInvoices(studentId?: string) {
  return useQuery({
    queryKey: ['parent-invoices', studentId],
    queryFn: async (): Promise<ParentInvoice[]> => {
      if (!studentId) return [];

      const { data, error } = await supabase
        .from('fee_invoices')
        .select(`
          id, student_id, total_amount, paid_amount, balance, status, due_date,
          components:fee_invoice_components(id, fee_type, amount),
          payments:fee_payments(id, amount, payment_method, payment_date, receipt_number, transaction_id, notes, created_at),
          discounts:fee_discounts(id, discount_amount, reason, notes, created_at)
        `)
        .eq('student_id', studentId)
        .order('due_date', { ascending: false })
        .limit(30);

      if (error) throw error;
      return (data || []) as unknown as ParentInvoice[];
    },
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
