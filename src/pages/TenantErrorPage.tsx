import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TenantErrorPageProps {
  message?: string;
}

export default function TenantErrorPage({ message }: TenantErrorPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">School Not Found</h1>
        <p className="text-gray-500 mb-6">
          {message || 'This subdomain does not match any active school. Please check the URL and try again.'}
        </p>
        <Button
          variant="outline"
          onClick={() => window.location.href = `https://${window.location.hostname.includes('ourschooltech.com') ? '' : ''}ourschooltech.com`}
        >
          Go to Main Site
        </Button>
      </div>
    </div>
  );
}
