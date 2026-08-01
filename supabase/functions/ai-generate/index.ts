// OurSchool AI content generators: homework, circular, notice, report-card remarks, timetable.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { generateText, loadAiConfig, pickModel, logAiUsage, PRO_MODEL, TONE_LINES } from '../_shared/ai-core.ts';

const STAFF = ['teacher', 'school_admin', 'super_admin'];

const GENERATION_TYPES = [
  'homework',
  'circular',
  'notice',
  'report_card_remarks',
  'timetable',
  'lesson_plan',
] as const;
type GenerationType = (typeof GENERATION_TYPES)[number];

interface BuildResult {
  title: string;
  system: string;
  user: string;
  heavy?: boolean;
  metadata?: Record<string, unknown>;
}

const BASE_RULES = `You write content for an Indian K-12 school. Rules:
- Output clean markdown only. No preamble like "Here is".
- Be specific and immediately usable; a teacher or admin should be able to publish it after a quick read.
- Use Indian context (rupees, Indian names, CBSE/State board vocabulary) where relevant.
- Never invent student data, marks, or dates that were not supplied.`;

async function buildPrompt(
  admin: any,
  type: GenerationType,
  p: any,
  schoolName: string,
  tone: string,
): Promise<BuildResult> {
  const system = `${BASE_RULES}\nSchool: ${schoolName || 'the school'}.\nTone: ${tone}`;

  switch (type) {
    case 'homework': {
      const title = `${p.subject || 'Homework'} — ${p.topic || 'Assignment'} (${p.class_name || ''}${p.section ? '-' + p.section : ''})`;
      return {
        title,
        system,
        user: `Create a homework assignment.
Class: ${p.class_name || 'N/A'}${p.section ? ' section ' + p.section : ''}
Subject: ${p.subject || 'N/A'}
Topic: ${p.topic || 'teacher will specify'}
Difficulty: ${p.difficulty || 'medium'}
Number of questions: ${p.question_count || 8}
Due date: ${p.due_date || 'not fixed'}
Extra instructions: ${p.instructions || 'none'}

Structure it as:
## Objective
## Instructions for students
## Questions (numbered, mixed formats, increasing difficulty)
## Answer key (collapsed under a "For teacher" heading)
## Estimated time`,
        metadata: { subject: p.subject, topic: p.topic, difficulty: p.difficulty },
      };
    }

    case 'circular': {
      return {
        title: p.subject_line || `Circular — ${p.topic || 'School communication'}`,
        system,
        user: `Write an official school circular.
Purpose/topic: ${p.topic || 'general communication'}
Audience: ${p.audience || 'parents'}
Key points to include: ${p.key_points || 'none supplied'}
Date/deadline: ${p.event_date || 'not specified'}
Extra instructions: ${p.instructions || 'none'}

Structure: circular reference line, date, subject line, salutation, 2-4 short paragraphs, action required (bulleted), closing with "Principal".`,
        metadata: { audience: p.audience },
      };
    }

    case 'notice': {
      return {
        title: p.topic ? `Notice — ${p.topic}` : 'School notice',
        system,
        user: `Write a short notice board announcement (under 150 words).
Topic: ${p.topic || 'general'}
Audience: ${p.audience || 'students and parents'}
Key details: ${p.key_points || 'none supplied'}
Date: ${p.event_date || 'not specified'}

Structure: bold heading, one-line summary, 3-5 bullet details, closing line about whom to contact.`,
        metadata: { audience: p.audience },
      };
    }

    case 'lesson_plan': {
      return {
        title: `Lesson plan — ${p.topic || p.subject || 'Untitled'}`,
        system,
        user: `Write a single-period lesson plan.
Class: ${p.class_name || 'N/A'} | Subject: ${p.subject || 'N/A'} | Topic: ${p.topic || 'N/A'}
Duration: ${p.duration || 40} minutes
Extra instructions: ${p.instructions || 'none'}

Structure: Learning outcomes, Prior knowledge, Materials, Minute-by-minute flow table, Board work, Assessment questions, Homework link, Differentiation for slow and fast learners.`,
        heavy: true,
      };
    }

    case 'report_card_remarks': {
      const { data: student } = await admin
        .from('students')
        .select('id, full_name, class_name, section')
        .eq('id', p.student_id)
        .maybeSingle();
      if (!student) throw new Error('Student not found');

      const { data: results } = await admin
        .from('results')
        .select('marks_obtained, grade, exam:exams(name, subject, max_marks, exam_date)')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })
        .limit(25);

      const since = new Date();
      since.setMonth(since.getMonth() - 6);
      const { data: att } = await admin
        .from('attendance')
        .select('status')
        .eq('student_id', student.id)
        .gte('date', since.toISOString().slice(0, 10))
        .limit(400);

      const total = (att || []).length || 1;
      const present = (att || []).filter((a: any) => String(a.status).toUpperCase() === 'PRESENT').length;
      const half = (att || []).filter((a: any) => String(a.status).toUpperCase() === 'HALF_DAY').length;
      const attPct = (((present + half * 0.5) / total) * 100).toFixed(1);

      const marksLines = (results || [])
        .map((r: any) => `- ${r.exam?.subject ?? 'Subject'} (${r.exam?.name ?? 'Exam'}): ${r.marks_obtained}/${r.exam?.max_marks ?? '?'} grade ${r.grade ?? '-'}`)
        .join('\n');

      return {
        title: `Report card remarks — ${student.full_name}`,
        system,
        user: `Write report card remarks for a student. Use ONLY the data below.

Student: ${student.full_name}, class ${student.class_name || 'N/A'}${student.section ? '-' + student.section : ''}
Attendance last 6 months: ${attPct}% (${total} recorded days)
Marks:
${marksLines || '- No exam results recorded yet.'}
Teacher notes: ${p.teacher_notes || 'none'}

Produce:
## Overall remark (3-4 sentences, addressed to parents, encouraging but honest)
## Strengths (2-3 bullets tied to actual subjects)
## Areas to improve (2-3 bullets, each with one concrete action)
## Suggested focus for next term (1-2 sentences)
Do not state any mark or percentage that is not in the data above.`,
        heavy: true,
        metadata: { student_id: student.id, student_name: student.full_name, attendance_pct: Number(attPct) },
      };
    }

    case 'timetable': {
      const { data: periods } = await admin
        .from('timetable_periods')
        .select('period_number, start_time, end_time, is_lunch, label')
        .eq('school_id', p.school_id)
        .order('period_number', { ascending: true })
        .limit(20);

      const { data: teachers } = await admin
        .from('teachers')
        .select('full_name, subjects')
        .eq('school_id', p.school_id)
        .limit(60);

      const periodLines = (periods || [])
        .map((r: any) => `- Period ${r.period_number}: ${r.start_time}-${r.end_time}${r.is_lunch ? ' (LUNCH)' : ''}`)
        .join('\n');

      const teacherLines = (teachers || [])
        .map((t: any) => `- ${t.full_name}: ${(t.subjects || []).join(', ') || 'general'}`)
        .join('\n');

      return {
        title: `Timetable draft — ${p.class_name || ''}${p.section ? '-' + p.section : ''}`,
        system,
        user: `Draft a weekly class timetable (Monday to Saturday).
Class: ${p.class_name || 'N/A'}${p.section ? ' section ' + p.section : ''}
Subjects with weekly period counts: ${p.subject_load || 'distribute evenly across the subjects listed below'}
Subjects: ${p.subjects || 'not specified'}
Working days: ${p.working_days || 'Monday to Saturday'}

School period slots:
${periodLines || '- Not configured; assume 8 periods of 40 minutes with lunch after period 4.'}

Available teachers:
${teacherLines || '- Not supplied.'}

Rules:
- Respect the lunch slot.
- No subject twice in a row unless it is a double lab period.
- Spread hard subjects (Maths, Science) in the morning.
- Do not assign the same teacher to two classes in the same slot.

Output a markdown table with rows = periods, columns = days. Below the table add "## Notes" listing any constraint you could not satisfy.`,
        heavy: true,
        metadata: { class_name: p.class_name, section: p.section },
      };
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing authorization' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableKey) return json({ error: 'AI service not configured' }, 500);

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) return json({ error: 'Not authenticated' }, 401);

    const body = await req.json();
    const type: GenerationType = body?.generationType;
    const params = body?.params ?? {};
    if (!GENERATION_TYPES.includes(type)) return json({ error: 'Unsupported generation type' }, 400);

    const { data: authData } = await admin.rpc('get_user_auth_data', { _user_id: user.id });
    const role: string = (authData as any)?.role || 'student';
    const profile: any = (authData as any)?.profile;
    const school: any = (authData as any)?.school;
    const schoolId: string | null = params.school_id || profile?.school_id || null;

    if (!STAFF.includes(role)) return json({ error: 'AI generators are available to school staff only.' }, 403);
    if (!schoolId) return json({ error: 'No school context for this account.' }, 400);

    const cfg = await loadAiConfig(admin, schoolId);
    if (!cfg.enabled) return json({ error: 'OurSchool AI is disabled for your school.' }, 403);
    if (!cfg.allowed_roles.includes(role)) return json({ error: 'OurSchool AI is not enabled for your role.' }, 403);

    // Rate limit: 40 generations per school per hour
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from('ai_generations')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .gte('created_at', hourAgo);
    if ((count || 0) >= 40) return json({ error: 'Hourly generation limit reached for this school.' }, 429);

    const built = await buildPrompt(admin, type, { ...params, school_id: schoolId }, school?.name || '', TONE_LINES[cfg.tone] ?? TONE_LINES.friendly);
    const model = built.heavy && cfg.model === 'auto' ? PRO_MODEL : pickModel(built.user, cfg.model);

    const { text, usage } = await generateText(lovableKey, {
      model,
      system: built.system,
      user: built.user,
    });

    if (!text.trim()) return json({ error: 'The AI returned an empty draft. Try again.' }, 502);

    const { data: saved, error: saveErr } = await admin
      .from('ai_generations')
      .insert({
        school_id: schoolId,
        generation_type: type,
        title: (params.title || built.title || 'Untitled').slice(0, 180),
        prompt: built.user,
        content: text,
        metadata: { ...(built.metadata || {}), params },
        class_name: params.class_name ?? null,
        section: params.section ?? null,
        subject: params.subject ?? null,
        status: 'draft',
        model,
        created_by: user.id,
      })
      .select('*')
      .single();

    if (saveErr) {
      console.error('save generation failed', saveErr);
      return json({ error: 'Draft generated but could not be saved.', content: text }, 500);
    }

    await logAiUsage(admin, {
      school_id: schoolId,
      user_id: user.id,
      feature: `generate_${type}`,
      model,
      tokens_in: usage.prompt_tokens,
      tokens_out: usage.completion_tokens,
    });

    return json({ generation: saved });
  } catch (err) {
    const status = (err as any)?.status ?? 500;
    console.error('ai-generate error', err);
    return json({ error: (err as Error).message || 'Generation failed' }, status);
  }
});
