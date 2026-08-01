import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  LOVABLE_GATEWAY,
  TONE_LINES,
  loadAiConfig,
  pickModel,
  logAiUsage,
  type AiSchoolConfig,
} from '../_shared/ai-core.ts';
import { AI_TOOLS, runTool, type ToolCtx } from '../_shared/ai-tools.ts';

const MAX_TOOL_ROUNDS = 3;

function buildSystemPrompt(
  role: string,
  userName: string,
  schoolName: string,
  baseFacts: string,
  cfg: AiSchoolConfig,
): string {
  const custom = cfg.custom_instructions?.trim()
    ? `\nSchool-specific instructions (MUST follow):\n${cfg.custom_instructions.trim()}\n`
    : '';
  return `You are OurSchool AI, an assistant embedded inside the Our School Tech school management platform.

You are talking to ${userName || 'a user'} (role: ${role}) at ${schoolName || 'their school'}.

Response tone: ${TONE_LINES[cfg.tone] ?? TONE_LINES.friendly}
${custom}
Tools:
- You have live read-only tools over this school's data. Call them whenever the user asks about attendance, fees, results, homework, timetable, school totals, or at-risk students. Never guess these numbers.
- Tools are already scoped to what this user is allowed to see. If a tool returns an error or empty data, say so plainly instead of inventing figures.
- Do not call a tool for general knowledge, study help, or writing tasks.

Guidelines:
- Answer in the user's language when they use one (English, Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali).
- Use markdown: short paragraphs, bullet lists, bold key numbers. Format money in Indian rupees.
- Keep answers short and practical. Point to the relevant app screen when useful.
- Never reveal data about other schools, other parents' children, or other students.
- Refuse: medical/legal/financial advice, anything harmful, requests for other users' private data.

Baseline context:
${baseFacts}`;
}

async function buildBaseFacts(admin: any, ctx: ToolCtx, schoolName: string): Promise<string> {
  const facts: string[] = [`Today's date: ${new Date().toISOString().slice(0, 10)}.`];
  if (schoolName) facts.push(`School: ${schoolName}.`);
  try {
    if (ctx.role === 'parent') {
      const { data: children } = await admin
        .from('students')
        .select('full_name, class_name, section, admission_number')
        .eq('parent_user_id', ctx.userId)
        .limit(10);
      if (children?.length) {
        facts.push(
          `Children of this parent: ${children
            .map((c: any) => `${c.full_name} (${c.class_name || 'N/A'}${c.section ? '-' + c.section : ''})`)
            .join('; ')}.`,
        );
      }
    } else if (ctx.role === 'student') {
      const { data: s } = await admin
        .from('students')
        .select('full_name, class_name, section')
        .eq('user_id', ctx.userId)
        .maybeSingle();
      if (s) facts.push(`Student: ${s.full_name}, class ${s.class_name || 'N/A'}${s.section ? '-' + s.section : ''}.`);
    } else if (ctx.role === 'teacher') {
      const { data: t } = await admin
        .from('teachers')
        .select('full_name, subjects, classes')
        .eq('user_id', ctx.userId)
        .maybeSingle();
      if (t) {
        facts.push(
          `Teacher: ${t.full_name}. Subjects: ${(t.subjects || []).join(', ') || 'N/A'}. Classes: ${(t.classes || []).join(', ') || 'N/A'}.`,
        );
      }
    }
    if (ctx.schoolId) {
      const { data: anns } = await admin
        .from('announcements')
        .select('title')
        .eq('school_id', ctx.schoolId)
        .order('created_at', { ascending: false })
        .limit(3);
      if (anns?.length) facts.push(`Recent announcements: ${anns.map((a: any) => a.title).join('; ')}.`);
    }
  } catch (e) {
    console.error('base facts error', e);
  }
  return facts.join('\n');
}

interface StreamResult {
  content: string;
  toolCalls: { id: string; name: string; args: string }[];
  usage: { prompt_tokens?: number; completion_tokens?: number };
}

/** One streaming gateway round. Text deltas go to onToken; tool_calls are accumulated. */
async function streamRound(
  apiKey: string,
  payload: Record<string, unknown>,
  onToken: (t: string) => void,
): Promise<StreamResult> {
  const res = await fetch(LOVABLE_GATEWAY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ ...payload, stream: true, stream_options: { include_usage: true } }),
  });
  if (!res.ok || !res.body) {
    const body = await res.text();
    console.error(`AI gateway failed [${res.status}]: ${body}`);
    const err: any = new Error(
      res.status === 429
        ? 'AI is busy right now, please try again in a moment.'
        : res.status === 402
        ? 'AI credits exhausted. Please contact support.'
        : 'AI service error',
    );
    err.status = res.status;
    throw err;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';
  const toolAcc: Record<number, { id: string; name: string; args: string }> = {};
  let usage: StreamResult['usage'] = {};

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        if (parsed?.usage) usage = parsed.usage;
        const delta = parsed?.choices?.[0]?.delta;
        if (delta?.content) {
          content += delta.content;
          onToken(delta.content);
        }
        if (Array.isArray(delta?.tool_calls)) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            if (!toolAcc[idx]) toolAcc[idx] = { id: tc.id || `call_${idx}`, name: '', args: '' };
            if (tc.id) toolAcc[idx].id = tc.id;
            if (tc.function?.name) toolAcc[idx].name += tc.function.name;
            if (tc.function?.arguments) toolAcc[idx].args += tc.function.arguments;
          }
        }
      } catch {
        /* partial chunk */
      }
    }
  }

  return { content, toolCalls: Object.values(toolAcc).filter((t) => t.name), usage };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

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
    const { conversationId: incomingConvId, message } = body ?? {};
    if (typeof message !== 'string' || !message.trim() || message.length > 4000) {
      return json({ error: 'Invalid message' }, 400);
    }

    // Rate limit: max 30 user messages / hour
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await admin
      .from('ai_messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('role', 'user')
      .gte('created_at', hourAgo);
    if ((recentCount || 0) >= 30) {
      return json({ error: "You've hit the hourly message limit. Try again in a bit." }, 429);
    }

    const { data: authData } = await admin.rpc('get_user_auth_data', { _user_id: user.id });
    const profile: any = (authData as any)?.profile;
    const role: string = (authData as any)?.role || 'student';
    const school: any = (authData as any)?.school;
    const schoolId: string | null = profile?.school_id || null;

    const aiCfg = await loadAiConfig(admin, schoolId);
    if (!aiCfg.enabled) return json({ error: 'OurSchool AI is disabled for your school.' }, 403);
    if (!aiCfg.allowed_roles.includes(role)) {
      return json({ error: 'OurSchool AI is not enabled for your role.' }, 403);
    }

    // Get or create conversation
    let conversationId: string = incomingConvId;
    if (!conversationId) {
      const { data: newConv, error: convErr } = await admin
        .from('ai_conversations')
        .insert({ user_id: user.id, school_id: schoolId, title: message.trim().slice(0, 60) })
        .select('id')
        .single();
      if (convErr || !newConv) return json({ error: 'Could not start conversation' }, 500);
      conversationId = newConv.id;
    } else {
      const { data: owned } = await admin
        .from('ai_conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!owned) return json({ error: 'Conversation not found' }, 404);
    }

    await admin.from('ai_messages').insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: 'user',
      content: message,
    });

    const { data: history } = await admin
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(40);

    const historyMessages = (history || []).slice(-20).map((m: any) => ({ role: m.role, content: m.content }));

    const toolCtx: ToolCtx = { admin, userId: user.id, role, schoolId };
    const baseFacts = await buildBaseFacts(admin, toolCtx, school?.name || '');
    const systemPrompt = buildSystemPrompt(role, profile?.full_name || '', school?.name || '', baseFacts, aiCfg);
    const model = pickModel(message, aiCfg.model);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) =>
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

        send('meta', { conversationId, model });

        const convo: any[] = [{ role: 'system', content: systemPrompt }, ...historyMessages];
        let fullText = '';
        let tokensIn = 0;
        let tokensOut = 0;

        try {
          for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
            const isLastRound = round === MAX_TOOL_ROUNDS;
            const result = await streamRound(
              lovableKey,
              {
                model,
                messages: convo,
                ...(isLastRound ? {} : { tools: AI_TOOLS, tool_choice: 'auto' }),
              },
              (t) => {
                fullText += t;
                send('token', { text: t });
              },
            );

            tokensIn += result.usage.prompt_tokens ?? 0;
            tokensOut += result.usage.completion_tokens ?? 0;

            if (!result.toolCalls.length) break;

            convo.push({
              role: 'assistant',
              content: result.content || null,
              tool_calls: result.toolCalls.map((tc) => ({
                id: tc.id,
                type: 'function',
                function: { name: tc.name, arguments: tc.args || '{}' },
              })),
            });

            for (const tc of result.toolCalls) {
              send('tool', { name: tc.name });
              let args: any = {};
              try {
                args = tc.args ? JSON.parse(tc.args) : {};
              } catch {
                args = {};
              }
              const output = await runTool(toolCtx, tc.name, args);
              convo.push({
                role: 'tool',
                tool_call_id: tc.id,
                content: JSON.stringify(output).slice(0, 12000),
              });
            }
          }

          if (fullText.trim()) {
            await admin.from('ai_messages').insert({
              conversation_id: conversationId,
              user_id: user.id,
              role: 'assistant',
              content: fullText,
              model,
              tokens_in: tokensIn,
              tokens_out: tokensOut,
            });
          }
          await logAiUsage(admin, {
            school_id: schoolId,
            user_id: user.id,
            feature: 'assistant_chat',
            model,
            tokens_in: tokensIn,
            tokens_out: tokensOut,
          });

          send('done', {});
          controller.close();
        } catch (err) {
          console.error('stream error', err);
          send('error', { error: (err as Error).message || 'Stream error' });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('ai-chat fatal', err);
    return json({ error: (err as Error).message }, 500);
  }
});
