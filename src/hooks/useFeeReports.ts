import { supabase } from '@/integrations/supabase/client';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';

async function downloadWorkbook(wb: ExcelJS.Workbook, filename: string) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function autoWidth(ws: ExcelJS.Worksheet) {
  ws.columns.forEach(col => {
    let max = 12;
    col.eachCell?.({ includeEmpty: false }, cell => {
      const len = String(cell.value || '').length + 2;
      if (len > max) max = len;
    });
    col.width = Math.min(max, 40);
  });
}

function addHeader(ws: ExcelJS.Worksheet, title: string) {
  const row = ws.addRow([title]);
  row.font = { bold: true, size: 14 };
  ws.addRow([`Generated: ${new Date().toLocaleDateString('en-IN')}`]);
  ws.addRow([]);
}

export function useFeeReports() {
  const schoolId = useEffectiveSchoolId();

  const generateFeeSummary = async () => {
    if (!schoolId) return;
    try {
      toast.loading('Generating fee summary...');

      const { data, error } = await supabase
        .from('fee_invoices')
        .select('total_amount, paid_amount, balance, status, due_date, student:students!inner(class_name, section)')
        .eq('school_id', schoolId);

      if (error) throw error;

      // Group by class
      const classMap = new Map<string, { total: number; collected: number; pending: number; overdue: number; count: number }>();
      const today = new Date().toISOString().split('T')[0];

      for (const inv of data || []) {
        const cls = (inv as any).student?.class_name || 'Unknown';
        if (!classMap.has(cls)) classMap.set(cls, { total: 0, collected: 0, pending: 0, overdue: 0, count: 0 });
        const g = classMap.get(cls)!;
        g.count++;
        g.total += Number(inv.total_amount);
        g.collected += Number(inv.paid_amount);
        if (inv.status === 'pending' && inv.due_date < today) {
          g.overdue += Number(inv.balance);
        } else if (inv.status !== 'paid') {
          g.pending += Number(inv.balance);
        }
      }

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Fee Summary');
      addHeader(ws, 'Fee Summary Report');

      const headerRow = ws.addRow(['Class', 'Invoices', 'Total Amount', 'Collected', 'Pending', 'Overdue', 'Collection %']);
      headerRow.font = { bold: true };
      headerRow.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }; });

      for (const [cls, stats] of Array.from(classMap.entries()).sort()) {
        const rate = stats.total > 0 ? ((stats.collected / stats.total) * 100).toFixed(1) + '%' : '0%';
        ws.addRow([cls, stats.count, stats.total, stats.collected, stats.pending, stats.overdue, rate]);
      }

      // Totals
      const totals = Array.from(classMap.values()).reduce((a, b) => ({
        count: a.count + b.count, total: a.total + b.total, collected: a.collected + b.collected,
        pending: a.pending + b.pending, overdue: a.overdue + b.overdue,
      }), { count: 0, total: 0, collected: 0, pending: 0, overdue: 0 });

      const totalRow = ws.addRow(['TOTAL', totals.count, totals.total, totals.collected, totals.pending, totals.overdue,
        totals.total > 0 ? ((totals.collected / totals.total) * 100).toFixed(1) + '%' : '0%']);
      totalRow.font = { bold: true };

      // Format currency columns
      [3, 4, 5, 6].forEach(col => {
        ws.getColumn(col).numFmt = '₹#,##0';
      });

      autoWidth(ws);
      ws.views = [{ state: 'frozen', ySplit: 4 }];

      await downloadWorkbook(wb, `fee-summary-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.dismiss();
      toast.success('Report downloaded');
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || 'Failed to generate report');
    }
  };

  const generatePendingList = async () => {
    if (!schoolId) return;
    try {
      toast.loading('Generating pending fees list...');

      const { data, error } = await supabase
        .from('fee_invoices')
        .select('total_amount, paid_amount, balance, due_date, status, student:students!inner(full_name, admission_number, class_name, section, parent_phone), term:fee_terms(name)')
        .eq('school_id', schoolId)
        .neq('status', 'paid')
        .order('due_date', { ascending: true });

      if (error) throw error;

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Pending Fees');
      addHeader(ws, 'Pending Fees List');

      const headerRow = ws.addRow(['Student', 'Admission No', 'Class', 'Term', 'Total', 'Paid', 'Balance', 'Due Date', 'Status', 'Parent Phone']);
      headerRow.font = { bold: true };
      headerRow.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }; });

      const today = new Date().toISOString().split('T')[0];
      for (const inv of data || []) {
        const s = (inv as any).student;
        const isOverdue = inv.status === 'pending' && inv.due_date < today;
        ws.addRow([
          s?.full_name, s?.admission_number, `${s?.class_name}-${s?.section}`,
          (inv as any).term?.name || 'N/A',
          Number(inv.total_amount), Number(inv.paid_amount), Number(inv.balance),
          new Date(inv.due_date).toLocaleDateString('en-IN'),
          isOverdue ? 'Overdue' : inv.status,
          s?.parent_phone || '',
        ]);
      }

      [5, 6, 7].forEach(col => { ws.getColumn(col).numFmt = '₹#,##0'; });
      autoWidth(ws);
      ws.views = [{ state: 'frozen', ySplit: 4 }];

      await downloadWorkbook(wb, `pending-fees-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.dismiss();
      toast.success('Report downloaded');
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || 'Failed to generate report');
    }
  };

  const generatePaymentHistory = async () => {
    if (!schoolId) return;
    try {
      toast.loading('Generating payment history...');

      const { data, error } = await supabase
        .from('fee_payments')
        .select('amount, payment_method, payment_date, receipt_number, transaction_id, notes, student:students!inner(full_name, admission_number, class_name, section)')
        .eq('school_id', schoolId)
        .order('payment_date', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Payment History');
      addHeader(ws, 'Payment History');

      const headerRow = ws.addRow(['Receipt No', 'Student', 'Admission No', 'Class', 'Amount', 'Payment Method', 'Date', 'Transaction ID', 'Notes']);
      headerRow.font = { bold: true };
      headerRow.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }; });

      for (const p of data || []) {
        const s = (p as any).student;
        ws.addRow([
          p.receipt_number, s?.full_name, s?.admission_number, `${s?.class_name}-${s?.section}`,
          Number(p.amount), p.payment_method,
          new Date(p.payment_date).toLocaleDateString('en-IN'),
          p.transaction_id || '', p.notes || '',
        ]);
      }

      ws.getColumn(5).numFmt = '₹#,##0';
      autoWidth(ws);
      ws.views = [{ state: 'frozen', ySplit: 4 }];

      await downloadWorkbook(wb, `payment-history-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.dismiss();
      toast.success('Report downloaded');
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || 'Failed to generate report');
    }
  };

  return { generateFeeSummary, generatePendingList, generatePaymentHistory };
}
