import { Button } from '@/components/ui/button';
import { Clock, X } from 'lucide-react';

interface SessionWarningBannerProps {
  remainingSeconds: number;
  onExtend: () => void;
  onLogout: () => void;
}

export function SessionWarningBanner({ remainingSeconds, onExtend, onLogout }: SessionWarningBannerProps) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeDisplay = minutes > 0
    ? `${minutes}m ${seconds.toString().padStart(2, '0')}s`
    : `${seconds}s`;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-lg animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 backdrop-blur-lg px-4 py-3 shadow-lg">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-destructive/20 shrink-0">
          <Clock className="w-5 h-5 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-destructive">Session expiring soon</p>
          <p className="text-xs text-muted-foreground">
            You'll be logged out in <span className="font-mono font-bold text-destructive">{timeDisplay}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" onClick={onExtend} className="h-8 text-xs">
            Stay logged in
          </Button>
          <Button size="sm" variant="ghost" onClick={onLogout} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
