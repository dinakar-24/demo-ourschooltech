import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCashfree } from '@/hooks/useCashfree';
import { Loader2, CreditCard, IndianRupee, ShieldCheck } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  studentId: string;
  schoolId: string;
  amount: number;
  extraChargePct: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  termName?: string;
}

export function OnlinePaymentDialog({
  open, onOpenChange, invoiceId, studentId, schoolId,
  amount, extraChargePct, customerName, customerEmail, customerPhone, termName,
}: Props) {
  const isMobile = useIsMobile();
  const { initiatePayment, loading } = useCashfree();

  const extraCharge = Math.round((amount * extraChargePct / 100) * 100) / 100;
  const totalAmount = amount + extraCharge;

  const handlePay = async () => {
    const result = await initiatePayment({
      invoiceId,
      studentId,
      schoolId,
      amount,
      customerName,
      customerEmail,
      customerPhone,
    });
    if (result.success) {
      onOpenChange(false);
    }
    // If error says "already paid", close dialog so user can see the receipt
    if (!result.success && result.alreadyPaid) {
      onOpenChange(false);
    }
  };

  const content = (
    <div className="space-y-5">
      {/* Amount breakdown */}
      <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Fee Amount</span>
          <span className="text-sm font-medium">₹{amount.toLocaleString('en-IN')}</span>
        </div>
        {extraCharge > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Gateway Charges ({extraChargePct}%)
            </span>
            <span className="text-sm font-medium">₹{extraCharge.toLocaleString('en-IN')}</span>
          </div>
        )}
        <div className="border-t border-border/60 pt-3 flex items-center justify-between">
          <span className="text-sm font-semibold">Total Payable</span>
          <span className="text-lg font-bold text-primary">₹{totalAmount.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Security badge */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-success/5 text-success text-sm">
        <ShieldCheck className="w-4 h-4 flex-shrink-0" />
        <span>Secure payment powered by Cashfree</span>
      </div>

      {/* Pay button */}
      <Button
        onClick={handlePay}
        disabled={loading}
        className="w-full h-12 text-sm font-semibold"
        size="lg"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <CreditCard className="w-4 h-4 mr-2" />
        )}
        Pay ₹{totalAmount.toLocaleString('en-IN')}
      </Button>
    </div>
  );

  const title = `Pay Online${termName ? ` — ${termName}` : ''}`;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85dvh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-base">{title}</DrawerTitle>
          </DrawerHeader>
          <div data-vaul-no-drag className="px-4 pb-6">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
