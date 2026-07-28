import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import type { FeeInvoice } from './useFeeInvoices';
import { queryKeys } from '@/lib/query-keys';

export function useStudentFeeInvoices(studentId: string | undefined) {
  const schoolId = useEffectiveSchoolId();

  return useQuery({
    queryKey: queryKeys.studentFeeInvoices(schoolId, studentId),
    queryFn: async () => {
      if (!schoolId || !studentId) return [] as FeeInvoice[];

      const { data, error } = await supabase
        .from('fee_invoices')
        .select(`
          *,
          student:students!inner(id, full_name, class_name, section, admission_number, parent_name, parent_email, roll_number, parent_phone, avatar_url),
          components:fee_invoice_components(id, fee_type, amount),
          payments:fee_payments(id, amount, payment_method, transaction_id, cheque_number, cheque_date, bank_name, payment_date, received_by, receipt_number, notes, created_at, student_id, school_id)
        `)
        .eq('school_id', schoolId)
        .eq('student_id', studentId)
        .order('due_date', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as FeeInvoice[];
    },
    enabled: !!schoolId && !!studentId,
    staleTime: 2 * 60 * 1000,
  });
}
