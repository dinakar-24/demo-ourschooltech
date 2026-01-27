import { AdminLayout } from '@/components/layout/AdminLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { AttendanceOverview } from '@/components/dashboard/AttendanceOverview';
import { FeesSummary } from '@/components/dashboard/FeesSummary';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';
import { useAuth } from '@/contexts/AuthContext';
import { Users, GraduationCap, CreditCard, ClipboardList } from 'lucide-react';

export default function AdminDashboard() {
  const { user, school } = useAuth();

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6 animate-fade-up">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">
              Good morning, {user?.name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-muted-foreground">
              Here's what's happening at {school?.name} today.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Academic Year: <span className="font-medium text-foreground">2024-25</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Students"
            value="1,248"
            change={5.2}
            trend="up"
            changeLabel="this month"
            icon={<Users className="w-5 h-5" />}
          />
          <MetricCard
            title="Total Teachers"
            value="86"
            change={2}
            trend="up"
            changeLabel="new joins"
            icon={<GraduationCap className="w-5 h-5" />}
          />
          <MetricCard
            title="Fee Collected"
            value="₹18.5L"
            change={12.4}
            trend="up"
            changeLabel="this month"
            icon={<CreditCard className="w-5 h-5" />}
          />
          <MetricCard
            title="Attendance Today"
            value="92.4%"
            change={-1.2}
            trend="down"
            changeLabel="vs yesterday"
            icon={<ClipboardList className="w-5 h-5" />}
          />
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width on large screens */}
          <div className="lg:col-span-2 space-y-6">
            <AttendanceOverview />
            <FeesSummary />
          </div>

          {/* Right Column - 1/3 width on large screens */}
          <div className="space-y-6">
            <RecentActivity />
            <UpcomingEvents />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
