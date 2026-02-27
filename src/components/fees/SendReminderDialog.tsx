import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { sendNotification } from '@/lib/send-notification';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendReminderDialog({ open, onOpenChange }: Props) {
  const schoolId = useEffectiveSchoolId();
  const [target, setTarget] = useState<'pending' | 'overdue'>('pending');
  const [sending, setSending] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  const fetchCount = async (t: 'pending' | 'overdue') => {
    if (!schoolId) return;
    let query = supabase
      .from('fee_invoices')
      .select('student_id', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .neq('status', 'paid');

    if (t === 'overdue') {
      query = query.lt('due_date', new Date().toISOString().split('T')[0]);
    }

    const { count: c } = await query;
    setCount(c || 0);
  };

  const handleTargetChange = (v: 'pending' | 'overdue') => {
    setTarget(v);
    fetchCount(v);
  };

  // Fetch count on open
  const handleOpenChange = (o: boolean) => {
    onOpenChange(o);
    if (o) fetchCount(target);
  };

  const handleSend = async () => {
    if (!schoolId) return;
    setSending(true);
    try {
      // Get distinct student IDs with pending invoices
      let query = supabase
        .from('fee_invoices')
        .select('student_id, balance, students!inner(id, full_name, parent_email, user_id)')
        .eq('school_id', schoolId)
        .neq('status', 'paid');

      if (target === 'overdue') {
        query = query.lt('due_date', new Date().toISOString().split('T')[0]);
      }

      const { data: invoices, error } = await query;
      if (error) throw error;

      // Collect unique student user_ids and parent user_ids
      const userIds = new Set<string>();
      const parentEmails = new Set<string>();

      for (const inv of invoices || []) {
        const student = (inv as any).students;
        if (student?.user_id) userIds.add(student.user_id);
        if (student?.parent_email) parentEmails.add(student.parent_email);
      }

      // Resolve parent user IDs from profiles
      if (parentEmails.size > 0) {
        const { data: parents } = await supabase
          .from('profiles')
          .select('id, email')
          .in('email', Array.from(parentEmails));

        for (const p of parents || []) {
          userIds.add(p.id);
        }
      }

      if (userIds.size === 0) {
        toast.info('No users to notify');
        onOpenChange(false);
        return;
      }

      await sendNotification({
        userIds: Array.from(userIds),
        title: 'Fee Payment Reminder',
        body: target === 'overdue'
          ? 'You have overdue fee payments. Please clear your dues at the earliest.'
          : 'You have pending fee payments. Please make the payment before the due date.',
        type: 'fee_reminder',
        schoolId,
      });

      toast.success(`Reminders sent to ${userIds.size} users`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reminders');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" /> Send Fee Reminders
          </DialogTitle>
          <DialogDescription>Push notifications will be sent to parents and students with outstanding fees.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Send to</Label>
            <Select value={target} onValueChange={(v: any) => handleTargetChange(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">All Pending</SelectItem>
                <SelectItem value="overdue">Only Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {count !== null && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{count}</span> student(s) with {target} fees will be notified.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSend} disabled={sending || count === 0}>
            {sending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Send Reminders
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
