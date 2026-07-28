/**
 * Client-side job queue utility.
 * Enqueues jobs into the `jobs` table for background processing.
 */

import { supabase } from '@/integrations/supabase/client';

export type JobType =
  | 'send_notification'
  | 'send_bulk_notifications'
  | 'generate_report'
  | 'bulk_import'
  | 'cleanup';

interface EnqueueOptions {
  /** Job type identifier */
  type: JobType;
  /** JSON payload for the job handler */
  payload: Record<string, any>;
  /** Optional school context */
  schoolId?: string;
  /** Optional user who enqueued */
  userId?: string;
  /** Higher priority jobs run first (default 0) */
  priority?: number;
  /** Max retry attempts (default 3) */
  maxAttempts?: number;
  /** Schedule for future execution */
  scheduledFor?: Date;
}

/**
 * Enqueue a background job. Returns the job ID on success, null on failure.
 * Fire-and-forget safe — never throws.
 */
export async function enqueueJob(options: EnqueueOptions): Promise<string | null> {
  try {
    const { data, error } = await (supabase.from('jobs' as any) as any).insert({
      job_type: options.type,
      payload: options.payload,
      school_id: options.schoolId || null,
      user_id: options.userId || null,
      priority: options.priority ?? 0,
      max_attempts: options.maxAttempts ?? 3,
      scheduled_for: options.scheduledFor?.toISOString() ?? new Date().toISOString(),
    }).select('id').single();

    if (error) {
      console.error('Failed to enqueue job:', error);
      return null;
    }

    return data?.id ?? null;
  } catch (err) {
    console.error('Job enqueue error:', err);
    return null;
  }
}
