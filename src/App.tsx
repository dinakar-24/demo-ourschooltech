import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import { ProtectedRoute, getRoleDashboard } from "@/components/auth/ProtectedRoute";
import { SubscriptionGuard } from "@/components/admin/SubscriptionGuard";

// Pages
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

// Super Admin Pages
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import SchoolsPage from "./pages/super-admin/SchoolsPage";
import SchoolAdminsPage from "./pages/super-admin/SchoolAdminsPage";
import AllUsersPage from "./pages/super-admin/AllUsersPage";
import SystemSettingsPage from "./pages/super-admin/SystemSettingsPage";
import SystemAnnouncementsPage from "./pages/super-admin/SystemAnnouncementsPage";
import AuditLogsPage from "./pages/super-admin/AuditLogsPage";
import SuperAdminReportsPage from "./pages/super-admin/SuperAdminReportsPage";
import SubscriptionsPage from "./pages/super-admin/SubscriptionsPage";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import StudentsPage from "./pages/admin/StudentsPage";
import TeachersPage from "./pages/admin/TeachersPage";
import ClassesPage from "./pages/admin/ClassesPage";
import AttendancePage from "./pages/admin/AttendancePage";
import FeesPage from "./pages/admin/FeesPage";
import ExamsPage from "./pages/admin/ExamsPage";
import AnnouncementsPage from "./pages/admin/AnnouncementsPage";
import AcademicYearsPage from "./pages/admin/AcademicYearsPage";
import ReportsPage from "./pages/admin/ReportsPage";
import SettingsPage from "./pages/admin/SettingsPage";
import SubscriptionPage from "./pages/admin/SubscriptionPage";
import TimetablePage from "./pages/admin/TimetablePage";
import BulkUploadPage from "./pages/admin/BulkUploadPage";

// Teacher Pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import TeacherHomework from "./pages/teacher/TeacherHomework";
import TeacherMarks from "./pages/teacher/TeacherMarks";
import TeacherProfile from "./pages/teacher/TeacherProfile";
import TeacherTimetable from "./pages/teacher/TeacherTimetable";
import TeacherAnnouncements from "./pages/teacher/TeacherAnnouncements";
import TeacherStudents from "./pages/teacher/TeacherStudents";

// Parent Pages
import ParentDashboard from "./pages/parent/ParentDashboard";
import ParentAttendance from "./pages/parent/ParentAttendance";
import ParentFees from "./pages/parent/ParentFees";
import ParentResults from "./pages/parent/ParentResults";
import ParentProfile from "./pages/parent/ParentProfile";
import ParentAnnouncements from "./pages/parent/ParentAnnouncements";
import ParentHomework from "./pages/parent/ParentHomework";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentHomework from "./pages/student/StudentHomework";
import StudentResults from "./pages/student/StudentResults";
import StudentProfile from "./pages/student/StudentProfile";
import StudentTimetable from "./pages/student/StudentTimetable";
import StudentAnnouncements from "./pages/student/StudentAnnouncements";

// Shared Pages
import NotificationsPage from "./pages/NotificationsPage";
const queryClient = new QueryClient();

// Smart redirect based on auth state
function AuthRedirect() {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (isAuthenticated && user) {
    return <Navigate to={getRoleDashboard(user.role)} replace />;
  }
  
  return <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<AuthRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Super Admin Routes */}
      <Route path="/super-admin/dashboard" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>} />
      <Route path="/super-admin/schools" element={<ProtectedRoute allowedRoles={['super_admin']}><SchoolsPage /></ProtectedRoute>} />
      <Route path="/super-admin/admins" element={<ProtectedRoute allowedRoles={['super_admin']}><SchoolAdminsPage /></ProtectedRoute>} />
      <Route path="/super-admin/users" element={<ProtectedRoute allowedRoles={['super_admin']}><AllUsersPage /></ProtectedRoute>} />
      <Route path="/super-admin/announcements" element={<ProtectedRoute allowedRoles={['super_admin']}><SystemAnnouncementsPage /></ProtectedRoute>} />
      <Route path="/super-admin/subscriptions" element={<ProtectedRoute allowedRoles={['super_admin']}><SubscriptionsPage /></ProtectedRoute>} />
      <Route path="/super-admin/reports" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminReportsPage /></ProtectedRoute>} />
      <Route path="/super-admin/audit-logs" element={<ProtectedRoute allowedRoles={['super_admin']}><AuditLogsPage /></ProtectedRoute>} />
      <Route path="/super-admin/settings" element={<ProtectedRoute allowedRoles={['super_admin']}><SystemSettingsPage /></ProtectedRoute>} />
      <Route path="/super-admin/*" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>} />
      
      {/* School Admin Routes (also accessible by super_admin when impersonating) */}
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AdminDashboard /></SubscriptionGuard></ProtectedRoute>} />
      <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><StudentsPage /></SubscriptionGuard></ProtectedRoute>} />
      <Route path="/admin/teachers" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><TeachersPage /></SubscriptionGuard></ProtectedRoute>} />
      <Route path="/admin/classes" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><ClassesPage /></SubscriptionGuard></ProtectedRoute>} />
      <Route path="/admin/attendance" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AttendancePage /></SubscriptionGuard></ProtectedRoute>} />
      <Route path="/admin/fees" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><FeesPage /></SubscriptionGuard></ProtectedRoute>} />
      <Route path="/admin/exams" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><ExamsPage /></SubscriptionGuard></ProtectedRoute>} />
      <Route path="/admin/academic-years" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AcademicYearsPage /></SubscriptionGuard></ProtectedRoute>} />
      <Route path="/admin/timetable" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><TimetablePage /></SubscriptionGuard></ProtectedRoute>} />
      <Route path="/admin/announcements" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AnnouncementsPage /></SubscriptionGuard></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><ReportsPage /></SubscriptionGuard></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><SettingsPage /></SubscriptionGuard></ProtectedRoute>} />
      <Route path="/admin/subscription" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionPage /></ProtectedRoute>} />
      <Route path="/admin/bulk-upload" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><BulkUploadPage /></SubscriptionGuard></ProtectedRoute>} />
      <Route path="/admin/students/bulk-upload" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><BulkUploadPage /></SubscriptionGuard></ProtectedRoute>} />
      <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AdminDashboard /></SubscriptionGuard></ProtectedRoute>} />
      
      {/* Teacher Routes */}
      <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
      <Route path="/teacher/attendance" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherAttendance /></ProtectedRoute>} />
      <Route path="/teacher/homework" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherHomework /></ProtectedRoute>} />
      <Route path="/teacher/marks" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherMarks /></ProtectedRoute>} />
      <Route path="/teacher/timetable" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherTimetable /></ProtectedRoute>} />
      <Route path="/teacher/announcements" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherAnnouncements /></ProtectedRoute>} />
      <Route path="/teacher/students" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherStudents /></ProtectedRoute>} />
      <Route path="/teacher/profile" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherProfile /></ProtectedRoute>} />
      <Route path="/teacher/notifications" element={<ProtectedRoute allowedRoles={['teacher']}><NotificationsPage /></ProtectedRoute>} />
      <Route path="/teacher/*" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
      
      {/* Parent Routes */}
      <Route path="/parent/dashboard" element={<ProtectedRoute allowedRoles={['parent']}><ParentDashboard /></ProtectedRoute>} />
      <Route path="/parent/attendance" element={<ProtectedRoute allowedRoles={['parent']}><ParentAttendance /></ProtectedRoute>} />
      <Route path="/parent/homework" element={<ProtectedRoute allowedRoles={['parent']}><ParentHomework /></ProtectedRoute>} />
      <Route path="/parent/fees" element={<ProtectedRoute allowedRoles={['parent']}><ParentFees /></ProtectedRoute>} />
      <Route path="/parent/results" element={<ProtectedRoute allowedRoles={['parent']}><ParentResults /></ProtectedRoute>} />
      <Route path="/parent/announcements" element={<ProtectedRoute allowedRoles={['parent']}><ParentAnnouncements /></ProtectedRoute>} />
      <Route path="/parent/profile" element={<ProtectedRoute allowedRoles={['parent']}><ParentProfile /></ProtectedRoute>} />
      <Route path="/parent/notifications" element={<ProtectedRoute allowedRoles={['parent']}><NotificationsPage /></ProtectedRoute>} />
      <Route path="/parent/*" element={<ProtectedRoute allowedRoles={['parent']}><ParentDashboard /></ProtectedRoute>} />
      
      {/* Student Routes */}
      <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={['student']}><StudentAttendance /></ProtectedRoute>} />
      <Route path="/student/homework" element={<ProtectedRoute allowedRoles={['student']}><StudentHomework /></ProtectedRoute>} />
      <Route path="/student/results" element={<ProtectedRoute allowedRoles={['student']}><StudentResults /></ProtectedRoute>} />
      <Route path="/student/timetable" element={<ProtectedRoute allowedRoles={['student']}><StudentTimetable /></ProtectedRoute>} />
      <Route path="/student/announcements" element={<ProtectedRoute allowedRoles={['student']}><StudentAnnouncements /></ProtectedRoute>} />
      <Route path="/student/profile" element={<ProtectedRoute allowedRoles={['student']}><StudentProfile /></ProtectedRoute>} />
      <Route path="/student/notifications" element={<ProtectedRoute allowedRoles={['student']}><NotificationsPage /></ProtectedRoute>} />
      <Route path="/student/*" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
      
      {/* Legacy routes - redirect to role-based */}
      <Route path="/dashboard" element={<AuthRedirect />} />
      
      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ImpersonationProvider>
              <AppRoutes />
            </ImpersonationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
