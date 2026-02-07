import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Bell,
  Edit,
  Trash2,
  Send,
  Calendar,
  Users,
  Loader2,
  Megaphone,
  Eye,
  EyeOff,
} from 'lucide-react';
import { 
  useAnnouncements, 
  useAnnouncementStats,
  useCreateAnnouncement, 
  useUpdateAnnouncement, 
  useDeleteAnnouncement,
  useToggleAnnouncement,
  AnnouncementFormData,
  Announcement 
} from '@/hooks/useAnnouncements';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const AVAILABLE_ROLES: { value: AppRole; label: string }[] = [
  { value: 'teacher', label: 'Teachers' },
  { value: 'parent', label: 'Parents' },
  { value: 'student', label: 'Students' },
];

export default function AnnouncementsPage() {
  const { data: announcementsResult, isLoading } = useAnnouncements();
  const announcements = announcementsResult?.data || [];
  const { data: stats } = useAnnouncementStats();
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const deleteAnnouncementMutation = useDeleteAnnouncement();
  const toggleAnnouncement = useToggleAnnouncement();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    content: '',
    target_roles: [],
    expires_at: '',
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      target_roles: [],
      expires_at: '',
      is_active: true,
    });
  };

  const toggleRole = (role: AppRole) => {
    setFormData(prev => ({
      ...prev,
      target_roles: prev.target_roles.includes(role)
        ? prev.target_roles.filter(r => r !== role)
        : [...prev.target_roles, role]
    }));
  };

  const handleCreate = async (publish: boolean) => {
    if (!formData.title || !formData.content || formData.target_roles.length === 0) {
      return;
    }
    await createAnnouncement.mutateAsync({
      ...formData,
      is_active: publish,
    });
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEdit = async () => {
    if (!selectedAnnouncement) return;
    await updateAnnouncement.mutateAsync({ id: selectedAnnouncement.id, ...formData });
    setIsEditDialogOpen(false);
    setSelectedAnnouncement(null);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedAnnouncement) return;
    await deleteAnnouncementMutation.mutateAsync(selectedAnnouncement.id);
    setDeleteDialogOpen(false);
    setSelectedAnnouncement(null);
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await toggleAnnouncement.mutateAsync({ id, isActive: !isActive });
  };

  const openEditDialog = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      target_roles: (announcement.target_roles || []) as AppRole[],
      expires_at: announcement.expires_at ? announcement.expires_at.split('T')[0] : '',
      is_active: announcement.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setDeleteDialogOpen(true);
  };

  const FormFields = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input 
          placeholder="Enter announcement title" 
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Message</Label>
        <Textarea 
          placeholder="Enter announcement message..." 
          className="min-h-[120px]"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Expires On (Optional)</Label>
          <Input 
            type="date" 
            value={formData.expires_at}
            onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Target Audience</Label>
        <div className="flex gap-4 pt-2">
          {AVAILABLE_ROLES.map(role => (
            <div key={role.value} className="flex items-center gap-2">
              <Checkbox 
                id={role.value}
                checked={formData.target_roles.includes(role.value)}
                onCheckedChange={() => toggleRole(role.value)}
              />
              <label htmlFor={role.value} className="text-sm cursor-pointer">
                {role.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout title="Announcements">
      <div className="space-y-6 animate-fade-up">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Announcements</p>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? <Skeleton className="h-8 w-12" /> : stats?.total || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Published</p>
              <p className="text-2xl font-bold text-success">
                {isLoading ? <Skeleton className="h-8 w-12" /> : stats?.active || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Draft</p>
              <p className="text-2xl font-bold text-warning">
                {isLoading ? <Skeleton className="h-8 w-12" /> : stats?.inactive || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold text-primary">
                {isLoading ? <Skeleton className="h-8 w-12" /> : stats?.thisMonth || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Announcement</DialogTitle>
              </DialogHeader>
              <FormFields />
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleCreate(false)}
                  disabled={createAnnouncement.isPending}
                >
                  {createAnnouncement.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save as Draft
                </Button>
                <Button 
                  onClick={() => handleCreate(true)}
                  disabled={createAnnouncement.isPending}
                >
                  {createAnnouncement.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Send className="w-4 h-4 mr-2" />
                  Publish
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Announcements List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Announcements</h3>
              <p className="text-muted-foreground mb-4">
                Create your first announcement to communicate with your school community.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Announcement
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id}>
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        announcement.is_active ? 'bg-success/10' : 'bg-muted'
                      }`}>
                        <Bell className={`w-5 h-5 ${
                          announcement.is_active ? 'text-success' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold">{announcement.title}</h3>
                          {announcement.is_active ? (
                            <Badge className="bg-success/10 text-success">Published</Badge>
                          ) : (
                            <Badge variant="outline">Draft</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {announcement.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(announcement.created_at), 'dd MMM yyyy')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {announcement.target_roles?.map(r => 
                              r.charAt(0).toUpperCase() + r.slice(1)
                            ).join(', ') || 'No audience selected'}
                          </div>
                          {announcement.expires_at && (
                            <div className="flex items-center gap-1">
                              Expires: {format(new Date(announcement.expires_at), 'dd MMM yyyy')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon-sm"
                        onClick={() => handleToggle(announcement.id, announcement.is_active)}
                        title={announcement.is_active ? 'Unpublish' : 'Publish'}
                      >
                        {announcement.is_active ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon-sm"
                        onClick={() => openEditDialog(announcement)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon-sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => openDeleteDialog(announcement)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
          </DialogHeader>
          <FormFields />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={updateAnnouncement.isPending}>
              {updateAnnouncement.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedAnnouncement?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
