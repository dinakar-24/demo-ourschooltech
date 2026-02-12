import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { toast } from 'sonner';

export function useGenerateReceipt() {
  const queryClient = useQueryClient();
  const schoolId = useEffectiveSchoolId();

  return useMutation({
    mutationFn: async (feeId: string) => {
      if (!schoolId) throw new Error('No school ID');

      // Generate receipt number atomically
      const { data: receiptNumber, error: rpcError } = await supabase.rpc(
        'generate_receipt_number' as any,
        { _school_id: schoolId } as any
      );

      if (rpcError) throw rpcError;

      // Update the fee record with receipt number
      const { data, error } = await supabase
        .from('fees')
        .update({ receipt_number: receiptNumber } as any)
        .eq('id', feeId)
        .eq('school_id', schoolId)
        .select(`
          *,
          student:students!inner(id, full_name, class_name, section, admission_number)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      toast.success('Receipt generated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate receipt');
    },
  });
}
