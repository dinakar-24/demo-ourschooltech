import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSubmitPayment } from '@/hooks/usePaymentSubmissions';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, Camera, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

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
}

export function SubmitPaymentDialog({ open, onOpenChange, invoiceId, studentId, schoolId, maxAmount, termName, prefillAmount, prefillLabel }: Props) {
  const [amount, setAmount] = useState(maxAmount.toString());
  const [paymentMethod, setPaymentMethod] = useState('phonepe');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const isMobile = useIsMobile();

  const submitPayment = useSubmitPayment();

  // Pre-fill when opening with specific component
  useEffect(() => {
    if (open) {
      if (prefillAmount && prefillAmount > 0) {
        setAmount(String(prefillAmount));
        if (prefillLabel) {
          setNotes(`Payment for ${prefillLabel}`);
        }
      } else {
        setAmount(maxAmount.toString());
        setNotes('');
      }
    }
  }, [open, prefillAmount, prefillLabel, maxAmount]);

  const resetForm = () => {
    setAmount(maxAmount.toString());
    setPaymentMethod('phonepe');
    setTransactionId('');
    setNotes('');
    setScreenshotFile(null);
  };

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0 || numAmount > maxAmount) {
      toast.error(`Amount must be between ₹1 and ₹${maxAmount.toLocaleString()}`);
      return;
    }
    if (!transactionId.trim()) {
      toast.error('Please enter the UTR/Transaction ID');
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

    submitPayment.mutate({
      school_id: schoolId,
      invoice_id: invoiceId,
      student_id: studentId,
      amount: numAmount,
      payment_method: paymentMethod,
      transaction_id: transactionId.trim(),
      screenshot_url: screenshotUrl,
      notes: notes.trim() || undefined,
    }, {
      onSuccess: () => {
        resetForm();
        onOpenChange(false);
      },
    });
  };

  const isSubmitting = submitPayment.isPending || uploading;

  const formContent = (
    <div className="space-y-4 flex-1 min-h-0">
      {/* Amount with quick-fill chips */}
      <div>
        <Label className="text-sm font-medium">Amount</Label>
        <div className="relative mt-1">
          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            max={maxAmount}
            min={1}
            className="pl-9 text-lg font-semibold h-11"
            placeholder="Enter amount"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Max: ₹{maxAmount.toLocaleString()}</p>
      </div>

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

      <div>
        <Label className="text-sm font-medium">UTR / Transaction ID *</Label>
        <Input
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          placeholder="Enter 12-digit UTR number"
          maxLength={50}
          className="mt-1 h-11"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Find this in your payment app's transaction details
        </p>
      </div>

      <div>
        <Label className="text-sm font-medium">Payment Screenshot (optional)</Label>
        <div className="mt-1">
          <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed rounded-lg p-4 hover:border-primary/50 transition-colors">
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

      <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full h-11 text-sm font-semibold">
        {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        Submit Payment Proof
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
          <div className="px-4 pb-6 overflow-y-auto flex-1 min-h-0">
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
