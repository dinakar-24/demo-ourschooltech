import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ConversationList } from '@/components/messaging/ConversationList';
import { ChatView } from '@/components/messaging/ChatView';
import { NewChatDialog } from '@/components/messaging/NewChatDialog';
import { useConversations, useMessages, useCreateConversation, useRealtimeConversations, Conversation } from '@/hooks/useMessages';
import { useIsMobile } from '@/hooks/use-mobile';
import { MessageCircle } from 'lucide-react';

export default function TeacherMessages() {
  const isMobile = useIsMobile();
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [newChatOpen, setNewChatOpen] = useState(false);

  const { data: conversations = [], isLoading: convsLoading } = useConversations();
  const { data: messages = [], isLoading: msgsLoading } = useMessages(selectedConv?.id);
  const createConversation = useCreateConversation();
  useRealtimeConversations();

  const currentConv = selectedConv ? conversations.find(c => c.id === selectedConv.id) || selectedConv : null;

  const handleCreateDirect = async (userId: string) => {
    const conv = await createConversation.mutateAsync({ type: 'direct', participantIds: [userId] });
    const fullConv = conversations.find(c => c.id === conv.id);
    if (fullConv) setSelectedConv(fullConv);
  };

  if (isMobile) {
    return (
      <DashboardLayout>
        <div className="h-[calc(100dvh-8rem)]">
          {!selectedConv ? (
            <ConversationList conversations={conversations} selectedId={selectedConv?.id} onSelect={setSelectedConv} onNewChat={() => setNewChatOpen(true)} isLoading={convsLoading} />
          ) : currentConv ? (
            <ChatView conversation={currentConv} messages={messages} isLoading={msgsLoading} onBack={() => setSelectedConv(null)} />
          ) : null}
        </div>
        <NewChatDialog open={newChatOpen} onOpenChange={setNewChatOpen} onCreateDirect={handleCreateDirect} onCreateGroup={async (n, ids) => { await createConversation.mutateAsync({ type: 'group', name: n, participantIds: ids }); }} onCreateBroadcast={async (n, ids) => { await createConversation.mutateAsync({ type: 'broadcast', name: n, participantIds: ids }); }} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-5rem)] rounded-lg border border-border overflow-hidden bg-card">
        <div className="w-80 shrink-0">
          <ConversationList conversations={conversations} selectedId={selectedConv?.id} onSelect={setSelectedConv} onNewChat={() => setNewChatOpen(true)} isLoading={convsLoading} />
        </div>
        <div className="flex-1 min-w-0">
          {currentConv ? (
            <ChatView conversation={currentConv} messages={messages} isLoading={msgsLoading} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <MessageCircle className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p className="text-sm">Choose from existing chats or start a new one</p>
            </div>
          )}
        </div>
      </div>
      <NewChatDialog open={newChatOpen} onOpenChange={setNewChatOpen} onCreateDirect={handleCreateDirect} onCreateGroup={async (n, ids) => { await createConversation.mutateAsync({ type: 'group', name: n, participantIds: ids }); }} onCreateBroadcast={async (n, ids) => { await createConversation.mutateAsync({ type: 'broadcast', name: n, participantIds: ids }); }} />
    </DashboardLayout>
  );
}
