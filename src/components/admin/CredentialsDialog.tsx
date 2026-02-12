import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export interface CreatedAccount {
  role: string;
  email: string;
  password: string;
  name: string;
}

interface CredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: CreatedAccount[];
  studentName: string;
}

export function CredentialsDialog({ open, onOpenChange, accounts, studentName }: CredentialsDialogProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAll = () => {
    const text = accounts.map(a =>
      `${a.role} Login:\nName: ${a.name}\nEmail: ${a.email}\nPassword: ${a.password}`
    ).join('\n\n');
    navigator.clipboard.writeText(text);
    toast.success('All credentials copied');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-success" />
            Accounts Created
          </DialogTitle>
          <DialogDescription>
            Login credentials for <strong>{studentName}</strong>. Share these with the respective users.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {accounts.map((account, index) => (
            <div key={index} className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant={account.role === 'Student' ? 'default' : 'secondary'}>
                  {account.role}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(
                    `Email: ${account.email}\nPassword: ${account.password}`,
                    index
                  )}
                >
                  {copiedIndex === index ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Name:</span> {account.name}</p>
                <p><span className="text-muted-foreground">Email:</span> <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{account.email}</code></p>
                <p><span className="text-muted-foreground">Password:</span> <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{account.password}</code></p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={copyAll}>
            <Copy className="w-4 h-4 mr-2" />
            Copy All
          </Button>
          <Button className="flex-1" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
