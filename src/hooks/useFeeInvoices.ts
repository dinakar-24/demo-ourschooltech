import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { useDebounce } from '@/hooks/useDebounce';
import { getSupabaseRange } from './usePagination';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';

// ─── Types ───────────────────────────────────────────────────────────

export interface InvoiceComponent {
  id: string;
  invoice_id: string;
  fee_type: string;
  amount: number;
}

export interface FeePayment {
  id: string;
  invoice_id: string;
  student_id: string;
  school_id: string;
  amount: number;
  payment_method: string;
  transaction_id: string | null;
  cheque_number: string | null;
  cheque_date: string | null;
  bank_name: string | null;
  payment_date: string;
  received_by: string | null;
  receipt_number: string;
  notes: string | null;
  created_at: string;
}

export interface FeeInvoice {
  id: string;
  school_id: string;
  student_id: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
  status: string;
  due_date: string;
  created_at: string;
  student?: {
    id: string;
    full_name: string;
    class_name: string;
    section: string;
    admission_number: string;
    parent_name?: string | null;
    parent_email?: string | null;
    roll_number?: number | null;
  };
  components?: InvoiceComponent[];
  payments?: FeePayment[];
}

export interface InvoiceStats {
  totalDue: number;
  collected: number;
  pending: number;
  overdue: number;
}

interface InvoiceFilters {
  status?: string;
  search?: string;
  className?: string;
  page?: number;
  pageSize?: number;
}

// ─── Fee Invoices ────────────────────────────────────────────────────


export function useFeeInvoices(filters?: InvoiceFilters) {
  const schoolId = useEffectiveSchoolId();
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 25;

  return useQuery({
    queryKey: queryKeys.feeInvoices(schoolId, filters),
    queryFn: async () => {
      if (!schoolId) return { data: [] as FeeInvoice[], totalCount: 0 };

      let query = supabase
        .from('fee_invoices')
        .select(`
          *,
          student:students!inner(id, full_name, class_name, section, admission_number, parent_name, parent_email, roll_number),
          components:fee_invoice_components(id, fee_type, amount),
          payments:fee_payments(id, amount, payment_method, transaction_id, cheque_number, cheque_date, bank_name, payment_date, received_by, receipt_number, notes, created_at, student_id, school_id)
        `, { count: 'exact' })
        .eq('school_id', schoolId)
        .order('due_date', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        if (filters.status === 'overdue') {
          query = query.eq('status', 'pending').lt('due_date', new Date().toISOString().split('T')[0]);
        } else {
          query = query.eq('status', filters.status);
        }
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
      return { data: (data || []) as unknown as FeeInvoice[], totalCount: count || 0 };
    },
    enabled: !!schoolId,
    staleTime: 2 * 60 * 1000,
  });
}

// ─── Invoice Stats ───────────────────────────────────────────────────

export function useInvoiceStats() {
  const schoolId = useEffectiveSchoolId();

  return useQuery({
    queryKey: queryKeys.invoiceStats(schoolId),
    queryFn: async (): Promise<InvoiceStats> => {
      if (!schoolId) return { totalDue: 0, collected: 0, pending: 0, overdue: 0 };

      const { data, error } = await supabase.rpc('get_invoice_stats' as any, {
        _school_id: schoolId,
      } as any);

      if (error) throw error;
      const r = data as any;
      return {
        totalDue: Number(r?.totalDue ?? 0),
        collected: Number(r?.collected ?? 0),
        pending: Number(r?.pending ?? 0),
        overdue: Number(r?.overdue ?? 0),
      };
    },
    enabled: !!schoolId,
    staleTime: 2 * 60 * 1000,
  });
}

// ─── Create Invoice ──────────────────────────────────────────────────

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const schoolId = useEffectiveSchoolId();

  return useMutation({
    mutationFn: async (invoiceData: {
      student_id: string;
      due_date: string;
      components: { fee_type: string; amount: number }[];
    }) => {
      if (!schoolId) throw new Error('No school ID');
      const totalAmount = invoiceData.components.reduce((s, c) => s + c.amount, 0);

      const { data: invoice, error: invErr } = await supabase
        .from('fee_invoices')
        .insert({
          school_id: schoolId,
          student_id: invoiceData.student_id,
          total_amount: totalAmount,
          paid_amount: 0,
          balance: totalAmount,
          status: 'pending',
          due_date: invoiceData.due_date,
        } as any)
        .select()
        .single();

      if (invErr) throw invErr;

      const comps = invoiceData.components.map((c) => ({
        invoice_id: invoice.id,
        fee_type: c.fee_type,
        amount: c.amount,
      }));

      const { error: compErr } = await supabase.from('fee_invoice_components').insert(comps);
      if (compErr) throw compErr;

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allFeeInvoices });
      queryClient.invalidateQueries({ queryKey: queryKeys.allInvoiceStats });
      toast.success('Invoice created');
    },
  });
}

// ─── Apply Discount (via RPC) ────────────────────────────────────────

export function useApplyDiscount() {
  const queryClient = useQueryClient();
  const schoolId = useEffectiveSchoolId();

  return useMutation({
    mutationFn: async (params: {
      invoice_id: string;
      student_id: string;
      discount_amount: number;
      reason: string;
      notes?: string;
    }) => {
      if (!schoolId) throw new Error('No school ID');

      const { data, error } = await supabase.rpc('apply_fee_discount' as any, {
        _school_id: schoolId,
        _invoice_id: params.invoice_id,
        _student_id: params.student_id,
        _discount_amount: params.discount_amount,
        _reason: params.reason,
        _notes: params.notes || null,
        _applied_by: null,
      } as any);

      if (error) throw error;
      return data as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allFeeInvoices });
      queryClient.invalidateQueries({ queryKey: queryKeys.allInvoiceStats });
      toast.success('Discount applied successfully');
    },
  });
}

// ─── Record Payment (via RPC) ────────────────────────────────────────

export function useRecordInvoicePayment() {
  const queryClient = useQueryClient();
  const schoolId = useEffectiveSchoolId();

  return useMutation({
    mutationFn: async (payment: {
      invoice_id: string;
      student_id: string;
      amount: number;
      payment_method: string;
      transaction_id?: string;
      cheque_number?: string;
      cheque_date?: string;
      bank_name?: string;
      payment_date: string;
      received_by?: string;
      notes?: string;
    }) => {
      if (!schoolId) throw new Error('No school ID');

      const { data, error } = await supabase.rpc('record_fee_payment' as any, {
        _school_id: schoolId,
        _invoice_id: payment.invoice_id,
        _student_id: payment.student_id,
        _amount: payment.amount,
        _payment_method: payment.payment_method,
        _transaction_id: payment.transaction_id || null,
        _cheque_number: payment.cheque_number || null,
        _cheque_date: payment.cheque_date || null,
        _bank_name: payment.bank_name || null,
        _payment_date: payment.payment_date,
        _received_by: payment.received_by || null,
        _notes: payment.notes || null,
      } as any);

      if (error) throw error;
      return data as any;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.allFeeInvoices });
      queryClient.invalidateQueries({ queryKey: queryKeys.allInvoiceStats });
      toast.success(`Payment recorded! Receipt: ${data?.receipt_number}`);
    },
  });
}
