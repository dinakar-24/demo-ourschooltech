import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useCashfree } from '@/hooks/useCashfree';
import { Loader2, CreditCard, ShieldCheck, AlertCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  amount: number;
  extraChargePct: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  termName?: string;
  components?: FeeComponent[];
  paidAmount?: number;
}

export function OnlinePaymentDialog({
  open, onOpenChange, invoiceId, studentId, schoolId,
  amount, extraChargePct, customerName, customerEmail, customerPhone,
  termName, components = [], paidAmount = 0,
}: Props) {
  const isMobile = useIsMobile();
  const { initiatePayment, loading } = useCashfree();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  // Reset selections when dialog opens
  useEffect(() => {
    if (open) {
      if (components.length > 0) {
        setSelectedIds(new Set(components.map(c => c.id)));
      }
      setUseCustomAmount(false);
      setCustomAmount('');
    }
  }, [open, components]);

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
    if (useCustomAmount) {
      const val = parseFloat(customAmount);
      return isNaN(val) ? 0 : Math.min(val, amount);
    }
    if (components.length === 0) return amount;
    return components
      .filter(c => selectedIds.has(c.id))
      .reduce((s, c) => s + Number(c.amount), 0);
  }, [selectedIds, components, amount, useCustomAmount, customAmount]);

  // Cap to balance
  const payableAmount = Math.min(selectedTotal, amount);
  const extraCharge = Math.round((payableAmount * extraChargePct / 100) * 100) / 100;
  const totalPayable = payableAmount + extraCharge;

  const isValid = payableAmount > 0;

  const handlePay = async () => {
    if (!isValid) return;
    const result = await initiatePayment({
      invoiceId,
      studentId,
      schoolId,
      amount: payableAmount,
      customerName,
      customerEmail,
      customerPhone,
    });
    if (result.success || result.alreadyPaid) {
      onOpenChange(false);
    }
  };

  const content = (
    <div className="space-y-4">
      {/* Student & Invoice Info */}
      {(customerName || termName) && (
        <div className="rounded-lg bg-muted/40 p-3 space-y-0.5">
          {customerName && (
            <p className="text-sm font-medium text-foreground">{customerName}</p>
          )}
          {termName && (
            <p className="text-xs text-muted-foreground">{termName}</p>
          )}
        </div>
      )}

      {/* Fee Components with Checkboxes */}
      {components.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Select Fees to Pay
            </p>
            <button
              type="button"
              className="text-xs text-primary font-medium"
              onClick={() => {
                if (selectedIds.size === components.length) {
                  setSelectedIds(new Set());
                } else {
                  setSelectedIds(new Set(components.map(c => c.id)));
                }
                setUseCustomAmount(false);
              }}
            >
              {selectedIds.size === components.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="space-y-1.5">
            {components.map(c => {
              const checked = selectedIds.has(c.id);
              return (
                <label
                  key={c.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    checked
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border/60 bg-card hover:bg-muted/30'
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggleComponent(c.id)}
                  />
                  <span className="flex-1 text-sm font-medium text-foreground">{c.fee_type}</span>
                  <span className="text-sm font-bold text-foreground">
                    ₹{Number(c.amount).toLocaleString('en-IN')}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Custom amount option */}
          <div className="pt-1">
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={useCustomAmount}
                onCheckedChange={(checked) => {
                  setUseCustomAmount(!!checked);
                  if (checked) {
                    setCustomAmount(String(amount));
                  }
                }}
              />
              <span className="text-sm text-muted-foreground">Enter custom amount</span>
            </label>
            {useCustomAmount && (
              <div className="mt-2 ml-7">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                  <Input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="pl-7 h-10"
                    placeholder="Enter amount"
                    min={1}
                    max={amount}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Max: ₹{amount.toLocaleString('en-IN')} (outstanding balance)
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* No components — simple single amount display */
        <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Outstanding Balance</p>
          <p className="text-2xl font-bold text-foreground">₹{amount.toLocaleString('en-IN')}</p>
        </div>
      )}

      {/* Amount Summary */}
      <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Fee Amount</span>
          <span className="font-medium">₹{payableAmount.toLocaleString('en-IN')}</span>
        </div>
        {extraCharge > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Gateway Charges ({extraChargePct}%)</span>
            <span className="font-medium">₹{extraCharge.toLocaleString('en-IN')}</span>
          </div>
        )}
        <div className="border-t border-border/60 pt-2.5 flex items-center justify-between">
          <span className="text-sm font-semibold">Total Payable</span>
          <span className="text-lg font-bold text-primary">₹{totalPayable.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Validation warning */}
      {!isValid && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/5 text-destructive text-xs">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Select at least one fee or enter a valid amount</span>
        </div>
      )}

      {/* Security badge */}
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-success/5 text-success text-xs">
        <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
        <span>Secure payment powered by Cashfree</span>
      </div>

      {/* Pay button */}
      <Button
        onClick={handlePay}
        disabled={loading || !isValid}
        className="w-full h-12 text-sm font-semibold"
        size="lg"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <CreditCard className="w-4 h-4 mr-2" />
        )}
        {isValid ? `Pay ₹${totalPayable.toLocaleString('en-IN')}` : 'Select fees to pay'}
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
          <div data-vaul-no-drag className="px-4 pb-6 overflow-y-auto">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
