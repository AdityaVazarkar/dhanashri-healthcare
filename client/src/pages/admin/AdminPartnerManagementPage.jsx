import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Plus,
  Search,
  Filter,
  IndianRupee,
  TrendingUp,
  Percent,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  MapPin,
  Edit3,
  Trash2,
  CalendarCheck,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Truck
} from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminPartnerManagementPage() {
  const [partners, setPartners] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Create & Edit Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    city: 'Bengaluru',
    area: '',
    commission_rate: '15.00',
    fixed_fee: '0.00',
    status: 'active'
  });

  // Assign Booking Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedPartnerForAssign, setSelectedPartnerForAssign] = useState(null);
  const [unassignedBookings, setUnassignedBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  // Delete State
  const [deletingPartner, setDeletingPartner] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const fetchPartners = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get(`/partners/admin?${params.toString()}`, {
        headers: { 'X-Admin-Request': 'true' }
      });

      if (res.data.success) {
        setPartners(res.data.partners || []);
        setSummary(res.data.summary || null);
      }
    } catch (err) {
      console.error('Failed to load partners:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [statusFilter]);

  const handleOpenCreateModal = () => {
    setEditingPartner(null);
    setFormData({
      name: '',
      email: '',
      mobile: '',
      password: '',
      city: 'Bengaluru',
      area: '',
      commission_rate: '15.00',
      fixed_fee: '0.00',
      status: 'active'
    });
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (p) => {
    setEditingPartner(p);
    setFormData({
      name: p.name || '',
      email: p.email || '',
      mobile: p.mobile || '',
      password: '', // Blank unless admin enters a new password
      city: p.city || 'Bengaluru',
      area: p.area || '',
      commission_rate: p.commission_rate?.toString() || '15.00',
      fixed_fee: p.fixed_fee?.toString() || '0.00',
      status: p.status || 'active'
    });
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      if (editingPartner) {
        // Update partner
        await api.put(`/partners/admin/${editingPartner.id}`, formData, {
          headers: { 'X-Admin-Request': 'true' }
        });
      } else {
        // Create new partner
        await api.post('/partners/admin', formData, {
          headers: { 'X-Admin-Request': 'true' }
        });
      }

      setIsCreateModalOpen(false);
      fetchPartners(true);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to save partner.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeletePartner = async () => {
    if (!deletingPartner) return;
    setDeleteSubmitting(true);
    try {
      await api.delete(`/partners/admin/${deletingPartner.id}`, {
        headers: { 'X-Admin-Request': 'true' }
      });
      setDeletingPartner(null);
      fetchPartners(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete partner.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Open Assign Booking modal
  const handleOpenAssignModal = async (partner = null) => {
    setSelectedPartnerForAssign(partner);
    setSelectedBookingId('');
    setIsAssignModalOpen(true);

    try {
      const res = await api.get('/bookings/admin?limit=100', {
        headers: { 'X-Admin-Request': 'true' }
      });
      if (res.data.success) {
        // Find bookings that can be assigned (Pending, Confirmed, or Home Collection)
        setUnassignedBookings(res.data.bookings || []);
      }
    } catch (err) {
      console.error('Failed to load bookings for assignment:', err);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookingId || !selectedPartnerForAssign) return;

    setAssignSubmitting(true);
    try {
      await api.post(
        '/partners/admin/assign',
        {
          booking_id: selectedBookingId,
          partner_id: selectedPartnerForAssign.id
        },
        {
          headers: { 'X-Admin-Request': 'true' }
        }
      );
      setIsAssignModalOpen(false);
      fetchPartners(true);
      alert(`Booking BK-${selectedBookingId} successfully assigned to ${selectedPartnerForAssign.name}!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign booking.');
    } finally {
      setAssignSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Partner & Sample Collector Network</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              {partners.length} Partners
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage phlebotomists, track sample collection volume, assign patient tests, and monitor income generated per partner.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => fetchPartners(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-sm"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/20 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create New Partner</span>
          </button>
        </div>
      </div>

      {/* Network Overview Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Active Partners */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Partners</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {summary?.active_partners || 0}
            <span className="text-xs font-normal text-slate-400"> / {summary?.total_partners || 0}</span>
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center">
            <UserCheck className="w-3 h-3 mr-1" />
            Field Phlebotomists
          </div>
        </div>

        {/* Samples Collected */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Samples Collected</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {summary?.grand_total_collected || 0}
          </div>
          <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
            Pending: <strong className="text-amber-600">{summary?.grand_total_pending || 0}</strong>
          </div>
        </div>

        {/* Total Collection Revenue */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Collection Volume</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            ₹{summary?.grand_total_collection_volume ? Number(summary.grand_total_collection_volume).toLocaleString('en-IN') : 0}
          </div>
          <div className="text-[10px] text-purple-600 font-semibold mt-0.5 flex items-center">
            <IndianRupee className="w-3 h-3 mr-0.5" />
            Gross Collected Value
          </div>
        </div>

        {/* Total Partner Income Generated */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-lg shadow-emerald-600/20">
          <div className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider">Total Partner Income</div>
          <div className="text-2xl font-black text-white mt-1">
            ₹{summary?.grand_total_partner_income ? Number(summary.grand_total_partner_income).toLocaleString('en-IN') : 0}
          </div>
          <div className="text-[10px] text-emerald-200 font-semibold mt-0.5 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" />
            Total Partner Payouts
          </div>
        </div>

        {/* Net Lab Share */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm col-span-2 md:col-span-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Net Lab Revenue</div>
          <div className="text-2xl font-black text-emerald-800 mt-1">
            ₹{summary?.grand_total_lab_net ? Number(summary.grand_total_lab_net).toLocaleString('en-IN') : 0}
          </div>
          <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
            Lab share after partner cuts
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchPartners(true)}
            placeholder="Search partner by name, email, phone, area..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Partners</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {(search || statusFilter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); }}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Partners List Table */}
      {loading ? (
        <LoadingSpinner message="Loading partners and commission statistics..." />
      ) : (
        <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-4 font-bold">Partner Details</th>
                  <th className="py-3 px-4 font-bold">Coverage Area</th>
                  <th className="py-3 px-4 font-bold">Commission Model</th>
                  <th className="py-3 px-4 font-bold">Visits / Samples</th>
                  <th className="py-3 px-4 font-bold">Collection Volume</th>
                  <th className="py-3 px-4 font-bold text-emerald-800">Partner Income Generated</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {partners.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      <Truck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700 text-sm">No partners found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Click "Create New Partner" to register phlebotomists and collection agents.
                      </p>
                    </td>
                  </tr>
                ) : (
                  partners.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      {/* Name & Contact */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                          <span>{p.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">#{p.id}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{p.email}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 flex items-center space-x-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="font-semibold">{p.mobile}</span>
                        </div>
                      </td>

                      {/* Area */}
                      <td className="py-3 px-4">
                        <div className="flex items-start space-x-1 text-slate-700 font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{p.area || p.city || 'Bengaluru'}</span>
                        </div>
                        {p.area && <div className="text-[10px] text-slate-400 pl-4">{p.city}</div>}
                      </td>

                      {/* Commission Model */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                          <Percent className="w-3 h-3" />
                          <span>{p.commission_rate}%</span>
                        </div>
                        {p.fixed_fee > 0 && (
                          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                            + ₹{p.fixed_fee} flat/sample
                          </div>
                        )}
                      </td>

                      {/* Visits & Samples */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {p.samples_collected} <span className="text-slate-400 font-normal">/ {p.total_assigned} visits</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Pending: <strong className="text-amber-600">{p.pending_collections}</strong>
                        </div>
                      </td>

                      {/* Collection Volume */}
                      <td className="py-3 px-4">
                        <div className="font-black text-slate-900 text-sm">
                          ₹{Number(p.total_collection_volume).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400">Total samples value</div>
                      </td>

                      {/* Partner Income Generated */}
                      <td className="py-3 px-4">
                        <div className="font-black text-emerald-700 text-sm">
                          ₹{Number(p.total_partner_income).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Lab net: ₹{Number(p.lab_net_revenue).toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            p.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.status === 'active' ? '● Active' : '○ Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleOpenAssignModal(p)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-bold transition flex items-center space-x-1 text-xs"
                            title="Assign a patient booking to this partner"
                          >
                            <CalendarCheck className="w-3.5 h-3.5" />
                            <span>Assign</span>
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                            title="Edit Partner"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeletingPartner(p)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Partner"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Create / Edit Partner Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title={editingPartner ? `Edit Partner: ${editingPartner.name}` : 'Register New Partner'}
          subtitle="Configure sample collection agent details, contact info, and commission rate."
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Partner Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Login Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="partner@dhanashrilabs.com"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  {editingPartner ? 'New Password (leave blank to keep current)' : 'Password *'}
                </label>
                <input
                  type="password"
                  required={!editingPartner}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingPartner ? '••••••••' : 'Enter strong password'}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Bengaluru"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Service Area / Zone
                </label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder="Indiranagar & Koramangala"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Commission Rate (%) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={formData.commission_rate}
                    onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                    placeholder="15.00"
                    className="w-full p-2.5 pr-8 rounded-xl border border-slate-300 text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Fixed Fee per Sample (₹)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.fixed_fee}
                    onChange={(e) => setFormData({ ...formData, fixed_fee: e.target.value })}
                    placeholder="0"
                    className="w-full p-2.5 pr-8 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 font-bold">₹</span>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Partner Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="active">Active (Permitted to log in and collect samples)</option>
                  <option value="inactive">Inactive (Suspended)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm disabled:opacity-50"
              >
                {formSubmitting ? 'Saving...' : editingPartner ? 'Update Partner' : 'Create Partner'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Patient Booking to Partner Modal */}
      {isAssignModalOpen && (
        <Modal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          title={`Assign Patient Booking to Partner`}
          subtitle={`Assign an appointment to ${selectedPartnerForAssign?.name || 'Partner'}`}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Select Patient Booking
              </label>
              <select
                required
                value={selectedBookingId}
                onChange={(e) => setSelectedBookingId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">-- Choose a booking to assign --</option>
                {unassignedBookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.booking_code} — {b.patient_name} (₹{b.total_amount}) • {b.collection_type} • {b.booking_status}
                    {b.partner_name ? ` [Currently: ${b.partner_name}]` : ' [Unassigned]'}
                  </option>
                ))}
              </select>
            </div>

            {selectedPartnerForAssign && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Assigning to: {selectedPartnerForAssign.name}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Mobile: {selectedPartnerForAssign.mobile} • Area: {selectedPartnerForAssign.area || selectedPartnerForAssign.city}
                </div>
                <div className="text-[11px] text-emerald-700 font-bold">
                  Commission: {selectedPartnerForAssign.commission_rate}% on collection
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assignSubmitting || !selectedBookingId}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm disabled:opacity-50"
              >
                {assignSubmitting ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Partner Modal */}
      {deletingPartner && (
        <Modal
          isOpen={!!deletingPartner}
          onClose={() => setDeletingPartner(null)}
          title="Delete Partner Account"
          subtitle={`Are you sure you want to remove ${deletingPartner.name}?`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs text-slate-600">
            <p>
              Deleting this partner will remove their login access. Any bookings currently assigned to them will be marked as unassigned.
            </p>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-semibold">
              Warning: This action cannot be undone.
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeletingPartner(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={handleDeletePartner}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-sm disabled:opacity-50"
              >
                {deleteSubmitting ? 'Deleting...' : 'Delete Partner'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
