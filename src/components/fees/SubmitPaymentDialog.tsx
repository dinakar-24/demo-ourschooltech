import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSubmitPayment } from '@/hooks/usePaymentSubmissions';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, Camera } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  studentId: string;
  schoolId: string;
  maxAmount: number;
  termName?: string;
}

export function SubmitPaymentDialog({ open, onOpenChange, invoiceId, studentId, schoolId, maxAmount, termName }: Props) {
  const [amount, setAmount] = useState(maxAmount.toString());
  const [paymentMethod, setPaymentMethod] = useState('phonepe');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const submitPayment = useSubmitPayment();

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Payment Proof{termName ? ` — ${termName}` : ''}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Amount (Max: ₹{maxAmount.toLocaleString()})</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={maxAmount}
              min={1}
              placeholder="Enter amount paid"
            />
          </div>

          <div>
            <Label>Payment App</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
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
            <Label>UTR / Transaction ID *</Label>
            <Input
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter 12-digit UTR number"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Find this in your payment app's transaction details
            </p>
          </div>

          <div>
            <Label>Payment Screenshot (optional)</Label>
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
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional info..."
              rows={2}
              maxLength={500}
            />
          </div>

          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Submit Payment Proof
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
