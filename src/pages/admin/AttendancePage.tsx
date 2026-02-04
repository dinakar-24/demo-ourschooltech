import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import {
  CalendarIcon,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

const mockAttendance = [
  { class: 'Class 6-A', present: 40, absent: 2, late: 0, total: 42, percentage: 95.2 },
  { class: 'Class 6-B', present: 38, absent: 1, late: 1, total: 40, percentage: 95.0 },
  { class: 'Class 7-A', present: 42, absent: 2, late: 1, total: 45, percentage: 93.3 },
  { class: 'Class 7-B', present: 41, absent: 2, late: 0, total: 43, percentage: 95.3 },
  { class: 'Class 8-A', present: 40, absent: 3, late: 1, total: 44, percentage: 90.9 },
  { class: 'Class 8-B', present: 40, absent: 1, late: 1, total: 42, percentage: 95.2 },
  { class: 'Class 9-A', present: 43, absent: 2, late: 1, total: 46, percentage: 93.5 },
  { class: 'Class 9-B', present: 42, absent: 1, late: 1, total: 44, percentage: 95.5 },
  { class: 'Class 10-A', present: 45, absent: 2, late: 1, total: 48, percentage: 93.8 },
  { class: 'Class 10-B', present: 43, absent: 1, late: 1, total: 45, percentage: 95.6 },
];

export default function AttendancePage() {
  const [date, setDate] = useState<Date>(new Date());

  const totalStats = mockAttendance.reduce((acc, curr) => ({
    present: acc.present + curr.present,
    absent: acc.absent + curr.absent,
    late: acc.late + curr.late,
    total: acc.total + curr.total,
  }), { present: 0, absent: 0, late: 0, total: 0 });

  const overallPercentage = ((totalStats.present / totalStats.total) * 100).toFixed(1);

  return (
    <AdminLayout title="Attendance">
      <div className="space-y-6 animate-fade-up">
        {/* Date Picker & Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(date, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{overallPercentage}%</p>
              <p className="text-sm text-muted-foreground">Overall Attendance</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-success" />
                </div>
              </div>
              <p className="text-2xl font-bold text-success">{totalStats.present}</p>
              <p className="text-sm text-muted-foreground">Present</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-destructive" />
                </div>
              </div>
              <p className="text-2xl font-bold text-destructive">{totalStats.absent}</p>
              <p className="text-sm text-muted-foreground">Absent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-warning" />
                </div>
              </div>
              <p className="text-2xl font-bold text-warning">{totalStats.late}</p>
              <p className="text-sm text-muted-foreground">Late</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-info" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalStats.total}</p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </CardContent>
          </Card>
        </div>

        {/* Class-wise Attendance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Class-wise Attendance for {format(date, 'dd MMM yyyy')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-center">Present</TableHead>
                  <TableHead className="text-center">Absent</TableHead>
                  <TableHead className="text-center">Late</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Percentage</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAttendance.map((row) => (
                  <TableRow key={row.class}>
                    <TableCell className="font-medium">{row.class}</TableCell>
                    <TableCell className="text-center text-success font-medium">{row.present}</TableCell>
                    <TableCell className="text-center text-destructive font-medium">{row.absent}</TableCell>
                    <TableCell className="text-center text-warning font-medium">{row.late}</TableCell>
                    <TableCell className="text-center">{row.total}</TableCell>
                    <TableCell className="text-center">
                      <span className={
                        row.percentage >= 95 ? 'text-success' :
                        row.percentage >= 90 ? 'text-warning' :
                        'text-destructive'
                      }>
                        {row.percentage}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        row.percentage >= 95 ? 'default' :
                        row.percentage >= 90 ? 'secondary' :
                        'destructive'
                      }>
                        {row.percentage >= 95 ? 'Excellent' :
                         row.percentage >= 90 ? 'Good' :
                         'Needs Attention'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
