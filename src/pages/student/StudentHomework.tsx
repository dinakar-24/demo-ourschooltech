import { MobileLayout } from '@/components/layout/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BookOpen, 
  Calendar, 
  Clock,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  BookX,
} from 'lucide-react';
import { useStudentProfile, useStudentHomework } from '@/hooks/useStudentData';
import { format, isPast, isToday } from 'date-fns';

export default function StudentHomework() {
  const { data: profile } = useStudentProfile();
  const { data: homework, isLoading } = useStudentHomework(profile?.class_name, profile?.section);

  const getStatusBadge = (dueDate: string) => {
    const due = new Date(dueDate);
    if (isToday(due)) {
      return <Badge className="bg-warning text-warning-foreground">Due Today</Badge>;
    }
    if (isPast(due)) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    return <Badge className="bg-primary text-primary-foreground">Upcoming</Badge>;
  };

  const overdueCount = homework?.filter(h => isPast(new Date(h.due_date)) && !isToday(new Date(h.due_date))).length ?? 0;
  const dueTodayCount = homework?.filter(h => isToday(new Date(h.due_date))).length ?? 0;
  const upcomingCount = homework?.filter(h => !isPast(new Date(h.due_date)) && !isToday(new Date(h.due_date))).length ?? 0;

  return (
    <MobileLayout title="Homework" showBack>
      <div className="p-4 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <AlertCircle className="w-5 h-5 text-destructive mx-auto mb-1" />
              <p className="text-lg font-bold">{overdueCount}</p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Clock className="w-5 h-5 text-warning mx-auto mb-1" />
              <p className="text-lg font-bold">{dueTodayCount}</p>
              <p className="text-xs text-muted-foreground">Due Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <CheckCircle className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold">{upcomingCount}</p>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </CardContent>
          </Card>
        </div>

        {/* Homework List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !homework?.length ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookX className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-muted-foreground">No homework assigned</p>
              <p className="text-sm text-muted-foreground mt-1">Check back later for new assignments</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {homework.map((hw) => {
              const isOverdue = isPast(new Date(hw.due_date)) && !isToday(new Date(hw.due_date));
              return (
                <Card key={hw.id} className={isOverdue ? 'border-destructive/50' : isToday(new Date(hw.due_date)) ? 'border-warning/50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{hw.subject}</p>
                          <p className="text-xs text-muted-foreground">{hw.class?.name}{hw.section ? ` - ${hw.section.name}` : ''}</p>
                        </div>
                      </div>
                      {getStatusBadge(hw.due_date)}
                    </div>
                    
                    <h3 className="font-medium mb-1">{hw.title}</h3>
                    {hw.description && (
                      <p className="text-sm text-muted-foreground mb-3">{hw.description}</p>
                    )}

                    {/* Show attached photos if any */}
                    {hw.attachments && hw.attachments.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {hw.attachments.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-lg overflow-hidden border border-border">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        Due: {format(new Date(hw.due_date), 'dd MMM yyyy')}
                      </div>
                      {hw.attachments && hw.attachments.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ImageIcon className="w-3 h-3" />
                          {hw.attachments.length} photo{hw.attachments.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
