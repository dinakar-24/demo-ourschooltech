
-- Fix conversations policies: drop and recreate with TO authenticated
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "School users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Creator can update conversation" ON public.conversations;
DROP POLICY IF EXISTS "Creator can delete conversation" ON public.conversations;

CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (
  (EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()))
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "School users can create conversations"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK ((school_id = get_user_school_id(auth.uid())) AND (created_by = auth.uid()));

CREATE POLICY "Creator can update conversation"
ON public.conversations FOR UPDATE
TO authenticated
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'school_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Creator can delete conversation"
ON public.conversations FOR DELETE
TO authenticated
USING ((created_by = auth.uid()) OR has_role(auth.uid(), 'school_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Fix conversation_participants policies
DROP POLICY IF EXISTS "Users can view their participation" ON public.conversation_participants;
DROP POLICY IF EXISTS "School members can add participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update own participation" ON public.conversation_participants;
DROP POLICY IF EXISTS "Admins can remove participants" ON public.conversation_participants;

CREATE POLICY "Users can view their participation"
ON public.conversation_participants FOR SELECT
TO authenticated
USING (
  (user_id = auth.uid())
  OR (EXISTS (SELECT 1 FROM conversation_participants cp2 WHERE cp2.conversation_id = conversation_participants.conversation_id AND cp2.user_id = auth.uid()))
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "School members can add participants"
ON public.conversation_participants FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_participants.conversation_id AND c.school_id = get_user_school_id(auth.uid())));

CREATE POLICY "Users can update own participation"
ON public.conversation_participants FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can remove participants"
ON public.conversation_participants FOR DELETE
TO authenticated
USING ((user_id = auth.uid()) OR has_role(auth.uid(), 'school_admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
