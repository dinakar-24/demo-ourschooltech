import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Student {
  id: string;
  full_name: string;
  admission_number: string;
  class_name: string;
  section: string;
  roll_number: number | null;
  parent_name: string | null;
  parent_phone: string | null;
  status: string | null;
  user_id: string | null;
  avatar_url?: string | null;
  profiles?: { avatar_url: string | null } | null;
}

interface StudentCardProps {
  student: Student;
  onView: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (id: string, userId: string | null) => void;
}

export function StudentCard({ student, onView, onEdit, onDelete }: StudentCardProps) {
  const avatarUrl = student.avatar_url || (student as any).profiles?.avatar_url;
  const initials = student.full_name.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <div className="p-4 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => onView(student)}>
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarImage src={avatarUrl} alt={student.full_name} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{student.full_name}</p>
            <p className="text-xs text-muted-foreground">{student.admission_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className="text-[10px] h-[18px] px-1.5">
            {student.status || 'active'}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(student)}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(student)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => onDelete(student.id, student.user_id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <div>
          <span className="text-muted-foreground">Class: </span>
          <span className="font-medium">{student.class_name} - {student.section}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Roll: </span>
          <span className="font-medium">{student.roll_number || '-'}</span>
        </div>
        {student.parent_name && (
          <div className="col-span-2">
            <span className="text-muted-foreground">Parent: </span>
            <span className="font-medium">{student.parent_name}</span>
          </div>
        )}
        {student.parent_phone && (
          <div className="col-span-2 flex items-center gap-1 text-muted-foreground">
            <Phone className="w-3 h-3" />
            <span>{student.parent_phone}</span>
          </div>
        )}
      </div>
    </div>
  );
}
