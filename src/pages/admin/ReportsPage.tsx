import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  FileText,
  Users,
  CreditCard,
  ClipboardList,
  Award,
  TrendingUp,
  BarChart3,
  PieChart,
} from 'lucide-react';

const reportCategories = [
  {
    title: 'Student Reports',
    icon: Users,
    color: 'bg-primary/10 text-primary',
    reports: [
      { name: 'Student List Report', description: 'Complete list of all enrolled students' },
      { name: 'Class-wise Report', description: 'Students categorized by class and section' },
      { name: 'Admission Report', description: 'New admissions by date range' },
    ],
  },
  {
    title: 'Attendance Reports',
    icon: ClipboardList,
    color: 'bg-success/10 text-success',
    reports: [
      { name: 'Daily Attendance', description: 'Day-wise attendance summary' },
      { name: 'Monthly Report', description: 'Monthly attendance percentage' },
      { name: 'Absentee Report', description: 'List of absent students' },
    ],
  },
  {
    title: 'Fee Reports',
    icon: CreditCard,
    color: 'bg-warning/10 text-warning',
    reports: [
      { name: 'Collection Report', description: 'Fee collection summary' },
      { name: 'Pending Dues', description: 'List of pending fee payments' },
      { name: 'Payment History', description: 'Complete payment transaction history' },
    ],
  },
  {
    title: 'Academic Reports',
    icon: Award,
    color: 'bg-info/10 text-info',
    reports: [
      { name: 'Exam Results', description: 'Subject-wise exam results' },
      { name: 'Report Cards', description: 'Generate student report cards' },
      { name: 'Performance Analysis', description: 'Class-wise performance comparison' },
    ],
  },
];

export default function ReportsPage() {
  return (
    <AdminLayout title="Reports">
      <div className="space-y-6 animate-fade-up">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">156</p>
                  <p className="text-sm text-muted-foreground">Reports Generated</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Download className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">89</p>
                  <p className="text-sm text-muted-foreground">Downloads</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-sm text-muted-foreground">Custom Reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">5</p>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Select defaultValue="2024-25">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Academic Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024-25">2024-25</SelectItem>
              <SelectItem value="2023-24">2023-24</SelectItem>
              <SelectItem value="2022-23">2022-23</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              <SelectItem value="6">Class 6</SelectItem>
              <SelectItem value="7">Class 7</SelectItem>
              <SelectItem value="8">Class 8</SelectItem>
              <SelectItem value="9">Class 9</SelectItem>
              <SelectItem value="10">Class 10</SelectItem>
            </SelectContent>
          </Select>
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
                    key={report.name}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{report.name}</p>
                      <p className="text-xs text-muted-foreground">{report.description}</p>
                    </div>
                    <Button size="sm" variant="outline">
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
            <Button>
              <FileText className="w-4 h-4 mr-2" />
              Create Custom Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
