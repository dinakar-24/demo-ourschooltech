import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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

export function FeeReceiptDialog({ open, onOpenChange, fee }: FeeReceiptProps) {
  const { school } = useAuth();
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!fee) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !receiptRef.current) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt ${fee.receipt_number || ''}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #1a1a1a; }
          .receipt { max-width: 600px; margin: 0 auto; border: 2px solid #0f766e; padding: 30px; }
          .header { text-align: center; margin-bottom: 20px; }
          .school-name { font-size: 22px; font-weight: 700; color: #0f766e; }
          .school-details { font-size: 11px; color: #666; margin-top: 4px; }
          .receipt-title { font-size: 16px; font-weight: 600; text-align: center; margin: 16px 0; padding: 8px; background: #f0fdfa; border-radius: 6px; }
          .receipt-no { font-size: 12px; color: #666; text-align: right; margin-bottom: 12px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
          .info-item label { font-size: 11px; color: #888; display: block; }
          .info-item span { font-size: 13px; font-weight: 500; }
          .divider { border-top: 1px dashed #ccc; margin: 16px 0; }
          .amount-row { display: flex; justify-content: space-between; padding: 12px 0; font-size: 18px; font-weight: 700; color: #0f766e; }
          .footer { text-align: center; font-size: 10px; color: #999; margin-top: 20px; }
          .stamp { text-align: right; margin-top: 40px; font-size: 12px; }
          @media print { body { padding: 0; } .receipt { border: none; } }
        </style>
      </head>
      <body>
        ${receiptRef.current.innerHTML}
        <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPDF = () => {
    // Use print-to-PDF approach (browser native)
    handlePrint();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Fee Receipt
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-1" />
                Print
              </Button>
              <Button size="sm" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-1" />
                PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Receipt Preview */}
        <div ref={receiptRef}>
          <div className="receipt" style={{ border: '2px solid hsl(173, 82%, 26%)', padding: '24px', borderRadius: '8px' }}>
            {/* School Header */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              {school?.logo && (
                <img 
                  src={school.logo} 
                  alt={school.name} 
                  style={{ height: '50px', margin: '0 auto 8px', display: 'block' }} 
                />
              )}
              <div className="school-name" style={{ fontSize: '20px', fontWeight: 700, color: 'hsl(173, 82%, 26%)' }}>
                {school?.name || 'School Name'}
              </div>
              <div className="school-details" style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                {school?.address && <span>{school.address}</span>}
                {school?.city && <span> · {school.city}</span>}
              </div>
            </div>

            <Separator className="my-3" />

            {/* Receipt Title */}
            <div style={{ textAlign: 'center', padding: '8px', background: 'hsl(173, 40%, 94%)', borderRadius: '6px', fontWeight: 600, fontSize: '14px', marginBottom: '12px' }}>
              FEE PAYMENT RECEIPT
            </div>

            {/* Receipt Number & Date */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666', marginBottom: '16px' }}>
              <span><strong>Receipt No:</strong> {fee.receipt_number || 'N/A'}</span>
              <span><strong>Date:</strong> {fee.paid_date ? new Date(fee.paid_date).toLocaleDateString('en-IN') : 'N/A'}</span>
            </div>

            {/* Student Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#888' }}>Student Name</div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{fee.student?.full_name || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#888' }}>Admission No</div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{fee.student?.admission_number || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#888' }}>Class & Section</div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{fee.student?.class_name}-{fee.student?.section}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#888' }}>Payment Mode</div>
                <div style={{ fontSize: '13px', fontWeight: 500, textTransform: 'capitalize' }}>{fee.payment_method || 'Cash'}</div>
              </div>
            </div>

            <Separator className="my-3" style={{ borderStyle: 'dashed' }} />

            {/* Fee Breakdown */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                <span>{fee.fee_type}</span>
                <span>₹{Number(fee.amount).toLocaleString()}</span>
              </div>
            </div>

            <Separator className="my-2" />

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '18px', fontWeight: 700, color: 'hsl(173, 82%, 26%)' }}>
              <span>Total Paid</span>
              <span>₹{Number(fee.amount).toLocaleString()}</span>
            </div>

            {fee.transaction_id && (
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                Transaction ID: {fee.transaction_id}
              </div>
            )}

            {/* Signature Area */}
            <div style={{ textAlign: 'right', marginTop: '40px' }}>
              <div style={{ borderTop: '1px solid #ccc', display: 'inline-block', paddingTop: '4px', minWidth: '150px', fontSize: '12px', color: '#666' }}>
                Authorized Signature
              </div>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', fontSize: '10px', color: '#999', marginTop: '16px' }}>
              This is a computer-generated receipt. · Thank you for your payment.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
