
-- Create a security definer function to check conversation membership
-- This avoids infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = _conversation_id
      AND user_id = _user_id
  )
$$;

-- Fix conversation_participants SELECT policy to avoid self-reference
DROP POLICY IF EXISTS "Users can view their participation" ON public.conversation_participants;

CREATE POLICY "Users can view their participation"
ON public.conversation_participants FOR SELECT
USING (
  (user_id = auth.uid())
  OR has_role(auth.uid(), 'school_admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Also fix conversations SELECT to use the new function instead of subquery on conversation_participants
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;

CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
USING (
  public.is_conversation_participant(id, auth.uid())
  OR has_role(auth.uid(), 'school_admin'::app_role)
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Fix messages SELECT to use the new function
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;

CREATE POLICY "Participants can view messages"
ON public.messages FOR SELECT
USING (
  public.is_conversation_participant(conversation_id, auth.uid())
  OR has_role(auth.uid(), 'super_admin'::app_role)
);

-- Fix messages INSERT to use the new function
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;

CREATE POLICY "Participants can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  (sender_id = auth.uid())
  AND public.is_conversation_participant(conversation_id, auth.uid())
);
