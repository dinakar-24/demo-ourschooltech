import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ReceiptData {
  verified: boolean;
  receipt_number: string;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  student_name: string;
  admission_number: string;
  class_name: string;
  section: string;
  school_name: string;
  invoice_status: string;
  total_amount: number;
  remaining_balance: number;
}

export default function ReceiptVerificationPage() {
  const { receiptNumber } = useParams<{ receiptNumber: string }>();
  const [data, setData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verify() {
      if (!receiptNumber) {
        setError('No receipt number provided');
        setLoading(false);
        return;
      }
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const resp = await fetch(
          `https://${projectId}.supabase.co/functions/v1/verify-receipt?receipt_number=${encodeURIComponent(receiptNumber)}`,
          {
            headers: {
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        );
        const json = await resp.json();

        if (!resp.ok || !json.verified) {
          setError(json.error || 'Receipt not found or invalid');
        } else {
          setData(json);
        }
      } catch {
        setError('Failed to verify receipt');
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [receiptNumber]);

  const formatINR = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2 });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verifying receipt...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4 bg-card border border-border rounded-xl p-8 shadow-lg">
          <XCircle className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Verification Failed</h1>
          <p className="text-muted-foreground">{error || 'This receipt could not be verified.'}</p>
          <p className="text-sm text-muted-foreground">
            If you believe this is an error, please contact the school administration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-primary p-6 text-center">
          <CheckCircle className="w-12 h-12 text-primary-foreground mx-auto mb-2" />
          <h1 className="text-xl font-bold text-primary-foreground">Receipt Verified</h1>
          <p className="text-primary-foreground/80 text-sm mt-1">This receipt is authentic and valid</p>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          <div className="text-center pb-4 border-b border-border">
            <p className="text-sm text-muted-foreground">School</p>
            <p className="text-lg font-bold text-foreground">{data.school_name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Receipt No</p>
              <p className="font-semibold text-foreground">{data.receipt_number}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Payment Date</p>
              <p className="font-semibold text-foreground">
                {new Date(data.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Student Name</p>
              <p className="font-semibold text-foreground">{data.student_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Admission No</p>
              <p className="font-semibold text-foreground">{data.admission_number}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Class</p>
              <p className="font-semibold text-foreground">{data.class_name} {data.section}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Payment Mode</p>
              <p className="font-semibold text-foreground capitalize">{data.payment_method}</p>
            </div>
          </div>

          {/* Amount */}
          <div className="bg-accent/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Amount Paid</p>
            <p className="text-2xl font-bold text-foreground">₹{formatINR(data.amount_paid)}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-border">
            <div>
              <p className="text-muted-foreground">Total Invoice</p>
              <p className="font-semibold text-foreground">₹{formatINR(data.total_amount)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Balance</p>
              <p className={`font-semibold ${data.remaining_balance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                ₹{formatINR(data.remaining_balance)}
              </p>
            </div>
          </div>

          <div className="text-center pt-4 border-t border-border">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              data.invoice_status === 'paid'
                ? 'bg-green-100 text-green-800'
                : data.invoice_status === 'partial'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
            }`}>
              <CheckCircle className="w-3 h-3" />
              {data.invoice_status === 'paid' ? 'Fully Paid' : data.invoice_status === 'partial' ? 'Partially Paid' : 'Pending'}
            </span>
          </div>
        </div>

        <div className="bg-muted/50 px-6 py-3 text-center text-xs text-muted-foreground">
          Verified by Our School Tech • {new Date().toLocaleDateString('en-IN')}
        </div>
      </div>
    </div>
  );
}
