import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminQuickActions } from '@/components/admin/AdminQuickActions';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { TodaysSummary } from '@/components/admin/TodaysSummary';
import { PendingTasks } from '@/components/admin/PendingTasks';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectiveSchoolId } from '@/hooks/useEffectiveSchoolId';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { supabase } from '@/integrations/supabase/client';
import { Users, GraduationCap, CreditCard, ClipboardList } from 'lucide-react';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  feeCollected: number;
  attendanceRate: number;
}

export default function AdminDashboard() {
  const { user, school } = useAuth();
  const schoolId = useEffectiveSchoolId();
  const { impersonatedSchool, isImpersonating } = useImpersonation();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    feeCollected: 0,
    attendanceRate: 0,
  });
  const [loading, setLoading] = useState(true);

  const displaySchoolName = isImpersonating ? impersonatedSchool?.name : school?.name;

  useEffect(() => {
    if (schoolId) {
      fetchStats();
    }
  }, [schoolId]);

  const fetchStats = async () => {
    try {
      const [studentsRes, teachersRes, feesRes, attendanceRes] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
        supabase.from('teachers').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
        supabase.from('fees').select('amount').eq('school_id', schoolId).eq('status', 'paid'),
        supabase.from('attendance').select('status').eq('school_id', schoolId).eq('date', new Date().toISOString().split('T')[0]),
      ]);

      const feeTotal = feesRes.data?.reduce((sum, f) => sum + Number(f.amount), 0) || 0;
      const presentCount = attendanceRes.data?.filter(a => a.status === 'present').length || 0;
      const totalAttendance = attendanceRes.data?.length || 0;
      const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

      setStats({
        totalStudents: studentsRes.count || 0,
        totalTeachers: teachersRes.count || 0,
        feeCollected: feeTotal,
        attendanceRate,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount}`;
  };
  
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-5 pb-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {greeting()}, {user?.name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {displaySchoolName || 'Your School'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">Academic Year</p>
            <p className="text-sm font-semibold text-foreground">2024-25</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <AdminStatCard
            title="Students"
            value={loading ? '...' : stats.totalStudents.toLocaleString()}
            icon={<Users className="w-4 h-4" />}
          />
          <AdminStatCard
            title="Teachers"
            value={loading ? '...' : stats.totalTeachers.toLocaleString()}
            icon={<GraduationCap className="w-4 h-4" />}
          />
          <AdminStatCard
            title="Fee Collected"
            value={loading ? '...' : formatCurrency(stats.feeCollected)}
            icon={<CreditCard className="w-4 h-4" />}
          />
          <AdminStatCard
            title="Attendance"
            value={loading ? '...' : `${stats.attendanceRate}%`}
            subtitle="today"
            icon={<ClipboardList className="w-4 h-4" />}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
          <AdminQuickActions />
        </div>

        {/* Pending Tasks */}
        <PendingTasks />

        {/* Today's Summary */}
        <TodaysSummary />
      </div>
    </AdminLayout>
  );
}
