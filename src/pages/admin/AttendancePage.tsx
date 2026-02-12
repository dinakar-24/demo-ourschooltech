import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
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
  Loader2,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAdminAttendance } from '@/hooks/useAdminAttendance';

export default function AttendancePage() {
  const isMobile = useIsMobile();
  const [date, setDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading
  } = useAdminAttendance(date);

  const classWise = [...(data?.classWise || [])]
    .filter(c => c.class.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const numA = parseInt(a.class.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.class.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
  const totals = data?.totals || { present: 0, absent: 0, late: 0, total: 0 };
  const overallPercentage = totals.total > 0 
    ? ((totals.present / totals.total) * 100).toFixed(1) 
    : '0.0';

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
              <p className="text-2xl font-bold text-success">{totals.present}</p>
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
              <p className="text-2xl font-bold text-destructive">{totals.absent}</p>
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
              <p className="text-2xl font-bold text-warning">{totals.late}</p>
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
              <p className="text-2xl font-bold text-foreground">{totals.total}</p>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </CardContent>
          </Card>
        </div>

        {/* Class-wise Attendance Table */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle>Class-wise Attendance for {format(date, 'dd MMM yyyy')}</CardTitle>
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : classWise.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No attendance data for this date</p>
                <p className="text-sm mt-1">Attendance will appear once teachers mark it</p>
              </div>
            ) : isMobile ? (
              /* Mobile Card Layout */
              <div className="divide-y">
                {classWise.map((row) => (
                  <div key={row.class} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{row.class}</p>
                      <Badge variant={
                        row.percentage >= 95 ? 'default' :
                        row.percentage >= 90 ? 'secondary' : 'destructive'
                      }>
                        {row.percentage >= 95 ? 'Excellent' : row.percentage >= 90 ? 'Good' : 'Needs Attention'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">Present</p>
                        <p className="text-sm font-medium text-success">{row.present}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Absent</p>
                        <p className="text-sm font-medium text-destructive">{row.absent}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Late</p>
                        <p className="text-sm font-medium text-warning">{row.late}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-sm font-medium">{row.total}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-medium ${
                        row.percentage >= 95 ? 'text-success' :
                        row.percentage >= 90 ? 'text-warning' : 'text-destructive'
                      }`}>
                        {row.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Desktop Table */
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
                  {classWise.map((row) => (
                    <TableRow key={row.class}>
                      <TableCell className="font-medium">{row.class}</TableCell>
                      <TableCell className="text-center text-success font-medium">{row.present}</TableCell>
                      <TableCell className="text-center text-destructive font-medium">{row.absent}</TableCell>
                      <TableCell className="text-center text-warning font-medium">{row.late}</TableCell>
                      <TableCell className="text-center">{row.total}</TableCell>
                      <TableCell className="text-center">
                        <span className={
                          row.percentage >= 95 ? 'text-success' :
                          row.percentage >= 90 ? 'text-warning' : 'text-destructive'
                        }>
                          {row.percentage}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          row.percentage >= 95 ? 'default' :
                          row.percentage >= 90 ? 'secondary' : 'destructive'
                        }>
                          {row.percentage >= 95 ? 'Excellent' :
                           row.percentage >= 90 ? 'Good' : 'Needs Attention'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
