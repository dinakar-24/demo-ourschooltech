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
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1a1a1a; font-size: 13px; }
  .receipt-container { max-width: 650px; margin: 0 auto; border: 2px solid #333; padding: 24px; }
  .office-copy { text-align: right; font-size: 11px; color: #666; font-style: italic; margin-bottom: 8px; }
  .header { text-align: center; margin-bottom: 16px; }
  .header img { height: 60px; margin-bottom: 6px; }
  .school-name { font-size: 22px; font-weight: 700; color: #0f766e; margin-bottom: 2px; }
  .school-address { font-size: 11px; color: #555; }
  .school-contact { font-size: 11px; color: #555; margin-top: 2px; }
  .receipt-title { font-size: 15px; font-weight: 700; text-align: center; margin: 12px 0; padding: 6px; background: #f0f0f0; border: 1px solid #ccc; }
  .meta-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 12px; }
  .student-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; margin-bottom: 14px; font-size: 12px; }
  .student-grid .label { color: #666; }
  .student-grid .value { font-weight: 500; }
  .fee-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 12px; }
  .fee-table th { background: #f5f5f5; border: 1px solid #ccc; padding: 6px 8px; text-align: left; font-weight: 600; }
  .fee-table td { border: 1px solid #ccc; padding: 6px 8px; }
  .fee-table .total-row td { font-weight: 700; background: #fafafa; }
  .amount-words { font-size: 12px; margin: 8px 0; padding: 6px 8px; background: #f9f9f9; border-radius: 4px; }
  .payment-info { font-size: 12px; margin: 8px 0; }
  .note { font-size: 10px; color: #888; margin-top: 16px; line-height: 1.5; border-top: 1px dashed #ccc; padding-top: 12px; }
  .system-note { text-align: center; font-size: 10px; color: #999; margin-top: 12px; font-style: italic; }
  @media print { body { padding: 0; } .receipt-container { border: none; } }
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
          <div className="receipt-container" style={{ maxWidth: '650px', margin: '0 auto', border: '2px solid #333', padding: '24px', fontFamily: "'Segoe UI', sans-serif", fontSize: '13px', color: '#1a1a1a' }}>
            {/* Office Copy */}
            <div style={{ textAlign: 'right', fontSize: '11px', color: '#666', fontStyle: 'italic', marginBottom: '8px' }}>
              OFFICE COPY
            </div>

            {/* School Header */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              {school?.logo && (
                <img src={school.logo} alt={school.name} style={{ height: '60px', margin: '0 auto 6px', display: 'block' }} />
              )}
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f766e', marginBottom: '2px' }}>
                {school?.name || 'School Name'}
              </div>
              <div style={{ fontSize: '11px', color: '#555' }}>
                {[school?.address, school?.city].filter(Boolean).join(', ')}
              </div>
              {(school?.phone || school?.email) && (
                <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
                  {school?.phone && <>Tel: {school.phone}</>}
                  {school?.phone && school?.email && ', '}
                  {school?.email && <>Email: {school.email}</>}
                </div>
              )}
            </div>

            {/* Title */}
            <div style={{ fontSize: '15px', fontWeight: 700, textAlign: 'center', margin: '12px 0', padding: '6px', background: '#f0f0f0', border: '1px solid #ccc' }}>
              FEE RECEIPT
            </div>

            {/* Receipt No & Date */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '12px' }}>
              <span><strong>Receipt No:</strong> {payment.receipt_number}</span>
              <span><strong>Receipt Date:</strong> {new Date(payment.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>

            {/* Student Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginBottom: '14px', fontSize: '12px' }}>
              <div>
                <span style={{ color: '#666' }}>Student Name: </span>
                <strong>{invoice.student?.full_name || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: '#666' }}>Admission No: </span>
                <strong>{invoice.student?.admission_number || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ color: '#666' }}>Class: </span>
                <strong>{invoice.student?.class_name} {invoice.student?.section}</strong>
              </div>
              <div>
                <span style={{ color: '#666' }}>Term: </span>
                <strong>{invoice.term?.name || 'N/A'}</strong>
              </div>
            </div>

            {/* Fee Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th style={{ background: '#f5f5f5', border: '1px solid #ccc', padding: '6px 8px', textAlign: 'left', fontWeight: 600 }}>S.No</th>
                  <th style={{ background: '#f5f5f5', border: '1px solid #ccc', padding: '6px 8px', textAlign: 'left', fontWeight: 600 }}>Particulars</th>
                  <th style={{ background: '#f5f5f5', border: '1px solid #ccc', padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>Fee Due</th>
                  <th style={{ background: '#f5f5f5', border: '1px solid #ccc', padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>Paid</th>
                  <th style={{ background: '#f5f5f5', border: '1px solid #ccc', padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.components || []).map((c, idx) => (
                  <tr key={c.id}>
                    <td style={{ border: '1px solid #ccc', padding: '6px 8px' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 8px' }}>{c.fee_type}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'right' }}>₹{Number(c.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'right' }}>—</td>
                    <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'right' }}>—</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2} style={{ border: '1px solid #ccc', padding: '6px 8px', fontWeight: 700, background: '#fafafa' }}>Total</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'right', fontWeight: 700, background: '#fafafa' }}>₹{Number(invoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'right', fontWeight: 700, background: '#fafafa', color: '#0f766e' }}>₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'right', fontWeight: 700, background: '#fafafa', color: '#dc2626' }}>₹{Number(invoice.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>

            {/* Amount in Words */}
            <div style={{ fontSize: '12px', margin: '8px 0', padding: '6px 8px', background: '#f9f9f9', borderRadius: '4px' }}>
              <strong>Amount In Words:</strong> {numberToWords(totalPaid)}
            </div>

            {/* Payment Info */}
            <div style={{ fontSize: '12px', margin: '8px 0' }}>
              <strong>Payment Mode:</strong> <span style={{ textTransform: 'capitalize' }}>{payment.payment_method}</span>
              {payment.transaction_id && (
                <span style={{ marginLeft: '16px' }}><strong>Transaction No:</strong> {payment.transaction_id}</span>
              )}
              {payment.cheque_number && (
                <span style={{ marginLeft: '16px' }}><strong>Cheque:</strong> {payment.cheque_number} | Bank: {payment.bank_name}</span>
              )}
            </div>

            {payment.received_by && (
              <div style={{ fontSize: '12px', margin: '4px 0' }}>
                <strong>Received By:</strong> {payment.received_by}
              </div>
            )}

            {/* Note */}
            <div style={{ fontSize: '10px', color: '#888', marginTop: '16px', lineHeight: 1.5, borderTop: '1px dashed #ccc', paddingTop: '12px' }}>
              <strong>Note:</strong> Parents are requested to preserve this receipt for future clarification. Fees once paid will not be refunded or transferred. Cheques subject to realization.
            </div>

            {/* System Note */}
            <div style={{ textAlign: 'center', fontSize: '10px', color: '#999', marginTop: '12px', fontStyle: 'italic' }}>
              This is a system-generated Fee Receipt and does not require any stamp or signature.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
