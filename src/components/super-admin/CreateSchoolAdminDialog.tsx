import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { UserPlus, Building2, User, Mail, Lock, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateSchoolUser } from '@/hooks/useCreateSchoolUser';

interface School {
  id: string;
  name: string;
  code: string;
}

interface CreateSchoolAdminDialogProps {
  schools: School[];
  onSuccess: () => void;
}

const validatePassword = (password: string): string | null => {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Must contain an uppercase letter';
  if (!/[a-z]/.test(password)) return 'Must contain a lowercase letter';
  if (!/[0-9]/.test(password)) return 'Must contain a number';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Must contain a special character';
  return null;
};

export function CreateSchoolAdminDialog({ schools, onSuccess }: CreateSchoolAdminDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '', password: '', fullName: '', schoolId: '', phone: '',
  });

  const { createUser, isCreating } = useCreateSchoolUser();

  const resetForm = () => setFormData({ email: '', password: '', fullName: '', schoolId: '', phone: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.schoolId) { toast.error('Please select a school'); return; }
    const passwordError = validatePassword(formData.password);
    if (passwordError) { toast.error(passwordError); return; }

    const success = await createUser({
      email: formData.email,
      password: formData.password,
      full_name: formData.fullName,
      role: 'school_admin',
      school_id: formData.schoolId,
      phone: formData.phone || undefined,
    });

    if (success) {
      setIsOpen(false);
      resetForm();
      onSuccess();
    }
  };

  const update = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto gap-2">
          <UserPlus className="w-4 h-4" />
          Add School Admin
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto p-0">
        <div className="p-6 pb-2">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg">Add School Admin</DialogTitle>
                <DialogDescription className="text-sm">
                  Create a new administrator account for a school
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="admin-fullName" className="text-sm font-medium">
              Full Name <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="admin-fullName"
                value={formData.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                placeholder="Enter full name"
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="admin-email" className="text-sm font-medium">
              Email <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="admin-email"
                type="email"
                value={formData.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="Enter email address"
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="admin-phone" className="text-sm font-medium">
              Phone Number
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="admin-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="Enter phone number (optional)"
                className="pl-10"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="admin-password" className="text-sm font-medium">
              Password <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="admin-password"
                type="password"
                value={formData.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="Enter a strong password"
                className="pl-10"
                minLength={8}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground pl-1">
              Min 8 characters with uppercase, lowercase, number & special character
            </p>
          </div>

          {/* Assign to School */}
          <div className="space-y-2">
            <Label htmlFor="admin-school" className="text-sm font-medium">
              Assign to School <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.schoolId} onValueChange={(v) => update('schoolId', v)}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select a school" />
              </SelectTrigger>
              <SelectContent>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="font-medium">{school.name}</span>
                      <span className="text-xs text-muted-foreground">({school.code})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating…' : 'Create Admin'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
