
-- Conversation types: 'direct' (1-to-1), 'group' (class groups), 'broadcast' (one-way announcements)
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'broadcast')),
  name TEXT, -- For group/broadcast chats
  created_by UUID NOT NULL,
  class_name TEXT, -- For class-linked groups
  section TEXT, -- For class-linked groups
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now(),
  last_message_preview TEXT
);

-- Participants in conversations
CREATE TABLE public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  is_muted BOOLEAN DEFAULT false,
  last_read_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  attachment_url TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_conversations_school_id ON public.conversations(school_id);
CREATE INDEX idx_conversations_last_message ON public.conversations(last_message_at DESC);
CREATE INDEX idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE UNIQUE INDEX idx_conversation_participants_unique ON public.conversation_participants(conversation_id, user_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view conversations they participate in
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'super_admin')
);

-- RLS: Users in the school can create conversations
CREATE POLICY "School users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (
  school_id = get_user_school_id(auth.uid())
  AND created_by = auth.uid()
);

-- RLS: Conversation creator or admin can update
CREATE POLICY "Creator can update conversation"
ON public.conversations FOR UPDATE
USING (
  created_by = auth.uid()
  OR has_role(auth.uid(), 'school_admin')
  OR has_role(auth.uid(), 'super_admin')
);

-- RLS: Conversation creator or admin can delete
CREATE POLICY "Creator can delete conversation"
ON public.conversations FOR DELETE
USING (
  created_by = auth.uid()
  OR has_role(auth.uid(), 'school_admin')
  OR has_role(auth.uid(), 'super_admin')
);

-- RLS: Participants can view their own participation
CREATE POLICY "Users can view their participation"
ON public.conversation_participants FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.conversation_participants cp2
    WHERE cp2.conversation_id = conversation_participants.conversation_id AND cp2.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'super_admin')
);

-- RLS: School members can add participants
CREATE POLICY "School members can add participants"
ON public.conversation_participants FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND c.school_id = get_user_school_id(auth.uid())
  )
);

-- RLS: Users can update their own participation (mute, last_read)
CREATE POLICY "Users can update own participation"
ON public.conversation_participants FOR UPDATE
USING (user_id = auth.uid());

-- RLS: Admins or conversation creator can remove participants
CREATE POLICY "Admins can remove participants"
ON public.conversation_participants FOR DELETE
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'school_admin')
  OR has_role(auth.uid(), 'super_admin')
);

-- RLS: Participants can view messages in their conversations
CREATE POLICY "Participants can view messages"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'super_admin')
);

-- RLS: Participants can send messages
CREATE POLICY "Participants can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
  )
);

-- RLS: Senders can update own messages (edit/soft delete)
CREATE POLICY "Senders can update own messages"
ON public.messages FOR UPDATE
USING (sender_id = auth.uid());

-- RLS: Senders and admins can delete messages
CREATE POLICY "Senders and admins can delete messages"
ON public.messages FOR DELETE
USING (
  sender_id = auth.uid()
  OR has_role(auth.uid(), 'school_admin')
  OR has_role(auth.uid(), 'super_admin')
);

-- Trigger to update conversation last_message_at
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at,
      last_message_preview = LEFT(NEW.content, 100),
      updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_message_insert
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_last_message();

-- Enable realtime for messages and conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
