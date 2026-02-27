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
      const len = String(cell.value || '').length + 4;
      if (len > max) max = len;
    });
    col.width = Math.min(max, 45);
  });
}

function addHeader(ws: ExcelJS.Worksheet, title: string) {
  const row = ws.addRow([title]);
  row.font = { bold: true, size: 14 };
  ws.addRow([`Generated: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}`]);
  ws.addRow([]);
}

function styleHeaderRow(headerRow: ExcelJS.Row) {
  headerRow.font = { bold: true, size: 11 };
  headerRow.height = 24;
  headerRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FFD0D5DD' } } };
    cell.alignment = { vertical: 'middle', wrapText: true };
  });
}

export interface ReportFilters {
  className?: string;
  section?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  examId?: string;
  status?: string;
}

export function useReportGenerators() {
  const schoolId = useEffectiveSchoolId();

  // ─── STUDENT LIST REPORT ─────────────────────────────
  const generateStudentList = async (filters: ReportFilters = {}) => {
    if (!schoolId) return;
    const tid = toast.loading('Generating Student List Report...');
    try {
      let query = supabase
        .from('students')
        .select('full_name, admission_number, class_name, section, parent_name, parent_phone, parent_email, gender, date_of_birth, status, roll_number')
        .eq('school_id', schoolId)
        .order('class_name')
        .order('section')
        .order('roll_number');

      if (filters.className) query = query.eq('class_name', filters.className);
      if (filters.section) query = query.eq('section', filters.section);
      if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);

      const { data, error } = await query;
      if (error) throw error;

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Student List');
      addHeader(ws, 'Student List Report');

      const headerRow = ws.addRow(['#', 'Name', 'Admission No', 'Class', 'Section', 'Roll No', 'Gender', 'DOB', 'Parent Name', 'Parent Phone', 'Parent Email', 'Status']);
      styleHeaderRow(headerRow);

      (data || []).forEach((s, i) => {
        ws.addRow([
          i + 1, s.full_name, s.admission_number, s.class_name, s.section,
          s.roll_number || '', s.gender || '', s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString('en-IN') : '',
          s.parent_name || '', s.parent_phone || '', s.parent_email || '', s.status || 'active',
        ]);
      });

      autoWidth(ws);
      ws.views = [{ state: 'frozen', ySplit: 4 }];
      await downloadWorkbook(wb, `student-list-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.dismiss(tid);
      toast.success(`Student List exported (${data?.length || 0} records)`);
    } catch (err: any) {
      toast.dismiss(tid);
      toast.error(err.message || 'Failed to generate report');
    }
  };

  // ─── CLASS-WISE REPORT ───────────────────────────────
  const generateClassWise = async () => {
    if (!schoolId) return;
    const tid = toast.loading('Generating Class-wise Report...');
    try {
      const { data, error } = await supabase
        .from('students')
        .select('full_name, admission_number, class_name, section, roll_number, gender, status')
        .eq('school_id', schoolId)
        .eq('status', 'active')
        .order('class_name')
        .order('section')
        .order('roll_number');

      if (error) throw error;

      const wb = new ExcelJS.Workbook();

      // Group by class
      const classMap = new Map<string, typeof data>();
      for (const s of data || []) {
        const key = s.class_name;
        if (!classMap.has(key)) classMap.set(key, []);
        classMap.get(key)!.push(s);
      }

      // Summary sheet
      const summary = wb.addWorksheet('Summary');
      addHeader(summary, 'Class-wise Summary');
      const sHeader = summary.addRow(['Class', 'Total Students', 'Boys', 'Girls']);
      styleHeaderRow(sHeader);

      let grandTotal = 0;
      for (const [cls, students] of Array.from(classMap.entries()).sort()) {
        const boys = students.filter(s => s.gender?.toLowerCase() === 'male').length;
        const girls = students.filter(s => s.gender?.toLowerCase() === 'female').length;
        summary.addRow([cls, students.length, boys, girls]);
        grandTotal += students.length;
      }
      const totalRow = summary.addRow(['TOTAL', grandTotal, '', '']);
      totalRow.font = { bold: true };
      autoWidth(summary);

      // Detail sheets per class
      for (const [cls, students] of Array.from(classMap.entries()).sort()) {
        const ws = wb.addWorksheet(`Class ${cls}`);
        addHeader(ws, `Class ${cls} Students`);
        const h = ws.addRow(['#', 'Name', 'Admission No', 'Section', 'Roll No', 'Gender']);
        styleHeaderRow(h);
        students.forEach((s, i) => {
          ws.addRow([i + 1, s.full_name, s.admission_number, s.section, s.roll_number || '', s.gender || '']);
        });
        autoWidth(ws);
      }

      await downloadWorkbook(wb, `class-wise-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.dismiss(tid);
      toast.success(`Class-wise report exported (${grandTotal} students)`);
    } catch (err: any) {
      toast.dismiss(tid);
      toast.error(err.message || 'Failed to generate report');
    }
  };

  // ─── DAILY ATTENDANCE REPORT ─────────────────────────
  const generateDailyAttendance = async (filters: ReportFilters = {}) => {
    if (!schoolId) return;
    const date = filters.date || new Date().toISOString().split('T')[0];
    const tid = toast.loading('Generating Daily Attendance Report...');
    try {
      // Get all active students
      let studentQuery = supabase
        .from('students')
        .select('id, full_name, admission_number, class_name, section, roll_number')
        .eq('school_id', schoolId)
        .eq('status', 'active')
        .order('class_name')
        .order('section')
        .order('roll_number');

      if (filters.className) studentQuery = studentQuery.eq('class_name', filters.className);

      const [studentsRes, attendanceRes] = await Promise.all([
        studentQuery,
        supabase
          .from('attendance')
          .select('student_id, status, notes')
          .eq('school_id', schoolId)
          .eq('date', date),
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (attendanceRes.error) throw attendanceRes.error;

      const attMap = new Map<string, { status: string; notes: string | null }>();
      for (const a of attendanceRes.data || []) {
        attMap.set(a.student_id, { status: a.status, notes: a.notes });
      }

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Daily Attendance');
      addHeader(ws, `Daily Attendance Report - ${new Date(date).toLocaleDateString('en-IN')}`);

      const headerRow = ws.addRow(['#', 'Name', 'Admission No', 'Class', 'Section', 'Roll No', 'Status', 'Notes']);
      styleHeaderRow(headerRow);

      let present = 0, absent = 0, late = 0, unmarked = 0;
      (studentsRes.data || []).forEach((s, i) => {
        const att = attMap.get(s.id);
        const status = att?.status || 'Not Marked';
        if (status === 'present') present++;
        else if (status === 'absent') absent++;
        else if (status === 'late') late++;
        else unmarked++;
        ws.addRow([i + 1, s.full_name, s.admission_number, s.class_name, s.section, s.roll_number || '', status, att?.notes || '']);
      });

      // Summary at bottom
      ws.addRow([]);
      const sumRow = ws.addRow(['Summary', '', '', `Present: ${present}`, `Absent: ${absent}`, `Late: ${late}`, `Unmarked: ${unmarked}`, `Total: ${studentsRes.data?.length || 0}`]);
      sumRow.font = { bold: true };

      autoWidth(ws);
      ws.views = [{ state: 'frozen', ySplit: 4 }];
      await downloadWorkbook(wb, `daily-attendance-${date}.xlsx`);
      toast.dismiss(tid);
      toast.success(`Attendance report exported for ${new Date(date).toLocaleDateString('en-IN')}`);
    } catch (err: any) {
      toast.dismiss(tid);
      toast.error(err.message || 'Failed to generate report');
    }
  };

  // ─── ABSENTEE REPORT ─────────────────────────────────
  const generateAbsenteeReport = async (filters: ReportFilters = {}) => {
    if (!schoolId) return;
    const dateFrom = filters.dateFrom || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const dateTo = filters.dateTo || new Date().toISOString().split('T')[0];
    const tid = toast.loading('Generating Absentee Report...');
    try {
      const { data: attendance, error } = await supabase
        .from('attendance')
        .select('student_id, date, status')
        .eq('school_id', schoolId)
        .eq('status', 'absent')
        .gte('date', dateFrom)
        .lte('date', dateTo);

      if (error) throw error;

      // Count absences per student
      const absMap = new Map<string, { count: number; dates: string[] }>();
      for (const a of attendance || []) {
        if (!absMap.has(a.student_id)) absMap.set(a.student_id, { count: 0, dates: [] });
        const entry = absMap.get(a.student_id)!;
        entry.count++;
        entry.dates.push(a.date);
      }

      // Get student details for those with absences
      const studentIds = Array.from(absMap.keys());
      if (studentIds.length === 0) {
        toast.dismiss(tid);
        toast.info('No absences found in the selected date range.');
        return;
      }

      const { data: students, error: sErr } = await supabase
        .from('students')
        .select('id, full_name, admission_number, class_name, section, parent_phone')
        .in('id', studentIds);

      if (sErr) throw sErr;

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Absentee Report');
      addHeader(ws, `Absentee Report (${new Date(dateFrom).toLocaleDateString('en-IN')} - ${new Date(dateTo).toLocaleDateString('en-IN')})`);

      const headerRow = ws.addRow(['#', 'Name', 'Admission No', 'Class', 'Section', 'Absence Count', 'Parent Phone']);
      styleHeaderRow(headerRow);

      const sorted = (students || [])
        .map(s => ({ ...s, absences: absMap.get(s.id)?.count || 0 }))
        .sort((a, b) => b.absences - a.absences);

      sorted.forEach((s, i) => {
        ws.addRow([i + 1, s.full_name, s.admission_number, s.class_name, s.section, s.absences, s.parent_phone || '']);
      });

      autoWidth(ws);
      ws.views = [{ state: 'frozen', ySplit: 4 }];
      await downloadWorkbook(wb, `absentee-report-${dateFrom}-to-${dateTo}.xlsx`);
      toast.dismiss(tid);
      toast.success(`Absentee report exported (${sorted.length} students)`);
    } catch (err: any) {
      toast.dismiss(tid);
      toast.error(err.message || 'Failed to generate report');
    }
  };

  // ─── FEE COLLECTION REPORT ───────────────────────────
  const generateFeeCollection = async (filters: ReportFilters = {}) => {
    if (!schoolId) return;
    const tid = toast.loading('Generating Fee Collection Report...');
    try {
      let query = supabase
        .from('fee_payments')
        .select('amount, payment_method, payment_date, receipt_number, student:students!inner(full_name, admission_number, class_name, section)')
        .eq('school_id', schoolId)
        .order('payment_date', { ascending: false });

      if (filters.dateFrom) query = query.gte('payment_date', filters.dateFrom);
      if (filters.dateTo) query = query.lte('payment_date', filters.dateTo);

      const { data, error } = await query;
      if (error) throw error;

      // Filter by class in JS since it's from joined table
      let filtered = data || [];
      if (filters.className) {
        filtered = filtered.filter((p: any) => p.student?.class_name === filters.className);
      }

      const wb = new ExcelJS.Workbook();

      // Detail sheet
      const ws = wb.addWorksheet('Collection Details');
      addHeader(ws, 'Fee Collection Report');
      const headerRow = ws.addRow(['#', 'Receipt No', 'Student', 'Admission No', 'Class', 'Section', 'Amount', 'Method', 'Date']);
      styleHeaderRow(headerRow);

      let total = 0;
      filtered.forEach((p: any, i: number) => {
        total += Number(p.amount);
        ws.addRow([
          i + 1, p.receipt_number, p.student?.full_name, p.student?.admission_number,
          p.student?.class_name, p.student?.section, Number(p.amount), p.payment_method,
          new Date(p.payment_date).toLocaleDateString('en-IN'),
        ]);
      });
      const tRow = ws.addRow(['', '', '', '', '', 'TOTAL', total, '', '']);
      tRow.font = { bold: true };
      ws.getColumn(7).numFmt = '₹#,##0';
      autoWidth(ws);
      ws.views = [{ state: 'frozen', ySplit: 4 }];

      // Summary by payment method
      const methodMap = new Map<string, number>();
      for (const p of filtered) {
        const m = (p as any).payment_method || 'Unknown';
        methodMap.set(m, (methodMap.get(m) || 0) + Number(p.amount));
      }
      const sumWs = wb.addWorksheet('Method Breakdown');
      addHeader(sumWs, 'Payment Method Breakdown');
      const sh = sumWs.addRow(['Payment Method', 'Total Amount', 'Transactions']);
      styleHeaderRow(sh);
      const methodCount = new Map<string, number>();
      for (const p of filtered) {
        const m = (p as any).payment_method || 'Unknown';
        methodCount.set(m, (methodCount.get(m) || 0) + 1);
      }
      for (const [method, amount] of Array.from(methodMap.entries())) {
        sumWs.addRow([method, amount, methodCount.get(method) || 0]);
      }
      sumWs.getColumn(2).numFmt = '₹#,##0';
      autoWidth(sumWs);

      await downloadWorkbook(wb, `fee-collection-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.dismiss(tid);
      toast.success(`Collection report exported (₹${total.toLocaleString('en-IN')} from ${filtered.length} payments)`);
    } catch (err: any) {
      toast.dismiss(tid);
      toast.error(err.message || 'Failed to generate report');
    }
  };

  // ─── PENDING DUES REPORT ─────────────────────────────
  const generatePendingDues = async (filters: ReportFilters = {}) => {
    if (!schoolId) return;
    const tid = toast.loading('Generating Pending Dues Report...');
    try {
      let query = supabase
        .from('fee_invoices')
        .select('id, total_amount, paid_amount, balance, due_date, status, student:students!inner(full_name, admission_number, class_name, section, parent_phone)')
        .eq('school_id', schoolId)
        .neq('status', 'paid')
        .order('due_date', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data || [];
      if (filters.className) {
        filtered = filtered.filter((inv: any) => inv.student?.class_name === filters.className);
      }

      // Get last payment date per student
      const studentIds = [...new Set(filtered.map((inv: any) => inv.student_id).filter(Boolean))];
      
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Pending Dues');
      addHeader(ws, 'Pending Dues Report');

      const headerRow = ws.addRow(['#', 'Student', 'Admission No', 'Class', 'Section', 'Total Amount', 'Paid', 'Balance', 'Due Date', 'Status', 'Parent Phone']);
      styleHeaderRow(headerRow);

      const today = new Date().toISOString().split('T')[0];
      let totalPending = 0;
      filtered.forEach((inv: any, i: number) => {
        const isOverdue = inv.status === 'pending' && inv.due_date < today;
        totalPending += Number(inv.balance);
        ws.addRow([
          i + 1, inv.student?.full_name, inv.student?.admission_number, inv.student?.class_name,
          inv.student?.section, Number(inv.total_amount), Number(inv.paid_amount), Number(inv.balance),
          new Date(inv.due_date).toLocaleDateString('en-IN'), isOverdue ? 'Overdue' : inv.status,
          inv.student?.parent_phone || '',
        ]);
      });

      const tRow = ws.addRow(['', '', '', '', 'TOTAL', '', '', totalPending, '', '', '']);
      tRow.font = { bold: true };
      [6, 7, 8].forEach(col => { ws.getColumn(col).numFmt = '₹#,##0'; });
      autoWidth(ws);
      ws.views = [{ state: 'frozen', ySplit: 4 }];

      await downloadWorkbook(wb, `pending-dues-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.dismiss(tid);
      toast.success(`Pending dues exported (₹${totalPending.toLocaleString('en-IN')} from ${filtered.length} invoices)`);
    } catch (err: any) {
      toast.dismiss(tid);
      toast.error(err.message || 'Failed to generate report');
    }
  };

  // ─── EXAM RESULTS REPORT ─────────────────────────────
  const generateExamResults = async (filters: ReportFilters = {}) => {
    if (!schoolId) return;
    const tid = toast.loading('Generating Exam Results Report...');
    try {
      let examQuery = supabase
        .from('exams')
        .select('id, name, class_name, subject, max_marks, exam_date')
        .eq('school_id', schoolId)
        .order('exam_date', { ascending: false });

      if (filters.examId) examQuery = examQuery.eq('id', filters.examId);
      if (filters.className) examQuery = examQuery.eq('class_name', filters.className);

      const { data: exams, error: eErr } = await examQuery;
      if (eErr) throw eErr;
      if (!exams?.length) {
        toast.dismiss(tid);
        toast.info('No exams found for the selected filters.');
        return;
      }

      const examIds = exams.map(e => e.id);
      const { data: results, error: rErr } = await supabase
        .from('results')
        .select('exam_id, student_id, marks_obtained, grade, remarks')
        .in('exam_id', examIds);

      if (rErr) throw rErr;

      // Get student details
      const studentIds = [...new Set((results || []).map(r => r.student_id))];
      const { data: students } = await supabase
        .from('students')
        .select('id, full_name, admission_number, class_name, section, roll_number')
        .in('id', studentIds.length > 0 ? studentIds : ['00000000-0000-0000-0000-000000000000']);

      const studentMap = new Map((students || []).map(s => [s.id, s]));

      const wb = new ExcelJS.Workbook();

      for (const exam of exams) {
        const examResults = (results || []).filter(r => r.exam_id === exam.id);
        const ws = wb.addWorksheet(`${exam.name}-${exam.subject}`.substring(0, 30));
        addHeader(ws, `${exam.name} - ${exam.subject} (Class ${exam.class_name})`);
        ws.addRow([`Max Marks: ${exam.max_marks} | Date: ${new Date(exam.exam_date).toLocaleDateString('en-IN')}`]);
        ws.addRow([]);

        const headerRow = ws.addRow(['#', 'Name', 'Admission No', 'Section', 'Roll No', 'Marks', 'Percentage', 'Grade', 'Remarks']);
        styleHeaderRow(headerRow);

        const sorted = examResults
          .map(r => ({ ...r, student: studentMap.get(r.student_id) }))
          .sort((a, b) => b.marks_obtained - a.marks_obtained);

        sorted.forEach((r, i) => {
          const pct = exam.max_marks > 0 ? ((r.marks_obtained / exam.max_marks) * 100).toFixed(1) + '%' : '';
          ws.addRow([
            i + 1, r.student?.full_name || '', r.student?.admission_number || '',
            r.student?.section || '', r.student?.roll_number || '',
            r.marks_obtained, pct, r.grade || '', r.remarks || '',
          ]);
        });

        if (sorted.length > 0) {
          ws.addRow([]);
          const avg = sorted.reduce((s, r) => s + r.marks_obtained, 0) / sorted.length;
          const highest = sorted[0]?.marks_obtained || 0;
          const lowest = sorted[sorted.length - 1]?.marks_obtained || 0;
          const statsRow = ws.addRow(['', 'Statistics', '', '', '', `Avg: ${avg.toFixed(1)}`, `Highest: ${highest}`, `Lowest: ${lowest}`, `Students: ${sorted.length}`]);
          statsRow.font = { bold: true };
        }

        autoWidth(ws);
      }

      await downloadWorkbook(wb, `exam-results-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.dismiss(tid);
      toast.success(`Exam results exported (${exams.length} exams)`);
    } catch (err: any) {
      toast.dismiss(tid);
      toast.error(err.message || 'Failed to generate report');
    }
  };

  // ─── PERFORMANCE ANALYSIS ────────────────────────────
  const generatePerformanceAnalysis = async (filters: ReportFilters = {}) => {
    if (!schoolId) return;
    const tid = toast.loading('Generating Performance Analysis...');
    try {
      let examQuery = supabase
        .from('exams')
        .select('id, name, class_name, subject, max_marks')
        .eq('school_id', schoolId);

      if (filters.className) examQuery = examQuery.eq('class_name', filters.className);

      const { data: exams, error: eErr } = await examQuery;
      if (eErr) throw eErr;
      if (!exams?.length) {
        toast.dismiss(tid);
        toast.info('No exams found.');
        return;
      }

      const examIds = exams.map(e => e.id);
      const { data: results, error: rErr } = await supabase
        .from('results')
        .select('exam_id, student_id, marks_obtained')
        .in('exam_id', examIds);

      if (rErr) throw rErr;

      const studentIds = [...new Set((results || []).map(r => r.student_id))];
      const { data: students } = await supabase
        .from('students')
        .select('id, full_name, admission_number, class_name, section')
        .in('id', studentIds.length > 0 ? studentIds : ['00000000-0000-0000-0000-000000000000']);

      const studentMap = new Map((students || []).map(s => [s.id, s]));
      const examMap = new Map(exams.map(e => [e.id, e]));

      const wb = new ExcelJS.Workbook();

      // Subject-wise performance
      const subjectWs = wb.addWorksheet('Subject Performance');
      addHeader(subjectWs, 'Subject-wise Performance Summary');
      const sh = subjectWs.addRow(['Subject', 'Class', 'Exam', 'Students', 'Average', 'Highest', 'Lowest', 'Pass Rate (≥40%)']);
      styleHeaderRow(sh);

      const examGroups = new Map<string, typeof results>();
      for (const r of results || []) {
        const eid = r.exam_id;
        if (!examGroups.has(eid)) examGroups.set(eid, []);
        examGroups.get(eid)!.push(r);
      }

      for (const [eid, ers] of Array.from(examGroups.entries())) {
        const exam = examMap.get(eid);
        if (!exam) continue;
        const marks = ers.map(r => r.marks_obtained);
        const avg = marks.reduce((s, m) => s + m, 0) / marks.length;
        const passRate = exam.max_marks > 0 ? ((marks.filter(m => (m / exam.max_marks) * 100 >= 40).length / marks.length) * 100).toFixed(1) + '%' : '';
        subjectWs.addRow([exam.subject, exam.class_name, exam.name, marks.length, avg.toFixed(1), Math.max(...marks), Math.min(...marks), passRate]);
      }
      autoWidth(subjectWs);

      // Top performers
      const topWs = wb.addWorksheet('Top Performers');
      addHeader(topWs, 'Top Performers');

      // Calculate total percentage per student across all exams
      const studentScores = new Map<string, { totalPct: number; count: number }>();
      for (const r of results || []) {
        const exam = examMap.get(r.exam_id);
        if (!exam || exam.max_marks === 0) continue;
        const pct = (r.marks_obtained / exam.max_marks) * 100;
        if (!studentScores.has(r.student_id)) studentScores.set(r.student_id, { totalPct: 0, count: 0 });
        const s = studentScores.get(r.student_id)!;
        s.totalPct += pct;
        s.count++;
      }

      const ranked = Array.from(studentScores.entries())
        .map(([sid, { totalPct, count }]) => ({
          student: studentMap.get(sid),
          avgPct: totalPct / count,
          examsTaken: count,
        }))
        .filter(r => r.student)
        .sort((a, b) => b.avgPct - a.avgPct)
        .slice(0, 50);

      const th = topWs.addRow(['Rank', 'Name', 'Admission No', 'Class', 'Section', 'Exams Taken', 'Average %']);
      styleHeaderRow(th);
      ranked.forEach((r, i) => {
        topWs.addRow([i + 1, r.student?.full_name, r.student?.admission_number, r.student?.class_name, r.student?.section, r.examsTaken, r.avgPct.toFixed(1) + '%']);
      });
      autoWidth(topWs);

      await downloadWorkbook(wb, `performance-analysis-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.dismiss(tid);
      toast.success('Performance analysis exported');
    } catch (err: any) {
      toast.dismiss(tid);
      toast.error(err.message || 'Failed to generate report');
    }
  };

  // ─── CUSTOM REPORT BUILDER ───────────────────────────
  const generateCustomReport = async (module: string, fields: string[], filters: ReportFilters = {}) => {
    if (!schoolId) return;
    const tid = toast.loading('Generating Custom Report...');
    try {
      let data: any[] = [];
      let title = 'Custom Report';

      if (module === 'students') {
        title = 'Custom Student Report';
        let q = supabase.from('students').select(fields.join(',')).eq('school_id', schoolId);
        if (filters.className) q = q.eq('class_name', filters.className);
        if (filters.section) q = q.eq('section', filters.section);
        if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status);
        const { data: d, error } = await q;
        if (error) throw error;
        data = d || [];
      } else if (module === 'fees') {
        title = 'Custom Fee Report';
        const { data: d, error } = await supabase
          .from('fee_invoices')
          .select('total_amount, paid_amount, balance, due_date, status, student:students!inner(full_name, class_name, section)')
          .eq('school_id', schoolId);
        if (error) throw error;
        data = (d || []).map((inv: any) => ({
          student_name: inv.student?.full_name,
          class_name: inv.student?.class_name,
          section: inv.student?.section,
          total_amount: inv.total_amount,
          paid_amount: inv.paid_amount,
          balance: inv.balance,
          due_date: inv.due_date,
          status: inv.status,
        }));
        if (filters.className) data = data.filter(r => r.class_name === filters.className);
      } else if (module === 'attendance') {
        title = 'Custom Attendance Report';
        const date = filters.date || new Date().toISOString().split('T')[0];
        const { data: d, error } = await supabase
          .from('attendance')
          .select('date, status, notes, student:students!inner(full_name, class_name, section)')
          .eq('school_id', schoolId)
          .eq('date', date);
        if (error) throw error;
        data = (d || []).map((a: any) => ({
          student_name: a.student?.full_name,
          class_name: a.student?.class_name,
          section: a.student?.section,
          date: a.date,
          status: a.status,
          notes: a.notes,
        }));
        if (filters.className) data = data.filter(r => r.class_name === filters.className);
      } else if (module === 'exams') {
        title = 'Custom Exam Report';
        const { data: d, error } = await supabase
          .from('results')
          .select('marks_obtained, grade, remarks, exam:exams!inner(name, subject, class_name, max_marks), student:students!inner(full_name, class_name, section)')
          .in('exam_id', (
            await supabase.from('exams').select('id').eq('school_id', schoolId)
          ).data?.map(e => e.id) || []);
        if (error) throw error;
        data = (d || []).map((r: any) => ({
          student_name: r.student?.full_name,
          class_name: r.exam?.class_name,
          exam_name: r.exam?.name,
          subject: r.exam?.subject,
          marks: r.marks_obtained,
          max_marks: r.exam?.max_marks,
          grade: r.grade,
        }));
        if (filters.className) data = data.filter(r => r.class_name === filters.className);
      }

      if (data.length === 0) {
        toast.dismiss(tid);
        toast.info('No data found for the selected criteria.');
        return;
      }

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Report');
      addHeader(ws, title);

      const columns = Object.keys(data[0]);
      const headerRow = ws.addRow(columns.map(c => c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())));
      styleHeaderRow(headerRow);

      for (const row of data) {
        ws.addRow(columns.map(c => {
          const val = row[c];
          if (val instanceof Date) return val.toLocaleDateString('en-IN');
          return val ?? '';
        }));
      }

      autoWidth(ws);
      ws.views = [{ state: 'frozen', ySplit: 4 }];
      await downloadWorkbook(wb, `custom-report-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.dismiss(tid);
      toast.success(`Custom report exported (${data.length} records)`);
    } catch (err: any) {
      toast.dismiss(tid);
      toast.error(err.message || 'Failed to generate report');
    }
  };

  return {
    generateStudentList,
    generateClassWise,
    generateDailyAttendance,
    generateAbsenteeReport,
    generateFeeCollection,
    generatePendingDues,
    generateExamResults,
    generatePerformanceAnalysis,
    generateCustomReport,
  };
}
