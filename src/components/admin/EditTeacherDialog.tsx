import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, X } from 'lucide-react';
import { useUpdateTeacher, Teacher } from '@/hooks/useTeachers';
import { toast } from 'sonner';

const SUBJECTS = [
  'Mathematics', 'Science', 'English', 'Hindi', 'Social Studies',
  'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Physical Education',
  'Sanskrit', 'Economics', 'Accountancy', 'Business Studies', 'History', 'Geography', 'Art',
];

interface EditTeacherDialogProps {
  teacher: Teacher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTeacherDialog({ teacher, open, onOpenChange }: EditTeacherDialogProps) {
  const updateTeacher = useUpdateTeacher();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    qualification: '',
    subjects: [] as string[],
    classes: [] as string[],
    joining_date: '',
  });

  const [subjectInput, setSubjectInput] = useState('');
  const [classInput, setClassInput] = useState('');

  useEffect(() => {
    if (teacher) {
      setForm({
        full_name: teacher.full_name,
        email: teacher.email || '',
        phone: teacher.phone || '',
        qualification: teacher.qualification || '',
        subjects: teacher.subjects || [],
        classes: teacher.classes || [],
        joining_date: teacher.joining_date || '',
      });
    }
  }, [teacher]);

  const toggleSubject = (sub: string) => {
    setForm(f => ({
      ...f,
      subjects: f.subjects.includes(sub)
        ? f.subjects.filter(s => s !== sub)
        : [...f.subjects, sub],
    }));
  };

  const addCustomSubject = () => {
    if (subjectInput.trim() && !form.subjects.includes(subjectInput.trim())) {
      setForm(f => ({ ...f, subjects: [...f.subjects, subjectInput.trim()] }));
      setSubjectInput('');
    }
  };

  const addClass = () => {
    if (classInput.trim() && !form.classes.includes(classInput.trim())) {
      setForm(f => ({ ...f, classes: [...f.classes, classInput.trim()] }));
      setClassInput('');
    }
  };

  const handleSave = async () => {
    if (!teacher || !form.full_name) {
      toast.error('Name is required');
      return;
    }

    await updateTeacher.mutateAsync({
      id: teacher.id,
      full_name: form.full_name,
      email: form.email || null,
      phone: form.phone || null,
      qualification: form.qualification || null,
      subjects: form.subjects.length > 0 ? form.subjects : null,
      classes: form.classes.length > 0 ? form.classes : null,
      joining_date: form.joining_date || null,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Teacher</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Full Name *</Label>
              <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Qualification</Label>
              <Input value={form.qualification} onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Joining Date</Label>
              <Input type="date" value={form.joining_date} onChange={e => setForm(f => ({ ...f, joining_date: e.target.value }))} />
            </div>
          </div>

          {/* Subjects */}
          <div className="space-y-2">
            <Label>Subjects</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {SUBJECTS.slice(0, 10).map(sub => (
                <Badge
                  key={sub}
                  variant={form.subjects.includes(sub) ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  onClick={() => toggleSubject(sub)}
                >
                  {sub}
                </Badge>
              ))}
            </div>
            {form.subjects.filter(s => !SUBJECTS.slice(0, 10).includes(s)).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.subjects.filter(s => !SUBJECTS.slice(0, 10).includes(s)).map(sub => (
                  <Badge key={sub} variant="default" className="text-xs">
                    {sub}
                    <button onClick={() => toggleSubject(sub)} className="ml-1"><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Add custom subject"
                value={subjectInput}
                onChange={e => setSubjectInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomSubject())}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={addCustomSubject}>Add</Button>
            </div>
          </div>

          {/* Classes */}
          <div className="space-y-2">
            <Label>Assigned Classes</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.classes.map(cls => (
                <Badge key={cls} variant="secondary" className="text-xs">
                  {cls}
                  <button onClick={() => setForm(f => ({ ...f, classes: f.classes.filter(c => c !== cls) }))} className="ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Class 10-A"
                value={classInput}
                onChange={e => setClassInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addClass())}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={addClass}>Add</Button>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateTeacher.isPending}>
            {updateTeacher.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
