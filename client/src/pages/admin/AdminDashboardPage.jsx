import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FlaskConical,
  CalendarCheck,
  FileText,
  IndianRupee,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
  Eye,
  RefreshCw,
  Package,
  Plus,
  Sparkles,
  Search,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const COLORS = ['#F59E0B', '#3B82F6', '#6366F1', '#A855F7', '#10B981', '#059669', '#EF4444'];

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, []);

  // Auto-refresh dashboard metrics every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMetrics(false);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get('/dashboard/admin', {
        headers: { 'X-Admin-Request': 'true' }
      });
      setData(res.data || null);
    } catch (err) {
      console.error('Error fetching admin dashboard metrics:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  const formatScheduleDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Calculating laboratory operational KPIs..." />;
  }

  const stats = data?.stats || {
    totalUsers: 0,
    totalTests: 0,
    todayBookings: 0,
    pendingReports: 0,
    revenue: 0,
    completedTests: 0,
  };

  const charts = data?.charts || {};
  const dailyBookings = charts.dailyBookings || [];
  const monthlyRevenue = charts.monthlyRevenue || [];
  const popularTests = charts.popularTests || [];
  const statusDistribution = charts.statusDistribution || [];
  const recentBookings = data?.recentBookings || [];
  const liveTests = data?.liveTests || [];
  const livePackages = data?.livePackages || [];
  const [testSearch, setTestSearch] = useState('');

  const filteredLiveTests = liveTests.filter((t) =>
    !testSearch.trim() ||
    t.name.toLowerCase().includes(testSearch.toLowerCase()) ||
    t.test_code.toLowerCase().includes(testSearch.toLowerCase()) ||
    (t.category_name && t.category_name.toLowerCase().includes(testSearch.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Top 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Users */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Patients</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalUsers}</div>
          <div className="text-[10px] text-slate-400">Registered Accounts</div>
        </div>

        {/* Total Tests */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Tests</span>
            <FlaskConical className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalTests}</div>
          <div className="text-[10px] text-slate-400">Diagnostic Catalog</div>
        </div>

        {/* Today Bookings */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Visits</span>
            <CalendarCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.todayBookings}</div>
          <div className="text-[10px] text-slate-400">Scheduled Today</div>
        </div>

        {/* Pending Reports */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">In Progress</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{stats.pendingReports}</div>
          <div className="text-[10px] text-slate-400">Samples in Processing</div>
        </div>

        {/* Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Lab Revenue</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">₹{stats.revenue}</div>
          <div className="text-[10px] text-slate-400">Collected & Invoiced</div>
        </div>

        {/* Completed Tests */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.completedTests}</div>
          <div className="text-[10px] text-slate-400">Delivered Reports</div>
        </div>
      </div>

      {/* Charts Row 1: Daily Bookings & Monthly Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Booking Analytics Chart */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Booking Trends (Past 7 Days)</h3>
              <p className="text-xs text-slate-400">Daily appointment volume</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#15803D] text-xs font-bold">
              Live Feed
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyBookings} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="bookings_count" name="Bookings" fill="#16A34A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Monthly Revenue Trend</h3>
              <p className="text-xs text-slate-400">Total lab earnings (₹)</p>
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month_label" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue (₹)"
                  stroke="#15803D"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#16A34A' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Test Popularity & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Test Popularity Horizontal Bar */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Most Booked Diagnostic Tests</h3>
              <p className="text-xs text-slate-400">Order frequency breakdown</p>
            </div>
            <FlaskConical className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={popularTests}
                margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  dataKey="test_name"
                  type="category"
                  tick={{ fontSize: 10, fill: '#334155' }}
                  width={140}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Bar dataKey="booking_count" name="Bookings" fill="#10B981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Donut */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Appointment Status Breakdown</h3>
              <p className="text-xs text-slate-400">Current workflow distribution</p>
            </div>
            <span className="text-xs font-bold text-slate-400">All Time</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11 }}
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Appointments & Bookings</h3>
            <p className="text-xs text-slate-400">Direct operations overview</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => fetchMetrics(true)}
              disabled={refreshing}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              title="Refresh dashboard metrics"
            >
              <RefreshCw className={`w-3 h-3 text-[#16A34A] ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <Link
              to="/admin/bookings"
              className="text-xs font-bold text-[#16A34A] hover:underline flex items-center space-x-1"
            >
              <span>Manage All Bookings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="py-3 px-4 font-bold">Booking Code</th>
                <th className="py-3 px-4 font-bold">Patient Name</th>
                <th className="py-3 px-4 font-bold">Booked Test(s)</th>
                <th className="py-3 px-4 font-bold">Appointment</th>
                <th className="py-3 px-4 font-bold">Collection</th>
                <th className="py-3 px-4 font-bold">Amount</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No recent bookings recorded yet. New appointments placed by patients will appear here.
                  </td>
                </tr>
              ) : (
                recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{b.booking_code}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <div>{b.patient_name}</div>
                      {b.user_name && <div className="text-[10px] text-blue-600 font-semibold">User: {b.user_name}</div>}
                    </td>
                    <td className="py-3 px-4 min-w-[180px] max-w-[240px]">
                      {b.items && b.items.length > 0 ? (
                        <div className="space-y-1">
                          {b.items.map((it, idx) => (
                            <div key={idx} className="flex items-center space-x-1.5">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                it.item_type === 'package' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {it.item_type === 'package' ? 'PKG' : 'TEST'}
                              </span>
                              <span className="font-bold text-slate-800 text-[11px] truncate" title={it.item_name}>
                                {it.item_name}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">General Diagnostic</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {formatScheduleDate(b.appointment_date)} <span className="text-slate-400">({b.time_slot})</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{b.collection_type}</td>
                    <td className="py-3 px-4 font-black text-slate-900">₹{b.total_amount}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={b.booking_status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to="/admin/bookings"
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-[#15803D] hover:bg-emerald-100 font-bold transition inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION: Website Health Packages */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">Live Website Health Packages</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {livePackages.length} Active Packages
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Diagnostic checkup packages currently offered to patients on the website
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/admin/packages"
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add / Manage Packages</span>
            </Link>
            <a
              href="/packages"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition"
            >
              <span>View On Site</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {livePackages.map((pkg) => {
            const savingsPercent = Math.round(((pkg.original_price - pkg.discount_price) / pkg.original_price) * 100);
            const benefitsList = typeof pkg.benefits === 'string'
              ? JSON.parse(pkg.benefits || '[]')
              : (pkg.benefits || []);

            return (
              <div
                key={pkg.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">{pkg.name}</h4>
                    {pkg.is_featured && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 flex items-center space-x-0.5 flex-shrink-0">
                        <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-lg font-black text-slate-900">₹{pkg.discount_price}</span>
                    <span className="text-xs text-slate-400 line-through">₹{pkg.original_price}</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      {savingsPercent}% OFF
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] font-bold text-slate-600 flex items-center space-x-1">
                    <FlaskConical className="w-3.5 h-3.5 text-blue-600" />
                    <span>{pkg.test_count || 0} Diagnostic Tests Bundled</span>
                  </div>
                  {benefitsList.length > 0 && (
                    <div className="mt-2 text-[10px] text-slate-500 line-clamp-2">
                      {benefitsList.slice(0, 2).join(' • ')}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    ● Active on Website
                  </span>
                  <Link
                    to="/admin/packages"
                    className="text-xs font-bold text-[#16A34A] hover:underline flex items-center space-x-1"
                  >
                    <span>Edit Package</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION: Website Diagnostic Tests */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <FlaskConical className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">Live Website Diagnostic Tests</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                {liveTests.length} Total Tests
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Individual blood and pathology tests actively available in patient catalog
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-48 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={testSearch}
                onChange={(e) => setTestSearch(e.target.value)}
                placeholder="Search test name or code..."
                className="w-full py-1.5 pl-8 pr-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
            </div>
            <Link
              to="/admin/tests"
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add / Manage Tests</span>
            </Link>
            <a
              href="/tests"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition"
            >
              <span>View On Site</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="py-3 px-4 font-bold">Code</th>
                <th className="py-3 px-4 font-bold">Test Name & Category</th>
                <th className="py-3 px-4 font-bold">Sample & Fasting</th>
                <th className="py-3 px-4 font-bold">TAT</th>
                <th className="py-3 px-4 font-bold">Patient Price</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLiveTests.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No tests matching "{testSearch}".
                  </td>
                </tr>
              ) : (
                filteredLiveTests.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{t.test_code}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 flex items-center space-x-2">
                        <span>{t.name}</span>
                        {t.is_popular && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800">
                            POPULAR
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">{t.category_name || 'General Diagnostics'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-700 font-medium">{t.sample_type}</div>
                      {t.fasting_required ? (
                        <span className="text-[10px] font-bold text-amber-600">Fasting Required</span>
                      ) : (
                        <span className="text-[10px] text-slate-400">No Fasting</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{t.report_time}</td>
                    <td className="py-3 px-4">
                      <div className="font-black text-slate-900">₹{t.discount_price || t.price}</div>
                      {t.discount_price && t.discount_price < t.price && (
                        <div className="text-[10px] text-slate-400 line-through">₹{t.price}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {t.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to="/admin/tests"
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#15803D] hover:bg-emerald-100 font-bold transition inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Manage</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
