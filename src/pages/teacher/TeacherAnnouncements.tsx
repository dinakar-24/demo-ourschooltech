import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function TeacherAnnouncements() {
  const schoolId = useEffectiveSchoolId();

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['teacher-announcements', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(25);
      if (error) throw error;
      return data?.filter(a =>
        !a.target_roles || a.target_roles.length === 0 || a.target_roles.includes('teacher')
      ) || [];
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <MobileLayout title="Announcements" showBack>
      <div className="p-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-5 w-32 mb-2" /><Skeleton className="h-4 w-full" /></CardContent></Card>
          ))
        ) : announcements?.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Bell className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <h3 className="font-semibold text-foreground">No Announcements</h3>
            <p className="text-sm text-muted-foreground">Nothing new right now</p>
          </div>
        ) : (
          announcements?.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-sm truncate">{a.title}</h4>
                      {a.target_classes && a.target_classes.length > 0 && (
                        <Badge variant="outline" className="text-[10px] shrink-0 ml-2">{a.target_classes.join(', ')}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{a.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">{format(new Date(a.created_at), 'dd MMM yyyy, hh:mm a')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </MobileLayout>
  );
}
