import { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { ConversationList } from '@/components/messaging/ConversationList';
import { ChatView } from '@/components/messaging/ChatView';
import { useConversations, useMessages, useRealtimeConversations, Conversation } from '@/hooks/useMessages';
import { MessageCircle } from 'lucide-react';

export default function ParentMessages() {
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);

  const { data: conversations = [], isLoading: convsLoading } = useConversations();
  const { data: messages = [], isLoading: msgsLoading } = useMessages(selectedConv?.id);
  useRealtimeConversations();

  const currentConv = selectedConv ? conversations.find(c => c.id === selectedConv.id) || selectedConv : null;

  return (
    <MobileLayout title="Messages" showBack>
      <div className="h-[calc(100dvh-8rem)]">
        {!selectedConv ? (
          <ConversationList conversations={conversations} selectedId={selectedConv?.id} onSelect={setSelectedConv} isLoading={convsLoading} />
        ) : currentConv ? (
          <ChatView conversation={currentConv} messages={messages} isLoading={msgsLoading} onBack={() => setSelectedConv(null)} readOnly />
        ) : null}
      </div>
    </MobileLayout>
  );
}
