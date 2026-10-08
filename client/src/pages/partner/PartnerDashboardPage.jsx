import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Search,
  Filter,
  RefreshCw,
  IndianRupee,
  TrendingUp,
  Truck,
  FileCheck,
  AlertCircle,
  Calendar,
  User,
  FlaskConical,
  ExternalLink,
  MessageSquare,
  BadgeAlert
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function PartnerDashboardPage() {
  const { partner } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState('all'); // all, pending, collected, completed
  const [lastUpdated, setLastUpdated] = useState(null);

  // Status update modal state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('Sample Collected');
  const [partnerNotes, setPartnerNotes] = useState('');
  const [cashCollected, setCashCollected] = useState(false);
  const [statusSuccessMessage, setStatusSuccessMessage] = useState('');

  const fetchPartnerData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (statusTab !== 'all') params.append('status', statusTab);
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get(`/partners/assigned-bookings?${params.toString()}`, {
        headers: { 'X-Partner-Request': 'true' }
      });

      if (res.data.success) {
        setBookings(res.data.bookings || []);
        setSummary(res.data.summary || null);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Failed to load partner bookings:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPartnerData();
  }, [statusTab]);

  // Polling every 15s to catch new assignments
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPartnerData(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [statusTab, search]);

  const handleOpenStatusModal = (booking) => {
    setSelectedBooking(booking);
    setUpdateStatus(
      booking.booking_status === 'Pending' || booking.booking_status === 'Confirmed'
        ? 'Sample Collected'
        : booking.booking_status
    );
    setPartnerNotes(booking.partner_notes || '');
    setCashCollected(booking.payment_status === 'Paid');
    setStatusSuccessMessage('');
  };

  const handleSaveStatusUpdate = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;

    setUpdating(true);
    setStatusSuccessMessage('');
    try {
      const res = await api.put(
        `/partners/bookings/${selectedBooking.id}/status`,
        {
          status: updateStatus,
          notes: partnerNotes,
          payment_received: cashCollected
        },
        {
          headers: { 'X-Partner-Request': 'true' }
        }
      );

      if (res.data.success) {
        setStatusSuccessMessage('Sample collection status updated successfully!');
        setTimeout(() => {
          setSelectedBooking(null);
          fetchPartnerData(true);
        }, 800);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update sample status.');
    } finally {
      setUpdating(false);
    }
  };

  const formatScheduleDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Commission Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold mb-3">
              <Activity className="w-3.5 h-3.5" />
              <span>Phlebotomist Field Station</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {partner?.name || 'Partner'}
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl">
              Track assigned patient appointments, collect blood/diagnostic samples, update status in real-time, and watch your earnings grow.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-right min-w-[140px]">
              <div className="text-[10px] text-emerald-200 uppercase font-black tracking-wider">Commission Model</div>
              <div className="text-lg font-black text-white mt-0.5">
                {partner?.commission_rate || summary?.commission_rate || 15}%
                {partner?.fixed_fee > 0 && <span className="text-xs font-normal text-emerald-300"> + ₹{partner.fixed_fee}</span>}
              </div>
              <div className="text-[10px] text-emerald-300 font-medium">Per Collected Sample</div>
            </div>

            <button
              onClick={() => fetchPartnerData(true)}
              disabled={refreshing}
              className="px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-lg shadow-emerald-500/20 flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assigned */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Assigned Visits</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {summary?.total_assigned || bookings.length || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Total patient appointments</p>
        </div>

        {/* Samples Collected */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Samples Collected</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            {summary?.samples_collected || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Pending pickup: <strong className="text-amber-600">{summary?.pending_collections || 0}</strong>
          </p>
        </div>

        {/* Collection Volume */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Collection Volume</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            ₹{summary?.total_collection_volume ? Number(summary.total_collection_volume).toLocaleString('en-IN') : 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Total test billings handled</p>
        </div>

        {/* Income / Earnings Generated */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-600/20 hover:shadow-xl transition">
          <div className="flex items-center justify-between text-emerald-100 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Partner Income</span>
            <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            ₹{summary?.total_income_earned ? Number(summary.total_income_earned).toLocaleString('en-IN') : 0}
          </div>
          <p className="text-[11px] text-emerald-100 mt-1 font-medium">
            Generated from {summary?.samples_collected || 0} collections
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-2xl w-full md:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'All Assigned' },
            { id: 'pending', label: 'Pending Pickup' },
            { id: 'collected', label: 'Collected / In Transit' },
            { id: 'completed', label: 'Completed' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                statusTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchPartnerData(true)}
            placeholder="Search patient, phone, address..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Bookings List / Cards */}
      {loading ? (
        <LoadingSpinner message="Loading assigned patient collections..." />
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Truck className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Patient Appointments Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            {search || statusTab !== 'all'
              ? 'Try clearing the search query or status filter.'
              : 'Lab administrators will assign patient blood test visits to your portal.'}
          </p>
          {(search || statusTab !== 'all') && (
            <button
              onClick={() => { setSearch(''); setStatusTab('all'); }}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-500 px-1">
            Showing {bookings.length} assigned collection visits {lastUpdated && `(Updated ${lastUpdated.toLocaleTimeString()})`}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.map((b) => {
              const isPending = ['Pending', 'Confirmed'].includes(b.booking_status);
              const isCollected = ['Sample Collected', 'Processing', 'Report Ready', 'Completed'].includes(b.booking_status);

              return (
                <div
                  key={b.id}
                  className={`bg-white rounded-3xl border p-5 shadow-sm transition hover:shadow-md flex flex-col justify-between ${
                    isPending ? 'border-amber-200/80 ring-1 ring-amber-100' : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* Header: Code + Status Badge */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {b.booking_code}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {formatScheduleDate(b.appointment_date)} • {b.time_slot}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={b.booking_status} />
                    </div>

                    {/* Patient Name and Quick Call */}
                    <div className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 mb-3">
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                          <User className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>{b.patient_name}</span>
                          <span className="text-xs text-slate-500 font-normal">
                            ({b.patient_age}Y, {b.patient_gender})
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 mt-1 flex items-center space-x-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold">{b.patient_mobile}</span>
                        </div>
                      </div>

                      <a
                        href={`tel:${b.patient_mobile}`}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1 transition shadow-sm"
                        title="Call patient"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call</span>
                      </a>
                    </div>

                    {/* Address & Navigation */}
                    <div className="text-xs text-slate-600 mb-3 space-y-1">
                      <div className="flex items-start space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-slate-700">
                            {b.collection_type}:{' '}
                          </span>
                          <span>
                            {b.address ? `${b.address}, ${b.city} - ${b.pincode}` : 'Lab Visit (Dhanashri Diagnostic Center)'}
                          </span>
                          {b.landmark && (
                            <span className="block text-[11px] text-slate-400">Landmark: {b.landmark}</span>
                          )}
                        </div>
                      </div>

                      {b.address && (
                        <div className="pl-5 pt-0.5">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              `${b.address}, ${b.city} ${b.pincode}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 hover:underline"
                          >
                            <span>Open in Google Maps</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Booked Tests */}
                    <div className="text-xs mb-3 p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100">
                      <div className="font-bold text-slate-700 mb-1 flex items-center space-x-1">
                        <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tests for Collection:</span>
                      </div>
                      <div className="space-y-1">
                        {b.items && b.items.length > 0 ? (
                          b.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between text-[11px] text-slate-600">
                              <span className="truncate max-w-[200px]">{it.item_name}</span>
                              <span className="font-bold">₹{it.price}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-[11px] text-slate-400">Diagnostic Blood Profile</div>
                        )}
                      </div>
                    </div>

                    {/* Partner Notes & Collection Timestamp if collected */}
                    {b.sample_collected_at && (
                      <div className="mb-3 text-[11px] p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-100">
                        <div className="font-bold flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Sample Collected on: {new Date(b.sample_collected_at).toLocaleString()}</span>
                        </div>
                        {b.partner_notes && (
                          <div className="mt-0.5 text-emerald-700">Notes: {b.partner_notes}</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer: Payment + Status Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">
                        {b.payment_method}
                      </div>
                      <div className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
                        <span>Total: ₹{b.total_amount}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                          b.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {b.payment_status}
                        </span>
                      </div>
                      {b.commission_earned > 0 && (
                        <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                          Your Comm: +₹{b.commission_earned}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenStatusModal(b)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm ${
                        isPending
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-500/30'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isPending ? 'Collect Sample' : 'Update Status'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {selectedBooking && (
        <Modal
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          title={`Update Sample Status: ${selectedBooking.booking_code}`}
          subtitle={`Patient: ${selectedBooking.patient_name} (${selectedBooking.patient_mobile})`}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSaveStatusUpdate} className="space-y-4 text-xs">
            {statusSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{statusSuccessMessage}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Select Collection / Transit Status
              </label>
              <select
                value={updateStatus}
                onChange={(e) => setUpdateStatus(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Sample Collected">✅ Sample Collected (Successfully drawn)</option>
                <option value="In Transit">🚚 In Transit to Diagnostic Center</option>
                <option value="Processing">🔬 Delivered to Lab (Processing begins)</option>
                <option value="Completed">🎉 Completed</option>
                <option value="Cancelled">❌ Patient Cancelled / Unavailable</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Partner Notes & Sample Details
              </label>
              <textarea
                rows={3}
                value={partnerNotes}
                onChange={(e) => setPartnerNotes(e.target.value)}
                placeholder="e.g., Fasting sample collected in EDTA tube at 8:45 AM. Kept in cold box."
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Cash Collection Checkbox */}
            {selectedBooking.payment_method === 'Cash on Collection' && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-2.5">
                <input
                  type="checkbox"
                  id="cashCollectedCheck"
                  checked={cashCollected}
                  onChange={(e) => setCashCollected(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="cashCollectedCheck" className="text-amber-900 font-bold cursor-pointer">
                  Received Cash payment of ₹{selectedBooking.total_amount} from patient on collection
                  <p className="text-[11px] font-normal text-amber-700 mt-0.5">
                    Check this box to automatically mark payment as "Paid".
                  </p>
                </label>
              </div>
            )}

            {/* Estimated Commission info */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex justify-between items-center">
              <div>
                <span className="font-bold text-slate-800">Your Income for this sample:</span>
                <p className="text-[10px] text-slate-400">
                  {partner?.commission_rate || 15}% rate {partner?.fixed_fee > 0 && `+ ₹${partner.fixed_fee} fee`}
                </p>
              </div>
              <span className="text-sm font-black text-emerald-700">
                ₹{Math.round((((selectedBooking.total_amount * (partner?.commission_rate || 15)) / 100) + (partner?.fixed_fee || 0)) * 100) / 100}
              </span>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm disabled:opacity-50"
              >
                {updating ? 'Saving Status...' : 'Save & Update'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
