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
import { Building2, MapPin, Phone, Mail, Pencil, Trash2 } from 'lucide-react';

interface School {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string | null;
  email: string | null;
  logo: string | null;
  created_at: string;
}

interface SchoolsTableProps {
  schools: School[];
  onEdit: (school: School) => void;
  onDelete: (id: string) => void;
}

export const SchoolsTable = memo(function SchoolsTable({ 
  schools, 
  onEdit, 
  onDelete 
}: SchoolsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[35%]">School Name</TableHead>
          <TableHead className="w-[15%]">Code</TableHead>
          <TableHead className="w-[15%]">City</TableHead>
          <TableHead className="w-[25%]">Contact</TableHead>
          <TableHead className="w-[10%] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {schools.map((school) => (
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
                  <p className="font-medium truncate">{school.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{school.address}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{school.code}</span>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{school.city}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                {school.phone && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{school.phone}</span>
                  </div>
                )}
                {school.email && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{school.email}</span>
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon-sm" onClick={() => onEdit(school)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDelete(school.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
});
