
-- Fix conversations table: change RESTRICTIVE policies to PERMISSIVE
DROP POLICY IF EXISTS "School users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Creator can update conversation" ON public.conversations;
DROP POLICY IF EXISTS "Creator can delete conversation" ON public.conversations;

CREATE POLICY "School users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (
  (school_id = get_user_school_id(auth.uid())) AND (created_by = auth.uid())
);

CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
USING (
  (EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
  ))
  OR has_role(auth.uid(), 'school_admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Creator can update conversation"
ON public.conversations FOR UPDATE
USING (
  (created_by = auth.uid())
  OR has_role(auth.uid(), 'school_admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Creator can delete conversation"
ON public.conversations FOR DELETE
USING (
  (created_by = auth.uid())
  OR has_role(auth.uid(), 'school_admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Also fix conversation_participants policies (same issue)
DROP POLICY IF EXISTS "School members can add participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view their participation" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update own participation" ON public.conversation_participants;
DROP POLICY IF EXISTS "Admins can remove participants" ON public.conversation_participants;

CREATE POLICY "School members can add participants"
ON public.conversation_participants FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_participants.conversation_id
      AND c.school_id = get_user_school_id(auth.uid())
  )
);

CREATE POLICY "Users can view their participation"
ON public.conversation_participants FOR SELECT
USING (
  (user_id = auth.uid())
  OR (EXISTS (
    SELECT 1 FROM conversation_participants cp2
    WHERE cp2.conversation_id = conversation_participants.conversation_id
      AND cp2.user_id = auth.uid()
  ))
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Users can update own participation"
ON public.conversation_participants FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Admins can remove participants"
ON public.conversation_participants FOR DELETE
USING (
  (user_id = auth.uid())
  OR has_role(auth.uid(), 'school_admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Also fix messages policies (same issue)
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "Senders can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Senders and admins can delete messages" ON public.messages;

CREATE POLICY "Participants can view messages"
ON public.messages FOR SELECT
USING (
  (EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
  ))
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Participants can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  (sender_id = auth.uid())
  AND (EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
  ))
);

CREATE POLICY "Senders can update own messages"
ON public.messages FOR UPDATE
USING (sender_id = auth.uid());

CREATE POLICY "Senders and admins can delete messages"
ON public.messages FOR DELETE
USING (
  (sender_id = auth.uid())
  OR has_role(auth.uid(), 'school_admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);
