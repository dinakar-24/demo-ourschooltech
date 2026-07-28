import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Send, Square, Plus, X, Loader2 } from 'lucide-react';
import { useAiChat } from '@/hooks/useAiChat';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const ROLE_SUGGESTIONS: Record<string, string[]> = {
  parent: [
    "What are my child's pending fees?",
    "Show attendance this month",
    "Any new announcements?",
    "When is the next fee due?",
  ],
  student: [
    "What homework is due this week?",
    "Give me a study tip",
    "Explain photosynthesis simply",
    "Any new announcements?",
  ],
  teacher: [
    "Summarize today's attendance",
    "Draft a class announcement",
    "Ideas for tomorrow's lesson",
    "How do I mark exam results?",
  ],
  school_admin: [
    "Total pending fees this month",
    "How many students absent today?",
    "Draft a holiday announcement",
    "Tips to improve fee collection",
  ],
  super_admin: [
    "Platform school count",
    "Which schools are inactive?",
    "Summarize recent activity",
    "Ideas to grow the platform",
  ],
};

export function AiChatDrawer({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { messages, isStreaming, sendMessage, stop, startNewConversation } = useAiChat();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const suggestions = ROLE_SUGGESTIONS[user?.role || 'student'] || ROLE_SUGGESTIONS.student;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 100);
  }, [open]);

  const handleSend = () => {
    const val = input.trim();
    if (!val || isStreaming) return;
    setInput('');
    sendMessage(val);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92dvh] flex flex-col">
        <DrawerHeader className="border-b flex-row items-center justify-between space-y-0 py-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DrawerTitle className="text-base">OurSchool AI</DrawerTitle>
              <p className="text-xs text-muted-foreground">Your school assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={startNewConversation} title="New chat">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DrawerHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-4 pt-2">
              <div className="text-center space-y-2">
                <div className="h-14 w-14 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">Hi {user?.name?.split(' ')[0] || 'there'}! 👋</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Ask me anything about your school — fees, attendance, homework, or general questions.
                </p>
              </div>
              <div className="grid gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-left text-sm px-3 py-2.5 rounded-lg border bg-card hover:bg-accent transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                )}
              >
                {m.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-headings:my-2">
                    {m.content ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    ) : (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t p-3 bg-background">
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask OurSchool AI…"
              rows={1}
              className="min-h-[44px] max-h-32 resize-none"
              disabled={isStreaming}
            />
            {isStreaming ? (
              <Button size="icon" variant="destructive" onClick={stop} className="shrink-0">
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="icon" onClick={handleSend} disabled={!input.trim()} className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            AI can make mistakes. Verify important info.
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}