import { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Clock, Download, ZoomIn, X, ImageOff } from 'lucide-react';
import { useStudentProfile } from '@/hooks/useStudentData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function StudentTimetable() {
  const { user } = useAuth();
  const { data: student, isLoading: studentLoading } = useStudentProfile();
  const [showFullscreen, setShowFullscreen] = useState(false);

  const className = student?.class_name || '';
  const section = student?.section || 'A';
  const schoolId = student?.school_id || user?.schoolId || '';

  const { data: timetableImage, isLoading } = useQuery({
    queryKey: ['timetable-image', schoolId, className, section],
    queryFn: async () => {
      if (!schoolId || !className) return null;
      const { data, error } = await supabase
        .from('timetable_images' as any)
        .select('*')
        .eq('school_id', schoolId)
        .eq('class_name', className)
        .eq('section', section)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as { id: string; image_url: string; updated_at: string } | null;
    },
    enabled: !!schoolId && !!className,
  });

  const handleDownload = async () => {
    if (!timetableImage) return;
    try {
      const response = await fetch((timetableImage as any).image_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Timetable-${className}-${section}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // fallback: open in new tab
      window.open((timetableImage as any).image_url, '_blank');
    }
  };

  const loading = studentLoading || isLoading;

  return (
    <MobileLayout title="Timetable" showBack>
      <div className="p-4 space-y-4">
        {/* Class Info */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">My Timetable</h2>
            {student && (
              <p className="text-sm text-muted-foreground">
                {className} - Section {section}
              </p>
            )}
          </div>
          {timetableImage && (
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-1.5" />
              Save
            </Button>
          )}
        </div>

        {loading ? (
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
                  alt={`Timetable for ${className} - Section ${section}`}
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
              <div className="p-3 border-t text-center">
                <p className="text-xs text-muted-foreground">
                  Tap image to view fullscreen • Updated {new Date((timetableImage as any).updated_at).toLocaleDateString('en-IN')}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="p-10 text-center">
            <ImageOff className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">No Timetable Available</h3>
            <p className="text-sm text-muted-foreground">
              Your school admin hasn't uploaded the timetable for {className || 'your class'} yet.
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
