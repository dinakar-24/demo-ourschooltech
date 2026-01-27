import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
} from 'lucide-react';

interface Student {
  id: string;
  admissionNo: string;
  name: string;
  class: string;
  section: string;
  rollNo: number;
  parentName: string;
  phone: string;
  status: 'active' | 'inactive';
  avatar?: string;
}

const studentsData: Student[] = [
  { id: '1', admissionNo: 'DPS2024001', name: 'Arjun Sharma', class: '10', section: 'A', rollNo: 1, parentName: 'Rakesh Sharma', phone: '+91 98765 43210', status: 'active' },
  { id: '2', admissionNo: 'DPS2024002', name: 'Priya Patel', class: '10', section: 'A', rollNo: 2, parentName: 'Suresh Patel', phone: '+91 98765 43211', status: 'active' },
  { id: '3', admissionNo: 'DPS2024003', name: 'Rahul Verma', class: '10', section: 'A', rollNo: 3, parentName: 'Vijay Verma', phone: '+91 98765 43212', status: 'active' },
  { id: '4', admissionNo: 'DPS2024004', name: 'Ananya Singh', class: '10', section: 'B', rollNo: 1, parentName: 'Anil Singh', phone: '+91 98765 43213', status: 'active' },
  { id: '5', admissionNo: 'DPS2024005', name: 'Vikram Rao', class: '9', section: 'A', rollNo: 1, parentName: 'Krishna Rao', phone: '+91 98765 43214', status: 'inactive' },
  { id: '6', admissionNo: 'DPS2024006', name: 'Neha Gupta', class: '9', section: 'A', rollNo: 2, parentName: 'Rajesh Gupta', phone: '+91 98765 43215', status: 'active' },
  { id: '7', admissionNo: 'DPS2024007', name: 'Amit Kumar', class: '9', section: 'B', rollNo: 1, parentName: 'Sunil Kumar', phone: '+91 98765 43216', status: 'active' },
  { id: '8', admissionNo: 'DPS2024008', name: 'Kavya Nair', class: '8', section: 'A', rollNo: 1, parentName: 'Mohan Nair', phone: '+91 98765 43217', status: 'active' },
];

export default function Students() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const filteredStudents = studentsData.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.admissionNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === 'all' || student.class === selectedClass;
    const matchesStatus = selectedStatus === 'all' || student.status === selectedStatus;
    return matchesSearch && matchesClass && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <DashboardLayout title="Students" userRole="school_admin">
      <div className="space-y-6 animate-fade-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-muted-foreground">
              Manage all student records, admissions, and information.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Bulk Upload</span>
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button variant="accent" size="sm">
              <Plus className="w-4 h-4" />
              Add Student
            </Button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or admission no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="input-field py-2 px-3 min-w-[120px]"
              >
                <option value="all">All Classes</option>
                <option value="10">Class 10</option>
                <option value="9">Class 9</option>
                <option value="8">Class 8</option>
                <option value="7">Class 7</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input-field py-2 px-3 min-w-[120px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Selected Actions */}
        {selectedStudents.length > 0 && (
          <div className="bg-primary-muted rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-primary">
              {selectedStudents.length} student(s) selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">Send Message</Button>
              <Button variant="destructive" size="sm">Delete Selected</Button>
            </div>
          </div>
        )}

        {/* Students Table - Desktop */}
        <div className="hidden md:block bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-border"
                    />
                  </th>
                  <th>Student</th>
                  <th>Admission No</th>
                  <th>Class</th>
                  <th>Roll No</th>
                  <th>Parent</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th className="w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} className={cn(
                    selectedStudents.includes(student.id) && "bg-table-row-selected"
                  )}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="rounded border-border"
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                          {getInitials(student.name)}
                        </div>
                        <span className="font-medium text-foreground">{student.name}</span>
                      </div>
                    </td>
                    <td className="text-muted-foreground font-mono text-xs">{student.admissionNo}</td>
                    <td>{student.class}-{student.section}</td>
                    <td>{student.rollNo}</td>
                    <td className="text-muted-foreground">{student.parentName}</td>
                    <td>
                      <a href={`tel:${student.phone}`} className="text-primary hover:underline text-sm">
                        {student.phone}
                      </a>
                    </td>
                    <td>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-medium",
                        student.status === 'active' ? "badge-success" : "badge-neutral"
                      )}>
                        {student.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing 1-8 of 1,248 students
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Students Cards - Mobile */}
        <div className="md:hidden space-y-3">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="card-interactive"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                  {getInitials(student.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground truncate">{student.name}</h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium shrink-0",
                      student.status === 'active' ? "badge-success" : "badge-neutral"
                    )}>
                      {student.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Class {student.class}-{student.section} • Roll #{student.rollNo}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {student.admissionNo}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                <div className="text-sm text-muted-foreground">
                  Parent: {student.parentName}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon-sm">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm">
                    <Mail className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
