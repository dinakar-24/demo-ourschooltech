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
    queryKey: ['fee-invoices', schoolId, filters],
    queryFn: async () => {
      if (!schoolId) return { data: [] as FeeInvoice[], totalCount: 0 };

      let query = supabase
        .from('fee_invoices')
        .select(`
          *,
          student:students!inner(id, full_name, class_name, section, admission_number),
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
      queryClient.invalidateQueries({ queryKey: ['fee-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      toast.success('Invoice created');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ─── Bulk Create Invoices ────────────────────────────────────────────

export function useCreateBulkInvoices() {
  const queryClient = useQueryClient();
  const schoolId = useEffectiveSchoolId();

  return useMutation({
    mutationFn: async (params: {
      className: string;
      section?: string;
      due_date: string;
      components: { fee_type: string; amount: number }[];
    }) => {
      if (!schoolId) throw new Error('No school ID');

      // Fetch active students for this class/section
      let query = supabase
        .from('students')
        .select('id')
        .eq('school_id', schoolId)
        .eq('status', 'active')
        .eq('class_name', params.className);

      if (params.section) {
        query = query.eq('section', params.section);
      }

      const { data: students, error: studErr } = await query;
      if (studErr) throw studErr;
      if (!students?.length) throw new Error('No active students found for this class/section');

      const totalAmount = params.components.reduce((s, c) => s + c.amount, 0);
      let created = 0;

      // Create in batches of 50
      const batchSize = 50;
      for (let i = 0; i < students.length; i += batchSize) {
        const batch = students.slice(i, i + batchSize);

        const invoices = batch.map(s => ({
          school_id: schoolId,
          student_id: s.id,
          total_amount: totalAmount,
          paid_amount: 0,
          balance: totalAmount,
          status: 'pending',
          due_date: params.due_date,
        }));

        const { data: createdInvoices, error: invErr } = await supabase
          .from('fee_invoices')
          .insert(invoices)
          .select('id');

        if (invErr) throw invErr;

        // Insert components for each invoice
        const allComps = (createdInvoices || []).flatMap(inv =>
          params.components.map(c => ({
            invoice_id: inv.id,
            fee_type: c.fee_type,
            amount: c.amount,
          }))
        );

        if (allComps.length > 0) {
          const { error: compErr } = await supabase.from('fee_invoice_components').insert(allComps);
          if (compErr) throw compErr;
        }

        created += batch.length;
      }

      return { created };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fee-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      toast.success(`Created invoices for ${data.created} students`);
    },
    onError: (e: Error) => toast.error(e.message),
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
      queryClient.invalidateQueries({ queryKey: ['fee-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      toast.success('Discount applied successfully');
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
