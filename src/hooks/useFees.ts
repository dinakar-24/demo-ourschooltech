import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { getSupabaseRange } from './usePagination';

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
  receipt_number: string | null;
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

interface FeeFilters {
  status?: string;
  feeType?: string;
  className?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedFees {
  data: FeeRecord[];
  totalCount: number;
}

export function useFees(filters?: FeeFilters) {
  const schoolId = useEffectiveSchoolId();
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 25;

  return useQuery({
    queryKey: ['fees', schoolId, filters],
    queryFn: async (): Promise<PaginatedFees> => {
      if (!schoolId) return { data: [], totalCount: 0 };

      let query = supabase
        .from('fees')
        .select(`
          *,
          student:students!inner(id, full_name, class_name, section, admission_number)
        `, { count: 'exact' })
        .eq('school_id', schoolId)
        .order('due_date', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.feeType && filters.feeType !== 'All Types') {
        query = query.eq('fee_type', filters.feeType);
      }

      if (filters?.className && filters.className !== 'all') {
        query = query.eq('student.class_name', filters.className);
      }

      if (filters?.search) {
        query = query.or(
          `student.full_name.ilike.%${filters.search}%,student.admission_number.ilike.%${filters.search}%`,
          { foreignTable: 'student' }
        );
      }

      const { from, to } = getSupabaseRange(page, pageSize);
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      return { data: (data || []) as FeeRecord[], totalCount: count || 0 };
    },
    enabled: !!schoolId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useFeeStats() {
  const schoolId = useEffectiveSchoolId();

  return useQuery({
    queryKey: ['fee-stats', schoolId],
    queryFn: async (): Promise<FeeStats> => {
      if (!schoolId) {
        return { totalDue: 0, collected: 0, pending: 0, overdue: 0 };
      }

      const { data, error } = await supabase.rpc('get_fee_stats' as any, {
        _school_id: schoolId,
      } as any);

      if (error) throw error;

      const result = data as any;
      return {
        totalDue: Number(result?.totalDue ?? 0),
        collected: Number(result?.collected ?? 0),
        pending: Number(result?.pending ?? 0),
        overdue: Number(result?.overdue ?? 0),
      };
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  const schoolId = useEffectiveSchoolId();

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
        .eq('school_id', schoolId)
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
  const schoolId = useEffectiveSchoolId();

  return useMutation({
    mutationFn: async (feeData: {
      student_id: string;
      fee_type: string;
      amount: number;
      due_date: string;
    }) => {
      if (!schoolId) throw new Error('No school ID');

      const { data, error } = await supabase
        .from('fees')
        .insert({
          ...feeData,
          school_id: schoolId,
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
