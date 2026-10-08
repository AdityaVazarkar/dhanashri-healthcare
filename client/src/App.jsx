import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layouts
import PatientLayout from './layouts/PatientLayout';
import AdminLayout from './layouts/AdminLayout';
import PartnerLayout from './layouts/PartnerLayout';

// Public & Patient Pages
import LandingPage from './pages/LandingPage';
import TestCatalogPage from './pages/TestCatalogPage';
import TestDetailsPage from './pages/TestDetailsPage';
import PackagesPage from './pages/PackagesPage';
import BookingFlowPage from './pages/BookingFlowPage';
import UserBookingsPage from './pages/UserBookingsPage';
import UserReportsPage from './pages/UserReportsPage';
import ReportViewerPage from './pages/ReportViewerPage';
import UserDashboard from './pages/UserDashboard';
import UserProfilePage from './pages/UserProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';

// Partner Pages
import PartnerLoginPage from './pages/partner/PartnerLoginPage';
import PartnerDashboardPage from './pages/partner/PartnerDashboardPage';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminPartnerManagementPage from './pages/admin/AdminPartnerManagementPage';
import AdminTestManagementPage from './pages/admin/AdminTestManagementPage';
import AdminCategoryManagementPage from './pages/admin/AdminCategoryManagementPage';
import AdminPackageManagementPage from './pages/admin/AdminPackageManagementPage';
import AdminBookingManagementPage from './pages/admin/AdminBookingManagementPage';
import AdminReportManagementPage from './pages/admin/AdminReportManagementPage';
import AdminUserManagementPage from './pages/admin/AdminUserManagementPage';
import AdminNotificationCenterPage from './pages/admin/AdminNotificationCenterPage';
import ErrorBoundary from './components/common/ErrorBoundary';

// User Protected Route Guard
function ProtectedUserRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location.pathname + location.search,
          message: 'To book a test, please log in. If you are a new patient, please register first.'
        }}
        replace
      />
    );
  }
  return children;
}

// Partner Protected Route Guard
function ProtectedPartnerRoute({ children }) {
  const { isPartnerAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isPartnerAuthenticated) {
    return <Navigate to="/partner/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
          <Routes>
            {/* Patient & Public Portal Routes */}
            <Route path="/" element={<PatientLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="tests" element={<TestCatalogPage />} />
              <Route path="tests/:id" element={<TestDetailsPage />} />
              <Route path="packages" element={<PackagesPage />} />
              <Route
                path="book"
                element={
                  <ProtectedUserRoute>
                    <BookingFlowPage />
                  </ProtectedUserRoute>
                }
              />
              <Route
                path="bookings"
                element={
                  <ProtectedUserRoute>
                    <UserBookingsPage />
                  </ProtectedUserRoute>
                }
              />
              <Route
                path="reports"
                element={
                  <ProtectedUserRoute>
                    <UserReportsPage />
                  </ProtectedUserRoute>
                }
              />
              <Route
                path="reports/:id"
                element={
                  <ProtectedUserRoute>
                    <ReportViewerPage />
                  </ProtectedUserRoute>
                }
              />
              <Route
                path="dashboard"
                element={
                  <ProtectedUserRoute>
                    <UserDashboard />
                  </ProtectedUserRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedUserRoute>
                    <UserProfilePage />
                  </ProtectedUserRoute>
                }
              />
              <Route path="about" element={<AboutPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
            </Route>

            {/* Partner Portal Routes */}
            <Route path="/partner/login" element={<PartnerLoginPage />} />
            <Route
              path="/partner"
              element={
                <ProtectedPartnerRoute>
                  <PartnerLayout />
                </ProtectedPartnerRoute>
              }
            >
              <Route index element={<Navigate to="/partner/dashboard" replace />} />
              <Route path="dashboard" element={<PartnerDashboardPage />} />
            </Route>

            {/* Admin Portal Authentication */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Admin Dashboard Protected Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="partners" element={<AdminPartnerManagementPage />} />
              <Route path="tests" element={<AdminTestManagementPage />} />
              <Route path="categories" element={<AdminCategoryManagementPage />} />
              <Route path="packages" element={<AdminPackageManagementPage />} />
              <Route path="bookings" element={<AdminBookingManagementPage />} />
              <Route path="reports" element={<AdminReportManagementPage />} />
              <Route path="users" element={<AdminUserManagementPage />} />
              <Route path="notifications" element={<AdminNotificationCenterPage />} />
            </Route>

            {/* Fallback 404 */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-center">
                  <div className="max-w-md space-y-4">
                    <h1 className="text-4xl font-black text-slate-900">404</h1>
                    <p className="text-sm text-slate-600">The requested medical page could not be found.</p>
                    <a
                      href="/"
                      className="inline-block px-5 py-2.5 bg-[#16A34A] text-white text-xs font-bold rounded-xl"
                    >
                      Return to Homepage
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}
