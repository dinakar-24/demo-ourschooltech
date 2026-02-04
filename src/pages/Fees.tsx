import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Search,
  Filter,
  Download,
  Plus,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  IndianRupee,
  Send,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface FeeRecord {
  id: string;
  studentName: string;
  class: string;
  admissionNo: string;
  feeType: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue' | 'partial';
  paidAmount?: number;
}

const feeRecords: FeeRecord[] = [
  { id: '1', studentName: 'Arjun Sharma', class: '10-A', admissionNo: 'DPS2024001', feeType: 'Tuition Fee', amount: 25000, dueDate: '2024-01-15', status: 'paid' },
  { id: '2', studentName: 'Priya Patel', class: '10-A', admissionNo: 'DPS2024002', feeType: 'Tuition Fee', amount: 25000, dueDate: '2024-01-15', status: 'pending' },
  { id: '3', studentName: 'Rahul Verma', class: '10-A', admissionNo: 'DPS2024003', feeType: 'Tuition Fee', amount: 25000, dueDate: '2024-01-15', status: 'overdue' },
  { id: '4', studentName: 'Ananya Singh', class: '10-B', admissionNo: 'DPS2024004', feeType: 'Transport Fee', amount: 8000, dueDate: '2024-01-20', status: 'partial', paidAmount: 4000 },
  { id: '5', studentName: 'Vikram Rao', class: '9-A', admissionNo: 'DPS2024005', feeType: 'Tuition Fee', amount: 22000, dueDate: '2024-01-15', status: 'paid' },
  { id: '6', studentName: 'Neha Gupta', class: '9-A', admissionNo: 'DPS2024006', feeType: 'Lab Fee', amount: 5000, dueDate: '2024-01-25', status: 'pending' },
];

const statusConfig = {
  paid: { label: 'Paid', icon: CheckCircle2, className: 'badge-success' },
  pending: { label: 'Pending', icon: Clock, className: 'badge-warning' },
  overdue: { label: 'Overdue', icon: AlertCircle, className: 'badge-error' },
  partial: { label: 'Partial', icon: CreditCard, className: 'badge-info' },
};

export default function Fees() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredRecords = feeRecords.filter(record => {
    const matchesSearch = record.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.admissionNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totals = {
    totalDue: feeRecords.reduce((sum, r) => sum + r.amount, 0),
    collected: feeRecords.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.amount, 0) +
               feeRecords.filter(r => r.status === 'partial').reduce((sum, r) => sum + (r.paidAmount || 0), 0),
    pending: feeRecords.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0),
    overdue: feeRecords.filter(r => r.status === 'overdue').reduce((sum, r) => sum + r.amount, 0),
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  return (
    <DashboardLayout title="Fee Management">
      <div className="space-y-6 animate-fade-up">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-metric">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Due</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(totals.totalDue)}</p>
              </div>
            </div>
          </div>
          <div className="card-metric bg-success-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-success/80">Collected</p>
                <p className="text-xl font-bold text-success">{formatCurrency(totals.collected)}</p>
              </div>
            </div>
          </div>
          <div className="card-metric bg-warning-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-warning/80">Pending</p>
                <p className="text-xl font-bold text-warning">{formatCurrency(totals.pending)}</p>
              </div>
            </div>
          </div>
          <div className="card-metric bg-destructive-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-destructive/80">Overdue</p>
                <p className="text-xl font-bold text-destructive">{formatCurrency(totals.overdue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions & Filters */}
        <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by student name or admission no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field py-2 px-3 min-w-[130px]"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="partial">Partial</option>
              </select>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button variant="accent" size="sm">
                <Plus className="w-4 h-4" />
                Collect Fee
              </Button>
            </div>
          </div>
        </div>

        {/* Fee Records Table - Desktop */}
        <div className="hidden md:block bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Admission No</th>
                <th>Class</th>
                <th>Fee Type</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => {
                const StatusIcon = statusConfig[record.status].icon;
                return (
                  <tr key={record.id}>
                    <td className="font-medium text-foreground">{record.studentName}</td>
                    <td className="font-mono text-xs text-muted-foreground">{record.admissionNo}</td>
                    <td>{record.class}</td>
                    <td>{record.feeType}</td>
                    <td className="font-medium">
                      {formatCurrency(record.amount)}
                      {record.status === 'partial' && (
                        <span className="block text-xs text-muted-foreground">
                          Paid: {formatCurrency(record.paidAmount || 0)}
                        </span>
                      )}
                    </td>
                    <td className="text-muted-foreground">{new Date(record.dueDate).toLocaleDateString('en-IN')}</td>
                    <td>
                      <span className={cn("flex items-center gap-1.5 w-fit", statusConfig[record.status].className)}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig[record.status].label}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {record.status !== 'paid' && (
                          <Button variant="default" size="sm">
                            Collect
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-sm">
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Fee Records Cards - Mobile */}
        <div className="md:hidden space-y-3">
          {filteredRecords.map((record) => {
            const StatusIcon = statusConfig[record.status].icon;
            return (
              <div key={record.id} className="card-interactive">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">{record.studentName}</h4>
                    <p className="text-sm text-muted-foreground">{record.class} • {record.admissionNo}</p>
                  </div>
                  <span className={cn("flex items-center gap-1", statusConfig[record.status].className)}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig[record.status].label}
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(record.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {record.feeType} • Due: {new Date(record.dueDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  {record.status !== 'paid' && (
                    <Button variant="accent" size="sm">Collect</Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
