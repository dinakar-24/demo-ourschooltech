// Shared OurSchool AI helpers: gateway access, per-school config, usage ledger.
import { createClient } from 'npm:@supabase/supabase-js@2';

export const LOVABLE_GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';
export const FLASH_MODEL = 'google/gemini-3.6-flash';
export const PRO_MODEL = 'google/gemini-3.1-pro-preview';

const REASONING_KEYWORDS =
  /\b(analy[sz]e|compare|explain why|reason|deep|strategy|forecast|plan|breakdown|optimi[sz]e|recommend|pros and cons)\b/i;

export type Admin = ReturnType<typeof createClient>;

export interface AiSchoolConfig {
  enabled: boolean;
  model: 'auto' | 'flash' | 'pro';
  tone: 'friendly' | 'formal' | 'concise' | 'playful';
  custom_instructions: string;
  allowed_roles: string[];
}

export const AI_DEFAULTS: AiSchoolConfig = {
  enabled: true,
  model: 'auto',
  tone: 'friendly',
  custom_instructions: '',
  allowed_roles: ['parent', 'student', 'teacher', 'school_admin', 'super_admin'],
};

export const TONE_LINES: Record<AiSchoolConfig['tone'], string> = {
  friendly: 'Warm, encouraging, use light emoji.',
  formal: 'Professional, respectful, no emoji, no slang.',
  concise: 'Extremely brief. Prefer bullet points. Skip pleasantries.',
  playful: 'Fun, upbeat, feel free to use emoji and light humour.',
};

export function pickModel(text: string, override: AiSchoolConfig['model']): string {
  if (override === 'flash') return FLASH_MODEL;
  if (override === 'pro') return PRO_MODEL;
  if (text.length > 500) return PRO_MODEL;
  if (REASONING_KEYWORDS.test(text)) return PRO_MODEL;
  return FLASH_MODEL;
}

export async function loadAiConfig(admin: Admin, schoolId: string | null): Promise<AiSchoolConfig> {
  let cfg: AiSchoolConfig = { ...AI_DEFAULTS };
  const { data: defaultsRow } = await admin
    .from('system_settings')
    .select('value')
    .eq('key', 'ai_defaults')
    .maybeSingle();
  if (defaultsRow?.value) cfg = { ...cfg, ...(defaultsRow.value as Partial<AiSchoolConfig>) };
  if (schoolId) {
    const { data: schoolRow } = await admin
      .from('schools')
      .select('ai_settings')
      .eq('id', schoolId)
      .maybeSingle();
    if (schoolRow?.ai_settings) cfg = { ...cfg, ...(schoolRow.ai_settings as Partial<AiSchoolConfig>) };
  }
  return cfg;
}

export async function logAiUsage(
  admin: Admin,
  entry: {
    school_id: string | null;
    user_id: string | null;
    feature: string;
    model: string;
    tokens_in?: number;
    tokens_out?: number;
  },
) {
  try {
    const tin = entry.tokens_in ?? 0;
    const tout = entry.tokens_out ?? 0;
    // Rough INR estimate; flash is ~8x cheaper than pro.
    const rate = entry.model === PRO_MODEL ? 0.00012 : 0.000015;
    await admin.from('ai_usage_ledger').insert({
      school_id: entry.school_id,
      user_id: entry.user_id,
      feature: entry.feature,
      model: entry.model,
      tokens_in: tin,
      tokens_out: tout,
      estimated_cost: Number(((tin + tout) * rate).toFixed(6)),
    });
  } catch (e) {
    console.error('usage ledger write failed', e);
  }
}

export class GatewayError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function gatewayFriendlyError(status: number, body: string): GatewayError {
  if (status === 429) return new GatewayError(429, 'AI is busy right now, please try again in a moment.');
  if (status === 402) return new GatewayError(402, 'AI credits exhausted. Please contact support.');
  return new GatewayError(status, `AI service error: ${body.slice(0, 300)}`);
}

/** Non-streaming chat completion. Returns the raw first choice plus usage. */
export async function callGateway(
  apiKey: string,
  payload: Record<string, unknown>,
): Promise<{ message: any; usage: { prompt_tokens?: number; completion_tokens?: number } }> {
  const res = await fetch(LOVABLE_GATEWAY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ ...payload, stream: false }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`AI gateway failed [${res.status}]: ${body}`);
    throw gatewayFriendlyError(res.status, body);
  }
  const json = await res.json();
  return { message: json?.choices?.[0]?.message ?? {}, usage: json?.usage ?? {} };
}

/** Convenience: single-shot text generation. */
export async function generateText(
  apiKey: string,
  opts: { model: string; system: string; user: string; maxTokens?: number },
): Promise<{ text: string; usage: { prompt_tokens?: number; completion_tokens?: number } }> {
  const { message, usage } = await callGateway(apiKey, {
    model: opts.model,
    messages: [
      { role: 'system', content: opts.system },
      { role: 'user', content: opts.user },
    ],
    ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
  });
  return { text: String(message?.content ?? ''), usage };
}