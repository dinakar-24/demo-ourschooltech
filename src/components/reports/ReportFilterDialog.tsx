import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Loader2 } from 'lucide-react';
import { useClasses } from '@/hooks/useClasses';
import { useSections } from '@/hooks/useSections';
import { useExams, type PaginatedExams } from '@/hooks/useExams';
import type { ReportFilters } from '@/hooks/useReportGenerators';

export type ReportType =
  | 'student-list' | 'class-wise'
  | 'daily-attendance' | 'absentee'
  | 'fee-collection' | 'pending-dues'
  | 'exam-results' | 'performance';

interface ReportFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportType: ReportType;
  onGenerate: (filters: ReportFilters) => Promise<void>;
}

const reportConfig: Record<ReportType, { title: string; filters: string[] }> = {
  'student-list': { title: 'Student List Report', filters: ['class', 'section', 'status'] },
  'class-wise': { title: 'Class-wise Report', filters: [] },
  'daily-attendance': { title: 'Daily Attendance Report', filters: ['date', 'class'] },
  'absentee': { title: 'Absentee Report', filters: ['dateRange'] },
  'fee-collection': { title: 'Fee Collection Report', filters: ['dateRange', 'class'] },
  'pending-dues': { title: 'Pending Dues Report', filters: ['class'] },
  'exam-results': { title: 'Exam Results Report', filters: ['class', 'exam'] },
  'performance': { title: 'Performance Analysis', filters: ['class'] },
};

export function ReportFilterDialog({ open, onOpenChange, reportType, onGenerate }: ReportFilterDialogProps) {
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({});
  const { data: classes } = useClasses();
  const { data: sections } = useSections(filters.className);
  const { data: examData } = useExams();
  const exams = (examData as PaginatedExams | undefined)?.data;

  const config = reportConfig[reportType];
  const hasFilters = config.filters.length > 0;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await onGenerate(filters);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const uniqueClasses = [...new Set(classes?.map(c => c.name) || [])].sort((a, b) => {
    const na = parseInt(a), nb = parseInt(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">{config.title}</DialogTitle>
        </DialogHeader>

        {hasFilters && (
          <div className="space-y-4 py-2">
            {config.filters.includes('class') && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Class</Label>
                <Select value={filters.className || ''} onValueChange={v => setFilters(f => ({ ...f, className: v === 'all' ? undefined : v, section: undefined }))}>
                  <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {uniqueClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {config.filters.includes('section') && filters.className && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Section</Label>
                <Select value={filters.section || ''} onValueChange={v => setFilters(f => ({ ...f, section: v === 'all' ? undefined : v }))}>
                  <SelectTrigger><SelectValue placeholder="All Sections" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {(sections || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {config.filters.includes('status') && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Status</Label>
                <Select value={filters.status || 'all'} onValueChange={v => setFilters(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {config.filters.includes('date') && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Date</Label>
                <Input type="date" value={filters.date || new Date().toISOString().split('T')[0]} onChange={e => setFilters(f => ({ ...f, date: e.target.value }))} />
              </div>
            )}

            {config.filters.includes('dateRange') && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">From</Label>
                  <Input type="date" value={filters.dateFrom || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">To</Label>
                  <Input type="date" value={filters.dateTo || new Date().toISOString().split('T')[0]} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} />
                </div>
              </div>
            )}

            {config.filters.includes('exam') && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Exam</Label>
                <Select value={filters.examId || ''} onValueChange={v => setFilters(f => ({ ...f, examId: v === 'all' ? undefined : v }))}>
                  <SelectTrigger><SelectValue placeholder="All Exams" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Exams</SelectItem>
                    {(exams || []).map(e => <SelectItem key={e.id} value={e.id}>{e.name} - {e.subject} ({e.class_name})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {!hasFilters && (
          <p className="text-sm text-muted-foreground py-2">
            This report will be generated with all available data. Click Generate to download.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Generate Excel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
