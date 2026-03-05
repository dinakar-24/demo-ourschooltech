import { useTenant } from '@/contexts/TenantContext';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function InstallAppBanner() {
  const { tenant, isSubdomain } = useTenant();
  const { canInstall, triggerInstall, dismiss } = useInstallPrompt();

  if (!canInstall || !isSubdomain || !tenant) return null;

  return (
    <div className="fixed bottom-16 left-2 right-2 z-50 sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-sm animate-fade-up">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-lg">
        {tenant.logo ? (
          <img src={tenant.logo} alt={tenant.name} className="w-10 h-10 rounded-lg object-contain bg-muted p-1 flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-primary-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            Install {tenant.appDisplayName || tenant.name}
          </p>
          <p className="text-xs text-muted-foreground">Add to home screen for quick access</p>
        </div>
        <Button size="sm" onClick={triggerInstall} className="flex-shrink-0">
          Install
        </Button>
        <button onClick={dismiss} className="p-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
