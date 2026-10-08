import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Home,
  Building,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  ShieldCheck,
  Trash2,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function BookingFlowPage() {
  const { cartItems, removeFromCart, subtotal, totalSavings, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [collectionType, setCollectionType] = useState('Home Collection'); // 'Home Collection' or 'Lab Visit'

  // Patient Info
  const [patientDetails, setPatientDetails] = useState({
    name: user?.full_name || '',
    age: '',
    gender: user?.gender || 'Male',
    mobile: user?.mobile || '',
    address: user?.address || '',
    landmark: user?.landmark || '',
    city: user?.city || 'Bengaluru',
    pincode: user?.pincode || '',
    notes: '',
  });

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState('Cash on Collection');
  const [bookingConfirmed, setBookingConfirmed] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch slots
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const res = await api.get('/bookings/time-slots');
        setTimeSlots(res.data.timeSlots || []);
        if (res.data.timeSlots?.length > 0) {
          setSelectedSlot(res.data.timeSlots[0].slot_time);
        }
      } catch (err) {
        console.error('Failed to load slots', err);
      }
    };
    fetchSlots();

    // Default appointment date to tomorrow
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    setAppointmentDate(tom.toISOString().split('T')[0]);
  }, []);

  // Sync user details if authenticated
  useEffect(() => {
    if (user) {
      setPatientDetails((prev) => ({
        ...prev,
        name: prev.name || user.full_name || '',
        mobile: prev.mobile || user.mobile || '',
        gender: prev.gender || user.gender || 'Male',
        address: prev.address || user.address || '',
        landmark: prev.landmark || user.landmark || '',
        city: prev.city || user.city || 'Bengaluru',
        pincode: prev.pincode || user.pincode || '',
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    setPatientDetails({
      ...patientDetails,
      [e.target.name]: e.target.value,
    });
  };

  const validateStep = () => {
    setErrorMsg('');
    if (step === 1) {
      if (cartItems.length === 0) {
        setErrorMsg('Please select at least one test or health package.');
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (!appointmentDate) {
        setErrorMsg('Please select an appointment date.');
        return false;
      }
      if (!selectedSlot) {
        setErrorMsg('Please choose a preferred time slot.');
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (!patientDetails.name || !patientDetails.age || !patientDetails.mobile) {
        setErrorMsg('Patient Name, Age, and Contact Mobile are required.');
        return false;
      }
      if (collectionType === 'Home Collection') {
        if (!patientDetails.address || !patientDetails.pincode) {
          setErrorMsg('Address and Pincode are required for doorstep sample collection.');
          return false;
        }
      }
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleConfirmBooking = async () => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: '/book',
          message: 'To book a test, please log in. If you are a new patient, please register first.'
        }
      });
      return;
    }

    setErrorMsg('');
    setLoading(true);
    try {
      const payload = {
        patientName: patientDetails.name,
        patientAge: parseInt(patientDetails.age, 10),
        patientGender: patientDetails.gender,
        patientMobile: patientDetails.mobile,
        address: collectionType === 'Home Collection' ? patientDetails.address : null,
        landmark: collectionType === 'Home Collection' ? patientDetails.landmark : null,
        city: collectionType === 'Home Collection' ? patientDetails.city : null,
        pincode: collectionType === 'Home Collection' ? patientDetails.pincode : null,
        collectionType,
        appointmentDate,
        timeSlot: selectedSlot,
        items: cartItems.map((ci) => ({
          id: ci.id,
          name: ci.name,
          type: ci.type,
          price: ci.price,
        })),
        paymentMethod,
        notes: patientDetails.notes,
      };

      const res = await api.post('/bookings', payload);
      if (res.data.success) {
        setBookingConfirmed(res.data.booking);
        clearCart();
        setStep(5); // Confirmation screen
      }
    } catch (err) {
      console.error('Booking submission failed:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to place booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated && !bookingConfirmed) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 text-[#16A34A] flex items-center justify-center shadow-sm">
          <User className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900">Please Sign In to Book Your Test</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            To schedule diagnostic appointments and securely receive lab reports, an authenticated patient account is required. If you are a new patient, please register first.
          </p>
        </div>
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/login"
            state={{ from: '/book', message: 'To book a test, please log in. If you are a new patient, please register first.' }}
            className="w-full sm:w-auto px-6 py-3 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            Sign In to Your Account
          </Link>
          <Link
            to="/register"
            state={{ from: '/book', message: 'To book a test, new patients need to register first.' }}
            className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
          >
            New Patient? Register Here
          </Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0 && !bookingConfirmed) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-[#16A34A] flex items-center justify-center">
          <Calendar className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-800">Your test selection is empty</h2>
        <p className="text-xs text-slate-500">
          Please explore our test catalog or full-body health packages to book an appointment.
        </p>
        <div className="pt-2">
          <Link
            to="/tests"
            className="inline-flex items-center px-6 py-3 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            Browse Tests Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Progress Stepper */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <span className={step >= 1 ? 'text-[#16A34A]' : ''}>1. Selected Tests</span>
          <span className={step >= 2 ? 'text-[#16A34A]' : ''}>2. Date & Time</span>
          <span className={step >= 3 ? 'text-[#16A34A]' : ''}>3. Patient Info</span>
          <span className={step >= 4 ? 'text-[#16A34A]' : ''}>4. Review & Confirm</span>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-[#16A34A] h-2 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* --- STEP 1: REVIEW TESTS --- */}
      {step === 1 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Review Booked Tests</h2>
              <p className="text-xs text-slate-500">Verify your selected blood tests and packages.</p>
            </div>
            <Link to="/tests" className="text-xs font-bold text-[#16A34A] hover:underline">
              + Add More Tests
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {cartItems.map((item) => (
              <div key={`${item.type}-${item.id}`} className="py-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-[#15803D]">
                      {item.type}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                  </div>
                  <div className="text-xs text-slate-400">
                    Sample: {item.sampleType} • TAT: {item.reportTime}
                    {item.fastingRequired && <span className="text-amber-600 ml-2 font-medium">• Fasting Required</span>}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-base font-black text-slate-900">₹{item.price}</div>
                  <button
                    onClick={() => removeFromCart(item.id, item.type)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-semibold">Total Payable</span>
              <div className="text-2xl font-black text-slate-900">₹{subtotal}</div>
            </div>
            {totalSavings > 0 && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                Savings: ₹{totalSavings}
              </span>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-2"
            >
              <span>Continue to Schedule</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 2: DATE & TIME SLOT --- */}
      {step === 2 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">Select Date & Time Slot</h2>
            <p className="text-xs text-slate-500">Choose when our phlebotomist should visit or when you will visit the lab.</p>
          </div>

          {/* Collection Type Toggle */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Sample Collection Preference</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setCollectionType('Home Collection')}
                className={`p-4 rounded-2xl border text-left transition flex items-start space-x-3 ${
                  collectionType === 'Home Collection'
                    ? 'border-[#16A34A] bg-[#F0FDF4] ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#15803D] flex items-center justify-center flex-shrink-0">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">Home Sample Collection</div>
                  <div className="text-xs text-slate-500">Phlebotomist visits your doorstep (Free)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCollectionType('Lab Visit')}
                className={`p-4 rounded-2xl border text-left transition flex items-start space-x-3 ${
                  collectionType === 'Lab Visit'
                    ? 'border-[#16A34A] bg-[#F0FDF4] ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#15803D] flex items-center justify-center flex-shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">Visit Diagnostic Lab</div>
                  <div className="text-xs text-slate-500">Walk-in at Central Diagnostic Center</div>
                </div>
              </button>
            </div>
          </div>

          {/* Appointment Date */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Preferred Appointment Date</label>
            <input
              type="date"
              value={appointmentDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full sm:w-72 p-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            />
          </div>

          {/* Time Slots */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Available 1-Hour Time Window</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {timeSlots.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSelectedSlot(slot.slot_time)}
                  className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-2 ${
                    selectedSlot === slot.slot_time
                      ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-sm'
                      : 'border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-slate-50'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{slot.slot_time}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={handleBack}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-2"
            >
              <span>Continue to Patient Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 3: PATIENT DETAILS --- */}
      {step === 3 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">Patient Details & Address</h2>
            <p className="text-xs text-slate-500">Provide medical details for accurate laboratory documentation.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Patient Full Name *</label>
              <input
                type="text"
                name="name"
                value={patientDetails.name}
                onChange={handleInputChange}
                placeholder="e.g. Aditya Sharma"
                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#16A34A] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Age *</label>
                <input
                  type="number"
                  name="age"
                  min="1"
                  max="120"
                  value={patientDetails.age}
                  onChange={handleInputChange}
                  placeholder="e.g. 34"
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#16A34A] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Gender *</label>
                <select
                  name="gender"
                  value={patientDetails.gender}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#16A34A] focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Mobile Number (For report delivery) *</label>
              <input
                type="tel"
                name="mobile"
                value={patientDetails.mobile}
                onChange={handleInputChange}
                placeholder="e.g. 9876543210"
                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#16A34A] focus:outline-none"
              />
            </div>

            {/* Address fields only if Home Collection */}
            {collectionType === 'Home Collection' && (
              <>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Address Line (Flat / Building / Street) *</label>
                  <textarea
                    rows="2"
                    name="address"
                    value={patientDetails.address}
                    onChange={handleInputChange}
                    placeholder="e.g. Flat 402, Green Orchid Apartments, Bannerghatta Road"
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#16A34A] focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Landmark</label>
                  <input
                    type="text"
                    name="landmark"
                    value={patientDetails.landmark}
                    onChange={handleInputChange}
                    placeholder="e.g. Opposite Apollo Clinic"
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#16A34A] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">City</label>
                    <input
                      type="text"
                      name="city"
                      value={patientDetails.city}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#16A34A] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Pincode *</label>
                    <input
                      type="text"
                      name="pincode"
                      value={patientDetails.pincode}
                      onChange={handleInputChange}
                      placeholder="e.g. 560076"
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#16A34A] focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Special Instructions / Remarks</label>
              <input
                type="text"
                name="notes"
                value={patientDetails.notes}
                onChange={handleInputChange}
                placeholder="e.g. Please ring bell twice, patient is elderly"
                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#16A34A] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={handleBack}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-md transition flex items-center space-x-2"
            >
              <span>Review Order & Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 4: REVIEW & PAYMENT --- */}
      {step === 4 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900">Review Booking & Payment Summary</h2>
            <p className="text-xs text-slate-500">Confirm all appointment details before submitting.</p>
          </div>

          {/* Booking Summary Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl bg-[#F0FDF4] border border-emerald-200 text-xs">
            <div className="space-y-2">
              <span className="font-bold text-[#15803D] uppercase tracking-wider text-[10px]">
                Patient & Appointment
              </span>
              <div><strong>Patient:</strong> {patientDetails.name} ({patientDetails.age} Y, {patientDetails.gender})</div>
              <div><strong>Contact:</strong> {patientDetails.mobile}</div>
              <div><strong>Collection Type:</strong> {collectionType}</div>
              <div><strong>Slot:</strong> {appointmentDate} at {selectedSlot}</div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-[#15803D] uppercase tracking-wider text-[10px]">
                Collection Location
              </span>
              {collectionType === 'Home Collection' ? (
                <div>{patientDetails.address}, {patientDetails.landmark ? `${patientDetails.landmark}, ` : ''}{patientDetails.city} - {patientDetails.pincode}</div>
              ) : (
                <div>Central Diagnostic Laboratory, 102 Health Avenue, Bengaluru - 560076</div>
              )}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700">Choose Payment Option</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'Cash on Collection', label: 'Cash on Collection', desc: 'Pay phlebotomist upon arrival' },
                { id: 'Pay at Lab', label: 'Pay at Lab', desc: 'Settle at front desk billing' },
                { id: 'Online Payment', label: 'Online Payment', desc: 'Card / UPI / NetBanking (Simulation)' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPaymentMethod(opt.id)}
                  className={`p-3.5 rounded-2xl border text-left transition ${
                    paymentMethod === opt.id
                      ? 'border-[#16A34A] bg-[#DCFCE7] ring-1 ring-emerald-400'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-bold text-slate-800 text-xs">{opt.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Bill summary */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Tests & Packages Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Home Phlebotomist Visit Fee</span>
              <span className="text-[#16A34A] font-bold">FREE</span>
            </div>
            {totalSavings > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Discount Applied</span>
                <span>- ₹{totalSavings}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-900 text-base">
              <span>Total Payable</span>
              <span>₹{subtotal}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={handleBack}
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleConfirmBooking}
              disabled={loading}
              className="px-7 py-3.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center space-x-2"
            >
              {loading ? (
                <span>Confirming Booking...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm & Schedule Booking</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* --- STEP 5: CONFIRMATION SUCCESS --- */}
      {step === 5 && bookingConfirmed && (
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-emerald-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#DCFCE7] text-[#15803D] flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">
              Booking Confirmed
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Thank You, {bookingConfirmed.patient_name}!
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Your appointment is scheduled. Booking Reference Number:{' '}
              <strong className="text-slate-800 font-mono text-sm">{bookingConfirmed.booking_code}</strong>
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-left max-w-md mx-auto space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Date:</span>
              <span className="font-bold text-slate-800">{bookingConfirmed.appointment_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Time Slot:</span>
              <span className="font-bold text-slate-800">{bookingConfirmed.time_slot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Collection Type:</span>
              <span className="font-bold text-slate-800">{bookingConfirmed.collection_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Amount:</span>
              <span className="font-bold text-emerald-700">₹{bookingConfirmed.total_amount}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              to="/bookings"
              className="w-full sm:w-auto px-6 py-3 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              View My Bookings Timeline
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Return Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
