import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Home,
  Building,
  MapPin,
  AlertCircle,
  Save,
  CheckCircle2,
  FileText
} from 'lucide-react';
import Modal from '../common/Modal';
import api from '../../services/api';

const DEFAULT_TIME_SLOTS = [
  '06:30 AM - 07:30 AM',
  '07:30 AM - 08:30 AM',
  '08:30 AM - 09:30 AM',
  '09:30 AM - 10:30 AM',
  '10:30 AM - 11:30 AM',
  '11:30 AM - 12:30 PM',
  '04:00 PM - 05:00 PM',
  '05:00 PM - 06:00 PM',
  '06:00 PM - 07:00 PM'
];

const BOOKING_STATUSES = [
  'Pending',
  'Confirmed',
  'Sample Collected',
  'Processing',
  'Report Ready',
  'Completed',
  'Cancelled'
];

const PAYMENT_STATUSES = ['Pending', 'Paid', 'Refunded'];

export default function EditBookingModal({
  isOpen,
  onClose,
  booking,
  onSuccess,
  isAdmin = false
}) {
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_age: '',
    patient_gender: 'Male',
    patient_mobile: '',
    appointment_date: '',
    time_slot: '',
    collection_type: 'Home Collection',
    address: '',
    landmark: '',
    city: 'Bengaluru',
    pincode: '',
    notes: '',
    booking_status: 'Pending',
    payment_status: 'Pending'
  });

  const [timeSlots, setTimeSlots] = useState(DEFAULT_TIME_SLOTS);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch slots on open
  useEffect(() => {
    if (!isOpen) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const res = await api.get('/bookings/time-slots');
        if (res.data?.timeSlots && res.data.timeSlots.length > 0) {
          setTimeSlots(res.data.timeSlots.map((s) => s.slot_time));
        }
      } catch (err) {
        console.warn('Failed to load slots from API, using default slots:', err);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [isOpen]);

  // Populate formData whenever booking changes
  useEffect(() => {
    if (booking && isOpen) {
      // Format appointment_date to YYYY-MM-DD
      let dateVal = '';
      if (booking.appointment_date) {
        try {
          const d = new Date(booking.appointment_date);
          if (!isNaN(d.getTime())) {
            dateVal = d.toISOString().split('T')[0];
          } else {
            dateVal = String(booking.appointment_date).split('T')[0];
          }
        } catch {
          dateVal = String(booking.appointment_date).split('T')[0];
        }
      }

      setFormData({
        patient_name: booking.patient_name || '',
        patient_age: booking.patient_age !== undefined && booking.patient_age !== null ? String(booking.patient_age) : '',
        patient_gender: booking.patient_gender || 'Male',
        patient_mobile: booking.patient_mobile || '',
        appointment_date: dateVal,
        time_slot: booking.time_slot || DEFAULT_TIME_SLOTS[0],
        collection_type: booking.collection_type || 'Home Collection',
        address: booking.address || '',
        landmark: booking.landmark || '',
        city: booking.city || 'Bengaluru',
        pincode: booking.pincode || '',
        notes: booking.notes || '',
        booking_status: booking.booking_status || 'Pending',
        payment_status: booking.payment_status || 'Pending'
      });
      setErrorMsg('');
    }
  }, [booking, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.patient_name?.trim()) {
      setErrorMsg('Patient full name is required.');
      return;
    }
    if (!formData.patient_age || isNaN(formData.patient_age) || parseInt(formData.patient_age, 10) <= 0) {
      setErrorMsg('Please enter a valid patient age.');
      return;
    }
    if (!formData.patient_mobile?.trim() || formData.patient_mobile.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!formData.appointment_date) {
      setErrorMsg('Please select an appointment date.');
      return;
    }
    if (!formData.time_slot) {
      setErrorMsg('Please select a time slot.');
      return;
    }

    if (formData.collection_type === 'Home Collection') {
      if (!formData.address?.trim()) {
        setErrorMsg('Address is required for Home Sample Collection.');
        return;
      }
      if (!formData.city?.trim()) {
        setErrorMsg('City is required for Home Sample Collection.');
        return;
      }
      if (!formData.pincode?.trim() || formData.pincode.replace(/\D/g, '').length < 6) {
        setErrorMsg('Please enter a valid 6-digit postal pincode.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        patient_name: formData.patient_name.trim(),
        patient_age: parseInt(formData.patient_age, 10),
        patient_gender: formData.patient_gender,
        patient_mobile: formData.patient_mobile.trim(),
        appointment_date: formData.appointment_date,
        time_slot: formData.time_slot,
        collection_type: formData.collection_type,
        address: formData.collection_type === 'Home Collection' ? formData.address.trim() : null,
        landmark: formData.collection_type === 'Home Collection' ? formData.landmark.trim() : null,
        city: formData.collection_type === 'Home Collection' ? formData.city.trim() : null,
        pincode: formData.collection_type === 'Home Collection' ? formData.pincode.trim() : null,
        notes: formData.notes?.trim() || null,
        ...(isAdmin
          ? {
              booking_status: formData.booking_status,
              payment_status: formData.payment_status
            }
          : {})
      };

      const res = await api.put(`/bookings/${booking.id}`, payload, {
        headers: isAdmin ? { 'X-Admin-Request': 'true' } : {}
      });

      if (onSuccess) {
        onSuccess(res.data.booking || { ...booking, ...payload });
      }
      onClose();
    } catch (err) {
      console.error('Failed to update booking:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to update booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !booking) return null;

  const items = Array.isArray(booking.items)
    ? booking.items
    : typeof booking.items === 'string'
    ? JSON.parse(booking.items || '[]')
    : [];

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Test Booking: ${booking.booking_code}`}
      subtitle="Modify patient details, schedule, or collection address"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-xs text-slate-700">
        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Booked Items Summary (Read-Only) */}
        {items.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                Booked Test Profile ({items.length})
              </span>
              <span className="font-bold text-emerald-700">Total: ₹{booking.total_amount}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {items.map((it, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-800 shadow-2xs"
                >
                  {it.item_name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Section 1: Patient Information */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5 border-b border-slate-100 pb-1.5">
            <User className="w-4 h-4 text-[#16A34A]" />
            <span>Patient Information</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Patient Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="patient_name"
                value={formData.patient_name}
                onChange={handleChange}
                placeholder="e.g. Rahul Sharma"
                required
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                name="patient_mobile"
                value={formData.patient_mobile}
                onChange={handleChange}
                placeholder="10-digit mobile"
                maxLength={12}
                required
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Age (Years) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="patient_age"
                value={formData.patient_age}
                onChange={handleChange}
                min="1"
                max="125"
                placeholder="e.g. 35"
                required
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Biological Gender <span className="text-rose-500">*</span>
              </label>
              <select
                name="patient_gender"
                value={formData.patient_gender}
                onChange={handleChange}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Appointment Schedule */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5 border-b border-slate-100 pb-1.5">
            <Calendar className="w-4 h-4 text-[#16A34A]" />
            <span>Appointment Schedule</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Appointment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="appointment_date"
                min={todayStr}
                value={formData.appointment_date}
                onChange={handleChange}
                required
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Preferred Time Slot <span className="text-rose-500">*</span>
              </label>
              <select
                name="time_slot"
                value={formData.time_slot}
                onChange={handleChange}
                required
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              >
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Collection Mode & Address */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5 border-b border-slate-100 pb-1.5">
            <Home className="w-4 h-4 text-[#16A34A]" />
            <span>Sample Collection Mode</span>
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData((p) => ({ ...p, collection_type: 'Home Collection' }))}
              className={`p-3 rounded-xl border text-left flex items-center space-x-2.5 transition ${
                formData.collection_type === 'Home Collection'
                  ? 'border-[#16A34A] bg-emerald-50/60 text-[#15803D] ring-2 ring-[#16A34A]/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Home className="w-4 h-4 shrink-0" />
              <div>
                <div className="font-bold">Home Collection</div>
                <div className="text-[10px] text-slate-500">Phlebotomist visits home</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormData((p) => ({ ...p, collection_type: 'Lab Visit' }))}
              className={`p-3 rounded-xl border text-left flex items-center space-x-2.5 transition ${
                formData.collection_type === 'Lab Visit'
                  ? 'border-blue-600 bg-blue-50/60 text-blue-800 ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Building className="w-4 h-4 shrink-0" />
              <div>
                <div className="font-bold">Lab Visit</div>
                <div className="text-[10px] text-slate-500">Visit diagnostic center</div>
              </div>
            </button>
          </div>

          {formData.collection_type === 'Home Collection' && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 mt-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  House / Flat / Street Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Complete postal address for sample collection phlebotomist"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Landmark</label>
                  <input
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleChange}
                    placeholder="Near Park / Metro"
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Pincode <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="6-digit pincode"
                    maxLength={6}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Special Instructions / Notes */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">Notes / Special Instructions</label>
          <input
            type="text"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="e.g. Patient is fasting / Ring bell on 2nd floor"
            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
          />
        </div>

        {/* Section 5: Admin Controls (Status & Payment) */}
        {isAdmin && (
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
            <span className="font-bold text-amber-900 text-xs uppercase tracking-wider block">
              Administrative Status Controls
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Workflow Status</label>
                <select
                  name="booking_status"
                  value={formData.booking_status}
                  onChange={handleChange}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                >
                  {BOOKING_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Status</label>
                <select
                  name="payment_status"
                  value={formData.payment_status}
                  onChange={handleChange}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                >
                  {PAYMENT_STATUSES.map((pst) => (
                    <option key={pst} value={pst}>
                      {pst}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Footer buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold shadow-md transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving Changes...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
