import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Home,
  Building,
  CheckCircle2,
  Clock3,
  FileText,
  AlertCircle,
  Eye,
  ChevronRight,
  MapPin
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

export default function UserBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/my-bookings');
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Status timeline steps definition
  const timelineSteps = [
    { key: 'Confirmed', label: 'Booking Confirmed', desc: 'Appointment accepted' },
    { key: 'Sample Collected', label: 'Sample Collected', desc: 'Barcoded by phlebotomist' },
    { key: 'Processing', label: 'Testing in Progress', desc: 'Analyzing in central lab' },
    { key: 'Report Ready', label: 'Report Ready', desc: 'Verified by Pathologist' }
  ];

  const getStepStatus = (stepKey, currentStatus) => {
    const order = ['Pending', 'Confirmed', 'Sample Collected', 'Processing', 'Report Ready', 'Completed'];
    const currentIndex = order.indexOf(currentStatus);
    const stepIndex = order.indexOf(stepKey);

    if (currentStatus === 'Cancelled') return 'cancelled';
    if (currentIndex >= stepIndex) return 'completed';
    if (currentIndex === stepIndex - 1) return 'current';
    return 'upcoming';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">
            Patient Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            My Appointments & Bookings
          </h1>
          <p className="text-xs text-slate-500">
            Track your upcoming sample collections and historical diagnostic appointments.
          </p>
        </div>

        <Link
          to="/tests"
          className="inline-flex items-center px-5 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-sm transition"
        >
          <span>Book New Test</span>
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading your appointments..." />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No bookings placed yet"
          description="You do not have any pending or past diagnostic appointments."
          actionLabel="Book a Test"
          actionLink="/tests"
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const items = typeof booking.items === 'string' ? JSON.parse(booking.items || '[]') : (booking.items || []);
            return (
              <div
                key={booking.id}
                className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-emerald-300 transition space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {booking.booking_code}
                    </span>
                    <span className="text-xs text-slate-400">
                      Booked on: {new Date(booking.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <StatusBadge status={booking.booking_status} />
                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#F0FDF4] text-[#15803D] hover:bg-[#DCFCE7] transition flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Patient Name</span>
                    <span className="font-bold text-slate-800">{booking.patient_name}</span>
                    <span className="text-slate-500 block">({booking.patient_age} Y, {booking.patient_gender})</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Appointment Schedule</span>
                    <span className="font-bold text-slate-800">{booking.appointment_date}</span>
                    <span className="text-slate-500 block">{booking.time_slot}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Collection Type</span>
                    <span className="font-bold text-slate-800 flex items-center">
                      {booking.collection_type === 'Home Collection' ? (
                        <Home className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                      ) : (
                        <Building className="w-3.5 h-3.5 mr-1 text-blue-600" />
                      )}
                      {booking.collection_type}
                    </span>
                    <span className="text-slate-500 block">{booking.city || 'Central Lab'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 font-semibold block mb-0.5">Total Amount</span>
                    <span className="text-base font-black text-slate-900">₹{booking.total_amount}</span>
                    <span className="text-[11px] text-slate-500 block">({booking.payment_method})</span>
                  </div>
                </div>

                {/* Items Pill */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((it, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700"
                      >
                        {it.item_name}
                      </span>
                    ))}
                  </div>

                  {booking.booking_status === 'Report Ready' && (
                    <Link
                      to="/reports"
                      className="inline-flex items-center text-xs font-bold text-[#16A34A] hover:underline"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1" />
                      <span>Download Ready Report →</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- BOOKING DETAIL & TIMELINE MODAL --- */}
      {selectedBooking && (
        <Modal
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          title={`Booking ${selectedBooking.booking_code}`}
          subtitle={`Placed for ${selectedBooking.patient_name} on ${selectedBooking.appointment_date}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6 text-xs">
            {/* Status Timeline */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm mb-4">Sample & Testing Status Timeline</h4>
              <div className="space-y-4">
                {timelineSteps.map((s, idx) => {
                  const state = getStepStatus(s.key, selectedBooking.booking_status);
                  const isDone = state === 'completed';
                  const isCurrent = state === 'current';
                  const isLast = idx === timelineSteps.length - 1;

                  return (
                    <div key={s.key} className="flex items-start space-x-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                            isDone
                              ? 'bg-[#16A34A] text-white'
                              : isCurrent
                              ? 'bg-amber-500 text-white animate-pulse'
                              : 'bg-slate-200 text-slate-400'
                          }`}
                        >
                          {isDone ? '✓' : idx + 1}
                        </div>
                        {!isLast && (
                          <div
                            className={`w-0.5 h-7 ${
                              isDone ? 'bg-[#16A34A]' : 'bg-slate-200'
                            }`}
                          />
                        )}
                      </div>

                      <div className="pt-0.5">
                        <div className={`font-bold ${isDone || isCurrent ? 'text-slate-800' : 'text-slate-400'}`}>
                          {s.label}
                        </div>
                        <div className="text-[11px] text-slate-500">{s.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Patient & Location info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-semibold">Patient Information</span>
                <div className="font-bold text-slate-800">{selectedBooking.patient_name}</div>
                <div className="text-slate-600">{selectedBooking.patient_age} Years / {selectedBooking.patient_gender}</div>
                <div className="text-slate-600">Contact: {selectedBooking.patient_mobile}</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-semibold">Collection Location</span>
                <div className="font-bold text-slate-800">{selectedBooking.collection_type}</div>
                {selectedBooking.address ? (
                  <div className="text-slate-600 leading-relaxed">
                    {selectedBooking.address}, {selectedBooking.landmark ? `${selectedBooking.landmark}, ` : ''}{selectedBooking.city} - {selectedBooking.pincode}
                  </div>
                ) : (
                  <div className="text-slate-600">Dhanashri Health Care Central Diagnostic Laboratory</div>
                )}
              </div>
            </div>

            {/* Items booked */}
            <div className="space-y-2">
              <span className="font-bold text-slate-700">Tests Included</span>
              <div className="border border-slate-100 rounded-xl divide-y divide-slate-100">
                {(typeof selectedBooking.items === 'string' ? JSON.parse(selectedBooking.items || '[]') : (selectedBooking.items || [])).map((it, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center">
                    <span className="font-semibold text-slate-800">{it.item_name}</span>
                    <span className="font-bold text-slate-900">₹{it.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex justify-end">
              {selectedBooking.booking_status === 'Report Ready' ? (
                <Link
                  to="/reports"
                  className="px-5 py-2.5 bg-[#16A34A] text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  View Verified Reports
                </Link>
              ) : (
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
