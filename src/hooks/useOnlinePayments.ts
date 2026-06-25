import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OnlinePayment {
  id: string;
  invoice_id: string;
  student_id: string;
  school_id: string;
  amount: number;
  extra_charge: number;
  total_charged: number;
  cf_order_id: string | null;
  cf_payment_id: string | null;
  method: string | null;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
  transaction_ref: string | null;
  created_at: string;
  verified_at: string | null;
}

/**
 * Fetch online payment attempts for an invoice, newest first, with realtime updates.
 */
export function useOnlinePayments(invoiceId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = ['online-payments', invoiceId];

  const query = useQuery({
    queryKey,
    enabled: !!invoiceId,
    staleTime: 15 * 1000,
    queryFn: async (): Promise<OnlinePayment[]> => {
      if (!invoiceId) return [];
      const { data, error } = await (supabase
        .from('online_payments' as any)
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: false })
        .limit(10) as any);
      if (error) throw error;
      return (data || []) as OnlinePayment[];
    },
  });

  useEffect(() => {
    if (!invoiceId) return;
    const channel = supabase
      .channel(`online-payments-${invoiceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'online_payments', filter: `invoice_id=eq.${invoiceId}` },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  return query;
}