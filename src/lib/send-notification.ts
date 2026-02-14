import { supabase } from '@/integrations/supabase/client';

interface SendNotificationParams {
  userIds: string[];
  title: string;
  body: string;
  type?: string;
  referenceId?: string;
  schoolId?: string;
}

export async function sendNotification({
  userIds,
  title,
  body,
  type = 'general',
  referenceId,
  schoolId,
}: SendNotificationParams) {
  if (!userIds.length) return;

  try {
    const { error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        user_ids: userIds,
        title,
        body,
        type,
        reference_id: referenceId || null,
        school_id: schoolId || null,
      },
    });

    if (error) {
      console.error('Failed to send notification:', error);
    }
  } catch (err) {
    console.error('Notification send error:', err);
  }
}
