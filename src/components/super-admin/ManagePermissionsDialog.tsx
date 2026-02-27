import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Shield, Check, X as XIcon } from 'lucide-react';
import { useManageAdminPermissions, ALL_ADMIN_MODULES, MODULE_LABELS, AdminModule } from '@/hooks/useAdminPermissions';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';

interface ManagePermissionsDialogProps {
  userId: string;
  schoolId: string;
  adminName: string;
  trigger?: React.ReactNode;
}

function PermissionsForm({
  userId,
  schoolId,
  onClose,
}: {
  userId: string;
  schoolId: string;
  onClose: () => void;
}) {
  const { allowedModules, toggleModule, setAll, savePermissions, loading, saving } = useManageAdminPermissions(userId, schoolId);

  const allSelected = allowedModules.size === ALL_ADMIN_MODULES.length;
  const noneSelected = allowedModules.size === 0;

  const handleSave = async () => {
    const success = await savePermissions();
    if (success) onClose();
  };

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 pb-6 space-y-4">
      {/* Quick actions */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAll(true)}
          disabled={allSelected}
          className="gap-1.5"
        >
          <Check className="w-3.5 h-3.5" /> Select All
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAll(false)}
          disabled={noneSelected}
          className="gap-1.5"
        >
          <XIcon className="w-3.5 h-3.5" /> Deselect All
        </Button>
        <Badge variant="secondary" className="ml-auto">
          {allowedModules.size}/{ALL_ADMIN_MODULES.length} modules
        </Badge>
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto pr-1">
        {ALL_ADMIN_MODULES.map((module) => (
          <button
            key={module}
            type="button"
            onClick={() => toggleModule(module)}
            className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors text-left ${
              allowedModules.has(module)
                ? 'border-primary/30 bg-primary/5'
                : 'border-border bg-muted/30 opacity-60'
            }`}
          >
            <span className="text-sm font-medium">{MODULE_LABELS[module]}</span>
            <Switch
              checked={allowedModules.has(module)}
              onCheckedChange={() => toggleModule(module)}
              className="pointer-events-none"
            />
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none sm:ml-auto gap-2">
          <Shield className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save Permissions'}
        </Button>
      </div>
    </div>
  );
}

export function ManagePermissionsDialog({ userId, schoolId, adminName, trigger }: ManagePermissionsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const headerContent = (
    <div className="flex items-center gap-3 px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Shield className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-lg font-semibold">Module Permissions</p>
        <p className="text-sm text-muted-foreground truncate max-w-[250px]">
          Configure access for {adminName}
        </p>
      </div>
    </div>
  );

  const defaultTrigger = trigger || (
    <Button variant="outline" size="sm" className="gap-1.5">
      <Shield className="w-3.5 h-3.5" /> Permissions
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>{defaultTrigger}</DrawerTrigger>
        <DrawerContent className="max-h-[90dvh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Module Permissions</DrawerTitle>
            <DrawerDescription>Configure module access</DrawerDescription>
          </DrawerHeader>
          {headerContent}
          <div className="overflow-y-auto">
            <PermissionsForm userId={userId} schoolId={schoolId} onClose={() => setIsOpen(false)} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Module Permissions</DialogTitle>
          <DialogDescription>Configure module access</DialogDescription>
        </DialogHeader>
        {headerContent}
        <PermissionsForm userId={userId} schoolId={schoolId} onClose={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
