import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Pencil, Trash2, Eye, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';

const BASE_DOMAIN = 'ourschooltech.com';

interface School {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string | null;
  email: string | null;
  logo: string | null;
  primary_color?: string | null;
  accent_color?: string | null;
  created_at: string;
}

interface SchoolCardProps {
  school: School;
  onEdit: (school: School) => void;
  onDelete: (school: School) => void;
  onImpersonate?: (school: School) => void;
}

export const SchoolCard = memo(function SchoolCard({ 
  school, 
  onEdit, 
  onDelete,
  onImpersonate,
}: SchoolCardProps) {
  const subdomainUrl = `https://${school.code}.${BASE_DOMAIN}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(subdomainUrl);
    toast.success('Subdomain URL copied!');
  };

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border bg-card">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
          {school.logo ? (
            <img 
              src={school.logo} 
              alt={`${school.name} logo`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <Building2 className="w-6 h-6 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{school.name}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">{school.code}</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {school.city}
            </span>
            {school.primary_color && (
              <div className="flex gap-0.5 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: school.primary_color }} />
                <div className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: school.accent_color || '#E69500' }} />
              </div>
            )}
          </div>
          {/* Subdomain URL */}
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-muted-foreground font-mono truncate">{subdomainUrl}</span>
            <button onClick={handleCopyUrl} className="text-muted-foreground hover:text-foreground shrink-0">
              <Copy className="w-3 h-3" />
            </button>
            <a href={subdomainUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary shrink-0">
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
      {/* Action buttons row */}
      <div className="flex gap-2">
        {onImpersonate && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onImpersonate(school)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            View as Admin
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => onEdit(school)} className="px-3">
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="px-3 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
          onClick={() => onDelete(school)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});