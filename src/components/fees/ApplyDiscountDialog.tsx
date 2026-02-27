import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useApplyDiscount } from '@/hooks/useFeeInvoices';
import { FeeInvoice } from '@/hooks/useFeeInvoices';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: FeeInvoice | null;
}

const REASONS = ['Scholarship', 'Sibling Discount', 'Staff Ward', 'Financial Aid', 'Merit-Based', 'Other'];

export function ApplyDiscountDialog({ open, onOpenChange, invoice }: Props) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const applyDiscount = useApplyDiscount();

  const balance = Number(invoice?.balance || 0);
  const discountAmount = Number(amount) || 0;
  const isValid = discountAmount > 0 && discountAmount <= balance && reason;

  const handleSubmit = () => {
    if (!isValid || !invoice) return;
    applyDiscount.mutate(
      {
        invoice_id: invoice.id,
        student_id: invoice.student_id,
        discount_amount: discountAmount,
        reason,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setAmount('');
          setReason('');
          setNotes('');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Apply Discount</DialogTitle>
        </DialogHeader>

        {invoice && (
          <div className="space-y-4">
            <div className="text-sm space-y-1 p-3 rounded-lg bg-muted/50">
              <p><span className="text-muted-foreground">Student:</span> {invoice.student?.full_name}</p>
              <p><span className="text-muted-foreground">Term:</span> {invoice.term?.name}</p>
              <p><span className="text-muted-foreground">Balance:</span> <span className="font-semibold">₹{balance.toLocaleString()}</span></p>
            </div>

            <div className="space-y-1.5">
              <Label>Discount Amount *</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                max={balance}
              />
              {discountAmount > balance && (
                <p className="text-xs text-destructive">Cannot exceed balance</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Reason *</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                <SelectContent>
                  {REASONS.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Additional details..." />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!isValid || applyDiscount.isPending}>
            {applyDiscount.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Apply Discount
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
