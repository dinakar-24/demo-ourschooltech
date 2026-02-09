import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { School, Users, GraduationCap, CreditCard, TrendingUp, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function SuperAdminDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: loading } = useQuery({
    queryKey: ['super-admin-dashboard-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_super_admin_stats' as any);
      if (error) throw error;
      const r = data as any;
      return {
        totalSchools: Number(r?.totalSchools ?? 0),
        totalStudents: Number(r?.totalStudents ?? 0),
        totalTeachers: Number(r?.totalTeachers ?? 0),
        activeSubscriptions: Number(r?.activeSubscriptions ?? 0),
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <SuperAdminLayout title="Super Admin Dashboard">
      <div className="space-y-6 animate-fade-up">
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Schools"
            value={loading ? '...' : (stats?.totalSchools ?? 0).toString()}
            icon={<Building2 className="w-5 h-5" />}
          />
          <MetricCard
            title="Total Students"
            value={loading ? '...' : (stats?.totalStudents ?? 0).toLocaleString()}
            icon={<Users className="w-5 h-5" />}
          />
          <MetricCard
            title="Total Teachers"
            value={loading ? '...' : (stats?.totalTeachers ?? 0).toLocaleString()}
            icon={<GraduationCap className="w-5 h-5" />}
          />
          <MetricCard
            title="Active Subscriptions"
            value={loading ? '...' : (stats?.activeSubscriptions ?? 0).toString()}
            icon={<CreditCard className="w-5 h-5" />}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="w-5 h-5 text-primary" />
                Recent Schools
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(stats?.totalSchools ?? 0) === 0 ? (
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
