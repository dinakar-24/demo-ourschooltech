import { useState, useRef, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, Upload, Trash2, ImageIcon, ZoomIn, X, Loader2 } from 'lucide-react';
import { useClasses } from '@/hooks/useClasses';
import { useSections } from '@/hooks/useSections';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export default function TimetablePage() {
  const { data: classes } = useClasses();
  const schoolId = useEffectiveSchoolId();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [showFullscreen, setShowFullscreen] = useState(false);

  const classNames = classes?.map(c => c.name) || [];
  const selectedClassData = classes?.find(c => c.name === selectedClass);
  const { data: dynamicSections } = useSections(selectedClass);
  const classSections = selectedClassData?.sections.map(s => s.name) || [];
  const sections = classSections.length > 0 ? classSections : (dynamicSections || ['A']);

  // Auto-select first section when class changes
  useEffect(() => {
    if (sections.length > 0 && !sections.includes(selectedSection)) {
      setSelectedSection(sections[0]);
    }
  }, [selectedClass, sections]);

  // Fetch timetable image for selected class/section
  const { data: timetableImage, isLoading: loadingImage } = useQuery({
    queryKey: ['timetable-image', schoolId, selectedClass, selectedSection],
    queryFn: async () => {
      if (!schoolId || !selectedClass) return null;
      const { data, error } = await supabase
        .from('timetable_images' as any)
        .select('*')
        .eq('school_id', schoolId)
        .eq('class_name', selectedClass)
        .eq('section', selectedSection)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as { id: string; image_url: string; updated_at: string } | null;
    },
    enabled: !!schoolId && !!selectedClass,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!schoolId || !selectedClass) throw new Error('Select a class first');

      const ext = file.name.split('.').pop();
      const path = `${schoolId}/${selectedClass}-${selectedSection}.${ext}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('timetables')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('timetables').getPublicUrl(path);
      const imageUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Upsert to DB
      const { error: dbError } = await supabase
        .from('timetable_images' as any)
        .upsert({
          school_id: schoolId,
          class_name: selectedClass,
          section: selectedSection,
          image_url: imageUrl,
        } as any, { onConflict: 'school_id,class_name,section' });
      if (dbError) throw dbError;

      return imageUrl;
    },
    onSuccess: () => {
      toast.success('Timetable uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['timetable-image'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Upload failed');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!schoolId || !selectedClass || !timetableImage) throw new Error('Nothing to delete');

      // Delete from storage
      const path = `${schoolId}/${selectedClass}-${selectedSection}`;
      // List files matching this prefix to find exact file
      const { data: files } = await supabase.storage.from('timetables').list(schoolId, {
        search: `${selectedClass}-${selectedSection}`,
      });
      if (files?.length) {
        await supabase.storage.from('timetables').remove(
          files.map(f => `${schoolId}/${f.name}`)
        );
      }

      // Delete from DB
      const { error } = await supabase
        .from('timetable_images' as any)
        .delete()
        .eq('id', (timetableImage as any).id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Timetable removed');
      queryClient.invalidateQueries({ queryKey: ['timetable-image'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Delete failed');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
      return;
    }

    uploadMutation.mutate(file);
    e.target.value = '';
  };

  const isUploading = uploadMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  return (
    <AdminLayout title="Timetable">
      <div className="space-y-5 animate-fade-up pb-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
              {classNames.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              {sections.map(s => (
                <SelectItem key={s} value={s}>Section {s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!selectedClass ? (
          <Card className="p-12 text-center">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Select a Class</h3>
            <p className="text-muted-foreground text-sm">
              Choose a class and section above to view or upload the timetable.
            </p>
          </Card>
        ) : loadingImage ? (
          <Card className="p-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
          </Card>
        ) : timetableImage ? (
          /* Show uploaded timetable */
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative group">
                <img
                  src={(timetableImage as any).image_url}
                  alt={`Timetable for ${selectedClass} - Section ${selectedSection}`}
                  className="w-full h-auto cursor-pointer"
                  onClick={() => setShowFullscreen(true)}
                />
                {/* Overlay actions */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="shadow-lg h-9 w-9"
                    onClick={() => setShowFullscreen(true)}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between border-t">
                <div>
                  <p className="font-semibold text-sm">{selectedClass} - Section {selectedSection}</p>
                  <p className="text-xs text-muted-foreground">
                    Updated {new Date((timetableImage as any).updated_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Upload className="w-4 h-4 mr-1.5" />}
                    Replace
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate()}
                    disabled={isDeleting}
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
                    Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Upload prompt */
          <Card
            className="border-2 border-dashed cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="p-10 text-center">
              {isUploading ? (
                <>
                  <Loader2 className="w-12 h-12 mx-auto text-primary mb-4 animate-spin" />
                  <h3 className="text-lg font-semibold mb-1">Uploading...</h3>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">Upload Timetable</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a photo or image of the timetable for {selectedClass} - Section {selectedSection}
                  </p>
                  <Button size="sm" variant="outline" className="pointer-events-none">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Image
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">Supports JPG, PNG, WebP • Max 10MB</p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Fullscreen viewer */}
        <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-auto">
            <button
              onClick={() => setShowFullscreen(false)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
            {timetableImage && (
              <img
                src={(timetableImage as any).image_url}
                alt="Timetable"
                className="w-full h-auto"
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
