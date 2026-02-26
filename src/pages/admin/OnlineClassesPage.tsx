import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Video, Edit2, Trash2, ExternalLink, Search, Loader2 } from 'lucide-react';
import { useOnlineClasses, useCreateOnlineClass, useUpdateOnlineClass, useDeleteOnlineClass, OnlineClass } from '@/hooks/useOnlineClasses';
import { useTeachers } from '@/hooks/useTeachers';
import { useClasses } from '@/hooks/useClasses';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { format } from 'date-fns';
import { EmptyState } from '@/components/ui/data-states';

const platforms = [
  { value: 'zoom', label: 'Zoom' },
  { value: 'google_meet', label: 'Google Meet' },
  { value: 'ms_teams', label: 'Microsoft Teams' },
  { value: 'custom', label: 'Custom' },
];

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  live: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const defaultForm = {
  title: '',
  description: '',
  platform: 'zoom',
  meeting_url: '',
  meeting_id: '',
  password: '',
  class_name: '',
  section: '',
  subject: '',
  teacher_id: '',
  scheduled_at: '',
  duration_minutes: 60,
  status: 'scheduled',
};

export default function OnlineClassesPage() {
  const schoolId = useEffectiveSchoolId();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<OnlineClass | null>(null);
  const [form, setForm] = useState(defaultForm);

  const { data: classes = [], isLoading } = useOnlineClasses({ status: statusFilter });
  const { data: teacherData } = useTeachers();
  const { data: classData } = useClasses();
  const createMutation = useCreateOnlineClass();
  const updateMutation = useUpdateOnlineClass();
  const deleteMutation = useDeleteOnlineClass();

  const teachers = Array.isArray(teacherData) ? teacherData : (teacherData as any)?.teachers || [];
  const schoolClasses = classData || [];

  const filtered = classes.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.subject?.toLowerCase().includes(search.toLowerCase()) ||
    c.class_name?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingClass(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (cls: OnlineClass) => {
    setEditingClass(cls);
    setForm({
      title: cls.title,
      description: cls.description || '',
      platform: cls.platform,
      meeting_url: cls.meeting_url || '',
      meeting_id: cls.meeting_id || '',
      password: cls.password || '',
      class_name: cls.class_name || '',
      section: cls.section || '',
      subject: cls.subject || '',
      teacher_id: cls.teacher_id || '',
      scheduled_at: cls.scheduled_at ? format(new Date(cls.scheduled_at), "yyyy-MM-dd'T'HH:mm") : '',
      duration_minutes: cls.duration_minutes,
      status: cls.status,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title || !form.scheduled_at) return;
    const payload = {
      ...form,
      school_id: schoolId,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      teacher_id: form.teacher_id || null,
      description: form.description || null,
      meeting_url: form.meeting_url || null,
      meeting_id: form.meeting_id || null,
      password: form.password || null,
      class_name: form.class_name || null,
      section: form.section || null,
      subject: form.subject || null,
      created_by: null,
    };

    if (editingClass) {
      updateMutation.mutate({ id: editingClass.id, ...payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createMutation.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Online Classes</h1>
            <p className="text-sm text-muted-foreground">Manage virtual classes and meeting links</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Schedule Class
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search classes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Video} title="No online classes" description="Schedule your first virtual class to get started." />
        ) : (
          <div className="rounded-lg border bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(cls => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-primary" />
                        {cls.title}
                      </div>
                      {cls.subject && <p className="text-xs text-muted-foreground">{cls.subject}</p>}
                    </TableCell>
                    <TableCell className="capitalize">{cls.platform.replace('_', ' ')}</TableCell>
                    <TableCell>{cls.class_name}{cls.section ? ` - ${cls.section}` : ''}</TableCell>
                    <TableCell>{cls.teacher?.full_name || '—'}</TableCell>
                    <TableCell>{format(new Date(cls.scheduled_at), 'dd MMM yyyy, hh:mm a')}</TableCell>
                    <TableCell>{cls.duration_minutes} min</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[cls.status] || ''}>{cls.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {cls.meeting_url && (
                          <Button variant="ghost" size="icon-sm" asChild>
                            <a href={cls.meeting_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" /></a>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(cls)}><Edit2 className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => deleteMutation.mutate(cls.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingClass ? 'Edit Online Class' : 'Schedule Online Class'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Maths - Chapter 5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Platform</Label>
                <Select value={form.platform} onValueChange={v => setForm(f => ({ ...f, platform: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {platforms.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Duration (min)</Label>
                <Input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 60 }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Meeting URL</Label>
              <Input value={form.meeting_url} onChange={e => setForm(f => ({ ...f, meeting_url: e.target.value }))} placeholder="https://zoom.us/j/..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Meeting ID</Label>
                <Input value={form.meeting_id} onChange={e => setForm(f => ({ ...f, meeting_id: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Password</Label>
                <Input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Scheduled At *</Label>
              <Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Class</Label>
                <Select value={form.class_name} onValueChange={v => setForm(f => ({ ...f, class_name: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {schoolClasses.map((c: any) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Section</Label>
                <Input value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} placeholder="A, B, C..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Subject</Label>
                <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Mathematics" />
              </div>
              <div className="grid gap-2">
                <Label>Teacher</Label>
                <Select value={form.teacher_id} onValueChange={v => setForm(f => ({ ...f, teacher_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                  <SelectContent>
                    {teachers.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {editingClass && (
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional notes..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingClass ? 'Save Changes' : 'Create Class'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
