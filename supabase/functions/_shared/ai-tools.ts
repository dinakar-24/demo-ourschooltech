// Role-scoped data tools the OurSchool AI assistant can call.
import type { Admin } from './ai-core.ts';

export interface ToolCtx {
  admin: Admin;
  userId: string;
  role: string;
  schoolId: string | null;
}

const today = () => new Date().toISOString().slice(0, 10);

/** Students this user is allowed to read. null = every student in their school (staff). */
async function allowedStudentIds(ctx: ToolCtx): Promise<string[] | null> {
  if (ctx.role === 'parent') {
    const { data } = await ctx.admin
      .from('students')
      .select('id')
      .eq('parent_user_id', ctx.userId)
      .limit(20);
    return (data || []).map((s: any) => s.id);
  }
  if (ctx.role === 'student') {
    const { data } = await ctx.admin.from('students').select('id').eq('user_id', ctx.userId).limit(1);
    return (data || []).map((s: any) => s.id);
  }
  return null; // teacher / school_admin / super_admin -> whole school
}

async function resolveStudents(ctx: ToolCtx, nameQuery?: string) {
  const ids = await allowedStudentIds(ctx);
  if (ids !== null && ids.length === 0) return [];
  let q = ctx.admin
    .from('students')
    .select('id, full_name, admission_number, class_name, section')
    .limit(25);
  if (ctx.schoolId) q = q.eq('school_id', ctx.schoolId);
  if (ids !== null) q = q.in('id', ids);
  if (nameQuery) q = q.ilike('full_name', `%${nameQuery}%`);
  const { data } = await q;
  return data || [];
}

export const AI_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_attendance_summary',
      description:
        'Attendance totals (present / absent / late / half-day) for a student or the whole school over a date range.',
      parameters: {
        type: 'object',
        properties: {
          student_name: { type: 'string', description: 'Optional student name to filter by.' },
          from_date: { type: 'string', description: 'Start date YYYY-MM-DD. Defaults to the 1st of this month.' },
          to_date: { type: 'string', description: 'End date YYYY-MM-DD. Defaults to today.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_fee_status',
      description: 'Outstanding and paid fee invoices, with balances and due dates.',
      parameters: {
        type: 'object',
        properties: {
          student_name: { type: 'string', description: 'Optional student name to filter by.' },
          only_pending: { type: 'boolean', description: 'Only unpaid invoices. Defaults to true.' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_exam_results',
      description: 'Exam marks and grades for a student, most recent first.',
      parameters: {
        type: 'object',
        properties: { student_name: { type: 'string' } },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_homework',
      description: 'Homework assignments for a class, upcoming by default.',
      parameters: {
        type: 'object',
        properties: {
          class_name: { type: 'string' },
          include_past: { type: 'boolean' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_timetable',
      description: 'Period-wise timetable for a class and section, optionally for one weekday.',
      parameters: {
        type: 'object',
        properties: {
          class_name: { type: 'string' },
          section: { type: 'string' },
          day_of_week: { type: 'string', description: 'e.g. Monday' },
        },
        required: ['class_name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_school_overview',
      description:
        'School-wide counts and totals: students, teachers, today attendance, outstanding fees. Staff only.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_risk_list',
      description:
        'Students flagged at risk by OurSchool AI predictions. Types: fee_default, performance, attendance. Staff only.',
      parameters: {
        type: 'object',
        properties: {
          prediction_type: { type: 'string', description: 'fee_default | performance | attendance' },
          limit: { type: 'number' },
        },
        required: ['prediction_type'],
      },
    },
  },
];

const STAFF = ['teacher', 'school_admin', 'super_admin'];

export async function runTool(ctx: ToolCtx, name: string, args: any): Promise<unknown> {
  const { admin, schoolId } = ctx;
  try {
    switch (name) {
      case 'get_attendance_summary': {
        const students = await resolveStudents(ctx, args?.student_name);
        if (!students.length) return { error: 'No matching student you have access to.' };
        const monthStart = new Date();
        monthStart.setDate(1);
        const from = args?.from_date || monthStart.toISOString().slice(0, 10);
        const to = args?.to_date || today();
        const { data } = await admin
          .from('attendance')
          .select('status, student_id, date')
          .in('student_id', students.map((s: any) => s.id))
          .gte('date', from)
          .lte('date', to)
          .limit(3000);
        const rows = data || [];
        const tally = (id?: string) => {
          const set = id ? rows.filter((r: any) => r.student_id === id) : rows;
          const c = (s: string) => set.filter((r: any) => String(r.status).toUpperCase() === s).length;
          const present = c('PRESENT');
          const half = c('HALF_DAY');
          const absent = c('ABSENT');
          const late = c('LATE');
          const total = set.length || 1;
          return {
            present,
            absent,
            late,
            half_day: half,
            percentage: Number((((present + half * 0.5) / total) * 100).toFixed(1)),
          };
        };
        if (students.length === 1) {
          return { range: { from, to }, student: students[0].full_name, ...tally(students[0].id) };
        }
        return {
          range: { from, to },
          overall: tally(),
          per_student: students.slice(0, 15).map((s: any) => ({ name: s.full_name, ...tally(s.id) })),
        };
      }

      case 'get_fee_status': {
        const students = await resolveStudents(ctx, args?.student_name);
        if (!students.length) return { error: 'No matching student you have access to.' };
        const onlyPending = args?.only_pending !== false;
        let q = admin
          .from('fee_invoices')
          .select('student_id, total_amount, paid_amount, balance, status, due_date')
          .in('student_id', students.map((s: any) => s.id))
          .order('due_date', { ascending: true })
          .limit(100);
        if (onlyPending) q = q.neq('status', 'PAID');
        const { data } = await q;
        const rows = data || [];
        const byId = new Map(students.map((s: any) => [s.id, s.full_name]));
        return {
          total_balance: rows.reduce((s: number, r: any) => s + Number(r.balance || 0), 0),
          invoice_count: rows.length,
          invoices: rows.slice(0, 25).map((r: any) => ({
            student: byId.get(r.student_id),
            total: Number(r.total_amount),
            paid: Number(r.paid_amount),
            balance: Number(r.balance),
            status: r.status,
            due_date: r.due_date,
          })),
        };
      }

      case 'get_exam_results': {
        const students = await resolveStudents(ctx, args?.student_name);
        if (!students.length) return { error: 'No matching student you have access to.' };
        const { data } = await admin
          .from('results')
          .select('marks_obtained, grade, remarks, student_id, exam:exams(name, subject, exam_date, max_marks)')
          .in('student_id', students.map((s: any) => s.id))
          .order('created_at', { ascending: false })
          .limit(40);
        const byId = new Map(students.map((s: any) => [s.id, s.full_name]));
        return (data || []).map((r: any) => ({
          student: byId.get(r.student_id),
          exam: r.exam?.name,
          subject: r.exam?.subject,
          date: r.exam?.exam_date,
          marks: `${r.marks_obtained}/${r.exam?.max_marks ?? '?'}`,
          grade: r.grade,
        }));
      }

      case 'get_homework': {
        if (!schoolId) return { error: 'No school context.' };
        let className = args?.class_name;
        if (!className && (ctx.role === 'student' || ctx.role === 'parent')) {
          const students = await resolveStudents(ctx);
          className = students[0]?.class_name;
        }
        let q = admin
          .from('homework')
          .select('title, subject, due_date, description, class:classes(name)')
          .eq('school_id', schoolId)
          .order('due_date', { ascending: true })
          .limit(20);
        if (!args?.include_past) q = q.gte('due_date', today());
        const { data } = await q;
        let rows = data || [];
        if (className) rows = rows.filter((r: any) => !r.class?.name || r.class.name === className);
        return rows.map((r: any) => ({
          title: r.title,
          subject: r.subject,
          due_date: r.due_date,
          class: r.class?.name,
          description: String(r.description || '').slice(0, 200),
        }));
      }

      case 'get_timetable': {
        if (!schoolId) return { error: 'No school context.' };
        let q = admin
          .from('timetable_entries')
          .select('period_number, day_of_week, subject, start_time, end_time, is_lunch, section, class_name')
          .eq('school_id', schoolId)
          .eq('class_name', args.class_name)
          .order('period_number', { ascending: true })
          .limit(120);
        if (args?.section) q = q.eq('section', args.section);
        if (args?.day_of_week) q = q.eq('day_of_week', args.day_of_week);
        const { data } = await q;
        return (data || []).map((r: any) => ({
          day: r.day_of_week,
          period: r.period_number,
          subject: r.is_lunch ? 'Lunch break' : r.subject,
          time: `${r.start_time}-${r.end_time}`,
        }));
      }

      case 'get_school_overview': {
        if (!STAFF.includes(ctx.role) || !schoolId) return { error: 'Not available for your role.' };
        const [{ count: studentCount }, { count: teacherCount }] = await Promise.all([
          admin.from('students').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
          admin.from('teachers').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
        ]);
        const { data: absentToday } = await admin
          .from('attendance')
          .select('id')
          .eq('school_id', schoolId)
          .eq('date', today())
          .eq('status', 'ABSENT');
        const { data: pending } = await admin
          .from('fee_invoices')
          .select('balance')
          .eq('school_id', schoolId)
          .neq('status', 'PAID')
          .limit(5000);
        return {
          students: studentCount || 0,
          teachers: teacherCount || 0,
          absent_today: absentToday?.length || 0,
          outstanding_fees: (pending || []).reduce((s: number, r: any) => s + Number(r.balance || 0), 0),
        };
      }

      case 'get_risk_list': {
        if (!STAFF.includes(ctx.role) || !schoolId) return { error: 'Not available for your role.' };
        const { data } = await admin
          .from('ai_predictions')
          .select('risk_score, risk_band, reasons, recommendation, student:students(full_name, class_name, section)')
          .eq('school_id', schoolId)
          .eq('prediction_type', args.prediction_type)
          .order('risk_score', { ascending: false })
          .limit(Math.min(Number(args?.limit) || 10, 25));
        return (data || []).map((r: any) => ({
          student: r.student?.full_name,
          class: `${r.student?.class_name ?? ''}${r.student?.section ? '-' + r.student.section : ''}`,
          risk_score: Number(r.risk_score),
          risk_band: r.risk_band,
          reasons: r.reasons,
          recommendation: r.recommendation,
        }));
      }

      default:
        return { error: `Unknown tool ${name}` };
    }
  } catch (e) {
    console.error('tool error', name, e);
    return { error: 'Could not load that data right now.' };
  }
}
