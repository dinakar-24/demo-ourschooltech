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
  @media print { body { padding: 0; } .receipt-outer { box-shadow: none !important; } }
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

  const thStyle: React.CSSProperties = {
    background: '#1a1a2e', color: '#fff', border: '1px solid #1a1a2e',
    padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: '11px',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  };
  const thStyleRight: React.CSSProperties = { ...thStyle, textAlign: 'right' };
  const tdStyle: React.CSSProperties = { border: '1px solid #e0e0e0', padding: '8px 10px', fontSize: '12px' };
  const tdStyleRight: React.CSSProperties = { ...tdStyle, textAlign: 'right', fontFamily: "'Courier New', monospace" };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
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
          <div className="receipt-outer" style={{ maxWidth: '680px', margin: '0 auto', border: '2px solid #1a1a2e', fontFamily: "'Segoe UI', sans-serif", fontSize: '13px', color: '#1a1a1a', background: '#fff' }}>
            {/* Top accent bar */}
            <div style={{ height: '4px', background: 'linear-gradient(90deg, #0f766e, #14b8a6, #0f766e)' }} />

            <div style={{ padding: '24px' }}>
              {/* Office Copy tag */}
              <div style={{ textAlign: 'right', marginBottom: '4px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#fff', background: '#6b7280', padding: '2px 8px', borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Office Copy
                </span>
              </div>

              {/* School Header */}
              <div style={{ textAlign: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '2px solid #e5e7eb' }}>
                {school?.logo && (
                  <img src={school.logo} alt={school.name} style={{ height: '56px', margin: '0 auto 8px', display: 'block', objectFit: 'contain' }} />
                )}
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f766e', letterSpacing: '0.5px', marginBottom: '4px' }}>
                  {school?.name || 'School Name'}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: 1.6 }}>
                  {[school?.address, school?.city].filter(Boolean).join(', ')}
                </div>
                {(school?.phone || school?.email) && (
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                    {school?.phone && <>Tel: {school.phone}</>}
                    {school?.phone && school?.email && ' | '}
                    {school?.email && <>Email: {school.email}</>}
                  </div>
                )}
              </div>

              {/* Title Banner */}
              <div style={{ textAlign: 'center', margin: '0 0 16px', padding: '8px', background: '#0f766e', borderRadius: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff', letterSpacing: '2px', textTransform: 'uppercase' }}>
                  Fee Receipt
                </span>
              </div>

              {/* Receipt Meta Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '14px', padding: '8px 12px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                <div>
                  <span style={{ color: '#6b7280' }}>Receipt No: </span>
                  <strong style={{ color: '#0f766e' }}>{payment.receipt_number}</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: '#6b7280' }}>Date: </span>
                  <strong>{formattedDate}</strong>
                  <span style={{ color: '#9ca3af', marginLeft: '6px', fontSize: '11px' }}>{formattedTime}</span>
                </div>
              </div>

              {/* Student Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', marginBottom: '16px', fontSize: '12px', padding: '10px 12px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student Name</span>
                  <div style={{ fontWeight: 700, marginTop: '2px' }}>{invoice.student?.full_name || 'N/A'}</div>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Admission No</span>
                  <div style={{ fontWeight: 700, marginTop: '2px' }}>{invoice.student?.admission_number || 'N/A'}</div>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Class</span>
                  <div style={{ fontWeight: 700, marginTop: '2px' }}>{invoice.student?.class_name} {invoice.student?.section}</div>
                </div>
                <div>
                  <span style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Due Date</span>
                  <div style={{ fontWeight: 700, marginTop: '2px' }}>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-IN') : 'N/A'}</div>
                </div>
              </div>

              {/* Fee Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: '40px' }}>S.No</th>
                    <th style={thStyle}>Particulars</th>
                    <th style={thStyleRight}>Fee Due</th>
                    <th style={thStyleRight}>Paid</th>
                    <th style={thStyleRight}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.components || []).map((c, idx) => (
                    <tr key={c.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={tdStyle}>{idx + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: 500 }}>{c.fee_type}</td>
                      <td style={tdStyleRight}>₹{Number(c.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td style={{ ...tdStyleRight, color: '#9ca3af' }}>—</td>
                      <td style={{ ...tdStyleRight, color: '#9ca3af' }}>—</td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr>
                    <td colSpan={2} style={{ ...tdStyle, fontWeight: 700, background: '#f1f5f9', fontSize: '13px' }}>Total</td>
                    <td style={{ ...tdStyleRight, fontWeight: 700, background: '#f1f5f9', fontSize: '13px' }}>
                      ₹{Number(invoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ ...tdStyleRight, fontWeight: 700, background: '#f1f5f9', color: '#0f766e', fontSize: '13px' }}>
                      ₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ ...tdStyleRight, fontWeight: 700, background: '#f1f5f9', color: '#dc2626', fontSize: '13px' }}>
                      ₹{Number(invoice.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Amount in Words */}
              <div style={{ fontSize: '12px', margin: '0 0 12px', padding: '8px 12px', background: '#ecfdf5', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                <strong>Amount In Words:</strong> {numberToWords(totalPaid)}
              </div>

              {/* Payment Info */}
              <div style={{ fontSize: '12px', margin: '0 0 8px', padding: '10px 12px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 24px' }}>
                  <div>
                    <span style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase' }}>Payment Mode</span>
                    <div style={{ fontWeight: 600, textTransform: 'capitalize', marginTop: '2px' }}>{payment.payment_method}</div>
                  </div>
                  {payment.transaction_id && (
                    <div>
                      <span style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase' }}>Transaction No</span>
                      <div style={{ fontWeight: 600, marginTop: '2px', fontFamily: "'Courier New', monospace" }}>{payment.transaction_id}</div>
                    </div>
                  )}
                  {payment.cheque_number && (
                    <>
                      <div>
                        <span style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase' }}>Cheque No</span>
                        <div style={{ fontWeight: 600, marginTop: '2px' }}>{payment.cheque_number}</div>
                      </div>
                      {payment.bank_name && (
                        <div>
                          <span style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase' }}>Bank</span>
                          <div style={{ fontWeight: 600, marginTop: '2px' }}>{payment.bank_name}</div>
                        </div>
                      )}
                    </>
                  )}
                  {payment.received_by && (
                    <div>
                      <span style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase' }}>Received By</span>
                      <div style={{ fontWeight: 600, marginTop: '2px' }}>{payment.received_by}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Disclaimer */}
              <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '16px', lineHeight: 1.6, borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
                <strong style={{ color: '#6b7280' }}>Note:</strong> Parents are requested to preserve this receipt for future clarification. Fees once paid will not be refunded or transferred. Cheques subject to realization.
              </div>

              {/* System Note */}
              <div style={{ textAlign: 'center', fontSize: '10px', color: '#a1a1aa', marginTop: '10px', fontStyle: 'italic' }}>
                This is a system-generated Fee Receipt and does not require any stamp or signature.
              </div>
            </div>

            {/* Bottom accent bar */}
            <div style={{ height: '4px', background: 'linear-gradient(90deg, #0f766e, #14b8a6, #0f766e)' }} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
