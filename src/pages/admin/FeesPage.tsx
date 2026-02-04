import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Search,
  Plus,
  Download,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  IndianRupee,
  MoreVertical,
  Eye,
  Receipt,
  Send,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const mockFeeRecords = [
  { id: '1', studentName: 'Arjun Verma', class: 'Class 8-A', admNo: 'ADM2024001', feeType: 'Tuition Fee', amount: 25000, dueDate: '2024-01-15', status: 'paid', paidDate: '2024-01-10' },
  { id: '2', studentName: 'Priya Singh', class: 'Class 8-A', admNo: 'ADM2024002', feeType: 'Tuition Fee', amount: 25000, dueDate: '2024-01-15', status: 'pending', paidDate: null },
  { id: '3', studentName: 'Rahul Kumar', class: 'Class 9-B', admNo: 'ADM2024003', feeType: 'Transport Fee', amount: 8000, dueDate: '2024-01-10', status: 'overdue', paidDate: null },
  { id: '4', studentName: 'Sneha Patel', class: 'Class 7-A', admNo: 'ADM2024004', feeType: 'Tuition Fee', amount: 22000, dueDate: '2024-01-15', status: 'paid', paidDate: '2024-01-12' },
  { id: '5', studentName: 'Karan Sharma', class: 'Class 10-A', admNo: 'ADM2024005', feeType: 'Exam Fee', amount: 3500, dueDate: '2024-01-20', status: 'pending', paidDate: null },
  { id: '6', studentName: 'Ananya Reddy', class: 'Class 9-A', admNo: 'ADM2024006', feeType: 'Lab Fee', amount: 5000, dueDate: '2024-01-18', status: 'paid', paidDate: '2024-01-15' },
  { id: '7', studentName: 'Vikram Joshi', class: 'Class 8-B', admNo: 'ADM2024007', feeType: 'Tuition Fee', amount: 25000, dueDate: '2024-01-15', status: 'partial', paidDate: '2024-01-14' },
  { id: '8', studentName: 'Meera Iyer', class: 'Class 10-B', admNo: 'ADM2024008', feeType: 'Sports Fee', amount: 4000, dueDate: '2024-01-25', status: 'pending', paidDate: null },
];

const feeTypes = ['All Types', 'Tuition Fee', 'Transport Fee', 'Exam Fee', 'Lab Fee', 'Sports Fee'];
const statusOptions = ['All Status', 'paid', 'pending', 'overdue', 'partial'];

export default function FeesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredRecords = mockFeeRecords.filter(record => {
    const matchesSearch = record.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.admNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'All Types' || record.feeType === selectedType;
    const matchesStatus = selectedStatus === 'All Status' || record.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    collected: mockFeeRecords.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0),
    pending: mockFeeRecords.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0),
    overdue: mockFeeRecords.filter(r => r.status === 'overdue').reduce((sum, r) => sum + r.amount, 0),
    total: mockFeeRecords.reduce((sum, r) => sum + r.amount, 0),
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-success text-success-foreground">Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'partial':
        return <Badge className="bg-warning text-warning-foreground">Partial</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout title="Fees Management">
      <div className="space-y-6 animate-fade-up">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-success" />
                </div>
              </div>
              <p className="text-2xl font-bold text-success">₹{(stats.collected / 100000).toFixed(1)}L</p>
              <p className="text-sm text-muted-foreground">Collected</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-warning" />
                </div>
              </div>
              <p className="text-2xl font-bold text-warning">₹{(stats.pending / 1000).toFixed(0)}K</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                </div>
              </div>
              <p className="text-2xl font-bold text-destructive">₹{(stats.overdue / 1000).toFixed(0)}K</p>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {((stats.collected / stats.total) * 100).toFixed(0)}%
              </p>
              <p className="text-sm text-muted-foreground">Collection Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, admission no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Fee Type" />
              </SelectTrigger>
              <SelectContent>
                {feeTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(status => (
                  <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Fee
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Fee Record</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Student</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockFeeRecords.map(r => (
                          <SelectItem key={r.id} value={r.admNo}>{r.studentName} ({r.admNo})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fee Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fee type" />
                      </SelectTrigger>
                      <SelectContent>
                        {feeTypes.slice(1).map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (₹)</Label>
                    <Input type="number" placeholder="Enter amount" />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input type="date" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                  <Button onClick={() => setIsAddDialogOpen(false)}>Add Record</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Fee Records Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.studentName}</p>
                        <p className="text-xs text-muted-foreground">{record.admNo}</p>
                      </div>
                    </TableCell>
                    <TableCell>{record.class}</TableCell>
                    <TableCell>{record.feeType}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <IndianRupee className="w-3 h-3" />
                        {record.amount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>{record.dueDate}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Record Payment
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Receipt className="w-4 h-4 mr-2" />
                            Generate Receipt
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Send className="w-4 h-4 mr-2" />
                            Send Reminder
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
