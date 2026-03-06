import { supabase } from '@/integrations/supabase/client';
import { enqueueJob } from '@/lib/job-queue';

interface SendNotificationParams {
  userIds: string[];
  title: string;
  body: string;
  type?: string;
  referenceId?: string;
  schoolId?: string;
}

/**
 * Send notifications via the background job queue.
 * Falls back to direct edge function call if enqueue fails.
 */
export async function sendNotification({
  userIds,
  title,
  body,
  type = 'general',
  referenceId,
  schoolId,
}: SendNotificationParams) {
  if (!userIds.length) return;

  // For small batches (≤5 users), use the job queue
  // For larger batches, use bulk notification job
  const jobType = userIds.length > 5 ? 'send_bulk_notifications' : 'send_notification';

  const jobId = await enqueueJob({
    type: jobType as any,
    payload: {
      user_ids: userIds,
      title,
      body,
      type,
      reference_id: referenceId || null,
      school_id: schoolId || null,
      ...(jobType === 'send_bulk_notifications' ? {
        notifications: userIds.map(uid => ({
          user_id: uid,
          title,
          body,
          type,
          reference_id: referenceId || null,
          school_id: schoolId || null,
        })),
      } : {}),
    },
    schoolId,
    priority: 1, // notifications are higher priority
  });

  // Fallback: if job enqueue fails, call edge function directly
  if (!jobId) {
    try {
      await supabase.functions.invoke('send-push-notification', {
        body: {
          user_ids: userIds,
          title,
          body,
          type,
          reference_id: referenceId || null,
          school_id: schoolId || null,
        },
      });
    } catch (err) {
      console.error('Notification fallback failed:', err);
    }
  }
}
