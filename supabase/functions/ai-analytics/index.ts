// OurSchool AI Analytics: natural-language questions over live school data + weekly insight cards.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { callGateway, loadAiConfig, logAiUsage, PRO_MODEL, FLASH_MODEL, TONE_LINES } from '../_shared/ai-core.ts';
import { AI_TOOLS, runTool, type ToolCtx } from '../_shared/ai-tools.ts';

const STAFF = ['school_admin', 'super_admin'];
const MAX_TOOL_ROUNDS = 4;

const INSIGHT_QUESTIONS = [
  'Summarise this week fee collection: total pending balance, how many invoices are overdue, and the trend versus expectations.',
  'Summarise attendance for the last 7 days across the school and flag any class that looks weak.',
  'Look at the current at-risk student lists and highlight the top 3 issues an administrator should act on this week.',
];

function systemPrompt(schoolName: string, tone: keyof typeof TONE_LINES, custom: string) {
  return `You are OurSchool AI Analytics for ${schoolName || 'this school'}, answering questions for a school administrator.

Tone: ${TONE_LINES[tone] ?? TONE_LINES.concise}
${custom ? `School-specific instructions (MUST follow):\n${custom}\n` : ''}
Rules:
- ALWAYS use the live data tools before answering anything numeric. Never invent or estimate figures.
- If the tools cannot answer, say exactly what data is missing.
- Format money in Indian rupees using Indian digit grouping (e.g. Rs 1,25,000).
- Answer in markdown: a one-line headline answer in bold, then a short bullet breakdown. Maximum 150 words.
- Finish with one concrete suggested action when it is useful.
Today's date: ${new Date().toISOString().slice(0, 10)}.`;
}

async function answerQuestion(
  apiKey: string,
  ctx: ToolCtx,
  model: string,
  system: string,
  question: string,
): Promise<{ text: string; toolsUsed: string[]; tokensIn: number; tokensOut: number }> {
  const messages: any[] = [
    { role: 'system', content: system },
    { role: 'user', content: question },
  ];
  const toolsUsed: string[] = [];
  let tokensIn = 0;
  let tokensOut = 0;

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const { message, usage } = await callGateway(apiKey, {
      model,
      messages,
      ...(round < MAX_TOOL_ROUNDS ? { tools: AI_TOOLS, tool_choice: 'auto' } : {}),
    });
    tokensIn += usage.prompt_tokens ?? 0;
    tokensOut += usage.completion_tokens ?? 0;

    const calls = message?.tool_calls ?? [];
    if (!calls.length) {
      return { text: String(message?.content ?? ''), toolsUsed, tokensIn, tokensOut };
    }

    messages.push(message);
    for (const call of calls) {
      const name = call?.function?.name;
      let args: any = {};
      try {
        args = JSON.parse(call?.function?.arguments || '{}');
      } catch {
        args = {};
      }
      const result = await runTool(ctx, name, args);
      if (name && !toolsUsed.includes(name)) toolsUsed.push(name);
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result).slice(0, 12000) });
    }
  }

  return { text: 'I could not complete that analysis. Please try a narrower question.', toolsUsed, tokensIn, tokensOut };
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
    if (!lovableKey) return json({ error: 'AI is not configured.' }, 500);

    const admin = createClient(supabaseUrl, serviceKey);
    const body = await req.json().catch(() => ({}));
    const mode: 'ask' | 'insights' = body?.mode === 'insights' ? 'insights' : 'ask';
    const question = String(body?.question || '').trim().slice(0, 1000);
    if (mode === 'ask' && !question) return json({ error: 'Please enter a question.' }, 400);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing authorization' }, 401);
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) return json({ error: 'Not authenticated' }, 401);

    const { data: authData } = await admin.rpc('get_user_auth_data', { _user_id: user.id });
    const role: string = (authData as any)?.role || 'student';
    if (!STAFF.includes(role)) return json({ error: 'AI Analytics is available to administrators only.' }, 403);

    const profileSchool = (authData as any)?.profile?.school_id ?? null;
    const schoolId: string | null = role === 'super_admin' ? (body?.school_id ?? profileSchool) : profileSchool;
    if (!schoolId) return json({ error: 'No school context.' }, 400);

    const cfg = await loadAiConfig(admin, schoolId);
    if (!cfg.enabled) return json({ error: 'OurSchool AI is disabled for this school.' }, 403);

    const { data: school } = await admin.from('schools').select('name').eq('id', schoolId).maybeSingle();
    const ctx: ToolCtx = { admin, userId: user.id, role, schoolId };
    const model = cfg.model === 'flash' ? FLASH_MODEL : PRO_MODEL;
    const system = systemPrompt(school?.name || '', cfg.tone, cfg.custom_instructions?.trim() || '');

    let tokensIn = 0;
    let tokensOut = 0;
    let payload: Record<string, unknown>;

    if (mode === 'insights') {
      const cards = [];
      for (const q of INSIGHT_QUESTIONS) {
        const res = await answerQuestion(lovableKey, ctx, model, system, q);
        tokensIn += res.tokensIn;
        tokensOut += res.tokensOut;
        cards.push({ question: q, answer: res.text, tools: res.toolsUsed });
      }
      payload = { cards, generated_at: new Date().toISOString() };
    } else {
      const res = await answerQuestion(lovableKey, ctx, model, system, question);
      tokensIn = res.tokensIn;
      tokensOut = res.tokensOut;
      payload = { answer: res.text, tools: res.toolsUsed };
    }

    await logAiUsage(admin, {
      school_id: schoolId,
      user_id: user.id,
      feature: mode === 'insights' ? 'analytics_insights' : 'analytics_ask',
      model,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
    });

    return json(payload);
  } catch (err: any) {
    console.error('ai-analytics error', err);
    const status = typeof err?.status === 'number' ? err.status : 500;
    return json({ error: err?.message || 'Analysis failed' }, status);
  }
});