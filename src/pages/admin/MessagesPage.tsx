import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ConversationList } from '@/components/messaging/ConversationList';
import { ChatView } from '@/components/messaging/ChatView';
import { useConversations, useMessages, useRealtimeConversations, Conversation } from '@/hooks/useMessages';
import { useAutoCreateGroups } from '@/hooks/useAutoCreateGroups';
import { useIsMobile } from '@/hooks/use-mobile';
import { MessageCircle } from 'lucide-react';

export default function MessagesPage() {
  const isMobile = useIsMobile();
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);

  const { data: conversations = [], isLoading: convsLoading } = useConversations();
  const { data: messages = [], isLoading: msgsLoading } = useMessages(selectedConv?.id);

  // Auto-create class/section groups & broadcasts
  useAutoCreateGroups();
  // Realtime for conversation list
  useRealtimeConversations();

  const handleSelect = (conv: Conversation) => {
    setSelectedConv(conv);
  };

  // Update selected conversation with latest data
  const currentConv = selectedConv ? conversations.find(c => c.id === selectedConv.id) || selectedConv : null;

  // Mobile: show either list or chat
  if (isMobile) {
    return (
      <AdminLayout>
        <div className="flex flex-col h-[calc(100dvh-4rem)]">
          {!selectedConv ? (
            <ConversationList
              conversations={conversations}
              selectedId={selectedConv?.id}
              onSelect={handleSelect}
              isLoading={convsLoading}
            />
          ) : currentConv ? (
            <ChatView
              conversation={currentConv}
              messages={messages}
              isLoading={msgsLoading}
              onBack={() => setSelectedConv(null)}
            />
          ) : null}
        </div>
      </AdminLayout>
    );
  }

  // Desktop: side-by-side
  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-5rem)] rounded-lg border border-border overflow-hidden bg-card">
        {/* Left panel - Conversation list */}
        <div className="w-80 shrink-0">
          <ConversationList
            conversations={conversations}
            selectedId={selectedConv?.id}
            onSelect={handleSelect}
            isLoading={convsLoading}
          />
        </div>

        {/* Right panel - Chat */}
        <div className="flex-1 min-w-0">
          {currentConv ? (
            <ChatView
              conversation={currentConv}
              messages={messages}
              isLoading={msgsLoading}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <MessageCircle className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose from existing chats or start a new one</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
