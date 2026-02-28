import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { FeePayment, FeeInvoice } from '@/hooks/useFeeInvoices';

interface PaymentReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: FeePayment | null;
  invoice: FeeInvoice | null;
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

const printStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1a1a1a; font-size: 13px; background: #fff; }
  @media print { body { padding: 0; } .receipt-outer { box-shadow: none !important; border: none !important; } }
`;

export function PaymentReceiptDialog({ open, onOpenChange, payment, invoice }: PaymentReceiptDialogProps) {
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

  const totalPaid = Number(payment.amount);
  const paymentDate = new Date(payment.payment_date);
  const createdAt = new Date(payment.created_at);
  const formattedDate = paymentDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const formattedTime = createdAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const labelStyle: React.CSSProperties = { fontWeight: 700, fontSize: '12px', color: '#1a1a1a' };
  const valueStyle: React.CSSProperties = { fontSize: '12px', color: '#1a1a1a' };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Fee Receipt
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-1" /> Print
              </Button>
              <Button size="sm" onClick={handlePrint}>
                <Download className="w-4 h-4 mr-1" /> PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div ref={receiptRef}>
          <div className="receipt-outer" style={{ margin: '0 auto', border: '2px solid #333', fontFamily: "'Segoe UI', sans-serif", fontSize: '13px', color: '#1a1a1a', background: '#fff', padding: '16px' }}>

            {/* OFFICE COPY - top right */}
            <div style={{ textAlign: 'right', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#dc2626', fontStyle: 'italic' }}>
                OFFICE COPY
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

            {/* Simplified Fee Table - 3 columns for mobile */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '11px' }}>
              <thead>
                <tr>
                  <th style={{ border: '1.5px solid #222', padding: '6px 8px', textAlign: 'left', fontWeight: 700, fontSize: '11px', background: '#f5f5f5' }}>
                    Particulars
                  </th>
                  <th style={{ border: '1.5px solid #222', padding: '6px 8px', textAlign: 'right', fontWeight: 700, fontSize: '11px', background: '#f5f5f5' }}>
                    Amount
                  </th>
                  <th style={{ border: '1.5px solid #222', padding: '6px 8px', textAlign: 'right', fontWeight: 700, fontSize: '11px', background: '#e8f5e9' }}>
                    Paid
                  </th>
                </tr>
              </thead>
              <tbody>
                {(invoice.components || []).map((c, idx) => {
                  const compAmount = Number(c.amount);
                  return (
                    <tr key={c.id}>
                      <td style={{ border: '1px solid #999', padding: '6px 8px', fontSize: '11px', fontWeight: 500 }}>{c.fee_type}</td>
                      <td style={{ border: '1px solid #999', padding: '6px 8px', fontSize: '11px', textAlign: 'right', fontFamily: "'Courier New', monospace" }}>
                        {compAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ border: '1px solid #999', padding: '6px 8px', fontSize: '11px', textAlign: 'right', fontWeight: 700, fontFamily: "'Courier New', monospace" }}>
                        {idx === 0 ? totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                      </td>
                    </tr>
                  );
                })}
                {(!invoice.components || invoice.components.length === 0) && (
                  <tr>
                    <td style={{ border: '1px solid #999', padding: '6px 8px', fontSize: '11px' }}>Fee Payment</td>
                    <td style={{ border: '1px solid #999', padding: '6px 8px', fontSize: '11px', textAlign: 'right', fontFamily: "'Courier New', monospace" }}>
                      {Number(invoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ border: '1px solid #999', padding: '6px 8px', fontSize: '11px', textAlign: 'right', fontWeight: 700, fontFamily: "'Courier New', monospace" }}>
                      {totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}
                {/* Total Row */}
                <tr style={{ background: '#f5f5f5' }}>
                  <td style={{ border: '1px solid #999', padding: '6px 8px', fontWeight: 700, fontSize: '11px' }}>Total</td>
                  <td style={{ border: '1px solid #999', padding: '6px 8px', fontWeight: 800, fontSize: '12px', textAlign: 'right', fontFamily: "'Courier New', monospace" }}>
                    {Number(invoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ border: '1px solid #999', padding: '6px 8px', fontWeight: 800, fontSize: '12px', textAlign: 'right', fontFamily: "'Courier New', monospace" }}>
                    {totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Balance */}
            {Number(invoice.balance) > 0 && (
              <div style={{ fontSize: '12px', marginBottom: '6px', padding: '6px 10px', background: '#fff3cd', borderRadius: '4px', border: '1px solid #ffc107' }}>
                <span style={labelStyle}>Balance Due: </span>
                <span style={{ ...valueStyle, fontWeight: 700, color: '#dc2626' }}>₹{Number(invoice.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {/* Amount in Words */}
            <div style={{ fontSize: '11px', marginBottom: '6px' }}>
              <span style={labelStyle}>Amount In Words: </span>
              <span style={valueStyle}>{numberToWords(totalPaid)}</span>
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
            <div style={{ fontSize: '10px', color: '#333', marginTop: '16px', lineHeight: 1.6 }}>
              <strong style={{ color: '#dc2626' }}>Note: </strong>
              Parents are requested to preserve this receipt for future clarification. Fees once paid will not be refunded or transferred.
            </div>

            {/* Divider */}
            <hr style={{ border: 'none', borderTop: '1px solid #999', margin: '10px 0 8px' }} />

            {/* System Note */}
            <div style={{ textAlign: 'center', fontSize: '10px', color: '#555', fontStyle: 'italic' }}>
              This is a system-generated Fee Receipt and does not require any stamp or signature.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
