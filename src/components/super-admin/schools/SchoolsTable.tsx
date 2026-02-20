import { memo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Building2, MapPin, Phone, Mail, Pencil, Trash2, Eye, ExternalLink, Copy } from 'lucide-react';
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

interface SchoolsTableProps {
  schools: School[];
  onEdit: (school: School) => void;
  onDelete: (school: School) => void;
  onImpersonate?: (school: School) => void;
}

export const SchoolsTable = memo(function SchoolsTable({ 
  schools, 
  onEdit, 
  onDelete,
  onImpersonate,
}: SchoolsTableProps) {
  const handleCopyUrl = (code: string) => {
    navigator.clipboard.writeText(`https://${code}.${BASE_DOMAIN}`);
    toast.success('Subdomain URL copied!');
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[28%]">School Name</TableHead>
          <TableHead className="w-[12%]">Code</TableHead>
          <TableHead className="w-[22%]">Subdomain</TableHead>
          <TableHead className="w-[13%]">City</TableHead>
          <TableHead className="w-[25%] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {schools.map((school) => {
          const subdomainUrl = `https://${school.code}.${BASE_DOMAIN}`;
          return (
            <TableRow key={school.id}>
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
                  <span className="text-xs font-mono text-muted-foreground truncate max-w-[140px]">{school.code}.{BASE_DOMAIN}</span>
                  <button onClick={() => handleCopyUrl(school.code)} className="text-muted-foreground hover:text-foreground shrink-0" title="Copy URL">
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
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
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
