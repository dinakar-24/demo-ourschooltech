import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FeeRecord {
  id: string;
  student_id: string;
  school_id: string;
  fee_type: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  payment_method: string | null;
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    full_name: string;
    class_name: string;
    section: string;
    admission_number: string;
  };
}

export interface FeeStats {
  totalDue: number;
  collected: number;
  pending: number;
  overdue: number;
}

export function useFees(filters?: { status?: string; classFilter?: string; search?: string }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['fees', user?.schoolId, filters],
    queryFn: async () => {
      if (!user?.schoolId) return [];

      let query = supabase
        .from('fees')
        .select(`
          *,
          student:students(id, full_name, class_name, section, admission_number)
        `)
        .eq('school_id', user.schoolId)
        .order('due_date', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Apply client-side filters for class and search
      let filtered = data as FeeRecord[];

      if (filters?.classFilter && filters.classFilter !== 'all') {
        filtered = filtered.filter(f => f.student?.class_name === filters.classFilter);
      }

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(f => 
          f.student?.full_name.toLowerCase().includes(searchLower) ||
          f.student?.admission_number.toLowerCase().includes(searchLower)
        );
      }

      return filtered;
    },
    enabled: !!user?.schoolId,
  });
}

export function useFeeStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['fee-stats', user?.schoolId],
    queryFn: async (): Promise<FeeStats> => {
      if (!user?.schoolId) {
        return { totalDue: 0, collected: 0, pending: 0, overdue: 0 };
      }

      const { data, error } = await supabase
        .from('fees')
        .select('amount, status, due_date')
        .eq('school_id', user.schoolId);

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];

      const stats = (data || []).reduce(
        (acc, fee) => {
          acc.totalDue += Number(fee.amount);
          
          if (fee.status === 'paid') {
            acc.collected += Number(fee.amount);
          } else if (fee.status === 'pending' && fee.due_date < today) {
            acc.overdue += Number(fee.amount);
          } else if (fee.status === 'pending') {
            acc.pending += Number(fee.amount);
          } else if (fee.status === 'partial') {
            // For partial, we'd need paid_amount field - for now count as pending
            acc.pending += Number(fee.amount);
          }
          
          return acc;
        },
        { totalDue: 0, collected: 0, pending: 0, overdue: 0 }
      );

      return stats;
    },
    enabled: !!user?.schoolId,
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      feeId,
      paymentMethod,
      transactionId,
    }: {
      feeId: string;
      paymentMethod: string;
      transactionId?: string;
    }) => {
      const { data, error } = await supabase
        .from('fees')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0],
          payment_method: paymentMethod,
          transaction_id: transactionId || null,
        })
        .eq('id', feeId)
        .eq('school_id', user?.schoolId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      queryClient.invalidateQueries({ queryKey: ['fee-stats'] });
    },
  });
}

export function useCreateFee() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (feeData: {
      student_id: string;
      fee_type: string;
      amount: number;
      due_date: string;
    }) => {
      if (!user?.schoolId) throw new Error('No school ID');

      const { data, error } = await supabase
        .from('fees')
        .insert({
          ...feeData,
          school_id: user.schoolId,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      queryClient.invalidateQueries({ queryKey: ['fee-stats'] });
    },
  });
}
