import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import AppLayout from './layouts/AppLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import AcceptInvitePage from './pages/auth/AcceptInvitePage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import VerificationRequiredPage from './pages/auth/VerificationRequiredPage';

// App Pages
import DashboardPage from './pages/DashboardPage';
import HorsesPage from './pages/horses/HorsesPage';
import HorseDetailPage from './pages/horses/HorseDetailPage';
import InvoicesPage from './pages/invoices/InvoicesPage';
import InvoiceDetailPage from './pages/invoices/InvoiceDetailPage';
import TasksPage from './pages/tasks/TasksPage';
import LessonsPage from './pages/lessons/LessonsPage';
import CalendarPage from './pages/calendar/CalendarPage';
import VendorsPage from './pages/vendors/VendorsPage';
import UsersPage from './pages/users/UsersPage';
import SettingsPage from './pages/settings/SettingsPage';
import ProfilePage from './pages/settings/ProfilePage';
import SecurityPage from './pages/settings/SecurityPage';
import BarnSettingsPage from './pages/settings/BarnSettingsPage';
import BrandingPage from './pages/settings/BrandingPage';
import SubscriptionPage from './pages/settings/SubscriptionPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminBarnDetailPage from './pages/admin/AdminBarnDetailPage';
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage';
import BillingTemplatesPage from './pages/billing/BillingTemplatesPage';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Public Route Component (redirects to dashboard if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  const loadUser = useAuthStore((state) => state.loadUser);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <AuthLayout>
              <RegisterPage />
            </AuthLayout>
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <AuthLayout>
              <ForgotPasswordPage />
            </AuthLayout>
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password/:token"
        element={
          <PublicRoute>
            <AuthLayout>
              <ResetPasswordPage />
            </AuthLayout>
          </PublicRoute>
        }
      />
      <Route
        path="/invite/:token"
        element={
          <AuthLayout>
            <AcceptInvitePage />
          </AuthLayout>
        }
      />
      <Route
        path="/verify-email/:token"
        element={
          <AuthLayout>
            <VerifyEmailPage />
          </AuthLayout>
        }
      />
      <Route
        path="/verification-required"
        element={
          <AuthLayout>
            <VerificationRequiredPage />
          </AuthLayout>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Horses */}
        <Route path="horses" element={<HorsesPage />} />
        <Route path="horses/:id" element={<HorseDetailPage />} />

        {/* Invoices */}
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="invoices/:id" element={<InvoiceDetailPage />} />

        {/* Calendar (combined Tasks & Lessons) */}
        <Route path="calendar" element={<CalendarPage />} />

        {/* Legacy routes redirect to calendar */}
        <Route path="tasks" element={<Navigate to="/calendar" replace />} />
        <Route path="lessons" element={<Navigate to="/calendar" replace />} />

        {/* Vendors */}
        <Route path="vendors" element={<VendorsPage />} />

        {/* Users */}
        <Route path="users" element={<UsersPage />} />

        {/* Settings */}
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/profile" element={<ProfilePage />} />
        <Route path="settings/security" element={<SecurityPage />} />
        <Route path="settings/barn" element={<BarnSettingsPage />} />
        <Route path="settings/branding" element={<BrandingPage />} />
        <Route path="settings/subscription" element={<SubscriptionPage />} />
        <Route path="settings/billing-templates" element={<BillingTemplatesPage />} />

        {/* Admin */}
        <Route path="admin" element={<AdminDashboardPage />} />
        <Route path="admin/barns/:id" element={<AdminBarnDetailPage />} />
        <Route path="admin/users/:id" element={<AdminUserDetailPage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
