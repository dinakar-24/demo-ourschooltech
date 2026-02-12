import { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, Download, ZoomIn, X, ImageOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { useClasses } from '@/hooks/useClasses';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function TeacherTimetable() {
  const { user } = useAuth();
  const schoolId = useEffectiveSchoolId();
  const { data: classes } = useClasses();
  const [showFullscreen, setShowFullscreen] = useState(false);

  // Default to teacher's first assigned class if available
  const classNames = classes?.map(c => c.name) || [];
  const teacherClasses = classNames; // show all available classes

  const [selectedClass, setSelectedClass] = useState(teacherClasses[0] || '');
  const [selectedSection, setSelectedSection] = useState('A');

  const selectedClassData = classes?.find(c => c.name === selectedClass);
  const sections = selectedClassData?.sections.map(s => s.name) || ['A'];

  const { data: timetableImage, isLoading } = useQuery({
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

  const handleDownload = async () => {
    if (!timetableImage) return;
    try {
      const response = await fetch((timetableImage as any).image_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Timetable-${selectedClass}-${selectedSection}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open((timetableImage as any).image_url, '_blank');
    }
  };

  return (
    <MobileLayout title="Timetable" showBack>
      <div className="p-4 space-y-4">
        {/* Class selector */}
        <div className="flex gap-2">
          <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedSection('A'); }}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select Class" />
            </SelectTrigger>
            <SelectContent>
              {classNames.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              {sections.map(s => (
                <SelectItem key={s} value={s}>Section {s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* My Classes chips */}
        {teacherClasses.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">My Classes</p>
            <div className="flex flex-wrap gap-2">
              {teacherClasses.map(cls => (
                <Badge
                  key={cls}
                  variant={cls === selectedClass ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => { setSelectedClass(cls); setSelectedSection('A'); }}
                >
                  {cls}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {!selectedClass ? (
          <Card className="p-10 text-center">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">Select a Class</h3>
            <p className="text-sm text-muted-foreground">
              Choose a class above to view its timetable.
            </p>
          </Card>
        ) : isLoading ? (
          <Card>
            <CardContent className="p-4">
              <Skeleton className="w-full h-64 rounded-lg" />
            </CardContent>
          </Card>
        ) : timetableImage ? (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative group">
                <img
                  src={(timetableImage as any).image_url}
                  alt={`Timetable for ${selectedClass} - Section ${selectedSection}`}
                  className="w-full h-auto cursor-pointer"
                  onClick={() => setShowFullscreen(true)}
                />
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
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
              <div className="p-3 border-t flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Updated {new Date((timetableImage as any).updated_at).toLocaleDateString('en-IN')}
                </p>
                <Button size="sm" variant="outline" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-1.5" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="p-10 text-center">
            <ImageOff className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">No Timetable Available</h3>
            <p className="text-sm text-muted-foreground">
              The timetable for {selectedClass} - Section {selectedSection} hasn't been uploaded yet.
            </p>
          </Card>
        )}
      </div>

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
    </MobileLayout>
  );
}
