import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
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
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFees, useFeeStats, useRecordPayment, useCreateFee } from '@/hooks/useFees';
import { useStudentSearch } from '@/hooks/useStudentSearch';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const feeTypes = ['All Types', 'Tuition Fee', 'Transport Fee', 'Exam Fee', 'Lab Fee', 'Sports Fee'];

export default function FeesPage() {
  const isMobile = useIsMobile();
  const [searchInput, setSearchInput] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedFeeId, setSelectedFeeId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transactionId, setTransactionId] = useState('');

  const pagination = usePagination(25);
  const debouncedSearch = useDebounce(searchInput, 400);

  // Reset page on filter change
  useEffect(() => {
    pagination.resetPage();
  }, [debouncedSearch, selectedType, selectedStatus]);

  // New fee form state
  const [newFee, setNewFee] = useState({
    student_id: '',
    fee_type: '',
    amount: '',
    due_date: '',
  });

  const { data: feesResult, isLoading } = useFees({
    status: selectedStatus,
    feeType: selectedType,
    search: debouncedSearch,
    page: pagination.page,
    pageSize: pagination.pageSize,
  });
  const fees = feesResult?.data || [];
  const totalCount = feesResult?.totalCount || 0;
  const { data: stats } = useFeeStats();

  // Search-as-you-type student selector for Add Fee dialog
  const studentSearch = useStudentSearch();

  const recordPayment = useRecordPayment();
  const createFee = useCreateFee();

  const handleRecordPayment = async () => {
    if (!selectedFeeId) return;

    try {
      await recordPayment.mutateAsync({
        feeId: selectedFeeId,
        paymentMethod,
        transactionId: transactionId || undefined,
      });
      toast.success('Payment recorded successfully');
      setIsPaymentDialogOpen(false);
      setSelectedFeeId(null);
      setPaymentMethod('cash');
      setTransactionId('');
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  const handleAddFee = async () => {
    if (!newFee.student_id || !newFee.fee_type || !newFee.amount || !newFee.due_date) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      await createFee.mutateAsync({
        student_id: newFee.student_id,
        fee_type: newFee.fee_type,
        amount: Number(newFee.amount),
        due_date: newFee.due_date,
      });
      toast.success('Fee record created');
      setIsAddDialogOpen(false);
      setNewFee({ student_id: '', fee_type: '', amount: '', due_date: '' });
      studentSearch.setSearchInput('');
    } catch (error) {
      toast.error('Failed to create fee record');
    }
  };

  const openPaymentDialog = (feeId: string) => {
    setSelectedFeeId(feeId);
    setIsPaymentDialogOpen(true);
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = status === 'pending' && dueDate < today;

    if (status === 'paid') {
      return <Badge className="bg-success text-success-foreground">Paid</Badge>;
    }
    if (isOverdue) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    if (status === 'pending') {
      return <Badge variant="secondary">Pending</Badge>;
    }
    if (status === 'partial') {
      return <Badge className="bg-warning text-warning-foreground">Partial</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
    return `₹${amount.toLocaleString()}`;
  };

  const collectionRate = stats && stats.totalDue > 0
    ? ((stats.collected / stats.totalDue) * 100).toFixed(0)
    : '0';

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
              <p className="text-2xl font-bold text-success">{formatCurrency(stats?.collected || 0)}</p>
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
              <p className="text-2xl font-bold text-warning">{formatCurrency(stats?.pending || 0)}</p>
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
              <p className="text-2xl font-bold text-destructive">{formatCurrency(stats?.overdue || 0)}</p>
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
              <p className="text-2xl font-bold text-foreground">{collectionRate}%</p>
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
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
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
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) {
                studentSearch.setSearchInput('');
                setNewFee({ student_id: '', fee_type: '', amount: '', due_date: '' });
              }
            }}>
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
                    <div className="space-y-2">
                      <Input
                        placeholder="Search student by name or admission no (min 2 chars)..."
                        value={studentSearch.searchInput}
                        onChange={(e) => {
                          studentSearch.setSearchInput(e.target.value);
                          if (!e.target.value) setNewFee(prev => ({ ...prev, student_id: '' }));
                        }}
                      />
                      {studentSearch.isLoading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Searching...
                        </div>
                      )}
                      {studentSearch.hasSearched && !studentSearch.isLoading && studentSearch.students.length === 0 && (
                        <p className="text-sm text-muted-foreground p-2">No students found</p>
                      )}
                      {studentSearch.students.length > 0 && (
                        <div className="max-h-40 overflow-y-auto border rounded-md divide-y">
                          {studentSearch.students.map(s => (
                            <button
                              key={s.id}
                              type="button"
                              className={`w-full text-left p-2 text-sm hover:bg-muted transition-colors ${
                                newFee.student_id === s.id ? 'bg-primary/10 text-primary font-medium' : ''
                              }`}
                              onClick={() => {
                                setNewFee(prev => ({ ...prev, student_id: s.id }));
                                studentSearch.setSearchInput(s.full_name);
                              }}
                            >
                              <span className="font-medium">{s.full_name}</span>
                              <span className="text-muted-foreground ml-2">
                                ({s.admission_number}) · {s.class_name}-{s.section}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Fee Type</Label>
                    <Select
                      value={newFee.fee_type}
                      onValueChange={(v) => setNewFee({ ...newFee, fee_type: v })}
                    >
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
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={newFee.amount}
                      onChange={(e) => setNewFee({ ...newFee, amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={newFee.due_date}
                      onChange={(e) => setNewFee({ ...newFee, due_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddFee} disabled={createFee.isPending || !newFee.student_id}>
                    {createFee.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Add Record
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Fee Records Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : fees.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No fee records found</p>
                <p className="text-sm mt-1">
                  {debouncedSearch ? 'Try a different search term' : 'Create fee records for students to track payments'}
                </p>
              </div>
            ) : isMobile ? (
              /* Mobile Card Layout */
              <div className="divide-y">
                {fees.map((record) => (
                  <div key={record.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{record.student?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{record.student?.admission_number || '-'} · {record.student?.class_name}-{record.student?.section}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Eye className="w-4 h-4 mr-2" />View</DropdownMenuItem>
                          {record.status !== 'paid' && (
                            <DropdownMenuItem onClick={() => openPaymentDialog(record.id)}>
                              <CreditCard className="w-4 h-4 mr-2" />Record Payment
                            </DropdownMenuItem>
                          )}
                          {record.status === 'paid' && (
                            <DropdownMenuItem><Receipt className="w-4 h-4 mr-2" />Receipt</DropdownMenuItem>
                          )}
                          <DropdownMenuItem><Send className="w-4 h-4 mr-2" />Remind</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-muted-foreground">{record.fee_type}</span>
                        <span className="mx-2">·</span>
                        <span className="text-muted-foreground">{new Date(record.due_date).toLocaleDateString('en-IN')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium flex items-center"><IndianRupee className="w-3 h-3" />{Number(record.amount).toLocaleString()}</span>
                        {getStatusBadge(record.status, record.due_date)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Desktop Table */
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
                  {fees.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{record.student?.full_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{record.student?.admission_number || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>{record.student?.class_name}-{record.student?.section}</TableCell>
                      <TableCell>{record.fee_type}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center"><IndianRupee className="w-3 h-3" />{Number(record.amount).toLocaleString()}</div>
                      </TableCell>
                      <TableCell>{new Date(record.due_date).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell>{getStatusBadge(record.status, record.due_date)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm"><MoreVertical className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem><Eye className="w-4 h-4 mr-2" />View Details</DropdownMenuItem>
                            {record.status !== 'paid' && (
                              <DropdownMenuItem onClick={() => openPaymentDialog(record.id)}>
                                <CreditCard className="w-4 h-4 mr-2" />Record Payment
                              </DropdownMenuItem>
                            )}
                            {record.status === 'paid' && (
                              <DropdownMenuItem><Receipt className="w-4 h-4 mr-2" />Generate Receipt</DropdownMenuItem>
                            )}
                            <DropdownMenuItem><Send className="w-4 h-4 mr-2" />Send Reminder</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <PaginationControls
              page={pagination.page}
              pageSize={pagination.pageSize}
              totalCount={totalCount}
              onPageChange={pagination.setPage}
              onPageSizeChange={pagination.setPageSize}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Payment Recording Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="neft">NEFT/RTGS</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transaction ID (Optional)</Label>
                <Input
                  placeholder="Enter transaction/reference ID"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRecordPayment} disabled={recordPayment.isPending}>
                {recordPayment.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirm Payment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
