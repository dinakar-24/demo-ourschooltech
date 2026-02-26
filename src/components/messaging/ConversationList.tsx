import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Users, Megaphone, MessageCircle } from 'lucide-react';
import { Conversation } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conv: Conversation) => void;
  onNewChat?: () => void;
  isLoading?: boolean;
}

export function ConversationList({ conversations, selectedId, onSelect, onNewChat, isLoading }: ConversationListProps) {
  const [search, setSearch] = useState('');
  const { user } = useAuth();

  const filtered = conversations.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = getConversationName(c, user?.id);
    return name.toLowerCase().includes(q) || c.last_message_preview?.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col h-full border-r border-border bg-card">
      {/* Header */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground text-lg">Messages</h2>
          {onNewChat && (
            <Button size="icon-sm" variant="outline" onClick={onNewChat}>
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search conversations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {search ? 'No conversations found' : 'No messages yet'}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(conv => {
              const name = getConversationName(conv, user?.id);
              const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              const TypeIcon = conv.type === 'group' ? Users : conv.type === 'broadcast' ? Megaphone : MessageCircle;
              
              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv)}
                  className={cn(
                    "w-full text-left px-3 py-3 hover:bg-accent/50 transition-colors flex items-start gap-3",
                    selectedId === conv.id && "bg-accent"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                    </Avatar>
                    {conv.type !== 'direct' && (
                      <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5">
                        <TypeIcon className="w-3 h-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={cn("text-sm truncate", conv.unread_count ? "font-semibold text-foreground" : "font-medium text-foreground")}>{name}</p>
                      {conv.last_message_at && (
                        <span className="text-xs text-muted-foreground ml-2 shrink-0">
                          {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={cn("text-xs truncate", conv.unread_count ? "text-foreground" : "text-muted-foreground")}>
                        {conv.last_message_preview || 'No messages yet'}
                      </p>
                      {!!conv.unread_count && (
                        <Badge variant="default" className="ml-2 h-5 w-5 shrink-0 rounded-full p-0 flex items-center justify-center text-[10px]">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function getConversationName(conv: Conversation, currentUserId?: string): string {
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
