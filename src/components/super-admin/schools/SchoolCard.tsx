import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Building2, MapPin, Pencil, Trash2, Eye, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';

const BASE_DOMAIN = 'ourschooltech.com';

interface School {
  id: string;
  name: string;
  code: string;
  subdomain: string;
  address: string;
  city: string;
  phone: string | null;
  email: string | null;
  logo: string | null;
  is_active?: boolean | null;
  primary_color?: string | null;
  accent_color?: string | null;
  created_at: string;
}

interface SchoolCardProps {
  school: School;
  onEdit: (school: School) => void;
  onDelete: (school: School) => void;
  onImpersonate?: (school: School) => void;
  onToggleStatus?: (school: School) => void;
  isToggling?: boolean;
}

export const SchoolCard = memo(function SchoolCard({ 
  school, 
  onEdit, 
  onDelete,
  onImpersonate,
  onToggleStatus,
  isToggling,
}: SchoolCardProps) {
  const subdomainUrl = `https://${school.subdomain}.${BASE_DOMAIN}`;
  const isActive = school.is_active !== false;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(subdomainUrl);
    toast.success('Subdomain URL copied!');
  };

  return (
    <div className={`flex flex-col gap-3 p-4 rounded-lg border bg-card ${!isActive ? 'opacity-60' : ''}`}>
      {/* Top row: Logo + Info + Toggle */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
          {school.logo ? (
            <img 
              src={school.logo} 
              alt={`${school.name} logo`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <Building2 className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-sm truncate">{school.name}</p>
            <Switch
              checked={isActive}
              disabled={isToggling}
              onCheckedChange={() => onToggleStatus?.(school)}
              aria-label={isActive ? 'Disable school' : 'Enable school'}
              className="shrink-0"
            />
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px] leading-tight">{school.code}</span>
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 shrink-0" />
              {school.city}
            </span>
            {!isActive && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">Disabled</span>
            )}
          </div>
        </div>
      </div>

      {/* Subdomain row */}
      <div className="flex items-center gap-1.5 pl-14">
        <span className="text-[11px] text-muted-foreground font-mono truncate">{school.subdomain}.{BASE_DOMAIN}</span>
        <button onClick={handleCopyUrl} className="text-muted-foreground hover:text-foreground shrink-0" title="Copy">
          <Copy className="w-3 h-3" />
        </button>
        <a href={subdomainUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary shrink-0" title="Open">
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-1 border-t">
        {onImpersonate && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onImpersonate(school)}
            className="flex-1 h-9 text-xs"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            View as Admin
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => onEdit(school)} className="h-9 w-9 p-0">
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
          onClick={() => onDelete(school)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
});
