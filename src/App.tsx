import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ImpersonationProvider } from "@/contexts/ImpersonationContext";
import { TenantProvider, useTenant } from "@/contexts/TenantContext";
import { ProtectedRoute, getRoleDashboard } from "@/components/auth/ProtectedRoute";
import { SubscriptionGuard } from "@/components/admin/SubscriptionGuard";
import { AdminPermissionGuard } from "@/components/admin/AdminPermissionGuard";
import { useDynamicManifest } from "@/hooks/useDynamicManifest";

// Pages
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
import TenantErrorPage from "./pages/TenantErrorPage";
import SubdomainLanding from "./pages/login/SubdomainLanding";

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
import HolidayCalendarPage from "./pages/admin/HolidayCalendarPage";
import EmployeeAttendancePage from "./pages/admin/EmployeeAttendancePage";
import FeesPage from "./pages/admin/FeesPage";
import ExamsPage from "./pages/admin/ExamsPage";
import AnnouncementsPage from "./pages/admin/AnnouncementsPage";
import AcademicYearsPage from "./pages/admin/AcademicYearsPage";
import ReportsPage from "./pages/admin/ReportsPage";
import SettingsPage from "./pages/admin/SettingsPage";
import AdminProfilePage from "./pages/admin/AdminProfilePage";
import SubscriptionPage from "./pages/admin/SubscriptionPage";
import TimetablePage from "./pages/admin/TimetablePage";
import BulkUploadPage from "./pages/admin/BulkUploadPage";
import OnlineClassesPage from "./pages/admin/OnlineClassesPage";
import TransportPage from "./pages/admin/TransportPage";
import MessagesPage from "./pages/admin/MessagesPage";
import GalleryPage from "./pages/admin/GalleryPage";
import FeedbackPage from "./pages/admin/FeedbackPage";
import QueryPage from "./pages/admin/QueryPage";

// Teacher Pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import TeacherHomework from "./pages/teacher/TeacherHomework";
import TeacherMarks from "./pages/teacher/TeacherMarks";
import TeacherProfile from "./pages/teacher/TeacherProfile";
import TeacherTimetable from "./pages/teacher/TeacherTimetable";
import TeacherAnnouncements from "./pages/teacher/TeacherAnnouncements";
import TeacherStudents from "./pages/teacher/TeacherStudents";
import TeacherOnlineClasses from "./pages/teacher/TeacherOnlineClasses";
import TeacherMessages from "./pages/teacher/TeacherMessages";
import TeacherFeedback from "./pages/teacher/TeacherFeedback";
import TeacherQueries from "./pages/teacher/TeacherQueries";
import TeacherSettings from "./pages/teacher/TeacherSettings";

// Parent Pages
import ParentDashboard from "./pages/parent/ParentDashboard";
import ParentAttendance from "./pages/parent/ParentAttendance";
import ParentFees from "./pages/parent/ParentFees";
import ParentResults from "./pages/parent/ParentResults";
import ParentProfile from "./pages/parent/ParentProfile";
import ParentAnnouncements from "./pages/parent/ParentAnnouncements";
import ParentHomework from "./pages/parent/ParentHomework";
import ParentOnlineClasses from "./pages/parent/ParentOnlineClasses";
import ParentTransport from "./pages/parent/ParentTransport";
import ParentMessages from "./pages/parent/ParentMessages";
import ParentGallery from "./pages/parent/ParentGallery";
import ParentFeedback from "./pages/parent/ParentFeedback";
import ParentQueries from "./pages/parent/ParentQueries";
import ParentSettings from "./pages/parent/ParentSettings";
import ParentMorePage from "./pages/parent/ParentMorePage";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentHomework from "./pages/student/StudentHomework";
import StudentResults from "./pages/student/StudentResults";
import StudentProfile from "./pages/student/StudentProfile";
import StudentTimetable from "./pages/student/StudentTimetable";
import StudentAnnouncements from "./pages/student/StudentAnnouncements";
import StudentSubjects from "./pages/student/StudentSubjects";
import StudentSettings from "./pages/student/StudentSettings";
import StudentOnlineClasses from "./pages/student/StudentOnlineClasses";
import StudentTransport from "./pages/student/StudentTransport";
import StudentGallery from "./pages/student/StudentGallery";

// Shared Pages
import NotificationsPage from "./pages/NotificationsPage";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

// Smart redirect based on auth state
function AuthRedirect() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { isSubdomain } = useTenant();
  
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

  // On subdomain, show single login page; on main domain, go to login
  if (isSubdomain) {
    return <SubdomainLanding />;
  }
  
  return <Navigate to="/login" replace />;
}

// Dynamic manifest handler
function DynamicManifestHandler() {
  const { user } = useAuth();
  const roleMap: Record<string, string> = {
    school_admin: 'admin',
    teacher: 'teacher',
    parent: 'parent',
    student: 'student',
  };
  useDynamicManifest(user ? roleMap[user.role] : undefined);
  return null;
}

function AppRoutes() {
  const { isSubdomain, isLoading: tenantLoading, tenantError } = useTenant();

  if (tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Subdomain detected but school not found
  if (isSubdomain && tenantError) {
    return <TenantErrorPage message={tenantError} />;
  }

  return (
    <>
      <DynamicManifestHandler />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<AuthRedirect />} />
        <Route path="/login" element={isSubdomain ? <Navigate to="/" replace /> : <LoginPage />} />

        {/* On subdomain, /login redirects to root (single login) */}
        {/* Role paths on subdomain redirect to root login or dashboard */}
        {isSubdomain && (
          <>
            <Route path="/admin" element={<AuthRedirect />} />
            <Route path="/teacher" element={<AuthRedirect />} />
            <Route path="/parent" element={<AuthRedirect />} />
            <Route path="/student" element={<AuthRedirect />} />
          </>
        )}

        {/* Super Admin Routes - blocked on subdomains */}
        {isSubdomain ? (
          <Route path="/super-admin/*" element={<TenantErrorPage message="Super Admin access is not available on school subdomains." />} />
        ) : (
          <>
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
          </>
        )}
        
        {/* School Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AdminDashboard /></SubscriptionGuard></ProtectedRoute>} />
        <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AdminPermissionGuard><StudentsPage /></AdminPermissionGuard></SubscriptionGuard></ProtectedRoute>} />
        <Route path="/admin/teachers" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AdminPermissionGuard><TeachersPage /></AdminPermissionGuard></SubscriptionGuard></ProtectedRoute>} />
        <Route path="/admin/classes" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AdminPermissionGuard><ClassesPage /></AdminPermissionGuard></SubscriptionGuard></ProtectedRoute>} />
        <Route path="/admin/attendance" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AdminPermissionGuard><AttendancePage /></AdminPermissionGuard></SubscriptionGuard></ProtectedRoute>} />
        <Route path="/admin/holiday-calendar" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AdminPermissionGuard><HolidayCalendarPage /></AdminPermissionGuard></SubscriptionGuard></ProtectedRoute>} />
        <Route path="/admin/employee-attendance" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AdminPermissionGuard><EmployeeAttendancePage /></AdminPermissionGuard></SubscriptionGuard></ProtectedRoute>} />
        <Route path="/admin/fees" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AdminPermissionGuard><FeesPage /></AdminPermissionGuard></SubscriptionGuard></ProtectedRoute>} />
        <Route path="/admin/exams" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AdminPermissionGuard><ExamsPage /></AdminPermissionGuard></SubscriptionGuard></ProtectedRoute>} />
        <Route path="/admin/academic-years" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AdminPermissionGuard><AcademicYearsPage /></AdminPermissionGuard></SubscriptionGuard></ProtectedRoute>} />
        <Route path="/admin/timetable" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AdminPermissionGuard><TimetablePage /></AdminPermissionGuard></SubscriptionGuard></ProtectedRoute>} />
        <Route path="/admin/announcements" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AdminPermissionGuard><AnnouncementsPage /></AdminPermissionGuard></SubscriptionGuard></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AdminPermissionGuard><ReportsPage /></AdminPermissionGuard></SubscriptionGuard></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AdminPermissionGuard><SettingsPage /></AdminPermissionGuard></SubscriptionGuard></ProtectedRoute>} />
        <Route path="/admin/profile" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AdminProfilePage /></SubscriptionGuard></ProtectedRoute>} />
        <Route path="/admin/subscription" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><AdminPermissionGuard><SubscriptionPage /></AdminPermissionGuard></ProtectedRoute>} />
        <Route path="/admin/bulk-upload" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AdminPermissionGuard><BulkUploadPage /></AdminPermissionGuard></SubscriptionGuard></ProtectedRoute>} />
        <Route path="/admin/online-classes" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AdminPermissionGuard><OnlineClassesPage /></AdminPermissionGuard></SubscriptionGuard></ProtectedRoute>} />
        <Route path="/admin/transport" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AdminPermissionGuard><TransportPage /></AdminPermissionGuard></SubscriptionGuard></ProtectedRoute>} />
        <Route path="/admin/messages" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AdminPermissionGuard><MessagesPage /></AdminPermissionGuard></SubscriptionGuard></ProtectedRoute>} />
        <Route path="/admin/gallery" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AdminPermissionGuard><GalleryPage /></AdminPermissionGuard></SubscriptionGuard></ProtectedRoute>} />
        <Route path="/admin/feedback" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AdminPermissionGuard><FeedbackPage /></AdminPermissionGuard></SubscriptionGuard></ProtectedRoute>} />
        <Route path="/admin/queries" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AdminPermissionGuard><QueryPage /></AdminPermissionGuard></SubscriptionGuard></ProtectedRoute>} />
        <Route path="/admin/students/bulk-upload" element={<ProtectedRoute allowedRoles={['school_admin', 'super_admin']} requireImpersonation><SubscriptionGuard><AdminPermissionGuard><BulkUploadPage /></AdminPermissionGuard></SubscriptionGuard></ProtectedRoute>} />
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
        <Route path="/teacher/online-classes" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherOnlineClasses /></ProtectedRoute>} />
        <Route path="/teacher/notifications" element={<ProtectedRoute allowedRoles={['teacher']}><NotificationsPage /></ProtectedRoute>} />
        <Route path="/teacher/messages" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherMessages /></ProtectedRoute>} />
        <Route path="/teacher/feedback" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherFeedback /></ProtectedRoute>} />
        <Route path="/teacher/queries" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherQueries /></ProtectedRoute>} />
        <Route path="/teacher/settings" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherSettings /></ProtectedRoute>} />
        <Route path="/teacher/*" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
        
        {/* Parent Routes */}
        <Route path="/parent/dashboard" element={<ProtectedRoute allowedRoles={['parent']}><ParentDashboard /></ProtectedRoute>} />
        <Route path="/parent/attendance" element={<ProtectedRoute allowedRoles={['parent']}><ParentAttendance /></ProtectedRoute>} />
        <Route path="/parent/homework" element={<ProtectedRoute allowedRoles={['parent']}><ParentHomework /></ProtectedRoute>} />
        <Route path="/parent/fees" element={<ProtectedRoute allowedRoles={['parent']}><ParentFees /></ProtectedRoute>} />
        <Route path="/parent/results" element={<ProtectedRoute allowedRoles={['parent']}><ParentResults /></ProtectedRoute>} />
        <Route path="/parent/announcements" element={<ProtectedRoute allowedRoles={['parent']}><ParentAnnouncements /></ProtectedRoute>} />
        <Route path="/parent/profile" element={<ProtectedRoute allowedRoles={['parent']}><ParentProfile /></ProtectedRoute>} />
        <Route path="/parent/online-classes" element={<ProtectedRoute allowedRoles={['parent']}><ParentOnlineClasses /></ProtectedRoute>} />
        <Route path="/parent/transport" element={<ProtectedRoute allowedRoles={['parent']}><ParentTransport /></ProtectedRoute>} />
        <Route path="/parent/notifications" element={<ProtectedRoute allowedRoles={['parent']}><NotificationsPage /></ProtectedRoute>} />
        <Route path="/parent/messages" element={<ProtectedRoute allowedRoles={['parent']}><ParentMessages /></ProtectedRoute>} />
        <Route path="/parent/gallery" element={<ProtectedRoute allowedRoles={['parent']}><ParentGallery /></ProtectedRoute>} />
        <Route path="/parent/feedback" element={<ProtectedRoute allowedRoles={['parent']}><ParentFeedback /></ProtectedRoute>} />
        <Route path="/parent/queries" element={<ProtectedRoute allowedRoles={['parent']}><ParentQueries /></ProtectedRoute>} />
        <Route path="/parent/settings" element={<ProtectedRoute allowedRoles={['parent']}><ParentSettings /></ProtectedRoute>} />
        <Route path="/parent/more" element={<ProtectedRoute allowedRoles={['parent']}><ParentMorePage /></ProtectedRoute>} />
        <Route path="/parent/*" element={<ProtectedRoute allowedRoles={['parent']}><ParentDashboard /></ProtectedRoute>} />
        
        {/* Student Routes */}
        <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={['student']}><StudentAttendance /></ProtectedRoute>} />
        <Route path="/student/homework" element={<ProtectedRoute allowedRoles={['student']}><StudentHomework /></ProtectedRoute>} />
        <Route path="/student/results" element={<ProtectedRoute allowedRoles={['student']}><StudentResults /></ProtectedRoute>} />
        <Route path="/student/timetable" element={<ProtectedRoute allowedRoles={['student']}><StudentTimetable /></ProtectedRoute>} />
        <Route path="/student/announcements" element={<ProtectedRoute allowedRoles={['student']}><StudentAnnouncements /></ProtectedRoute>} />
        <Route path="/student/subjects" element={<ProtectedRoute allowedRoles={['student']}><StudentSubjects /></ProtectedRoute>} />
        <Route path="/student/settings" element={<ProtectedRoute allowedRoles={['student']}><StudentSettings /></ProtectedRoute>} />
        <Route path="/student/profile" element={<ProtectedRoute allowedRoles={['student']}><StudentProfile /></ProtectedRoute>} />
        <Route path="/student/notifications" element={<ProtectedRoute allowedRoles={['student']}><NotificationsPage /></ProtectedRoute>} />
        <Route path="/student/online-classes" element={<ProtectedRoute allowedRoles={['student']}><StudentOnlineClasses /></ProtectedRoute>} />
        <Route path="/student/transport" element={<ProtectedRoute allowedRoles={['student']}><StudentTransport /></ProtectedRoute>} />
        <Route path="/student/gallery" element={<ProtectedRoute allowedRoles={['student']}><StudentGallery /></ProtectedRoute>} />
        <Route path="/student/*" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
        
        {/* Legacy routes */}
        <Route path="/dashboard" element={<AuthRedirect />} />
        
        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <TenantProvider>
            <AuthProvider>
              <ImpersonationProvider>
                <AppRoutes />
              </ImpersonationProvider>
            </AuthProvider>
          </TenantProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
