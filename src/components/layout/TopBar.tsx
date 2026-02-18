import { Bell, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTenant } from '@/contexts/TenantContext';

interface TopBarProps {
  title?: string;
  onMenuClick?: () => void;
}

export function TopBar({ title = 'Dashboard', onMenuClick }: TopBarProps) {
  const { tenant, isSubdomain } = useTenant();

  return (
    <header className="sticky top-0 z-30 bg-surface border-b border-border px-4 md:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon-sm" 
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>
          {isSubdomain && tenant?.logo && (
            <img src={tenant.logo} alt={tenant.name} className="w-8 h-8 rounded-lg object-contain hidden md:block" />
          )}
          <h1 className="text-lg md:text-xl font-display font-semibold text-foreground">{title}</h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Search - Hidden on mobile */}
          <div className="hidden md:flex relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-9 w-64 bg-muted/50 border-0 focus-visible:ring-1"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </Button>

          {/* Mobile Search */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Search className="w-5 h-5 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </header>
  );
}
