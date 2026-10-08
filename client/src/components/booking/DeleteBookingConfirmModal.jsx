import React, { useState } from 'react';
import { Trash2, AlertTriangle, Calendar, User, IndianRupee, ShieldAlert } from 'lucide-react';
import Modal from '../common/Modal';
import api from '../../services/api';

export default function DeleteBookingConfirmModal({
  isOpen,
  onClose,
  booking,
  onSuccess,
  isAdmin = false
}) {
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !booking) return null;

  const items = Array.isArray(booking.items)
    ? booking.items
    : typeof booking.items === 'string'
    ? JSON.parse(booking.items || '[]')
    : [];

  const handleDelete = async () => {
    setDeleting(true);
    setErrorMsg('');
    try {
      await api.delete(`/bookings/${booking.id}`, {
        headers: isAdmin ? { 'X-Admin-Request': 'true' } : {}
      });
      if (onSuccess) {
        onSuccess(booking.id);
      }
      onClose();
    } catch (err) {
      console.error('Delete booking error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to delete booking. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const formatScheduleDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr).split('T')[0];
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return String(dateStr).split('T')[0];
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Delete Test Booking"
      subtitle={`Action cannot be undone for ${booking.booking_code}`}
      maxWidth="max-w-md"
    >
      <div className="space-y-5 text-xs text-slate-700">
        {/* Warning Badge */}
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-800">
          <div className="p-2 rounded-xl bg-rose-100 text-rose-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-rose-900 text-sm">Delete Booking Confirmation</h4>
            <p className="text-[11px] text-rose-700 leading-relaxed">
              {isAdmin
                ? `You are deleting this test booking permanently. All associated scheduled appointments, payment records, and diagnostic reports will be removed.`
                : `Are you sure you want to cancel and delete your scheduled test appointment?`}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 font-bold">
            {errorMsg}
          </div>
        )}

        {/* Booking Details Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
              {booking.booking_code}
            </span>
            <span className="font-black text-slate-900 text-sm">₹{booking.total_amount}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400 block font-semibold">Patient:</span>
              <span className="font-bold text-slate-800">{booking.patient_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Date & Time:</span>
              <span className="font-bold text-slate-800">
                {formatScheduleDate(booking.appointment_date)} ({booking.time_slot})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Collection:</span>
              <span className="font-bold text-slate-800">{booking.collection_type}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold">Status:</span>
              <span className="font-bold text-slate-800">{booking.booking_status}</span>
            </div>
          </div>

          {items.length > 0 && (
            <div className="pt-2 border-t border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Included Tests ({items.length}):
              </span>
              <div className="text-[11px] font-semibold text-slate-700 truncate">
                {items.map((i) => i.item_name).join(', ')}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{deleting ? 'Deleting...' : 'Confirm Delete'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
