import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

type TabType = 'group' | 'broadcast' | 'direct';

const tabs: { key: TabType; label: string; icon: React.ElementType }[] = [
  { key: 'group', label: 'Groups', icon: Users },
  { key: 'broadcast', label: 'Broadcast', icon: Megaphone },
  { key: 'direct', label: 'Direct', icon: MessageCircle },
];

const avatarColors: Record<TabType, string> = {
  group: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  broadcast: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  direct: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
};

export function ConversationList({ conversations, selectedId, onSelect, onNewChat, isLoading }: ConversationListProps) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('group');
  const { user } = useAuth();

  const filtered = conversations.filter(c => {
    if (c.type !== activeTab) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const name = getConversationName(c, user?.id);
    return name.toLowerCase().includes(q) || c.last_message_preview?.toLowerCase().includes(q);
  });

  const counts = {
    group: conversations.filter(c => c.type === 'group').length,
    broadcast: conversations.filter(c => c.type === 'broadcast').length,
    direct: conversations.filter(c => c.type === 'direct').length,
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-foreground text-xl tracking-tight">Messages</h2>
          {onNewChat && (
            <Button
              size="icon"
              onClick={onNewChat}
              className="h-9 w-9 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
            >
              <Plus className="w-5 h-5" />
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-muted/60 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
          />
        </div>
      </div>

      {/* Tabs - horizontal scroll on mobile */}
      <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 whitespace-nowrap shrink-0",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {counts[tab.key] > 0 && (
                <span className={cn(
                  "text-[11px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-background text-muted-foreground"
                )}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="h-px bg-border mx-4" />

      {/* List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading conversations...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 px-6 text-center">
            {activeTab === 'group' && <Users className="w-12 h-12 text-muted-foreground/30" />}
            {activeTab === 'broadcast' && <Megaphone className="w-12 h-12 text-muted-foreground/30" />}
            {activeTab === 'direct' && <MessageCircle className="w-12 h-12 text-muted-foreground/30" />}
            <div>
              <p className="text-sm font-medium text-foreground">
                {search ? 'No results found' : `No ${activeTab} conversations`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? 'Try a different search term' : 'Start a new conversation to get going'}
              </p>
            </div>
          </div>
        ) : (
          <div className="py-1">
            {filtered.map(conv => {
              const name = getConversationName(conv, user?.id);
              const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              const isSelected = selectedId === conv.id;
              const hasUnread = !!conv.unread_count;

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv)}
                  className={cn(
                    "w-full text-left px-4 py-3 flex items-center gap-3 transition-all duration-150 relative",
                    isSelected
                      ? "bg-primary/8"
                      : "hover:bg-muted/50 active:bg-muted"
                  )}
                >
                  {/* Active indicator */}
                  {isSelected && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                  )}

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className={cn("text-sm font-bold", avatarColors[conv.type as TabType] || avatarColors.direct)}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={cn(
                        "text-[15px] truncate leading-tight",
                        hasUnread ? "font-bold text-foreground" : "font-semibold text-foreground"
                      )}>
                        {name}
                      </p>
                      {conv.last_message_at && (
                        <span className={cn(
                          "text-[11px] ml-2 shrink-0",
                          hasUnread ? "text-primary font-semibold" : "text-muted-foreground"
                        )}>
                          {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={cn(
                        "text-[13px] truncate pr-2",
                        hasUnread ? "text-foreground font-medium" : "text-muted-foreground"
                      )}>
                        {conv.last_message_preview || 'No messages yet'}
                      </p>
                      {hasUnread && (
                        <span className="shrink-0 h-5 min-w-[20px] px-1.5 bg-primary text-primary-foreground text-[11px] font-bold rounded-full flex items-center justify-center">
                          {conv.unread_count}
                        </span>
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
