import { ModulePage, ModuleHeader, StatGrid, StatusBadge, ModuleTable } from '@/components/modules/ModuleShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileQuestion, Plus, Timer, ShieldAlert } from 'lucide-react';
import { onlineExams, examResults } from '@/data/mockModules';

export default function OnlineExamsPage() {
  return (
    <ModulePage>
      <ModuleHeader
        icon={FileQuestion}
        title="Online Exams"
        description="Question banks, timed tests and proctoring flags"
        actions={<Button><Plus className="h-4 w-4 mr-2" />Create exam</Button>}
      />

      <StatGrid stats={[
        { label: 'Exams', value: onlineExams.length, icon: FileQuestion },
        { label: 'Live now', value: onlineExams.filter(e => e.status === 'live').length, icon: Timer, tone: 'success' },
        { label: 'Attempts', value: onlineExams.reduce((a, e) => a + e.attempts, 0), icon: FileQuestion },
        { label: 'Proctor flags', value: examResults.filter(r => r.flag !== 'Clean').length, icon: ShieldAlert, tone: 'destructive' },
      ]} />

      <Card>
        <CardHeader><CardTitle className="text-base">Exam schedule</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ModuleTable
            rows={onlineExams}
            columns={[
              { key: 'title', header: 'Exam', mobile: 'title', cell: e => e.title },
              { key: 'scheduled', header: 'Scheduled', mobile: 'subtitle', cell: e => e.scheduled },
              { key: 'questions', header: 'Questions', mobile: 'meta', cell: e => `${e.questions}` },
              { key: 'marks', header: 'Marks', mobile: 'meta', cell: e => `${e.marks}` },
              { key: 'duration', header: 'Duration', mobile: 'meta', cell: e => e.duration },
              { key: 'attempts', header: 'Attempts', mobile: 'meta', cell: e => `${e.attempts}` },
              { key: 'status', header: 'Status', mobile: 'badge', cell: e => <StatusBadge status={e.status} /> },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Latest results</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ModuleTable
            rows={examResults}
            columns={[
              { key: 'student', header: 'Student', mobile: 'title', cell: r => r.student },
              { key: 'score', header: 'Score', mobile: 'meta', cell: r => `${r.score}/${r.total}` },
              { key: 'percent', header: 'Percent', mobile: 'meta', cell: r => `${r.percent}%` },
              { key: 'time', header: 'Time taken', mobile: 'meta', cell: r => r.time },
              {
                key: 'flag', header: 'Proctoring', mobile: 'subtitle',
                cell: r => <span className={r.flag === 'Clean' ? 'text-muted-foreground' : 'text-destructive'}>{r.flag}</span>,
              },
            ]}
          />
        </CardContent>
      </Card>
    </ModulePage>
  );
}