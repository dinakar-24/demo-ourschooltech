import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/query-keys';

const FEE_REALTIME_TABLES = [
  'fee_invoices',
  'fee_payments',
  'fee_discounts',
  'payment_submissions',
  'fees',
  'online_payments',
] as const;

interface UseFeeRealtimeOptions {
  schoolId?: string;
  studentId?: string;
  scope: string;
  enabled?: boolean;
}

export function useFeeRealtime({ schoolId, studentId, scope, enabled = true }: UseFeeRealtimeOptions) {
  const queryClient = useQueryClient();

  const target = useMemo(() => {
    if (studentId) {
      return { column: 'student_id', value: studentId };
    }

    if (schoolId) {
      return { column: 'school_id', value: schoolId };
    }

    return null;
  }, [schoolId, studentId]);

  useEffect(() => {
    if (!enabled || !target?.value) return;

    const handleFeeChange = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allFeeInvoices });
      queryClient.invalidateQueries({ queryKey: queryKeys.allInvoiceStats });
      queryClient.invalidateQueries({ queryKey: ['student-fee-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['payment-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['parent-payment-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['parent-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      queryClient.invalidateQueries({ queryKey: ['fee-stats'] });
      queryClient.invalidateQueries({ queryKey: ['parent-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['parent-data'] });
    };

    const channel = supabase.channel(`fee-realtime-${scope}-${target.column}-${target.value}`);

    FEE_REALTIME_TABLES.forEach((table) => {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `${target.column}=eq.${target.value}`,
        },
        handleFeeChange
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, queryClient, scope, target]);
}