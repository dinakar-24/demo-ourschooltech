import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { useDebounce } from '@/hooks/useDebounce';
import { getSupabaseRange } from './usePagination';
import { toast } from 'sonner';

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
  term_id: string;
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
  };
  term?: {
    id: string;
    name: string;
    academic_year?: {
      id: string;
      name: string;
    };
  };
  components?: InvoiceComponent[];
  payments?: FeePayment[];
}

export interface FeeTerm {
  id: string;
  school_id: string;
  academic_year_id: string;
  name: string;
  due_date: string;
  display_order: number;
  academic_year?: {
    id: string;
    name: string;
  };
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
  termId?: string;
  className?: string;
  page?: number;
  pageSize?: number;
}

// ─── Fee Terms ───────────────────────────────────────────────────────

export function useFeeTerms() {
  const schoolId = useEffectiveSchoolId();

  return useQuery({
    queryKey: ['fee-terms', schoolId],
    queryFn: async (): Promise<FeeTerm[]> => {
      if (!schoolId) return [];
      const { data, error } = await supabase
        .from('fee_terms')
        .select('*, academic_year:academic_years(id, name)')
        .eq('school_id', schoolId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data || []) as any;
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateFeeTerm() {
  const queryClient = useQueryClient();
  const schoolId = useEffectiveSchoolId();

  return useMutation({
    mutationFn: async (term: { name: string; academic_year_id: string; due_date: string; display_order?: number }) => {
      if (!schoolId) throw new Error('No school ID');
      const { data, error } = await supabase
        .from('fee_terms')
        .insert({ ...term, school_id: schoolId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-terms'] });
      toast.success('Term created');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Fee Invoices ────────────────────────────────────────────────────

export function useFeeInvoices(filters?: InvoiceFilters) {
  const schoolId = useEffectiveSchoolId();
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 25;

  return useQuery({
    queryKey: ['fee-invoices', schoolId, filters],
    queryFn: async () => {
      if (!schoolId) return { data: [] as FeeInvoice[], totalCount: 0 };

      let query = supabase
        .from('fee_invoices')
        .select(`
          *,
          student:students!inner(id, full_name, class_name, section, admission_number),
          term:fee_terms(id, name, academic_year:academic_years(id, name)),
          components:fee_invoice_components(id, fee_type, amount),
          payments:fee_payments(id, amount, payment_method, transaction_id, cheque_number, bank_name, payment_date, received_by, receipt_number, notes, created_at)
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

      if (filters?.termId && filters.termId !== 'all') {
        query = query.eq('term_id', filters.termId);
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
    queryKey: ['invoice-stats', schoolId],
    queryFn: async (): Promise<InvoiceStats> => {
      if (!schoolId) return { totalDue: 0, collected: 0, pending: 0, overdue: 0 };

      const { data, error } = await supabase
        .from('fee_invoices')
        .select('total_amount, paid_amount, balance, status, due_date')
        .eq('school_id', schoolId);

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      const stats = (data || []).reduce(
        (acc, inv) => {
          acc.totalDue += Number(inv.total_amount);
          acc.collected += Number(inv.paid_amount);
          if (inv.status === 'pending' && inv.due_date < today) {
            acc.overdue += Number(inv.balance);
          } else if (inv.status !== 'paid') {
            acc.pending += Number(inv.balance);
          }
          return acc;
        },
        { totalDue: 0, collected: 0, pending: 0, overdue: 0 }
      );
      return stats;
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
      term_id: string;
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
          term_id: invoiceData.term_id,
          total_amount: totalAmount,
          paid_amount: 0,
          balance: totalAmount,
          status: 'pending',
          due_date: invoiceData.due_date,
        })
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
      queryClient.invalidateQueries({ queryKey: ['fee-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      toast.success('Invoice created');
    },
    onError: (e: Error) => toast.error(e.message),
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
      queryClient.invalidateQueries({ queryKey: ['fee-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      toast.success(`Payment recorded! Receipt: ${data?.receipt_number}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
