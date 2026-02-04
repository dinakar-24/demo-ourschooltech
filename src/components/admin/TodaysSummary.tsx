import { useEffect, useState } from 'react';
import { ClipboardCheck, CreditCard, UserPlus, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SummaryData {
  attendanceMarked: number;
  totalClasses: number;
  feesCollected: number;
  newAdmissions: number;
  noticesSent: number;
}

export function TodaysSummary() {
  const { school } = useAuth();
  const [data, setData] = useState<SummaryData>({
    attendanceMarked: 0,
    totalClasses: 0,
    feesCollected: 0,
    newAdmissions: 0,
    noticesSent: 0,
  });

  useEffect(() => {
    if (school?.id) fetchData();
  }, [school?.id]);

  const fetchData = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const [feesRes, admissionsRes, noticesRes] = await Promise.all([
      supabase.from('fees').select('amount').eq('status', 'paid').gte('paid_date', today),
      supabase.from('students').select('id', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('announcements').select('id', { count: 'exact', head: true }).gte('created_at', today),
    ]);

    setData({
      attendanceMarked: 0,
      totalClasses: 15,
      feesCollected: feesRes.data?.reduce((sum, f) => sum + Number(f.amount), 0) || 0,
      newAdmissions: admissionsRes.count || 0,
      noticesSent: noticesRes.count || 0,
    });
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
    return `₹${amount}`;
  };

  const todayItems = [
    { 
      label: 'Fees Collected', 
      value: formatCurrency(data.feesCollected), 
      icon: CreditCard,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
    { 
      label: 'New Admissions', 
      value: `${data.newAdmissions} students`, 
      icon: UserPlus,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    { 
      label: 'Notices Sent', 
      value: `${data.noticesSent} announcements`, 
      icon: Bell,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10'
    },
  ];

  return (
    <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground mb-3">Today's Activity</h3>
      <div className="space-y-3">
        {todayItems.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center`}>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
