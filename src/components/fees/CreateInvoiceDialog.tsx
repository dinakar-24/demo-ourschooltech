import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
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
import { CalendarIcon, Loader2, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCreateInvoice } from '@/hooks/useFeeInvoices';
import { useStudentSearch } from '@/hooks/useStudentSearch';
import { useIsMobile } from '@/hooks/use-mobile';

const FEE_COMPONENT_TYPES = [
  'Tuition Fee', 'Transport Fee', 'Exam Fee', 'Lab Fee',
  'Sports Fee', 'Library Fee', 'Activity Fee', 'Other'
];

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateInvoiceDialog({ open, onOpenChange }: CreateInvoiceDialogProps) {
  const isMobile = useIsMobile();
  const createInvoice = useCreateInvoice();
  const studentSearch = useStudentSearch();

  const [studentId, setStudentId] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [components, setComponents] = useState<{ fee_type: string; amount: string; custom_type?: string }[]>([
    { fee_type: '', amount: '' }
  ]);

  const resetForm = () => {
    setStudentId('');
    setDueDate(undefined);
    setComponents([{ fee_type: '', amount: '' }]);
    studentSearch.setSearchInput('');
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  const addComponent = () => {
    setComponents([...components, { fee_type: '', amount: '' }]);
  };

  const removeComponent = (idx: number) => {
    if (components.length <= 1) return;
    setComponents(components.filter((_, i) => i !== idx));
  };

  const updateComponent = (idx: number, field: string, value: string) => {
    const updated = [...components];
    (updated[idx] as any)[field] = value;
    setComponents(updated);
  };

  const totalAmount = components.reduce((s, c) => s + (Number(c.amount) || 0), 0);

  const canSubmit = () => {
    if (!studentId) return false;
    return components.every(c => {
      const type = c.fee_type === 'Other' ? c.custom_type?.trim() : c.fee_type;
      return type && Number(c.amount) > 0;
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    const comps = components.map(c => ({
      fee_type: c.fee_type === 'Other' ? (c.custom_type?.trim() || 'Other') : c.fee_type,
      amount: Number(c.amount),
    }));

    try {
      await createInvoice.mutateAsync({
        student_id: studentId,
        due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        components: comps,
      });
      handleClose(false);
    } catch {
      // handled by hook
    }
  };

  const formContent = (
    <div className="space-y-4">
      {/* Student Search */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Student <span className="text-destructive">*</span></Label>
        <Input
          placeholder="Search by name or admission no..."
          value={studentSearch.searchInput}
          onChange={(e) => {
            studentSearch.setSearchInput(e.target.value);
            if (!e.target.value) setStudentId('');
          }}
        />
        {studentSearch.isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Searching...
          </div>
        )}
        {studentSearch.students.length > 0 && (
          <div className="max-h-32 overflow-y-auto border rounded-md divide-y">
            {studentSearch.students.map(s => (
              <button
                key={s.id}
                type="button"
                className={cn("w-full text-left p-2.5 text-sm hover:bg-muted transition-colors", studentId === s.id && "bg-primary/10 text-primary font-medium")}
                onClick={() => { setStudentId(s.id); studentSearch.setSearchInput(s.full_name); }}
              >
                <span className="font-medium">{s.full_name}</span>
                <span className="text-muted-foreground ml-2 text-xs">({s.admission_number}) · {s.class_name}-{s.section}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Due Date (Optional) */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Due Date <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDate ? format(dueDate, 'PPP') : 'Select due date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus className="p-3 pointer-events-auto" />
          </PopoverContent>
        </Popover>
      </div>

      {/* Fee Components */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Fee Components</Label>
          <Button type="button" variant="outline" size="sm" onClick={addComponent}>
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>
        {components.map((comp, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <Select value={comp.fee_type} onValueChange={(v) => updateComponent(idx, 'fee_type', v)}>
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue placeholder="Fee type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FEE_COMPONENT_TYPES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                type="number"
                placeholder="₹ Amount"
                value={comp.amount}
                onChange={(e) => updateComponent(idx, 'amount', e.target.value)}
                className="w-28 h-10 text-sm"
              />
              {components.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeComponent(idx)} className="shrink-0 h-10 w-10">
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              )}
            </div>
            {comp.fee_type === 'Other' && (
              <Input
                placeholder="Custom type name"
                value={comp.custom_type || ''}
                onChange={(e) => updateComponent(idx, 'custom_type', e.target.value)}
                className="h-9 text-sm"
              />
            )}
          </div>
        ))}
        <div className="flex justify-between items-center rounded-lg border bg-muted/30 px-4 py-3 text-sm font-medium">
          <span>Total Invoice Amount</span>
          <span className="text-base font-semibold">₹{totalAmount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );

  const actionButtons = (
    <div className={cn("flex gap-2 pt-3", isMobile ? "flex-col" : "justify-end")}>
      {isMobile ? (
        <>
          <Button onClick={handleSubmit} disabled={!canSubmit() || createInvoice.isPending} className="w-full h-11">
            {createInvoice.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Invoice
          </Button>
          <Button variant="outline" onClick={() => handleClose(false)} className="w-full h-11">Cancel</Button>
        </>
      ) : (
        <>
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit() || createInvoice.isPending}>
            {createInvoice.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Invoice
          </Button>
        </>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="px-4 pb-6 max-h-[90dvh]">
          <DrawerHeader className="px-0 pb-2">
            <DrawerTitle>Create Fee Invoice</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto flex-1 min-h-0">
            {formContent}
            {actionButtons}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Fee Invoice</DialogTitle>
        </DialogHeader>
        {formContent}
        {actionButtons}
      </DialogContent>
    </Dialog>
  );
}
