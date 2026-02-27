import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Loader2 } from 'lucide-react';
import { useClasses } from '@/hooks/useClasses';
import type { ReportFilters } from '@/hooks/useReportGenerators';

interface CustomReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (module: string, fields: string[], filters: ReportFilters) => Promise<void>;
}

const moduleFields: Record<string, { label: string; value: string }[]> = {
  students: [
    { label: 'Full Name', value: 'full_name' },
    { label: 'Admission Number', value: 'admission_number' },
    { label: 'Class', value: 'class_name' },
    { label: 'Section', value: 'section' },
    { label: 'Roll Number', value: 'roll_number' },
    { label: 'Gender', value: 'gender' },
    { label: 'Date of Birth', value: 'date_of_birth' },
    { label: 'Parent Name', value: 'parent_name' },
    { label: 'Parent Phone', value: 'parent_phone' },
    { label: 'Parent Email', value: 'parent_email' },
    { label: 'Address', value: 'address' },
    { label: 'Blood Group', value: 'blood_group' },
    { label: 'Status', value: 'status' },
  ],
  fees: [
    { label: 'Student Name', value: 'student_name' },
    { label: 'Class', value: 'class_name' },
    { label: 'Section', value: 'section' },
    { label: 'Total Amount', value: 'total_amount' },
    { label: 'Paid Amount', value: 'paid_amount' },
    { label: 'Balance', value: 'balance' },
    { label: 'Due Date', value: 'due_date' },
    { label: 'Status', value: 'status' },
  ],
  attendance: [
    { label: 'Student Name', value: 'student_name' },
    { label: 'Class', value: 'class_name' },
    { label: 'Section', value: 'section' },
    { label: 'Date', value: 'date' },
    { label: 'Status', value: 'status' },
    { label: 'Notes', value: 'notes' },
  ],
  exams: [
    { label: 'Student Name', value: 'student_name' },
    { label: 'Class', value: 'class_name' },
    { label: 'Exam Name', value: 'exam_name' },
    { label: 'Subject', value: 'subject' },
    { label: 'Marks', value: 'marks' },
    { label: 'Max Marks', value: 'max_marks' },
    { label: 'Grade', value: 'grade' },
  ],
};

export function CustomReportDialog({ open, onOpenChange, onGenerate }: CustomReportDialogProps) {
  const [module, setModule] = useState('students');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilters>({});
  const [loading, setLoading] = useState(false);
  const { data: classes } = useClasses();

  const fields = moduleFields[module] || [];

  const toggleField = (field: string) => {
    setSelectedFields(prev =>
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  const handleModuleChange = (m: string) => {
    setModule(m);
    setSelectedFields([]);
  };

  const selectAll = () => {
    setSelectedFields(fields.map(f => f.value));
  };

  const handleGenerate = async () => {
    const fieldsToUse = selectedFields.length > 0 ? selectedFields : fields.map(f => f.value);
    setLoading(true);
    try {
      await onGenerate(module, fieldsToUse, filters);
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
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Custom Report Builder</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Module</Label>
            <Select value={module} onValueChange={handleModuleChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="students">Students</SelectItem>
                <SelectItem value="fees">Fees</SelectItem>
                <SelectItem value="attendance">Attendance</SelectItem>
                <SelectItem value="exams">Exams</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Fields</Label>
              <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-7">
                Select All
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3 rounded-lg border bg-muted/30 max-h-48 overflow-y-auto">
              {fields.map(field => (
                <label key={field.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={selectedFields.includes(field.value)}
                    onCheckedChange={() => toggleField(field.value)}
                  />
                  {field.label}
                </label>
              ))}
            </div>
            {selectedFields.length === 0 && (
              <p className="text-xs text-muted-foreground">No fields selected — all fields will be included.</p>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Filters (Optional)</Label>
            <Select value={filters.className || ''} onValueChange={v => setFilters(f => ({ ...f, className: v === 'all' ? undefined : v }))}>
              <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {uniqueClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            {module === 'attendance' && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Date</Label>
                <Input type="date" value={filters.date || new Date().toISOString().split('T')[0]} onChange={e => setFilters(f => ({ ...f, date: e.target.value }))} />
              </div>
            )}

            {module === 'students' && (
              <Select value={filters.status || 'all'} onValueChange={v => setFilters(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Generate Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
