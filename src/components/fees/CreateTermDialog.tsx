import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCreateFeeTerm } from '@/hooks/useFeeInvoices';
import { useAcademicYears } from '@/hooks/useAcademicYears';

interface CreateTermDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTermDialog({ open, onOpenChange }: CreateTermDialogProps) {
  const { data: academicYears } = useAcademicYears();
  const createTerm = useCreateFeeTerm();

  const [name, setName] = useState('');
  const [academicYearId, setAcademicYearId] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();

  const resetForm = () => {
    setName('');
    setAcademicYearId('');
    setDueDate(undefined);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !academicYearId || !dueDate) return;
    try {
      await createTerm.mutateAsync({
        name: name.trim(),
        academic_year_id: academicYearId,
        due_date: format(dueDate, 'yyyy-MM-dd'),
      });
      handleClose(false);
    } catch {
      // handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Fee Term</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Academic Year <span className="text-destructive">*</span></Label>
            <Select value={academicYearId} onValueChange={setAcademicYearId}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {(academicYears || []).map(ay => (
                  <SelectItem key={ay.id} value={ay.id}>{ay.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Term Name <span className="text-destructive">*</span></Label>
            <Input placeholder="e.g., Term 1, Q1, Installment 1" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Default Due Date <span className="text-destructive">*</span></Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP') : 'Pick date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !academicYearId || !dueDate || createTerm.isPending}>
            {createTerm.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Term
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
