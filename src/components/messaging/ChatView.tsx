import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, ArrowLeft, Trash2, Users, Megaphone } from 'lucide-react';
import { Message, Conversation, useSendMessage, useDeleteMessage, useMarkAsRead, useRealtimeMessages } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/contexts/AuthContext';
import { format, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';

interface ChatViewProps {
  conversation: Conversation;
  messages: Message[];
  isLoading?: boolean;
  onBack?: () => void;
  readOnly?: boolean;
}

export function ChatView({ conversation, messages, isLoading, onBack, readOnly = false }: ChatViewProps) {
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const sendMessage = useSendMessage();
  const deleteMessage = useDeleteMessage();
  const markAsRead = useMarkAsRead();

  // Realtime subscription
  useRealtimeMessages(conversation.id);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark as read when opening
  useEffect(() => {
    if (conversation.id) {
      markAsRead.mutate(conversation.id);
    }
  }, [conversation.id]);

  const handleSend = () => {
    const trimmed = newMessage.trim();
    if (!trimmed) return;
    sendMessage.mutate({ conversationId: conversation.id, content: trimmed });
    setNewMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const chatName = getChatName(conversation, user?.id);
  const participantCount = conversation.participants?.length || 0;
  const TypeIcon = conversation.type === 'group' ? Users : conversation.type === 'broadcast' ? Megaphone : null;

  // Group messages by date
  const groupedMessages = groupByDate(messages);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-card">
        {onBack && (
          <Button variant="ghost" size="icon-sm" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <Avatar className="h-9 w-9">
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {chatName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {TypeIcon && <TypeIcon className="w-3.5 h-3.5 text-muted-foreground" />}
            <p className="font-semibold text-sm text-foreground truncate">{chatName}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {conversation.type === 'direct' ? 'Direct message' : `${participantCount} members`}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex justify-center my-3">
                <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">{date}</span>
              </div>
              {msgs.map((msg, idx) => {
                const isMe = msg.sender_id === user?.id;
                const showSender = !isMe && conversation.type !== 'direct' && 
                  (idx === 0 || msgs[idx - 1].sender_id !== msg.sender_id);
                
                return (
                  <div key={msg.id} className={cn("flex mb-1", isMe ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[75%] group relative", isMe ? "items-end" : "items-start")}>
                      {showSender && (
                        <p className="text-xs font-medium text-primary mb-0.5 ml-1">{msg.sender?.full_name}</p>
                      )}
                      <div className={cn(
                        "px-3 py-2 rounded-2xl text-sm relative",
                        isMe ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md",
                        msg.is_deleted && "italic opacity-60"
                      )}>
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={cn(
                          "text-[10px] mt-0.5 text-right",
                          isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {format(new Date(msg.created_at), 'hh:mm a')}
                        </p>
                      </div>
                      {isMe && !msg.is_deleted && (
                        <button
                          onClick={() => deleteMessage.mutate({ messageId: msg.id, conversationId: conversation.id })}
                          className="absolute -left-7 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      {readOnly ? (
        <div className="px-4 py-3 border-t border-border bg-muted text-center">
          <p className="text-sm text-muted-foreground">You can only view messages</p>
        </div>
      ) : conversation.type !== 'broadcast' || conversation.created_by === user?.id ? (
        <div className="px-4 py-3 border-t border-border bg-card">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
              autoComplete="off"
            />
            <Button size="icon" onClick={handleSend} disabled={!newMessage.trim() || sendMessage.isPending}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="px-4 py-3 border-t border-border bg-muted text-center">
          <p className="text-sm text-muted-foreground">Only the creator can send messages in broadcasts</p>
        </div>
      )}
    </div>
  );
}

function getChatName(conv: Conversation, currentUserId?: string): string {
  if (conv.name) return conv.name;
  if (conv.type === 'direct' && conv.participants) {
    const other = conv.participants.find(p => p.user_id !== currentUserId);
    return other?.profile?.full_name || 'Unknown User';
  }
  if (conv.type === 'group' && conv.class_name) {
    return `${conv.class_name}${conv.section ? `-${conv.section}` : ''} Group`;
  }
  return 'Conversation';
}

function groupByDate(messages: Message[]): Record<string, Message[]> {
  const groups: Record<string, Message[]> = {};
  for (const msg of messages) {
    const d = new Date(msg.created_at);
    let label: string;
    if (isToday(d)) label = 'Today';
    else if (isYesterday(d)) label = 'Yesterday';
    else label = format(d, 'MMM d, yyyy');
    if (!groups[label]) groups[label] = [];
    groups[label].push(msg);
  }
  return groups;
}
