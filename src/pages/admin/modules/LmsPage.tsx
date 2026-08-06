import { ModulePage, ModuleHeader, StatGrid, StatusBadge } from '@/components/modules/ModuleShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Library, Plus, PlayCircle, Users, BookOpenCheck } from 'lucide-react';
import { lmsCourses, lmsLessons } from '@/data/mockModules';

export default function LmsPage() {
  return (
    <ModulePage>
      <ModuleHeader
        icon={Library}
        title="Learning Management"
        description="Courses, lesson content and learner progress"
        actions={<Button><Plus className="h-4 w-4 mr-2" />Create course</Button>}
      />

      <StatGrid stats={[
        { label: 'Courses', value: lmsCourses.length, icon: Library },
        { label: 'Published', value: lmsCourses.filter(c => c.status === 'active').length, icon: BookOpenCheck, tone: 'success' },
        { label: 'Lessons', value: lmsCourses.reduce((a, c) => a + c.lessons, 0), icon: PlayCircle },
        { label: 'Enrolled', value: lmsCourses.reduce((a, c) => a + c.students, 0), icon: Users },
      ]} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {lmsCourses.map(c => (
          <Card key={c.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-sm leading-snug">{c.title}</p>
                <StatusBadge status={c.status} />
              </div>
              <p className="text-xs text-muted-foreground">{c.teacher} · {c.lessons} lessons · {c.students} students</p>
              <div>
                <Progress value={c.progress} className="h-2" />
                <p className="text-[11px] text-muted-foreground mt-1">Class progress {c.progress}%</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Lessons — Mathematics VIII</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {lmsLessons.map(l => (
            <div key={l.id} className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <PlayCircle className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{l.title}</p>
                <p className="text-xs text-muted-foreground">{l.type} · {l.duration}</p>
              </div>
              <div className="w-24 shrink-0 hidden sm:block">
                <Progress value={l.completion} className="h-2" />
              </div>
              <Badge variant="outline" className="shrink-0">{l.completion}%</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </ModulePage>
  );
}