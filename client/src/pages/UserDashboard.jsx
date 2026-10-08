import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  FileText,
  Clock,
  ArrowRight,
  Download,
  Eye,
  CheckCircle2,
  Home,
  Building,
  Sparkles,
  ShoppingBag,
  Package,
  Activity,
  Edit3,
  Trash2
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EditBookingModal from '../components/booking/EditBookingModal';
import DeleteBookingConfirmModal from '../components/booking/DeleteBookingConfirmModal';

export default function UserDashboard() {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingBooking, setEditingBooking] = useState(null);
  const [deletingBooking, setDeletingBooking] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard/user');
      setDashboardData(res.data.data || null);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleDownloadReport = (reportId) => {
    const downloadUrl = `http://localhost:5001/api/reports/${reportId}/download?token=${token}`;
    window.open(downloadUrl, '_blank');
  };

  if (loading) {
    return <LoadingSpinner message="Loading your health portal..." />;
  }

  const stats = dashboardData?.stats || {
    upcomingTests: 0,
    completedTests: 0,
    availableReports: 0,
    totalBookings: 0,
  };

  const upcomingAppointment = dashboardData?.upcomingAppointment;
  const recentReports = dashboardData?.recentReports || [];
  const recommendedPackages = dashboardData?.recommendedPackages || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#F0FDF4] via-emerald-50 to-white p-6 sm:p-10 border border-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">
            Patient Portal
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
            {getGreeting()}, {user?.full_name?.split(' ')[0] || 'Patient'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Your Health Dashboard • Keep track of test appointments and diagnostic reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/tests"
            className="px-5 py-3 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-2"
          >
            <span>Book New Test</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Upcoming Tests</span>
            <Calendar className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.upcomingTests}</div>
          <div className="text-[11px] text-slate-500 font-medium">Scheduled Appointments</div>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Completed Tests</span>
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.completedTests}</div>
          <div className="text-[11px] text-slate-500 font-medium">Historical Testing</div>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Available Reports</span>
            <FileText className="w-5 h-5 text-[#16A34A]" />
          </div>
          <div className="text-3xl font-black text-[#15803D]">{stats.availableReports}</div>
          <div className="text-[11px] text-slate-500 font-medium">Verified PDF Records</div>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Bookings</span>
            <ShoppingBag className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.totalBookings}</div>
          <div className="text-[11px] text-slate-500 font-medium">Lifetime Activity</div>
        </div>
      </div>

      {/* Main Split: Upcoming Appointment + Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Upcoming Appointment Section */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Upcoming Appointment</h2>
            <Link to="/bookings" className="text-xs font-bold text-[#16A34A] hover:underline">
              View All
            </Link>
          </div>

          {upcomingAppointment ? (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {upcomingAppointment.booking_code}
                </span>
                <StatusBadge status={upcomingAppointment.booking_status} />
              </div>

              <div className="space-y-2">
                <div className="text-xs text-slate-400 font-semibold">Test Name(s)</div>
                <div className="font-bold text-slate-900 text-sm">
                  {(upcomingAppointment.items || []).map((it) => it.item_name).join(', ') || 'Diagnostic Blood Profile'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 font-semibold block">Date & Time</span>
                  <span className="font-bold text-slate-800">
                    {upcomingAppointment.appointment_date}
                  </span>
                  <span className="text-slate-500 block">{upcomingAppointment.time_slot}</span>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block">Collection Type</span>
                  <span className="font-bold text-slate-800 flex items-center">
                    {upcomingAppointment.collection_type === 'Home Collection' ? (
                      <Home className="w-3.5 h-3.5 mr-1 text-[#16A34A]" />
                    ) : (
                      <Building className="w-3.5 h-3.5 mr-1 text-blue-600" />
                    )}
                    {upcomingAppointment.collection_type}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingBooking(upcomingAppointment)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-emerald-50 hover:text-[#15803D] text-slate-700 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-2xs"
                    title="Edit test appointment schedule or details"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Booking</span>
                  </button>
                  <button
                    onClick={() => setDeletingBooking(upcomingAppointment)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-2xs"
                    title="Cancel and delete this test booking"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

                <Link
                  to="/bookings"
                  className="px-4 py-2 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#15803D] text-xs font-bold rounded-xl transition flex items-center space-x-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Status</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-[#16A34A] flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-500">You have no upcoming blood test appointments scheduled.</p>
              <Link
                to="/tests"
                className="inline-block px-4 py-2 bg-[#16A34A] text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Schedule a Test
              </Link>
            </div>
          )}
        </div>

        {/* Recent Reports Section */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Reports</h2>
            <Link to="/reports" className="text-xs font-bold text-[#16A34A] hover:underline">
              View All Reports
            </Link>
          </div>

          {recentReports.length > 0 ? (
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between hover:border-emerald-300 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-xs">{report.test_name}</span>
                      <StatusBadge status={report.report_status} />
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Report: {report.report_code} • {report.report_date}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/reports/${report.id}`}
                      className="p-2 rounded-xl text-slate-600 hover:text-[#16A34A] hover:bg-slate-50 transition"
                      title="View Report"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDownloadReport(report.id)}
                      className="px-3 py-1.5 rounded-xl bg-[#16A34A] text-white text-xs font-bold hover:bg-[#15803D] transition flex items-center space-x-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-[#16A34A] flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-500">No verified laboratory reports found yet.</p>
              <Link to="/tests" className="inline-block text-xs font-bold text-[#16A34A] hover:underline">
                Explore popular tests →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recommended Health Packages */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">Recommended For You</span>
            <h2 className="text-xl font-bold text-slate-900">Preventive Health Checkup Packages</h2>
          </div>
          <Link to="/packages" className="text-xs font-bold text-[#16A34A] hover:underline">
            Browse All Packages →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommendedPackages.map((pkg) => (
            <div
              key={pkg.id}
              className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-[#15803D]">
                    Preventive
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    Save {Math.round(((pkg.original_price - pkg.discount_price) / pkg.original_price) * 100)}%
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{pkg.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{pkg.description}</p>

                <div className="text-xs text-slate-600 font-semibold">
                  Includes {pkg.test_count || 5}+ Major Organ Diagnostic Profiles
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-xl font-black text-slate-900">₹{pkg.discount_price}</div>
                  <div className="text-[11px] text-slate-400 line-through">₹{pkg.original_price}</div>
                </div>

                <button
                  onClick={() => addToCart(pkg, 'package')}
                  className="px-4 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  Book Package
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Booking Modal */}
      {editingBooking && (
        <EditBookingModal
          isOpen={!!editingBooking}
          onClose={() => setEditingBooking(null)}
          booking={editingBooking}
          onSuccess={() => {
            setEditingBooking(null);
            fetchDashboard();
          }}
          isAdmin={false}
        />
      )}

      {/* Delete Booking Confirmation Modal */}
      {deletingBooking && (
        <DeleteBookingConfirmModal
          isOpen={!!deletingBooking}
          onClose={() => setDeletingBooking(null)}
          booking={deletingBooking}
          onSuccess={() => {
            setDeletingBooking(null);
            fetchDashboard();
          }}
          isAdmin={false}
        />
      )}
    </div>
  );
}
