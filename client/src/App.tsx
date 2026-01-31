import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import AppLayout from './layouts/AppLayout';
import AdminLayout from './layouts/AdminLayout';

// Landing Page
import LandingPage from './pages/LandingPage';

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
import InvoiceDetailPage from './pages/invoices/InvoiceDetailPage';
import GuestInvoicePage from './pages/invoices/GuestInvoicePage';
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
import AdminBarnsPage from './pages/admin/AdminBarnsPage';
import AdminBarnDetailPage from './pages/admin/AdminBarnDetailPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage';
import AdminDemoRequestsPage from './pages/admin/AdminDemoRequestsPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminHomePage from './pages/admin/AdminHomePage';
import AdminDemoPage from './pages/admin/AdminDemoPage';
import AdminUsersListPage from './pages/admin/AdminUsersListPage';
import AdminBarnsListPage from './pages/admin/AdminBarnsListPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminAvailabilityPage from './pages/admin/AdminAvailabilityPage';
import BillingTemplatesPage from './pages/billing/BillingTemplatesPage';
import StablePage from './pages/stable/StablePage';
import FinancialsPage from './pages/financials/FinancialsPage';

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
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Public Route Component (redirects to app dashboard if already logged in)
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
    return <Navigate to="/app/dashboard" replace />;
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
      {/* Landing Page - Public */}
      <Route path="/" element={<LandingPage />} />

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
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Horses */}
        <Route path="horses" element={<HorsesPage />} />
        <Route path="horses/:id" element={<HorseDetailPage />} />

        {/* Financials */}
        <Route path="financials" element={<FinancialsPage />} />

        {/* Invoices (legacy & detail views) */}
        <Route path="invoices" element={<Navigate to="/app/financials" replace />} />
        <Route path="invoices/:id" element={<InvoiceDetailPage />} />

        {/* Calendar (combined Tasks & Lessons) */}
        <Route path="calendar" element={<CalendarPage />} />

        {/* Legacy routes redirect to calendar */}
        <Route path="tasks" element={<Navigate to="/app/calendar" replace />} />
        <Route path="lessons" element={<Navigate to="/app/calendar" replace />} />

        {/* Stable */}
        <Route path="stable" element={<StablePage />} />

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
        <Route path="admin/users" element={<AdminUsersPage />} />
        <Route path="admin/users/:id" element={<AdminUserDetailPage />} />
        <Route path="admin/barns" element={<AdminBarnsPage />} />
        <Route path="admin/barns/:id" element={<AdminBarnDetailPage />} />
        <Route path="admin/demo-requests" element={<AdminDemoRequestsPage />} />
      </Route>

      {/* Guest Invoice Page - Public (no auth required) */}
      <Route path="/invoice/:token" element={<GuestInvoicePage />} />

      {/* Standalone Admin Portal */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminHomePage />} />
        <Route path="demo-requests" element={<AdminDemoPage />} />
        <Route path="users" element={<AdminUsersListPage />} />
        <Route path="barns" element={<AdminBarnsListPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="availability" element={<AdminAvailabilityPage />} />
      </Route>

      {/* Catch all - redirect to landing page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
