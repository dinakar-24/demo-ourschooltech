import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Download, Printer } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { FeePayment, FeeInvoice } from '@/hooks/useFeeInvoices';

interface PaymentReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: FeePayment | null;
  invoice: FeeInvoice | null;
}

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
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; padding: 20px; color: #1a1a1a; }
        .receipt { max-width: 600px; margin: 0 auto; border: 2px solid #0f766e; padding: 30px; }
        .header { text-align: center; margin-bottom: 20px; }
        .school-name { font-size: 22px; font-weight: 700; color: #0f766e; }
        .school-details { font-size: 11px; color: #666; margin-top: 4px; }
        .receipt-title { font-size: 16px; font-weight: 600; text-align: center; margin: 16px 0; padding: 8px; background: #f0fdfa; border-radius: 6px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
        .info-item label { font-size: 11px; color: #888; display: block; }
        .info-item span { font-size: 13px; font-weight: 500; }
        .divider { border-top: 1px dashed #ccc; margin: 16px 0; }
        .amount-row { display: flex; justify-content: space-between; padding: 12px 0; font-size: 18px; font-weight: 700; color: #0f766e; }
        .footer { text-align: center; font-size: 10px; color: #999; margin-top: 20px; }
        @media print { body { padding: 0; } .receipt { border: none; } }
      </style></head><body>
      ${receiptRef.current.innerHTML}
      <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Payment Receipt
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
          <div style={{ border: '2px solid hsl(173, 82%, 26%)', padding: '24px', borderRadius: '8px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              {school?.logo && <img src={school.logo} alt={school.name} style={{ height: '50px', margin: '0 auto 8px', display: 'block' }} />}
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'hsl(173, 82%, 26%)' }}>{school?.name || 'School'}</div>
              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                {school?.address && <span>{school.address}</span>}
                {school?.city && <span> · {school.city}</span>}
              </div>
            </div>

            <Separator className="my-3" />

            <div style={{ textAlign: 'center', padding: '8px', background: 'hsl(173, 40%, 94%)', borderRadius: '6px', fontWeight: 600, fontSize: '14px', marginBottom: '12px' }}>
              FEE PAYMENT RECEIPT
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666', marginBottom: '16px' }}>
              <span><strong>Receipt No:</strong> {payment.receipt_number}</span>
              <span><strong>Date:</strong> {new Date(payment.payment_date).toLocaleDateString('en-IN')}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#888' }}>Student Name</div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{invoice.student?.full_name || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#888' }}>Admission No</div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{invoice.student?.admission_number || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#888' }}>Class & Section</div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{invoice.student?.class_name}-{invoice.student?.section}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#888' }}>Payment Mode</div>
                <div style={{ fontSize: '13px', fontWeight: 500, textTransform: 'capitalize' }}>{payment.payment_method}</div>
              </div>
            </div>

            {payment.transaction_id && (
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>Transaction ID: {payment.transaction_id}</div>
            )}
            {payment.cheque_number && (
              <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>Cheque: {payment.cheque_number} | Bank: {payment.bank_name}</div>
            )}

            <Separator className="my-3" style={{ borderStyle: 'dashed' }} />

            {/* Fee Components */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginBottom: '4px' }}>Term: {invoice.term?.name || 'N/A'}</div>
              {(invoice.components || []).map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
                  <span>{c.fee_type}</span>
                  <span>₹{Number(c.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <Separator className="my-2" />

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', color: '#666' }}>
              <span>Invoice Total</span>
              <span>₹{Number(invoice.total_amount).toLocaleString()}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '18px', fontWeight: 700, color: 'hsl(173, 82%, 26%)' }}>
              <span>Amount Paid</span>
              <span>₹{Number(payment.amount).toLocaleString()}</span>
            </div>

            {payment.received_by && (
              <div style={{ fontSize: '11px', color: '#888' }}>Received By: {payment.received_by}</div>
            )}

            <div style={{ textAlign: 'right', marginTop: '40px' }}>
              <div style={{ borderTop: '1px solid #ccc', display: 'inline-block', paddingTop: '4px', minWidth: '150px', fontSize: '12px', color: '#666' }}>
                Authorized Signature
              </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '10px', color: '#999', marginTop: '16px' }}>
              This is a computer-generated receipt. · Thank you for your payment.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
