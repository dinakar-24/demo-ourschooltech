import { useState } from 'react';
import { ModulePage, ModuleHeader } from '@/components/modules/ModuleShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessagesSquare, Send, ArrowLeft, Search } from 'lucide-react';
import { chatThreads, chatMessages } from '@/data/mockModules';
import { cn } from '@/lib/utils';

export default function MessagingPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const active = chatThreads.find(t => t.id === activeId);

  const initials = (n: string) => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const list = (
    <div className="divide-y">
      {chatThreads.map(t => (
        <button
          key={t.id}
          onClick={() => setActiveId(t.id)}
          className={cn('w-full text-left p-3 flex gap-3 hover:bg-accent transition-colors', activeId === t.id && 'bg-accent')}
        >
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="text-xs">{initials(t.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm truncate">{t.name}</p>
              <span className="text-[11px] text-muted-foreground shrink-0">{t.time}</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{t.last}</p>
            <div className="flex items-center justify-between gap-2 mt-0.5">
              <span className="text-[11px] text-muted-foreground truncate">{t.context}</span>
              {t.unread > 0 && <Badge className="h-5 min-w-5 justify-center px-1.5 text-[10px]">{t.unread}</Badge>}
            </div>
          </div>
        </button>
      ))}
    </div>
  );

  const conversation = active && (
    <div className="flex flex-col h-[60vh] lg:h-[calc(100vh-19rem)]">
      <div className="flex items-center gap-3 p-3 border-b">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setActiveId(null)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-9 w-9"><AvatarFallback className="text-xs">{initials(active.name)}</AvatarFallback></Avatar>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{active.name}</p>
          <p className="text-xs text-muted-foreground truncate">{active.online ? 'Online' : active.context}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.map(m => (
          <div key={m.id} className={cn('flex', m.me ? 'justify-end' : 'justify-start')}>
            <div className={cn(
              'max-w-[80%] rounded-2xl px-3.5 py-2 text-sm',
              m.me ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm',
            )}>
              <p>{m.text}</p>
              <p className={cn('text-[10px] mt-1', m.me ? 'text-primary-foreground/70' : 'text-muted-foreground')}>{m.time}</p>
            </div>
          </div>
        ))}
      </div>
      <form
        className="flex items-center gap-2 p-3 border-t"
        onSubmit={e => { e.preventDefault(); setDraft(''); }}
      >
        <Input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Type a message" />
        <Button type="submit" size="icon" disabled={!draft.trim()}><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );

  return (
    <ModulePage>
      <ModuleHeader icon={MessagesSquare} title="Messaging" description="Parent–teacher and staff conversations" />

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="lg:grid lg:grid-cols-[320px_1fr]">
            <div className={cn('lg:border-r', activeId && 'hidden lg:block')}>
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search conversations" className="pl-9" />
                </div>
              </div>
              {list}
            </div>
            <div className={cn(!activeId && 'hidden lg:flex lg:items-center lg:justify-center')}>
              {conversation ?? (
                <p className="text-sm text-muted-foreground p-10 text-center">Select a conversation to start chatting</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </ModulePage>
  );
}