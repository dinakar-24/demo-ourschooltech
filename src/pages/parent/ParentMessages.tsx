import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ConversationList } from '@/components/messaging/ConversationList';
import { ChatView } from '@/components/messaging/ChatView';
import { useConversations, useMessages, useRealtimeConversations, Conversation } from '@/hooks/useMessages';
import { useIsMobile } from '@/hooks/use-mobile';
import { MessageCircle } from 'lucide-react';

export default function ParentMessages() {
  const isMobile = useIsMobile();
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);

  const { data: conversations = [], isLoading: convsLoading } = useConversations();
  const { data: messages = [], isLoading: msgsLoading } = useMessages(selectedConv?.id);
  useRealtimeConversations();

  const currentConv = selectedConv ? conversations.find(c => c.id === selectedConv.id) || selectedConv : null;

  if (isMobile) {
    return (
      <DashboardLayout>
        <div className="h-[calc(100dvh-8rem)]">
          {!selectedConv ? (
            <ConversationList conversations={conversations} selectedId={selectedConv?.id} onSelect={setSelectedConv} isLoading={convsLoading} />
          ) : currentConv ? (
            <ChatView conversation={currentConv} messages={messages} isLoading={msgsLoading} onBack={() => setSelectedConv(null)} readOnly />
          ) : null}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-5rem)] rounded-lg border border-border overflow-hidden bg-card">
        <div className="w-80 shrink-0">
          <ConversationList conversations={conversations} selectedId={selectedConv?.id} onSelect={setSelectedConv} isLoading={convsLoading} />
        </div>
        <div className="flex-1 min-w-0">
          {currentConv ? (
            <ChatView conversation={currentConv} messages={messages} isLoading={msgsLoading} readOnly />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <MessageCircle className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose from existing chats to view messages</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
