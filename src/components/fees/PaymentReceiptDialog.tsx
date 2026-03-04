import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Printer, Share2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { FeePayment, FeeInvoice } from '@/hooks/useFeeInvoices';

interface PaymentReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: FeePayment | null;
  invoice: FeeInvoice | null;
  copyLabel?: 'PARENT COPY' | 'OFFICE COPY';
}

function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  };

  const wholePart = Math.floor(num);
  const decimalPart = Math.round((num - wholePart) * 100);
  let result = 'INR ' + convert(wholePart);
  if (decimalPart > 0) result += ' and ' + convert(decimalPart) + ' Paise';
  return result + ' Only';
}

function formatINR(n: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2 });
}

const printStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1a1a1a; font-size: 13px; background: #fff; }
  @media print { body { padding: 0; } .receipt-outer { box-shadow: none !important; border: none !important; } }
`;

export function PaymentReceiptDialog({ open, onOpenChange, payment, invoice, copyLabel = 'OFFICE COPY' }: PaymentReceiptDialogProps) {
  const { school } = useAuth();
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!payment || !invoice) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !receiptRef.current) return;
    printWindow.document.write(`
      <!DOCTYPE html><html><head>
      <title>Receipt ${payment.receipt_number}</title>
      <style>${printStyles}</style></head><body>
      ${receiptRef.current.innerHTML}
      <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const handleShare = async () => {
    if (!receiptRef.current || !invoice || !payment) return;

    const studentName = invoice.student?.full_name || 'N/A';
    const admNo = invoice.student?.admission_number || 'N/A';
    const className = [invoice.student?.class_name, invoice.student?.section].filter(Boolean).join(' ');
    const schoolName = school?.name || 'School';

    const components = (invoice.components || [])
      .map(c => `  • ${c.fee_type}: ₹${formatINR(Number(c.amount))}`)
      .join('\n');

    const receiptText = [
      `📄 *FEE RECEIPT - ${schoolName}*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `Receipt No: ${payment.receipt_number}`,
      `Date: ${new Date(payment.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      ``,
      `👤 *Student Details*`,
      `Name: ${studentName}`,
      `Adm No: ${admNo}`,
      className ? `Class: ${className}` : '',
      invoice.student?.parent_name ? `Father: ${invoice.student.parent_name}` : '',
      ``,
      components ? `📋 *Fee Breakdown*\n${components}\n` : '',
      `💰 *Payment Summary*`,
      `Total Fee: ₹${formatINR(totalFees)}`,
      `Current Payment: ₹${formatINR(currentPayment)}`,
      `Remaining Balance: ₹${formatINR(remainingBalance)}`,
      ``,
      `Payment Mode: ${payment.payment_method?.charAt(0).toUpperCase() + payment.payment_method?.slice(1)}`,
      payment.transaction_id ? `Transaction ID: ${payment.transaction_id}` : '',
      payment.cheque_number ? `Cheque No: ${payment.cheque_number}` : '',
      `━━━━━━━━━━━━━━━━━━━━`,
      `_This is a system-generated receipt._`,
    ].filter(Boolean).join('\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Fee Receipt - ${payment.receipt_number}`,
          text: receiptText,
        });
      } catch {
        // user cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(receiptText);
        const { toast } = await import('@/hooks/use-toast');
        toast({ title: 'Copied!', description: 'Receipt details copied to clipboard' });
      } catch {
        const { toast } = await import('@/hooks/use-toast');
        toast({ title: 'Error', description: 'Could not copy to clipboard', variant: 'destructive' });
      }
    }
  };

  // ── Cumulative payment calculations ──────────────────────────────
  const allPayments = (invoice.payments || []).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const currentPayment = Number(payment.amount);
  const totalFees = Number(invoice.total_amount);

  // Sum of all payments made BEFORE this one (by created_at timestamp)
  const currentPaymentTime = new Date(payment.created_at).getTime();
  const previouslyPaid = allPayments
    .filter(p => new Date(p.created_at).getTime() < currentPaymentTime)
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const totalPaidTillDate = previouslyPaid + currentPayment;
  const remainingBalance = Math.max(0, totalFees - totalPaidTillDate);

  // Component-wise allocation: track how much was paid against each component
  const componentAllocations = (invoice.components || []).map(c => {
    const compAmount = Number(c.amount);
    const feeTypeLower = c.fee_type.toLowerCase();

    // Sum payments allocated to this component (via notes) up to current payment
    let allocatedPrev = 0;
    let allocatedCurrent = 0;

    for (const p of allPayments) {
      const notesLower = (p.notes || '').toLowerCase();
      const matchesComponent = notesLower.includes(feeTypeLower);
      const hasAnyComponentMatch = (invoice.components || []).some(comp =>
        notesLower.includes(comp.fee_type.toLowerCase())
      );

      if (hasAnyComponentMatch && matchesComponent) {
        if (p.id === payment.id) {
          allocatedCurrent = Number(p.amount);
        } else if (new Date(p.created_at).getTime() < currentPaymentTime) {
          allocatedPrev += Number(p.amount);
        }
      }
    }

    return {
      fee_type: c.fee_type,
      amount: compAmount,
      prevPaid: allocatedPrev,
      currentPaid: allocatedCurrent,
      totalPaid: allocatedPrev + allocatedCurrent,
      balance: Math.max(0, compAmount - allocatedPrev - allocatedCurrent),
    };
  });

  const hasComponentAllocation = componentAllocations.some(c => c.currentPaid > 0 || c.prevPaid > 0);

  const paymentDate = new Date(payment.payment_date);
  const createdAt = new Date(payment.created_at);
  const formattedDate = paymentDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const formattedTime = createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const labelStyle: React.CSSProperties = { fontWeight: 700, fontSize: '12px', color: '#1a1a1a' };
  const valueStyle: React.CSSProperties = { fontSize: '12px', color: '#1a1a1a' };
  const thStyle: React.CSSProperties = { border: '1.5px solid #222', padding: '6px 8px', textAlign: 'left', fontWeight: 700, fontSize: '11px', background: '#f5f5f5' };
  const thRight: React.CSSProperties = { ...thStyle, textAlign: 'right' };
  const tdStyle: React.CSSProperties = { border: '1px solid #999', padding: '6px 8px', fontSize: '11px' };
  const tdRight: React.CSSProperties = { ...tdStyle, textAlign: 'right', fontFamily: "'Courier New', monospace" };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Fee Receipt</DialogTitle>
        </DialogHeader>

        {/* Action buttons below header */}
        <div className="flex gap-2 -mt-2 mb-1">
          <Button variant="outline" size="sm" className="flex-1 h-9 text-xs font-medium border-border" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
          </Button>
          <Button variant="outline" size="sm" className="flex-1 h-9 text-xs font-medium border-border" onClick={handleShare}>
            <Download className="w-3.5 h-3.5 mr-1.5" /> Save
          </Button>
          <Button variant="outline" size="sm" className="flex-1 h-9 text-xs font-medium border-border" onClick={handleShare}>
            <Share2 className="w-3.5 h-3.5 mr-1.5" /> Share
          </Button>
        </div>

        <div ref={receiptRef}>
          <div className="receipt-outer" style={{ margin: '0 auto', border: '2px solid #333', fontFamily: "'Segoe UI', sans-serif", fontSize: '13px', color: '#1a1a1a', background: '#fff', padding: '16px' }}>

            {/* OFFICE COPY - top right */}
            <div style={{ textAlign: 'right', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#dc2626', fontStyle: 'italic' }}>
                {copyLabel}
              </span>
            </div>

            {/* School Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '12px' }}>
              {school?.logo && (
                <img src={school.logo} alt={school.name} style={{ height: '50px', width: '50px', objectFit: 'contain', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#1a1a1a', letterSpacing: '0.5px' }}>
                  {school?.name || 'School Name'}
                </div>
                <div style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>
                  {[school?.address, school?.city].filter(Boolean).join(', ')}
                </div>
                {(school?.phone || school?.email) && (
                  <div style={{ fontSize: '11px', color: '#444', marginTop: '1px' }}>
                    {school?.phone && <>Tel: {school.phone}</>}
                    {school?.phone && school?.email && ', '}
                    {school?.email && <>Email: {school.email}</>}
                  </div>
                )}
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a1a', marginTop: '4px' }}>
                  FEE RECEIPT
                </div>
              </div>
            </div>

            {/* Divider */}
            <hr style={{ border: 'none', borderTop: '2px solid #333', margin: '0 0 12px' }} />

            {/* Receipt & Student Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', marginBottom: '14px', fontSize: '11px' }}>
              <div>
                <span style={labelStyle}>Receipt No: </span>
                <span style={valueStyle}>{payment.receipt_number}</span>
              </div>
              <div>
                <span style={labelStyle}>Date: </span>
                <span style={valueStyle}>{formattedDate} {formattedTime}</span>
              </div>
              <div>
                <span style={labelStyle}>Student: </span>
                <span style={valueStyle}>{invoice.student?.full_name || 'N/A'}</span>
              </div>
              <div>
                <span style={labelStyle}>Adm No: </span>
                <span style={valueStyle}>{invoice.student?.admission_number || 'N/A'}</span>
              </div>
              <div>
                <span style={labelStyle}>Father: </span>
                <span style={valueStyle}>{invoice.student?.parent_name || '--'}</span>
              </div>
              <div>
                <span style={labelStyle}>Class: </span>
                <span style={valueStyle}>{invoice.student?.class_name} {invoice.student?.section}</span>
              </div>
            </div>

            {/* Fee Particulars Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '11px' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '30px' }}>S.No</th>
                  <th style={thStyle}>Particulars</th>
                  <th style={thRight}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.components || []).length > 0 ? (invoice.components || []).map((c, idx) => (
                  <tr key={c.fee_type}>
                    <td style={tdStyle}>{idx + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>{c.fee_type}</td>
                    <td style={tdRight}>{formatINR(Number(c.amount))}</td>
                  </tr>
                )) : (
                  <tr>
                    <td style={tdStyle}>1</td>
                    <td style={{ ...tdStyle, fontWeight: 500 }}>Fee Payment</td>
                    <td style={tdRight}>{formatINR(totalFees)}</td>
                  </tr>
                )}
                <tr style={{ background: '#f5f5f5' }}>
                  <td colSpan={2} style={{ ...tdStyle, fontWeight: 700 }}>Total</td>
                  <td style={{ ...tdRight, fontWeight: 800, fontSize: '12px' }}>₹{formatINR(totalFees)}</td>
                </tr>
              </tbody>
            </table>

            {/* Payment Summary */}
            <div style={{ marginBottom: '12px', padding: '10px 12px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '11px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '3px 12px' }}>
                <span>Total Fees</span>
                <span style={{ textAlign: 'right', fontFamily: "'Courier New', monospace", fontWeight: 600 }}>₹{formatINR(totalFees)}</span>

                <span style={{ fontWeight: 700, color: '#16a34a' }}>Current Payment</span>
                <span style={{ textAlign: 'right', fontFamily: "'Courier New', monospace", fontWeight: 700, color: '#16a34a' }}>₹{formatINR(currentPayment)}</span>

                <span style={{ fontWeight: 700, borderTop: '1px solid #cbd5e1', paddingTop: '4px', marginTop: '2px', color: remainingBalance > 0 ? '#dc2626' : '#16a34a' }}>Remaining Balance</span>
                <span style={{ textAlign: 'right', fontFamily: "'Courier New', monospace", fontWeight: 700, borderTop: '1px solid #cbd5e1', paddingTop: '4px', marginTop: '2px', color: remainingBalance > 0 ? '#dc2626' : '#16a34a' }}>
                  ₹{formatINR(remainingBalance)}{remainingBalance <= 0 ? ' (Fully Paid)' : ''}
                </span>
              </div>
            </div>

            {/* Amount in Words */}
            <div style={{ fontSize: '11px', marginBottom: '6px' }}>
              <span style={labelStyle}>Amount In Words: </span>
              <span style={valueStyle}>{numberToWords(currentPayment)}</span>
            </div>

            {/* Payment Mode */}
            <div style={{ fontSize: '11px', marginBottom: '4px' }}>
              <span style={labelStyle}>Payment Mode: </span>
              <span style={{ ...valueStyle, textTransform: 'capitalize' }}>{payment.payment_method}</span>
            </div>

            {/* Transaction / Cheque Info */}
            {payment.transaction_id && (
              <div style={{ fontSize: '11px', marginBottom: '4px' }}>
                <span style={labelStyle}>Transaction No: </span>
                <span style={valueStyle}>{payment.transaction_id}</span>
              </div>
            )}
            {payment.cheque_number && (
              <div style={{ fontSize: '11px', marginBottom: '4px' }}>
                <span style={labelStyle}>Cheque No: </span>
                <span style={valueStyle}>{payment.cheque_number}</span>
                {payment.bank_name && <> | <span style={labelStyle}>Bank: </span><span style={valueStyle}>{payment.bank_name}</span></>}
              </div>
            )}


            {/* Disclaimer */}
            <div style={{ fontSize: '10px', color: '#333', marginTop: '10px', lineHeight: 1.5 }}>
              <strong style={{ color: '#dc2626' }}>Note: </strong>
              Parents are requested to preserve this receipt for future clarification. Fees once paid will not be refunded or transferred.
            </div>

            {/* System Note */}
            <div style={{ textAlign: 'center', fontSize: '10px', color: '#dc2626', fontStyle: 'italic', marginTop: '8px' }}>
              This is a system-generated Fee Receipt and does not require any stamp or signature.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
