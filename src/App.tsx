import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute, getRoleDashboard } from "@/components/auth/ProtectedRoute";

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

// Teacher Pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import TeacherHomework from "./pages/teacher/TeacherHomework";
import TeacherMarks from "./pages/teacher/TeacherMarks";
import TeacherProfile from "./pages/teacher/TeacherProfile";

// Parent Pages
import ParentDashboard from "./pages/parent/ParentDashboard";
import ParentAttendance from "./pages/parent/ParentAttendance";
import ParentFees from "./pages/parent/ParentFees";
import ParentResults from "./pages/parent/ParentResults";
import ParentProfile from "./pages/parent/ParentProfile";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentHomework from "./pages/student/StudentHomework";
import StudentResults from "./pages/student/StudentResults";
import StudentProfile from "./pages/student/StudentProfile";

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
      <Route path="/super-admin/audit-logs" element={<ProtectedRoute allowedRoles={['super_admin']}><AuditLogsPage /></ProtectedRoute>} />
      <Route path="/super-admin/settings" element={<ProtectedRoute allowedRoles={['super_admin']}><SystemSettingsPage /></ProtectedRoute>} />
      <Route path="/super-admin/*" element={<ProtectedRoute allowedRoles={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>} />
      
      {/* School Admin Routes */}
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['school_admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['school_admin']}><StudentsPage /></ProtectedRoute>} />
      <Route path="/admin/teachers" element={<ProtectedRoute allowedRoles={['school_admin']}><TeachersPage /></ProtectedRoute>} />
      <Route path="/admin/classes" element={<ProtectedRoute allowedRoles={['school_admin']}><ClassesPage /></ProtectedRoute>} />
      <Route path="/admin/attendance" element={<ProtectedRoute allowedRoles={['school_admin']}><AttendancePage /></ProtectedRoute>} />
      <Route path="/admin/fees" element={<ProtectedRoute allowedRoles={['school_admin']}><FeesPage /></ProtectedRoute>} />
      <Route path="/admin/exams" element={<ProtectedRoute allowedRoles={['school_admin']}><ExamsPage /></ProtectedRoute>} />
      <Route path="/admin/academic-years" element={<ProtectedRoute allowedRoles={['school_admin']}><AcademicYearsPage /></ProtectedRoute>} />
      <Route path="/admin/announcements" element={<ProtectedRoute allowedRoles={['school_admin']}><AnnouncementsPage /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['school_admin']}><ReportsPage /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['school_admin']}><SettingsPage /></ProtectedRoute>} />
      <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['school_admin']}><AdminDashboard /></ProtectedRoute>} />
      
      {/* Teacher Routes */}
      <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
      <Route path="/teacher/attendance" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherAttendance /></ProtectedRoute>} />
      <Route path="/teacher/homework" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherHomework /></ProtectedRoute>} />
      <Route path="/teacher/marks" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherMarks /></ProtectedRoute>} />
      <Route path="/teacher/profile" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherProfile /></ProtectedRoute>} />
      <Route path="/teacher/*" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
      
      {/* Parent Routes */}
      <Route path="/parent/dashboard" element={<ProtectedRoute allowedRoles={['parent']}><ParentDashboard /></ProtectedRoute>} />
      <Route path="/parent/attendance" element={<ProtectedRoute allowedRoles={['parent']}><ParentAttendance /></ProtectedRoute>} />
      <Route path="/parent/fees" element={<ProtectedRoute allowedRoles={['parent']}><ParentFees /></ProtectedRoute>} />
      <Route path="/parent/results" element={<ProtectedRoute allowedRoles={['parent']}><ParentResults /></ProtectedRoute>} />
      <Route path="/parent/profile" element={<ProtectedRoute allowedRoles={['parent']}><ParentProfile /></ProtectedRoute>} />
      <Route path="/parent/*" element={<ProtectedRoute allowedRoles={['parent']}><ParentDashboard /></ProtectedRoute>} />
      
      {/* Student Routes */}
      <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/attendance" element={<ProtectedRoute allowedRoles={['student']}><StudentAttendance /></ProtectedRoute>} />
      <Route path="/student/homework" element={<ProtectedRoute allowedRoles={['student']}><StudentHomework /></ProtectedRoute>} />
      <Route path="/student/results" element={<ProtectedRoute allowedRoles={['student']}><StudentResults /></ProtectedRoute>} />
      <Route path="/student/profile" element={<ProtectedRoute allowedRoles={['student']}><StudentProfile /></ProtectedRoute>} />
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
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
