import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useNavigate } from 'react-router-dom';
import { Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ImpersonationBanner() {
  const { impersonatedSchool, isImpersonating, stopImpersonation } = useImpersonation();
  const navigate = useNavigate();

  if (!isImpersonating || !impersonatedSchool) return null;

  const handleExit = () => {
    stopImpersonation();
    navigate('/super-admin/schools');
  };

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between gap-3 text-sm font-medium sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4" />
        <span>
          Viewing as <strong>{impersonatedSchool.name}</strong> — Read-only support mode
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleExit}
        className="h-7 px-3 text-amber-950 hover:bg-amber-600 hover:text-amber-950 font-semibold"
      >
        <X className="w-4 h-4 mr-1" />
        Exit
      </Button>
    </div>
  );
}
