import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface FeeReceiptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fee: {
    id: string;
    fee_type: string;
    amount: number;
    paid_date: string | null;
    payment_method: string | null;
    transaction_id: string | null;
    receipt_number: string | null;
    student?: {
      full_name: string;
      class_name: string;
      section: string;
      admission_number: string;
    };
  } | null;
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

export function FeeReceiptDialog({ open, onOpenChange, fee }: FeeReceiptProps) {
  const { school } = useAuth();
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!fee) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !receiptRef.current) return;
    printWindow.document.write(`
      <!DOCTYPE html><html><head>
      <title>Receipt ${fee.receipt_number || ''}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; padding: 20px; color: #1a1a1a; font-size: 13px; }
        @media print { body { padding: 0; } }
      </style></head><body>
      ${receiptRef.current.innerHTML}
      <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const amount = Number(fee.amount);

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
          <div style={{ maxWidth: '650px', margin: '0 auto', border: '2px solid #333', padding: '24px', fontFamily: "'Segoe UI', sans-serif", fontSize: '13px', color: '#1a1a1a' }}>
            <div style={{ textAlign: 'right', fontSize: '11px', color: '#666', fontStyle: 'italic', marginBottom: '8px' }}>
              OFFICE COPY
            </div>

            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              {school?.logo && <img src={school.logo} alt={school.name} style={{ height: '60px', margin: '0 auto 6px', display: 'block' }} />}
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f766e', marginBottom: '2px' }}>{school?.name || 'School Name'}</div>
              <div style={{ fontSize: '11px', color: '#555' }}>{[school?.address, school?.city].filter(Boolean).join(', ')}</div>
              {(school?.phone || school?.email) && (
                <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
                  {school?.phone && <>Tel: {school.phone}</>}
                  {school?.phone && school?.email && ', '}
                  {school?.email && <>Email: {school.email}</>}
                </div>
              )}
            </div>

            <div style={{ fontSize: '15px', fontWeight: 700, textAlign: 'center', margin: '12px 0', padding: '6px', background: '#f0f0f0', border: '1px solid #ccc' }}>
              FEE RECEIPT
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '12px' }}>
              <span><strong>Receipt No:</strong> {fee.receipt_number || 'N/A'}</span>
              <span><strong>Receipt Date:</strong> {fee.paid_date ? new Date(fee.paid_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginBottom: '14px', fontSize: '12px' }}>
              <div><span style={{ color: '#666' }}>Student Name: </span><strong>{fee.student?.full_name || 'N/A'}</strong></div>
              <div><span style={{ color: '#666' }}>Admission No: </span><strong>{fee.student?.admission_number || 'N/A'}</strong></div>
              <div><span style={{ color: '#666' }}>Class: </span><strong>{fee.student?.class_name} {fee.student?.section}</strong></div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px', fontSize: '12px' }}>
              <thead>
                <tr>
                  <th style={{ background: '#f5f5f5', border: '1px solid #ccc', padding: '6px 8px', textAlign: 'left', fontWeight: 600 }}>S.No</th>
                  <th style={{ background: '#f5f5f5', border: '1px solid #ccc', padding: '6px 8px', textAlign: 'left', fontWeight: 600 }}>Particulars</th>
                  <th style={{ background: '#f5f5f5', border: '1px solid #ccc', padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #ccc', padding: '6px 8px' }}>1</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px 8px' }}>{fee.fee_type}</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'right' }}>₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td colSpan={2} style={{ border: '1px solid #ccc', padding: '6px 8px', fontWeight: 700, background: '#fafafa' }}>Total</td>
                  <td style={{ border: '1px solid #ccc', padding: '6px 8px', textAlign: 'right', fontWeight: 700, background: '#fafafa', color: '#0f766e' }}>₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ fontSize: '12px', margin: '8px 0', padding: '6px 8px', background: '#f9f9f9', borderRadius: '4px' }}>
              <strong>Amount In Words:</strong> {numberToWords(amount)}
            </div>

            <div style={{ fontSize: '12px', margin: '8px 0' }}>
              <strong>Payment Mode:</strong> <span style={{ textTransform: 'capitalize' }}>{fee.payment_method || 'Cash'}</span>
              {fee.transaction_id && <span style={{ marginLeft: '16px' }}><strong>Transaction No:</strong> {fee.transaction_id}</span>}
            </div>

            <div style={{ fontSize: '10px', color: '#888', marginTop: '16px', lineHeight: 1.5, borderTop: '1px dashed #ccc', paddingTop: '12px' }}>
              <strong>Note:</strong> Parents are requested to preserve this receipt for future clarification. Fees once paid will not be refunded or transferred. Cheques subject to realization.
            </div>

            <div style={{ textAlign: 'center', fontSize: '10px', color: '#999', marginTop: '12px', fontStyle: 'italic' }}>
              This is a system-generated Fee Receipt and does not require any stamp or signature.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
