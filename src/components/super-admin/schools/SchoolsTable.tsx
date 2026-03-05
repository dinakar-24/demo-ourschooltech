import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Building2, MapPin, Pencil, Trash2, Eye, ExternalLink, Copy, Users } from 'lucide-react';
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

interface SchoolsTableProps {
  schools: School[];
  onEdit: (school: School) => void;
  onDelete: (school: School) => void;
  onImpersonate?: (school: School) => void;
  onToggleStatus?: (school: School) => void;
  isTogglingId?: string | null;
}

export const SchoolsTable = memo(function SchoolsTable({ 
  schools, 
  onEdit, 
  onDelete,
  onImpersonate,
  onToggleStatus,
  isTogglingId,
}: SchoolsTableProps) {
  const navigate = useNavigate();
  const handleCopyUrl = (subdomain: string) => {
    navigator.clipboard.writeText(`https://${subdomain}.${BASE_DOMAIN}`);
    toast.success('Subdomain URL copied!');
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[26%]">School Name</TableHead>
          <TableHead className="w-[10%]">Code</TableHead>
          <TableHead className="w-[20%]">Subdomain</TableHead>
          <TableHead className="w-[12%]">City</TableHead>
          <TableHead className="w-[8%] text-center">Status</TableHead>
          <TableHead className="w-[24%] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {schools.map((school) => {
          const subdomainUrl = `https://${school.subdomain}.${BASE_DOMAIN}`;
          const isActive = school.is_active !== false;
          return (
            <TableRow key={school.id} className={!isActive ? 'opacity-60' : ''}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
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
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{school.name}</p>
                      {(school as any).primary_color && (
                        <div className="flex gap-0.5 shrink-0">
                          <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: (school as any).primary_color }} title="Primary" />
                          <div className="w-3 h-3 rounded-full border" style={{ backgroundColor: (school as any).accent_color || '#E69500' }} title="Accent" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{school.address}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{school.code}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono text-muted-foreground truncate max-w-[140px]">{school.subdomain}.{BASE_DOMAIN}</span>
                  <button onClick={() => handleCopyUrl(school.subdomain)} className="text-muted-foreground hover:text-foreground shrink-0" title="Copy URL">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <a href={subdomainUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary shrink-0" title="Open subdomain">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{school.city}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Switch
                  checked={isActive}
                  disabled={isTogglingId === school.id}
                  onCheckedChange={() => onToggleStatus?.(school)}
                  aria-label={isActive ? 'Disable school' : 'Enable school'}
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/super-admin/schools/${school.id}`)}
                    className="h-8 px-2 text-xs"
                  >
                    <Users className="w-3.5 h-3.5 mr-1" />
                    Users
                  </Button>
                  {onImpersonate && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onImpersonate(school)}
                      className="h-8 px-2 text-xs"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      View as Admin
                    </Button>
                  )}
                  <Button variant="ghost" size="icon-sm" onClick={() => onEdit(school)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(school)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
});
