import { useState, useRef } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus, Image, Trash2, Upload, Loader2, Eye, EyeOff, Video, X, Calendar, ArrowLeft,
} from 'lucide-react';
import {
  useGalleryAlbums, useGalleryItems, useCreateAlbum, useUpdateAlbum,
  useDeleteAlbum, useUploadGalleryItem, useDeleteGalleryItem, GalleryAlbum,
} from '@/hooks/useGallery';
import { format } from 'date-fns';

export default function GalleryPage() {
  const { data: albums, isLoading } = useGalleryAlbums();
  const createAlbum = useCreateAlbum();
  const updateAlbum = useUpdateAlbum();
  const deleteAlbum = useDeleteAlbum();
  const uploadItem = useUploadGalleryItem();
  const deleteItem = useDeleteGalleryItem();

  const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbum | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteAlbumId, setDeleteAlbumId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', event_date: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: items, isLoading: itemsLoading } = useGalleryItems(selectedAlbum?.id);

  const handleCreate = async () => {
    if (!formData.title) return;
    await createAlbum.mutateAsync({
      title: formData.title,
      description: formData.description || undefined,
      event_date: formData.event_date || undefined,
    });
    setIsCreateOpen(false);
    setFormData({ title: '', description: '', event_date: '' });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedAlbum || !e.target.files) return;
    const files = Array.from(e.target.files);
    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        continue;
      }
      await uploadItem.mutateAsync({ albumId: selectedAlbum.id, file });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTogglePublish = async (album: GalleryAlbum) => {
    await updateAlbum.mutateAsync({ id: album.id, is_published: !album.is_published });
  };

  if (selectedAlbum) {
    return (
      <AdminLayout title={selectedAlbum.title}>
        <div className="space-y-4 animate-fade-up">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setSelectedAlbum(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Albums
            </Button>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleUpload}
              />
              <Button onClick={() => fileInputRef.current?.click()} disabled={uploadItem.isPending}>
                {uploadItem.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Upload
              </Button>
            </div>
          </div>

          {itemsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="aspect-square rounded-lg" />)}
            </div>
          ) : items?.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No photos yet</p>
              <p className="text-sm">Upload photos or videos to this album</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items?.map((item) => (
                <div key={item.id} className="relative group rounded-lg overflow-hidden border border-border">
                  {item.file_type === 'video' ? (
                    <video src={item.file_url} className="w-full aspect-square object-cover" controls />
                  ) : (
                    <img src={item.file_url} alt={item.caption || ''} className="w-full aspect-square object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteItem.mutate(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {item.file_type === 'video' && (
                    <Badge className="absolute top-2 left-2 bg-black/60 text-white text-[10px]">
                      <Video className="w-3 h-3 mr-1" /> Video
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Gallery">
      <div className="space-y-6 animate-fade-up">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Manage photo and video albums</p>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-2" /> New Album</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Album</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input placeholder="e.g. Annual Day 2025" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Textarea placeholder="Brief description..." value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Event Date (Optional)</Label>
                  <Input type="date" value={formData.event_date} onChange={e => setFormData(p => ({ ...p, event_date: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleCreate} disabled={createAlbum.isPending || !formData.title}>
                  {createAlbum.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Album
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-lg" />)}
          </div>
        ) : albums?.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No albums yet</p>
            <p className="text-sm">Create your first album to share school memories</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {albums?.map((album) => (
              <Card key={album.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedAlbum(album)}>
                <div className="relative h-40 bg-muted">
                  {album.cover_image_url ? (
                    <img src={album.cover_image_url} alt={album.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1" onClick={e => e.stopPropagation()}>
                    <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => handleTogglePublish(album)}>
                      {album.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </Button>
                    <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => setDeleteAlbumId(album.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-sm truncate">{album.title}</h3>
                    <Badge variant={album.is_published ? 'default' : 'outline'} className="text-[10px] shrink-0">
                      {album.is_published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  {album.description && <p className="text-xs text-muted-foreground line-clamp-1">{album.description}</p>}
                  {album.event_date && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {format(new Date(album.event_date), 'dd MMM yyyy')}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteAlbumId} onOpenChange={() => setDeleteAlbumId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Album?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the album and all its photos/videos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteAlbumId) { deleteAlbum.mutate(deleteAlbumId); setDeleteAlbumId(null); } }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
