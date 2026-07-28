/**
 * Centralized query key factory for React Query.
 *
 * Using these constants prevents typo-based cache misses and ensures
 * schoolId / filters are always included in the key hierarchy.
 */

export const queryKeys = {
  // ── Students ─────────────────────────────────────────────────────
  students: (schoolId: string, filters?: any) =>
    ['students', schoolId, filters] as const,
  studentStats: (schoolId: string) =>
    ['student-stats', schoolId] as const,

  // ── Teachers ─────────────────────────────────────────────────────
  teachers: (schoolId: string, filters?: any) =>
    ['teachers', schoolId, filters] as const,
  teachersList: (schoolId: string) =>
    ['teachers-list', schoolId] as const,
  teacherStats: (schoolId: string) =>
    ['teacher-stats', schoolId] as const,
  teacherSubjects: (schoolId: string) =>
    ['teacher-subjects', schoolId] as const,

  // ── Attendance ───────────────────────────────────────────────────
  attendance: (schoolId: string, date: string, filters?: any) =>
    ['attendance', schoolId, date, filters] as const,
  attendanceSummary: (schoolId: string, date: string) =>
    ['attendance-summary', schoolId, date] as const,
  classAttendance: (schoolId: string, date: string, className: string, section: string) =>
    ['class-attendance', schoolId, date, className, section] as const,
  studentAttendance: (studentId: string, startDate?: Date, endDate?: Date) =>
    ['student-attendance', studentId, startDate, endDate] as const,

  // ── Fees ─────────────────────────────────────────────────────────
  feeInvoices: (schoolId: string, filters?: any) =>
    ['fee-invoices', schoolId, filters] as const,
  invoiceStats: (schoolId: string) =>
    ['invoice-stats', schoolId] as const,
  studentFeeInvoices: (schoolId: string, studentId?: string) =>
    ['student-fee-invoices', schoolId, studentId] as const,

  // ── Announcements ────────────────────────────────────────────────
  announcements: (schoolId: string, filters?: any) =>
    ['announcements', schoolId, filters] as const,
  announcementStats: (schoolId: string) =>
    ['announcement-stats', schoolId] as const,

  // ── Dashboard ────────────────────────────────────────────────────
  adminDashboard: (schoolId: string) =>
    ['admin-dashboard-stats', schoolId] as const,

  // ── Invalidation helpers (prefix-only keys for bulk invalidation) ──
  allStudents: ['students'] as const,
  allStudentStats: ['student-stats'] as const,
  allTeachers: ['teachers'] as const,
  allTeacherStats: ['teacher-stats'] as const,
  allTeacherSubjects: ['teacher-subjects'] as const,
  allAttendance: ['attendance'] as const,
  allAttendanceSummary: ['attendance-summary'] as const,
  allClassAttendance: ['class-attendance'] as const,
  allFeeInvoices: ['fee-invoices'] as const,
  allInvoiceStats: ['invoice-stats'] as const,
  allAnnouncements: ['announcements'] as const,
  allAnnouncementStats: ['announcement-stats'] as const,
};
