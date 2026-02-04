import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { School, Users, GraduationCap, CreditCard, TrendingUp, Building2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
}

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalSchools: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalAdmins: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [schoolsRes, studentsRes, teachersRes] = await Promise.all([
        supabase.from('schools').select('id', { count: 'exact' }),
        supabase.from('students').select('id', { count: 'exact' }),
        supabase.from('teachers').select('id', { count: 'exact' }),
      ]);

      setStats({
        totalSchools: schoolsRes.count || 0,
        totalStudents: studentsRes.count || 0,
        totalTeachers: teachersRes.count || 0,
        totalAdmins: 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SuperAdminLayout title="Super Admin Dashboard">
      <div className="space-y-6 animate-fade-up">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-display font-bold text-foreground">
              Welcome back, Super Admin! 🔐
            </h2>
            <p className="text-muted-foreground">
              Here's an overview of all schools in the system.
            </p>
          </div>
        </div>

        {/* System-wide Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Schools"
            value={loading ? '...' : stats.totalSchools.toString()}
            icon={<Building2 className="w-5 h-5" />}
          />
          <MetricCard
            title="Total Students"
            value={loading ? '...' : stats.totalStudents.toLocaleString()}
            icon={<Users className="w-5 h-5" />}
          />
          <MetricCard
            title="Total Teachers"
            value={loading ? '...' : stats.totalTeachers.toLocaleString()}
            icon={<GraduationCap className="w-5 h-5" />}
          />
          <MetricCard
            title="Active Subscriptions"
            value="0"
            icon={<CreditCard className="w-5 h-5" />}
          />
        </div>

        {/* Quick Stats Cards */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="w-5 h-5 text-primary" />
                Recent Schools
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.totalSchools === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No schools registered yet</p>
                  <p className="text-sm mt-1">Add your first school to get started</p>
                </div>
              ) : (
                <p className="text-muted-foreground">Schools will appear here</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Database</span>
                  <span className="text-sm font-medium text-success">Healthy</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Authentication</span>
                  <span className="text-sm font-medium text-success">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Storage</span>
                  <span className="text-sm font-medium text-success">Available</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
