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

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";

// Teacher Pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";

// Parent Pages
import ParentDashboard from "./pages/parent/ParentDashboard";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";

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
      
      {/* Admin Routes */}
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'school_admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute allowedRoles={['super_admin', 'school_admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Teacher Routes */}
      <Route 
        path="/teacher/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/teacher/*" 
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Parent Routes */}
      <Route 
        path="/parent/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['parent']}>
            <ParentDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/parent/*" 
        element={
          <ProtectedRoute allowedRoles={['parent']}>
            <ParentDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Student Routes */}
      <Route 
        path="/student/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/student/*" 
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Legacy routes - redirect to role-based */}
      <Route path="/dashboard" element={<AuthRedirect />} />
      <Route path="/students" element={<Navigate to="/admin/students" replace />} />
      <Route path="/attendance" element={<AuthRedirect />} />
      <Route path="/fees" element={<AuthRedirect />} />
      
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
