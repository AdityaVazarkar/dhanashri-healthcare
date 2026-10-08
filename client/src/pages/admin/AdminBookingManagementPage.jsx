import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Home,
  Building,
  Clock,
  AlertCircle,
  RefreshCw,
  FileText,
  User,
  Edit3,
  Trash2
} from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EditBookingModal from '../../components/booking/EditBookingModal';
import DeleteBookingConfirmModal from '../../components/booking/DeleteBookingConfirmModal';

const BOOKING_STATUSES = [
  'Pending',
  'Confirmed',
  'Sample Collected',
  'Processing',
  'Report Ready',
  'Completed',
  'Cancelled'
];

export default function AdminBookingManagementPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(null);

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [deletingBooking, setDeletingBooking] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  // Fetch users for user filter dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/users?limit=200', {
          headers: { 'X-Admin-Request': 'true' }
        });
        setUsers(res.data.users || []);
      } catch (err) {
        console.error('Failed to load users for filter:', err);
      }
    };
    fetchUsers();
  }, []);

  const fetchBookings = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (userFilter !== 'all') params.append('userId', userFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get(`/bookings/admin?${params.toString()}`, {
        headers: { 'X-Admin-Request': 'true' }
      });
      setBookings(res.data.bookings || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Failed to load bookings. Please verify admin session.');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, userFilter]);

  // Auto-refresh polling every 12 seconds so new patient bookings appear live
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBookings(false);
    }, 12000);
    return () => clearInterval(interval);
  }, [statusFilter, userFilter, search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBookings(true);
  };

  const handleOpenDetailModal = (b) => {
    setSelectedBooking(b);
    setNewStatus(b.booking_status);
    setPaymentStatus(b.payment_status);
  };

  const handleUpdateStatus = async () => {
    if (!selectedBooking) return;
    setStatusUpdating(true);
    try {
      await api.put(`/bookings/${selectedBooking.id}/status`, {
        status: newStatus,
        payment_status: paymentStatus
      }, {
        headers: { 'X-Admin-Request': 'true' }
      });
      setSelectedBooking(null);
      fetchBookings(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
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

  const pendingCount = bookings.filter((b) => b.booking_status === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Patient Booking Management</h2>
          <p className="text-xs text-slate-500">
            Track and advance diagnostic workflow through sample collection and testing stages.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {pendingCount > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 animate-pulse">
              {pendingCount} Pending Action{pendingCount > 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={() => fetchBookings(true)}
            disabled={refreshing}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-sm transition active:scale-95 disabled:opacity-50"
            title="Refresh bookings list"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#16A34A] ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchBookings(true)}
            className="px-3 py-1 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search test name, patient, user, code..."
            className="w-full py-2 pl-9 pr-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Filter According to User */}
          <div className="flex items-center space-x-1.5 flex-1 sm:flex-initial">
            <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full sm:w-56 p-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
              title="Filter tests and bookings according to user"
            >
              <option value="all">All Users & Patients</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.email || u.mobile})
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Status */}
          <div className="flex items-center space-x-1.5 flex-1 sm:flex-initial">
            <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-44 p-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">All Booking Statuses</option>
              {BOOKING_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {(search || statusFilter !== 'all' || userFilter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); setUserFilter('all'); }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <LoadingSpinner message="Loading patient bookings..." />
      ) : (
        <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-4 font-bold">Booking ID</th>
                  <th className="py-3 px-4 font-bold">Patient & User</th>
                  <th className="py-3 px-4 font-bold">Booked Test(s)</th>
                  <th className="py-3 px-4 font-bold">Schedule</th>
                  <th className="py-3 px-4 font-bold">Collection</th>
                  <th className="py-3 px-4 font-bold">Amount</th>
                  <th className="py-3 px-4 font-bold">Payment</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-slate-400">
                      <CalendarCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700 text-sm">No patient bookings found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {search || statusFilter !== 'all' || userFilter !== 'all'
                          ? 'Try adjusting your search criteria or filter options.'
                          : 'Appointments placed by patients will appear here in real-time.'}
                      </p>
                      {(search || statusFilter !== 'all' || userFilter !== 'all') && (
                        <button
                          onClick={() => { setSearch(''); setStatusFilter('all'); setUserFilter('all'); }}
                          className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-50 text-[#15803D] font-bold text-xs hover:bg-emerald-100 transition"
                        >
                          Clear Filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{b.booking_code}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{b.patient_name}</div>
                        <div className="text-[11px] text-slate-500">
                          {b.patient_age ? `${b.patient_age} Y` : ''} {b.patient_gender ? `• ${b.patient_gender}` : ''}
                        </div>
                        <div className="text-[10px] text-slate-400">📞 {b.patient_mobile}</div>
                        {b.user_name ? (
                          <div className="mt-1 inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-100" title={`User Account: ${b.user_name} (${b.user_email || ''})`}>
                            <User className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[120px]">User: {b.user_name}</span>
                          </div>
                        ) : (
                          <span className="mt-1 inline-block text-[10px] text-slate-400 font-medium">Guest Booking</span>
                        )}
                      </td>
                      {/* Booked Test(s) Column */}
                      <td className="py-3 px-4 min-w-[200px] max-w-[280px]">
                        {b.items && b.items.length > 0 ? (
                          <div className="space-y-1.5">
                            {b.items.map((it, idx) => (
                              <div key={idx} className="flex items-start space-x-1.5">
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase flex-shrink-0 mt-0.5 ${
                                    it.item_type === 'package'
                                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  }`}
                                >
                                  {it.item_type === 'package' ? 'PKG' : 'TEST'}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-slate-800 text-[11px] leading-tight truncate" title={it.item_name}>
                                    {it.item_name}
                                  </p>
                                  <span className="text-[10px] text-slate-400 font-semibold">₹{it.price}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">General Diagnostic</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{formatScheduleDate(b.appointment_date)}</div>
                        <div className="text-[10px] text-slate-400">{b.time_slot}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700 flex items-center">
                          {b.collection_type === 'Home Collection' ? (
                            <Home className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          ) : (
                            <Building className="w-3.5 h-3.5 mr-1 text-blue-600" />
                          )}
                          {b.collection_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">₹{b.total_amount}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {b.payment_status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={b.booking_status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => navigate(`/admin/reports?booking_id=${b.id}`)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-[#15803D] hover:bg-emerald-100 font-bold transition inline-flex items-center space-x-1 text-xs"
                            title="Generate Report for this booking"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Report</span>
                          </button>
                          <button
                            onClick={() => setEditingBooking(b)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="Edit Booking Details & Schedule"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingBooking(b)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Booking"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDetailModal(b)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold transition inline-flex items-center space-x-1 text-xs"
                            title="Quick Status Update"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Status</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Status Update Modal */}
      {selectedBooking && (
        <Modal
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          title={`Booking ${selectedBooking.booking_code}`}
          subtitle={`Patient: ${selectedBooking.patient_name} (${selectedBooking.patient_age} Yrs, ${selectedBooking.patient_gender})`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-5 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div><strong>Appointment Date:</strong> {formatScheduleDate(selectedBooking.appointment_date)}</div>
                <div><strong>Slot:</strong> {selectedBooking.time_slot}</div>
                <div><strong>Collection:</strong> {selectedBooking.collection_type}</div>
                <div><strong>Total Amount:</strong> ₹{selectedBooking.total_amount}</div>
                <div><strong>Patient Contact:</strong> {selectedBooking.patient_mobile}</div>
                <div>
                  <strong>Booked By User:</strong>{' '}
                  {selectedBooking.user_name ? (
                    <span className="text-emerald-700 font-bold">{selectedBooking.user_name} ({selectedBooking.user_email})</span>
                  ) : (
                    <span className="text-slate-500">Direct / Guest</span>
                  )}
                </div>
              </div>
              {selectedBooking.address && (
                <div className="pt-2 border-t border-slate-200">
                  <strong>Address:</strong> {selectedBooking.address}, {selectedBooking.city} - {selectedBooking.pincode}
                </div>
              )}
              {selectedBooking.items && selectedBooking.items.length > 0 && (
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <strong className="block text-slate-800">Tests / Packages Booked by User:</strong>
                  <div className="space-y-1.5">
                    {selectedBooking.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                        <div className="flex items-center space-x-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                            it.item_type === 'package' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {it.item_type === 'package' ? 'Package' : 'Test'}
                          </span>
                          <span className="font-bold text-slate-800">{it.item_name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-slate-900">₹{it.price}</span>
                          {it.test_id && (
                            <button
                              type="button"
                              onClick={() => {
                                const bId = selectedBooking.id;
                                setSelectedBooking(null);
                                navigate(`/admin/reports?booking_id=${bId}&test_id=${it.test_id}`);
                              }}
                              className="px-2 py-0.5 rounded bg-emerald-50 text-[#15803D] hover:bg-emerald-100 font-bold text-[10px] border border-emerald-200"
                            >
                              Create Report
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Change Status Control */}
            <div className="space-y-2">
              <label className="font-bold text-slate-800">Advance Workflow Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              >
                {BOOKING_STATUSES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">
                Updating status automatically triggers an in-app notification to the patient.
              </p>
            </div>

            {/* Payment Status */}
            <div className="space-y-2">
              <label className="font-bold text-slate-800">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const b = selectedBooking;
                    setSelectedBooking(null);
                    setEditingBooking(b);
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-emerald-50 hover:text-[#15803D] text-slate-700 font-bold rounded-xl flex items-center space-x-1.5 transition text-xs"
                  title="Edit full patient and appointment schedule details"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const b = selectedBooking;
                    setSelectedBooking(null);
                    setDeletingBooking(b);
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-bold rounded-xl flex items-center space-x-1.5 transition text-xs"
                  title="Delete this test booking"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const bId = selectedBooking.id;
                    setSelectedBooking(null);
                    navigate(`/admin/reports?booking_id=${bId}`);
                  }}
                  className="px-3 py-2 bg-emerald-50 text-[#15803D] hover:bg-emerald-100 font-bold rounded-xl flex items-center space-x-1.5 transition text-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Report</span>
                </button>
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={statusUpdating}
                  onClick={handleUpdateStatus}
                  className="px-5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-xl shadow-sm"
                >
                  {statusUpdating ? 'Updating...' : 'Save & Notify Patient'}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Booking Modal */}
      {editingBooking && (
        <EditBookingModal
          isOpen={!!editingBooking}
          onClose={() => setEditingBooking(null)}
          booking={editingBooking}
          onSuccess={() => {
            setEditingBooking(null);
            fetchBookings(true);
          }}
          isAdmin={true}
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
            fetchBookings(true);
          }}
          isAdmin={true}
        />
      )}
    </div>
  );
}
