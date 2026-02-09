import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Download,
  Users,
  CreditCard,
  ClipboardList,
  Award,
  TrendingUp,
  FileText,
  IndianRupee,
} from 'lucide-react';
import { useSchoolReportStats } from '@/hooks/useSchoolReportStats';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const reportCategories = [
  {
    title: 'Student Reports',
    icon: Users,
    color: 'bg-primary/10 text-primary',
    reports: [
      { name: 'Student List Report', description: 'Complete list of all enrolled students', key: 'student-list' },
      { name: 'Class-wise Report', description: 'Students categorized by class and section', key: 'class-wise' },
    ],
  },
  {
    title: 'Attendance Reports',
    icon: ClipboardList,
    color: 'bg-success/10 text-success',
    reports: [
      { name: 'Daily Attendance', description: 'Day-wise attendance summary', key: 'daily-attendance' },
      { name: 'Absentee Report', description: 'List of absent students', key: 'absentee' },
    ],
  },
  {
    title: 'Fee Reports',
    icon: CreditCard,
    color: 'bg-warning/10 text-warning',
    reports: [
      { name: 'Collection Report', description: 'Fee collection summary', key: 'fee-collection' },
      { name: 'Pending Dues', description: 'List of pending fee payments', key: 'pending-dues' },
    ],
  },
  {
    title: 'Academic Reports',
    icon: Award,
    color: 'bg-info/10 text-info',
    reports: [
      { name: 'Exam Results', description: 'Subject-wise exam results', key: 'exam-results' },
      { name: 'Performance Analysis', description: 'Class-wise performance comparison', key: 'performance' },
    ],
  },
];

export default function ReportsPage() {
  const { data: stats, isLoading } = useSchoolReportStats();

  const handleGenerate = (reportKey: string) => {
    toast.info('Report generation is coming soon. This feature will export data as CSV/PDF.');
  };

  return (
    <AdminLayout title="Reports">
      <div className="space-y-6 animate-fade-up">
        {/* Quick Stats from real data */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  {isLoading ? <Skeleton className="h-8 w-12" /> : (
                    <p className="text-2xl font-bold">{stats?.totalStudents ?? 0}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-success" />
                </div>
                <div>
                  {isLoading ? <Skeleton className="h-8 w-12" /> : (
                    <p className="text-2xl font-bold">{stats?.attendanceToday.present ?? 0}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Present Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-warning" />
                </div>
                <div>
                  {isLoading ? <Skeleton className="h-8 w-12" /> : (
                    <p className="text-2xl font-bold">₹{((stats?.totalFeeCollected ?? 0) / 1000).toFixed(0)}k</p>
                  )}
                  <p className="text-sm text-muted-foreground">Collected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  {isLoading ? <Skeleton className="h-8 w-12" /> : (
                    <p className="text-2xl font-bold">₹{((stats?.totalFeePending ?? 0) / 1000).toFixed(0)}k</p>
                  )}
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Categories */}
        <div className="grid md:grid-cols-2 gap-6">
          {reportCategories.map((category) => (
            <Card key={category.title}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${category.color}`}>
                    <category.icon className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {category.reports.map((report) => (
                  <div 
                    key={report.key}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{report.name}</p>
                      <p className="text-xs text-muted-foreground">{report.description}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleGenerate(report.key)}>
                      <Download className="w-4 h-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Custom Report Builder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Custom Report Builder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Create custom reports by selecting specific data fields and filters.
            </p>
            <Button onClick={() => toast.info('Custom report builder coming soon')}>
              <FileText className="w-4 h-4 mr-2" />
              Create Custom Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
