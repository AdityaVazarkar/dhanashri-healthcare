import React, { useState, useEffect } from 'react';
import { Users, Search, Eye, Shield, CheckCircle, XCircle, Calendar, FileText } from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users?search=${encodeURIComponent(search)}`, {
        headers: { 'X-Admin-Request': 'true' },
      });
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleViewUser = async (user) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/users/${user.id}`, {
        headers: { 'X-Admin-Request': 'true' },
      });
      setSelectedUser(res.data.user || user);
    } catch (err) {
      console.error('Failed to load user details', err);
      setSelectedUser(user);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await api.patch(`/users/${userId}/status`, {}, {
        headers: { 'X-Admin-Request': 'true' },
      });
      fetchUsers();
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser((prev) => ({
          ...prev,
          status: prev.status === 'active' ? 'inactive' : 'active',
        }));
      }
    } catch (err) {
      alert('Failed to update user status');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Registered Patients & Users</h2>
        <p className="text-xs text-slate-500">Manage patient accounts, audit bookings, and toggle account access status.</p>
      </div>

      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, or mobile..."
            className="w-full py-2 pl-9 pr-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
          />
        </form>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading user directory..." />
      ) : (
        <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-4 font-bold">Patient</th>
                  <th className="py-3 px-4 font-bold">Contact Email</th>
                  <th className="py-3 px-4 font-bold">Mobile</th>
                  <th className="py-3 px-4 font-bold">City</th>
                  <th className="py-3 px-4 font-bold">Bookings</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{u.full_name}</div>
                      <div className="text-[10px] text-slate-400">
                        {u.dob ? `${u.dob.split('T')[0]} • ` : ''}{u.gender || 'Patient'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{u.email}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{u.mobile}</td>
                    <td className="py-3 px-4 text-slate-600">{u.city || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg">
                        {u.total_bookings || 0} visits
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(u.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition ${
                          u.status === 'active'
                            ? 'bg-emerald-100 text-[#15803D] hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                        }`}
                        title="Click to toggle status"
                      >
                        {u.status}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleViewUser(u)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 text-[#15803D] hover:bg-emerald-100 font-bold transition inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title={`Patient: ${selectedUser.full_name}`}
          subtitle={`Account registered on ${new Date(selectedUser.created_at).toLocaleDateString()}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-3">
              <div><strong>Email:</strong> {selectedUser.email}</div>
              <div><strong>Mobile:</strong> {selectedUser.mobile}</div>
              <div><strong>Gender / DOB:</strong> {selectedUser.gender} ({selectedUser.dob ? selectedUser.dob.split('T')[0] : 'N/A'})</div>
              <div><strong>Status:</strong> <span className="font-bold text-emerald-700 uppercase">{selectedUser.status}</span></div>
              <div className="col-span-2">
                <strong>Address:</strong> {selectedUser.address || 'N/A'} {selectedUser.landmark ? `(${selectedUser.landmark})` : ''} {selectedUser.city} - {selectedUser.pincode}
              </div>
            </div>

            {/* Booking history summary */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800">Booking History ({selectedUser.bookings?.length || 0})</h4>
              <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
                {(selectedUser.bookings || []).map((b) => (
                  <div key={b.id} className="p-3 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{b.booking_code}</div>
                      <div className="text-[11px] text-slate-400">{b.appointment_date} • {b.booking_status}</div>
                    </div>
                    <span className="font-black text-slate-900">₹{b.total_amount}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleToggleStatus(selectedUser.id)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                  selectedUser.status === 'active'
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    : 'bg-emerald-50 text-[#15803D] hover:bg-emerald-100'
                }`}
              >
                {selectedUser.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
              </button>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
