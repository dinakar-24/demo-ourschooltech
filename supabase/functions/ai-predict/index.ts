// OurSchool AI prediction engine: fee-default, attendance and performance risk scoring.
// Callable by a school admin on demand, or by the scheduler with { school_id, cron_secret }.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { generateText, loadAiConfig, FLASH_MODEL, logAiUsage } from '../_shared/ai-core.ts';

const STAFF = ['school_admin', 'super_admin'];
const DAY = 24 * 60 * 60 * 1000;

type Band = 'low' | 'medium' | 'high';
const band = (score: number): Band => (score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low');
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

interface PredictionRow {
  school_id: string;
  student_id: string;
  prediction_type: string;
  risk_score: number;
  risk_band: Band;
  reasons: string[];
  metrics: Record<string, number | string>;
  recommendation: string | null;
}

async function computeFeeDefault(admin: any, schoolId: string, students: any[]): Promise<PredictionRow[]> {
  const { data: invoices } = await admin
    .from('fee_invoices')
    .select('student_id, balance, total_amount, paid_amount, status, due_date')
    .eq('school_id', schoolId)
    .limit(20000);

  const byStudent = new Map<string, any[]>();
  for (const inv of invoices || []) {
    if (!byStudent.has(inv.student_id)) byStudent.set(inv.student_id, []);
    byStudent.get(inv.student_id)!.push(inv);
  }

  const now = Date.now();
  const rows: PredictionRow[] = [];

  for (const s of students) {
    const list = byStudent.get(s.id) || [];
    if (!list.length) continue;

    const pending = list.filter((i: any) => String(i.status).toUpperCase() !== 'PAID');
    const balance = pending.reduce((sum: number, i: any) => sum + Number(i.balance || 0), 0);
    if (balance <= 0) continue;

    const overdue = pending.filter((i: any) => new Date(i.due_date).getTime() < now);
    const maxDaysOverdue = overdue.length
      ? Math.max(...overdue.map((i: any) => Math.floor((now - new Date(i.due_date).getTime()) / DAY)))
      : 0;

    const billed = list.reduce((sum: number, i: any) => sum + Number(i.total_amount || 0), 0) || 1;
    const paid = list.reduce((sum: number, i: any) => sum + Number(i.paid_amount || 0), 0);
    const paidRatio = paid / billed;

    let score = 0;
    const reasons: string[] = [];

    if (maxDaysOverdue > 0) {
      const add = Math.min(45, 10 + maxDaysOverdue * 0.5);
      score += add;
      reasons.push(`${maxDaysOverdue} days past the due date`);
    }
    if (overdue.length > 1) {
      score += Math.min(20, overdue.length * 6);
      reasons.push(`${overdue.length} overdue invoices`);
    }
    if (paidRatio < 0.5) {
      score += 20;
      reasons.push(`Only ${Math.round(paidRatio * 100)}% of billed fees collected so far`);
    } else if (paidRatio < 0.8) {
      score += 10;
      reasons.push(`${Math.round(paidRatio * 100)}% of billed fees collected`);
    }
    if (balance > billed * 0.4) {
      score += 15;
      reasons.push('Outstanding balance is a large share of the annual fee');
    }
    if (!reasons.length) reasons.push('Balance outstanding but no payment delay yet');

    rows.push({
      school_id: schoolId,
      student_id: s.id,
      prediction_type: 'fee_default',
      risk_score: clamp(score),
      risk_band: band(clamp(score)),
      reasons,
      metrics: {
        outstanding_balance: Math.round(balance),
        overdue_invoices: overdue.length,
        days_overdue: maxDaysOverdue,
        collected_pct: Math.round(paidRatio * 100),
      },
      recommendation: null,
    });
  }
  return rows;
}

async function computeAttendance(admin: any, schoolId: string, students: any[]): Promise<PredictionRow[]> {
  const since = new Date(Date.now() - 90 * DAY).toISOString().slice(0, 10);
  const { data: records } = await admin
    .from('attendance')
    .select('student_id, status, date')
    .eq('school_id', schoolId)
    .gte('date', since)
    .order('date', { ascending: true })
    .limit(100000);

  const byStudent = new Map<string, any[]>();
  for (const r of records || []) {
    if (!byStudent.has(r.student_id)) byStudent.set(r.student_id, []);
    byStudent.get(r.student_id)!.push(r);
  }

  const rows: PredictionRow[] = [];
  const pct = (list: any[]) => {
    if (!list.length) return 100;
    const present = list.filter((r) => String(r.status).toUpperCase() === 'PRESENT').length;
    const half = list.filter((r) => String(r.status).toUpperCase() === 'HALF_DAY').length;
    return ((present + half * 0.5) / list.length) * 100;
  };

  for (const s of students) {
    const list = byStudent.get(s.id) || [];
    if (list.length < 5) continue;

    const overall = pct(list);
    const recent = pct(list.slice(-20));
    const earlier = pct(list.slice(0, Math.max(1, list.length - 20)));

    // Longest run of consecutive absences
    let streak = 0;
    let maxStreak = 0;
    for (const r of list) {
      if (String(r.status).toUpperCase() === 'ABSENT') {
        streak += 1;
        maxStreak = Math.max(maxStreak, streak);
      } else streak = 0;
    }

    let score = 0;
    const reasons: string[] = [];

    if (overall < 60) {
      score += 45;
      reasons.push(`Attendance is ${overall.toFixed(0)}% over the last 90 days`);
    } else if (overall < 75) {
      score += 30;
      reasons.push(`Attendance is ${overall.toFixed(0)}%, below the 75% threshold`);
    } else if (overall < 85) {
      score += 12;
      reasons.push(`Attendance is ${overall.toFixed(0)}%`);
    }

    const drop = earlier - recent;
    if (drop > 15) {
      score += 25;
      reasons.push(`Attendance dropped ${drop.toFixed(0)} points in the last 20 school days`);
    } else if (drop > 7) {
      score += 12;
      reasons.push('Attendance is trending down recently');
    }

    if (maxStreak >= 5) {
      score += 20;
      reasons.push(`${maxStreak} consecutive absent days`);
    } else if (maxStreak >= 3) {
      score += 10;
      reasons.push(`${maxStreak} consecutive absent days`);
    }

    if (!reasons.length) continue;

    rows.push({
      school_id: schoolId,
      student_id: s.id,
      prediction_type: 'attendance',
      risk_score: clamp(score),
      risk_band: band(clamp(score)),
      reasons,
      metrics: {
        attendance_pct: Number(overall.toFixed(1)),
        recent_pct: Number(recent.toFixed(1)),
        longest_absent_streak: maxStreak,
        days_recorded: list.length,
      },
      recommendation: null,
    });
  }
  return rows;
}

async function computePerformance(admin: any, schoolId: string, students: any[]): Promise<PredictionRow[]> {
  const { data: exams } = await admin
    .from('exams')
    .select('id, name, subject, max_marks, exam_date')
    .eq('school_id', schoolId)
    .order('exam_date', { ascending: true })
    .limit(400);
  if (!exams?.length) return [];

  const examMap = new Map(exams.map((e: any) => [e.id, e]));
  const { data: results } = await admin
    .from('results')
    .select('student_id, exam_id, marks_obtained')
    .in('exam_id', exams.map((e: any) => e.id))
    .limit(100000);

  const byStudent = new Map<string, any[]>();
  for (const r of results || []) {
    if (!byStudent.has(r.student_id)) byStudent.set(r.student_id, []);
    byStudent.get(r.student_id)!.push(r);
  }

  const rows: PredictionRow[] = [];
  for (const s of students) {
    const list = (byStudent.get(s.id) || [])
      .map((r: any) => {
        const ex: any = examMap.get(r.exam_id);
        if (!ex || !ex.max_marks) return null;
        return {
          pct: (Number(r.marks_obtained) / Number(ex.max_marks)) * 100,
          subject: ex.subject,
          date: ex.exam_date,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => String(a.date).localeCompare(String(b.date)));

    if (list.length < 2) continue;

    const avg = list.reduce((sum: number, r: any) => sum + r.pct, 0) / list.length;
    const half = Math.floor(list.length / 2);
    const firstAvg = list.slice(0, half).reduce((s: number, r: any) => s + r.pct, 0) / Math.max(1, half);
    const lastAvg = list.slice(half).reduce((s: number, r: any) => s + r.pct, 0) / Math.max(1, list.length - half);
    const trend = lastAvg - firstAvg;

    const failing = list.filter((r: any) => r.pct < 35);
    const weakSubjects = [...new Set(failing.map((r: any) => r.subject).filter(Boolean))];

    let score = 0;
    const reasons: string[] = [];

    if (avg < 40) {
      score += 45;
      reasons.push(`Average score is ${avg.toFixed(0)}%`);
    } else if (avg < 55) {
      score += 28;
      reasons.push(`Average score is ${avg.toFixed(0)}%`);
    } else if (avg < 65) {
      score += 12;
      reasons.push(`Average score is ${avg.toFixed(0)}%`);
    }

    if (trend < -10) {
      score += 25;
      reasons.push(`Scores fell ${Math.abs(trend).toFixed(0)} points across recent exams`);
    } else if (trend < -4) {
      score += 12;
      reasons.push('Scores are trending downward');
    }

    if (weakSubjects.length) {
      score += Math.min(20, weakSubjects.length * 8);
      reasons.push(`Below pass mark in ${weakSubjects.join(', ')}`);
    }

    if (!reasons.length) continue;

    rows.push({
      school_id: schoolId,
      student_id: s.id,
      prediction_type: 'performance',
      risk_score: clamp(score),
      risk_band: band(clamp(score)),
      reasons,
      metrics: {
        average_pct: Number(avg.toFixed(1)),
        trend: Number(trend.toFixed(1)),
        exams_counted: list.length,
        weak_subjects: weakSubjects.join(', '),
      },
      recommendation: null,
    });
  }
  return rows;
}

/** One AI call writes short interventions for the highest-risk students. */
async function attachRecommendations(
  apiKey: string,
  admin: any,
  schoolId: string,
  userId: string | null,
  rows: PredictionRow[],
  nameById: Map<string, string>,
): Promise<void> {
  const top = [...rows].sort((a, b) => b.risk_score - a.risk_score).slice(0, 15);
  if (!top.length) return;

  const lines = top
    .map(
      (r, i) =>
        `${i + 1}. ${nameById.get(r.student_id) || 'Student'} | type=${r.prediction_type} | score=${r.risk_score} | reasons: ${r.reasons.join('; ')}`,
    )
    .join('\n');

  try {
    const { text, usage } = await generateText(apiKey, {
      model: FLASH_MODEL,
      system:
        'You advise Indian school administrators. For each numbered case, write ONE actionable intervention of at most 20 words. Reply with only the numbered list, same numbering, no extra text.',
      user: `Cases:\n${lines}`,
    });

    const map = new Map<number, string>();
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*(\d+)[.)]\s*(.+)$/);
      if (m) map.set(Number(m[1]), m[2].trim());
    }
    top.forEach((r, i) => {
      const rec = map.get(i + 1);
      if (rec) r.recommendation = rec.slice(0, 300);
    });

    await logAiUsage(admin, {
      school_id: schoolId,
      user_id: userId,
      feature: 'predictions',
      model: FLASH_MODEL,
      tokens_in: usage.prompt_tokens,
      tokens_out: usage.completion_tokens,
    });
  } catch (e) {
    console.error('recommendation generation failed', e);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    const admin = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const cronSecret = Deno.env.get('CRON_SECRET');
    const isCron = !!cronSecret && body?.cron_secret === cronSecret;

    let schoolId: string | null = body?.school_id ?? null;
    let userId: string | null = null;

    if (!isCron) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) return json({ error: 'Missing authorization' }, 401);
      const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
      const { data: userRes } = await userClient.auth.getUser();
      const user = userRes?.user;
      if (!user) return json({ error: 'Not authenticated' }, 401);
      userId = user.id;

      const { data: authData } = await admin.rpc('get_user_auth_data', { _user_id: user.id });
      const role: string = (authData as any)?.role || 'student';
      if (!STAFF.includes(role)) return json({ error: 'Predictions are available to administrators only.' }, 403);
      schoolId = schoolId || (authData as any)?.profile?.school_id || null;
      if (role !== 'super_admin' && schoolId !== ((authData as any)?.profile?.school_id ?? schoolId)) {
        return json({ error: 'Not authorized for this school.' }, 403);
      }
    }

    if (!schoolId) return json({ error: 'No school specified' }, 400);

    const cfg = await loadAiConfig(admin, schoolId);
    if (!cfg.enabled) return json({ error: 'OurSchool AI is disabled for this school.' }, 403);

    const { data: students } = await admin
      .from('students')
      .select('id, full_name, class_name, section')
      .eq('school_id', schoolId)
      .eq('status', 'active')
      .limit(5000);

    if (!students?.length) return json({ computed: 0, message: 'No active students to score.' });

    const nameById = new Map(students.map((s: any) => [s.id, s.full_name]));

    const [fee, attendance, performance] = await Promise.all([
      computeFeeDefault(admin, schoolId, students),
      computeAttendance(admin, schoolId, students),
      computePerformance(admin, schoolId, students),
    ]);

    const rows = [...fee, ...attendance, ...performance];
    if (lovableKey && rows.length) {
      await attachRecommendations(lovableKey, admin, schoolId, userId, rows, nameById);
    }

    // Replace previous scores for this school, then write the fresh set.
    await admin.from('ai_predictions').delete().eq('school_id', schoolId);

    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500).map((r) => ({ ...r, computed_at: new Date().toISOString() }));
      const { error } = await admin.from('ai_predictions').insert(chunk);
      if (error) {
        console.error('prediction insert failed', error);
        return json({ error: 'Could not save predictions', details: error.message }, 500);
      }
    }

    return json({
      computed: rows.length,
      breakdown: {
        fee_default: fee.length,
        attendance: attendance.length,
        performance: performance.length,
        high_risk: rows.filter((r) => r.risk_band === 'high').length,
      },
    });
  } catch (err) {
    console.error('ai-predict error', err);
    return json({ error: (err as Error).message || 'Prediction run failed' }, 500);
  }
});
