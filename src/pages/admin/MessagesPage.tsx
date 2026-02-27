import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ConversationList } from '@/components/messaging/ConversationList';
import { ChatView } from '@/components/messaging/ChatView';
import { NewChatDialog } from '@/components/messaging/NewChatDialog';
import { useConversations, useMessages, useCreateConversation, useRealtimeConversations, Conversation } from '@/hooks/useMessages';
import { useAutoCreateGroups } from '@/hooks/useAutoCreateGroups';
import { useIsMobile } from '@/hooks/use-mobile';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MessagesPage() {
  const isMobile = useIsMobile();
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [newChatOpen, setNewChatOpen] = useState(false);

  const { data: conversations = [], isLoading: convsLoading } = useConversations();
  const { data: messages = [], isLoading: msgsLoading } = useMessages(selectedConv?.id);
  const createConversation = useCreateConversation();

  // Auto-create class/section groups & broadcasts
  useAutoCreateGroups();
  // Realtime for conversation list
  useRealtimeConversations();

  const handleSelect = (conv: Conversation) => {
    setSelectedConv(conv);
  };

  const handleCreateDirect = async (userId: string) => {
    const conv = await createConversation.mutateAsync({ type: 'direct', participantIds: [userId] });
    // Find the full conversation from the list or use the created one
    const fullConv = conversations.find(c => c.id === conv.id);
    if (fullConv) setSelectedConv(fullConv);
  };

  const handleCreateGroup = async (name: string, participantIds: string[]) => {
    await createConversation.mutateAsync({ type: 'group', name, participantIds });
  };

  const handleCreateBroadcast = async (name: string, participantIds: string[]) => {
    await createConversation.mutateAsync({ type: 'broadcast', name, participantIds });
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
              onNewChat={() => setNewChatOpen(true)}
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
        <NewChatDialog
          open={newChatOpen}
          onOpenChange={setNewChatOpen}
          onCreateDirect={handleCreateDirect}
          onCreateGroup={handleCreateGroup}
          onCreateBroadcast={handleCreateBroadcast}
        />
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
            onNewChat={() => setNewChatOpen(true)}
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

      <NewChatDialog
        open={newChatOpen}
        onOpenChange={setNewChatOpen}
        onCreateDirect={handleCreateDirect}
        onCreateGroup={handleCreateGroup}
        onCreateBroadcast={handleCreateBroadcast}
      />
    </AdminLayout>
  );
}
