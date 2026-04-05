import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSubmitPayment } from '@/hooks/usePaymentSubmissions';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, Camera, IndianRupee, CheckCircle2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { computeComponentBalances, type FeeComponentBalance } from '@/lib/fee-waterfall';

interface FeeComponent {
  id: string;
  fee_type: string;
  amount: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  studentId: string;
  schoolId: string;
  maxAmount: number;
  termName?: string;
  prefillAmount?: number;
  prefillLabel?: string;
  components?: FeeComponent[];
  paidAmount?: number;
}

export function SubmitPaymentDialog({
  open, onOpenChange, invoiceId, studentId, schoolId,
  maxAmount, termName, prefillAmount, prefillLabel,
  components = [], paidAmount = 0,
}: Props) {
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [paymentMethod, setPaymentMethod] = useState('phonepe');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const isMobile = useIsMobile();

  const submitPayment = useSubmitPayment();

  const componentBalances = useMemo(
    () => computeComponentBalances(components, paidAmount),
    [components, paidAmount]
  );

  const unpaidComponents = useMemo(
    () => componentBalances.filter(c => c.remaining > 0),
    [componentBalances]
  );

  const paidComponents = useMemo(
    () => componentBalances.filter(c => c.remaining <= 0),
    [componentBalances]
  );

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setUseCustomAmount(false);
      setCustomAmount('');
      setPaymentMethod('phonepe');
      setTransactionId('');
      setNotes('');
      setScreenshotFile(null);

      if (prefillLabel && prefillAmount) {
        // Pre-select specific component
        const match = unpaidComponents.find(c => c.fee_type === prefillLabel);
        if (match) {
          setSelectedIds(new Set([match.id]));
        } else {
          setSelectedIds(new Set(unpaidComponents.map(c => c.id)));
        }
      } else {
        setSelectedIds(new Set(unpaidComponents.map(c => c.id)));
      }
    }
  }, [open, unpaidComponents, prefillLabel, prefillAmount]);

  const toggleComponent = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setUseCustomAmount(false);
  };

  const selectedTotal = useMemo(() => {
    if (unpaidComponents.length === 0) return maxAmount;
    return unpaidComponents
      .filter(c => selectedIds.has(c.id))
      .reduce((s, c) => s + c.remaining, 0);
  }, [selectedIds, unpaidComponents, maxAmount]);

  const payableAmount = useCustomAmount && customAmount
    ? Math.min(parseFloat(customAmount) || 0, maxAmount)
    : Math.min(Math.round(selectedTotal * 100) / 100, maxAmount);

  const isValid = payableAmount > 0 && transactionId.trim().length > 0;
  const allUnpaidSelected = unpaidComponents.length > 0 && unpaidComponents.every(c => selectedIds.has(c.id));

  const handleSubmit = async () => {
    if (!isValid) return;
    if (payableAmount > maxAmount) {
      toast.error(`Amount cannot exceed ₹${maxAmount.toLocaleString('en-IN')}`);
      return;
    }

    let screenshotUrl: string | undefined;
    if (screenshotFile) {
      setUploading(true);
      const ext = screenshotFile.name.split('.').pop();
      const path = `${schoolId}/${invoiceId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(path, screenshotFile);
      setUploading(false);
      if (uploadError) {
        toast.error('Screenshot upload failed: ' + uploadError.message);
        return;
      }
      screenshotUrl = path;
    }

    // Build descriptive notes
    const selectedFees = unpaidComponents.filter(c => selectedIds.has(c.id));
    const feeLabels = selectedFees.map(c => c.fee_type).join(', ');
    const autoNote = useCustomAmount
      ? `Custom amount payment`
      : feeLabels ? `Payment for: ${feeLabels}` : '';
    const finalNotes = [autoNote, notes.trim()].filter(Boolean).join(' · ');

    submitPayment.mutate({
      school_id: schoolId,
      invoice_id: invoiceId,
      student_id: studentId,
      amount: payableAmount,
      payment_method: paymentMethod,
      transaction_id: transactionId.trim(),
      screenshot_url: screenshotUrl,
      notes: finalNotes || undefined,
    }, {
      onSuccess: () => onOpenChange(false),
    });
  };

  const isSubmitting = submitPayment.isPending || uploading;

  const formContent = (
    <div className="space-y-4">
      {/* Fee Component Selection */}
      {unpaidComponents.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Select Fees to Pay
            </p>
            <button
              type="button"
              className="text-xs text-primary font-medium"
              onClick={() => {
                setUseCustomAmount(false);
                if (allUnpaidSelected) setSelectedIds(new Set());
                else setSelectedIds(new Set(unpaidComponents.map(c => c.id)));
              }}
            >
              {allUnpaidSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="space-y-1.5">
            {unpaidComponents.map(c => {
              const checked = selectedIds.has(c.id);
              return (
                <label
                  key={c.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    checked && !useCustomAmount
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border/60 bg-card hover:bg-muted/30'
                  }`}
                >
                  <Checkbox
                    checked={checked && !useCustomAmount}
                    onCheckedChange={() => toggleComponent(c.id)}
                    disabled={useCustomAmount}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">{c.fee_type}</span>
                    {c.paid > 0 && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        ₹{c.paid.toLocaleString('en-IN')} paid of ₹{c.original_amount.toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-bold text-foreground whitespace-nowrap">
                    ₹{c.remaining.toLocaleString('en-IN')}
                  </span>
                </label>
              );
            })}
          </div>

          {paidComponents.length > 0 && (
            <div className="pt-1 space-y-1">
              {paidComponents.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 opacity-60">
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                  <span className="flex-1 text-sm text-muted-foreground">{c.fee_type}</span>
                  <span className="text-xs text-success font-medium">Paid ✓</span>
                </div>
              ))}
            </div>
          )}

          {/* Custom amount toggle */}
          <label className="flex items-center gap-2 pt-1 cursor-pointer">
            <Checkbox
              checked={useCustomAmount}
              onCheckedChange={(v) => {
                setUseCustomAmount(!!v);
                if (!v) setCustomAmount('');
              }}
            />
            <span className="text-xs text-muted-foreground">Enter a custom amount instead</span>
          </label>

          {useCustomAmount && (
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                max={maxAmount}
                min={1}
                className="pl-9 text-lg font-semibold h-11"
                placeholder={`Max ₹${maxAmount.toLocaleString('en-IN')}`}
                autoFocus
              />
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Outstanding Balance</p>
          <p className="text-2xl font-bold text-foreground">₹{maxAmount.toLocaleString('en-IN')}</p>
        </div>
      )}

      {/* Amount summary */}
      <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Amount to Submit</span>
          <span className="text-lg font-bold text-primary">₹{payableAmount.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Payment method */}
      <div>
        <Label className="text-sm font-medium">Payment App</Label>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger className="mt-1 h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="phonepe">PhonePe</SelectItem>
            <SelectItem value="gpay">Google Pay</SelectItem>
            <SelectItem value="paytm">Paytm</SelectItem>
            <SelectItem value="upi_other">Other UPI</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* UTR */}
      <div>
        <Label className="text-sm font-medium">UTR / Transaction ID *</Label>
        <Input
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          placeholder="Enter 12-digit UTR number"
          maxLength={50}
          className="mt-1 h-11"
        />
        <p className="text-xs text-muted-foreground mt-1">Find this in your payment app's transaction details</p>
      </div>

      {/* Screenshot */}
      <div>
        <Label className="text-sm font-medium">Payment Screenshot (optional)</Label>
        <div className="mt-1">
          <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-lg p-3.5 hover:border-primary/50 transition-colors">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
            />
            {screenshotFile ? (
              <div className="flex items-center gap-2 text-sm">
                <Camera className="w-4 h-4 text-success" />
                <span className="truncate">{screenshotFile.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Upload className="w-4 h-4" />
                <span>Tap to upload screenshot</span>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label className="text-sm font-medium">Notes (optional)</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional info..."
          rows={2}
          maxLength={500}
          className="mt-1"
        />
      </div>

      {/* Submit */}
      <Button onClick={handleSubmit} disabled={isSubmitting || !isValid} className="w-full h-12 text-sm font-semibold" size="lg">
        {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
        {payableAmount > 0 ? `Submit ₹${payableAmount.toLocaleString('en-IN')} Proof` : 'Select fees to pay'}
      </Button>
    </div>
  );

  const title = `Submit Payment${termName ? ` — ${termName}` : ''}`;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90dvh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-base">{title}</DrawerTitle>
          </DrawerHeader>
          <div data-vaul-no-drag className="px-4 pb-6 overflow-y-auto flex-1 min-h-0">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
