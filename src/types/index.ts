export type UserRole = 'super_admin' | 'school_admin' | 'teacher' | 'parent' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  schoolId?: string;
}

export interface School {
  id: string;
  name: string;
  code: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
}

export interface Student {
  id: string;
  admissionNo: string;
  name: string;
  class: string;
  section: string;
  rollNo: number;
  parentName: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive' | 'graduated';
  avatar?: string;
  dob: string;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: string;
  address: string;
}

export interface Teacher {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  classes: string[];
  status: 'active' | 'inactive';
  avatar?: string;
  joinDate: string;
}

export interface ClassSection {
  id: string;
  className: string;
  section: string;
  classTeacher: string;
  studentCount: number;
  subjects: string[];
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'half_day';
  remarks?: string;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  feeType: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'paid' | 'pending' | 'overdue' | 'partial';
  paymentMethod?: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  targetRoles: UserRole[];
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  createdBy: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  children?: NavItem[];
}
