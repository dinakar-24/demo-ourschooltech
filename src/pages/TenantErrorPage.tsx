import { AlertTriangle, Building2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TenantErrorPageProps {
  message?: string;
}

export default function TenantErrorPage({ message }: TenantErrorPageProps) {
  const isInactive = message === 'inactive';
  const Icon = isInactive ? Building2 : XCircle;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 ${
          isInactive ? 'bg-amber-100' : 'bg-destructive/10'
        }`}>
          <Icon className={`w-8 h-8 ${isInactive ? 'text-amber-600' : 'text-destructive'}`} />
        </div>

        {isInactive ? (
          <>
            <h1 className="text-2xl font-bold text-foreground mb-2">School Currently Inactive</h1>
            <p className="text-muted-foreground mb-6">
              This school's account has been temporarily deactivated. Please contact your school administrator or support for assistance.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-foreground mb-2">School Not Found</h1>
            <p className="text-muted-foreground mb-6">
              No school is registered at this address. Please double-check the URL and try again.
            </p>
          </>
        )}

        <Button
          variant="outline"
          onClick={() => window.location.href = `https://ourschooltech.com`}
        >
          Go to Main Site
        </Button>
      </div>
    </div>
  );
}
