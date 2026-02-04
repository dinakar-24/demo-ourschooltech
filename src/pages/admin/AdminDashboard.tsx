import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminQuickActions } from '@/components/admin/AdminQuickActions';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { TodaysSummary } from '@/components/admin/TodaysSummary';
import { PendingTasks } from '@/components/admin/PendingTasks';
import { useAuth } from '@/contexts/AuthContext';
import { Users, GraduationCap, CreditCard, ClipboardList } from 'lucide-react';

export default function AdminDashboard() {
  const { user, school } = useAuth();
  
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-5 pb-6">
        {/* Welcome Section - Compact for mobile */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {greeting()}, {user?.name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {school?.name || 'Your School'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-muted-foreground">Academic Year</p>
            <p className="text-sm font-semibold text-foreground">2024-25</p>
          </div>
        </div>

        {/* Stats Grid - 2x2 on mobile */}
        <div className="grid grid-cols-2 gap-3">
          <AdminStatCard
            title="Students"
            value="1,248"
            trendValue="5.2%"
            trend="up"
            subtitle="this month"
            icon={<Users className="w-4 h-4" />}
          />
          <AdminStatCard
            title="Teachers"
            value="86"
            trendValue="2"
            trend="up"
            subtitle="new"
            icon={<GraduationCap className="w-4 h-4" />}
          />
          <AdminStatCard
            title="Fee Collected"
            value="₹18.5L"
            trendValue="12%"
            trend="up"
            subtitle="this month"
            icon={<CreditCard className="w-4 h-4" />}
          />
          <AdminStatCard
            title="Attendance"
            value="92.4%"
            trendValue="1.2%"
            trend="down"
            subtitle="today"
            icon={<ClipboardList className="w-4 h-4" />}
          />
        </div>

        {/* Quick Actions - App-style grid */}
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
