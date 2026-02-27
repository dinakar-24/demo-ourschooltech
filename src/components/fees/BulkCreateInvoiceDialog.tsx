import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useFeeTerms, useCreateBulkInvoices } from '@/hooks/useFeeInvoices';
import { useClasses } from '@/hooks/useClasses';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkCreateInvoiceDialog({ open, onOpenChange }: Props) {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [components, setComponents] = useState([{ fee_type: '', amount: 0 }]);

  const { data: terms } = useFeeTerms();
  const { data: classes } = useClasses();
  const selectedClassObj = classes?.find(c => c.name === selectedClass);
  const sections = selectedClassObj?.sections || [];
  const bulkCreate = useCreateBulkInvoices();

  const addComponent = () => setComponents([...components, { fee_type: '', amount: 0 }]);
  const removeComponent = (i: number) => setComponents(components.filter((_, idx) => idx !== i));
  const updateComponent = (i: number, field: string, value: any) => {
    const updated = [...components];
    (updated[i] as any)[field] = value;
    setComponents(updated);
  };

  const totalAmount = components.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const isValid = selectedClass && selectedTerm && dueDate && components.every(c => c.fee_type && c.amount > 0);

  const handleSubmit = () => {
    if (!isValid) return;
    bulkCreate.mutate(
      {
        className: selectedClass,
        section: selectedSection === 'all' ? undefined : selectedSection,
        term_id: selectedTerm,
        due_date: dueDate,
        components: components.map(c => ({ fee_type: c.fee_type, amount: Number(c.amount) })),
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSelectedClass('');
          setSelectedSection('all');
          setSelectedTerm('');
          setDueDate('');
          setComponents([{ fee_type: '', amount: 0 }]);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Create Invoices</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Class *</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {(classes || []).map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger><SelectValue placeholder="All sections" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sections</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Term *</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
                <SelectContent>
                  {(terms || []).map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Due Date *</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Fee Components *</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addComponent}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            </div>
            {components.map((c, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input placeholder="Fee type" value={c.fee_type} onChange={e => updateComponent(i, 'fee_type', e.target.value)} className="flex-1" />
                <Input type="number" placeholder="Amount" value={c.amount || ''} onChange={e => updateComponent(i, 'amount', e.target.value)} className="w-28" />
                {components.length > 1 && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeComponent(i)}>
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <p className="text-sm text-muted-foreground">Total per student: <span className="font-semibold text-foreground">₹{totalAmount.toLocaleString()}</span></p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!isValid || bulkCreate.isPending}>
            {bulkCreate.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Create Invoices
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
