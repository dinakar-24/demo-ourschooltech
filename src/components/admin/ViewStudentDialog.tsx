import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { Phone, Mail, Calendar, Droplets, Hash, User, MapPin, X } from 'lucide-react';
import type { Student } from '@/hooks/useStudents';

interface ViewStudentDialogProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground break-words">{value}</p>
      </div>
    </div>
  );
}

function StudentDetails({ student, onClose }: { student: Student; onClose: () => void }) {
  const initials = student.full_name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const avatarUrl = (student as any).avatar_url;

  return (
    <div className="px-4 sm:px-6 pb-6 space-y-5">
      {/* Header with avatar */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <Avatar className="w-20 h-20">
          <AvatarImage src={avatarUrl} alt={student.full_name} />
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h3 className="text-lg font-semibold">{student.full_name}</h3>
          <p className="text-sm text-muted-foreground">{student.admission_number}</p>
          <Badge variant={student.status === 'active' ? 'default' : 'secondary'} className="mt-1.5">
            {student.status || 'active'}
          </Badge>
        </div>
      </div>

      {/* Academic Info */}
      <div className="space-y-1 border rounded-lg p-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Academic Info</p>
        <div className="grid grid-cols-2 gap-x-4">
          <InfoRow icon={Hash} label="Class & Section" value={`${student.class_name} - ${student.section}`} />
          <InfoRow icon={Hash} label="Roll Number" value={student.roll_number?.toString() || '-'} />
        </div>
        <InfoRow icon={Calendar} label="Date of Birth" value={student.date_of_birth} />
        <InfoRow icon={User} label="Gender" value={student.gender} />
        <InfoRow icon={Droplets} label="Blood Group" value={(student as any).blood_group} />
      </div>

      {/* Parent / Contact Info */}
      <div className="space-y-1 border rounded-lg p-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Parent / Contact</p>
        <InfoRow icon={User} label="Parent Name" value={student.parent_name} />
        <InfoRow icon={Phone} label="Phone" value={student.parent_phone} />
        <InfoRow icon={Phone} label="Alternate Phone" value={(student as any).alternate_phone} />
        <InfoRow icon={Mail} label="Email" value={student.parent_email} />
        <InfoRow icon={MapPin} label="Address" value={student.address} />
      </div>

      <Button variant="outline" onClick={onClose} className="w-full">Close</Button>
    </div>
  );
}

export function ViewStudentDialog({ student, open, onOpenChange }: ViewStudentDialogProps) {
  const isMobile = useIsMobile();

  if (!student) return null;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90dvh] bg-background">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Student Details</DrawerTitle>
          </DrawerHeader>
          <div data-vaul-no-drag className="overflow-y-auto flex-1 min-h-0 bg-background">
            <StudentDetails student={student} onClose={() => onOpenChange(false)} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Student Details</DialogTitle>
        </DialogHeader>
        <StudentDetails student={student} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
