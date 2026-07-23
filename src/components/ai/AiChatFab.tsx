import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AiChatDrawer } from './AiChatDrawer';
import { cn } from '@/lib/utils';

export function AiChatFab() {
  const { isAuthenticated, user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!isAuthenticated || !user) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open OurSchool AI"
        className={cn(
          'fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40',
          'h-14 w-14 rounded-full shadow-lg',
          'bg-primary text-primary-foreground',
          'flex items-center justify-center',
          'hover:scale-105 active:scale-95 transition-transform',
          'ring-4 ring-primary/20'
        )}
      >
        <Sparkles className="h-6 w-6" />
        <span className="sr-only">Open OurSchool AI</span>
      </button>
      <AiChatDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}