import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useOnlineClasses } from '@/hooks/useOnlineClasses';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Video, ExternalLink, Clock, Calendar, User } from 'lucide-react';
import { format, isFuture } from 'date-fns';
import { EmptyState } from '@/components/ui/data-states';
import { Loader2 } from 'lucide-react';

export default function StudentOnlineClasses() {
  const { data: classes = [], isLoading } = useOnlineClasses();

  const upcoming = classes.filter(c => c.status === 'scheduled' && isFuture(new Date(c.scheduled_at)));
  const past = classes.filter(c => c.status !== 'scheduled' || !isFuture(new Date(c.scheduled_at)));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Online Classes</h1>
          <p className="text-sm text-muted-foreground">View and join your virtual classes</p>
        </div>

        {isLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : classes.length === 0 ? (
          <EmptyState icon={Video} title="No online classes" description="No online classes scheduled yet." />
        ) : (
          <>
            {upcoming.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Upcoming Classes</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {upcoming.map(cls => (
                    <Card key={cls.id}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Video className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold">{cls.title}</h3>
                          </div>
                          <Badge variant="outline" className="capitalize">{cls.platform.replace('_', ' ')}</Badge>
                        </div>
                        {cls.subject && <p className="text-sm text-muted-foreground">{cls.subject}</p>}
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{format(new Date(cls.scheduled_at), 'dd MMM yyyy, hh:mm a')}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{cls.duration_minutes} min</span>
                        </div>
                        {cls.teacher && <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" />{cls.teacher.full_name}</p>}
                        {cls.meeting_url && (
                          <Button className="w-full gap-2" asChild>
                            <a href={cls.meeting_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" />Join Class</a>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-muted-foreground">Past Classes</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {past.map(cls => (
                    <Card key={cls.id} className="opacity-70">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-muted-foreground" />
                          <h3 className="font-medium">{cls.title}</h3>
                          <Badge variant="secondary" className="ml-auto capitalize text-xs">{cls.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{format(new Date(cls.scheduled_at), 'dd MMM yyyy, hh:mm a')}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
