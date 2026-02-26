
-- Fix messages policies to use authenticated role
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "Senders can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Senders and admins can delete messages" ON public.messages;

CREATE POLICY "Participants can view messages"
ON public.messages FOR SELECT
TO authenticated
USING (
  (EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()))
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Participants can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  (sender_id = auth.uid())
  AND (EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()))
);

CREATE POLICY "Senders can update own messages"
ON public.messages FOR UPDATE
TO authenticated
USING (sender_id = auth.uid());

CREATE POLICY "Senders and admins can delete messages"
ON public.messages FOR DELETE
TO authenticated
USING ((sender_id = auth.uid()) OR has_role(auth.uid(), 'school_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
