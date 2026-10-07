import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorBoundary from '../components/common/ErrorBoundary';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { admin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <LoadingSpinner message="Verifying administrative access..." />
      </div>
    );
  }

  // Redirect to admin login if not logged in
  if (!admin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin') return 'Overview Dashboard';
    if (path.includes('/admin/users')) return 'User & Patient Management';
    if (path.includes('/admin/tests')) return 'Test Catalog Management';
    if (path.includes('/admin/categories')) return 'Category Management';
    if (path.includes('/admin/packages')) return 'Health Package Management';
    if (path.includes('/admin/bookings')) return 'Booking & Appointment Operations';
    if (path.includes('/admin/reports')) return 'Laboratory Report Management';
    if (path.includes('/admin/notifications')) return 'Admin Activity Center';
    return 'Lab Administration';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 flex flex-col lg:pl-64 min-w-0 transition-all">
        <AdminHeader
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          title={getPageTitle()}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
