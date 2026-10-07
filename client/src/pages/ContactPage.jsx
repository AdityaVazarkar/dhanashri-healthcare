import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      <div className="max-w-2xl space-y-3">
        <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">Contact & Support</span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900">Get in Touch with Dhanashri Health Care</h1>
        <p className="text-sm text-slate-600">
          Have queries about sample preparation, home collection or digital reports? We are here to assist 24/7.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Info Cards */}
        <div className="lg:col-span-5 space-y-4 text-xs">
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center space-x-2 text-[#15803D] font-bold">
              <Phone className="w-4 h-4" />
              <span>24/7 Diagnostic Helpline</span>
            </div>
            <p className="font-bold text-slate-800 text-sm">+91 80 4920 1100 / +91 98765 43210</p>
            <p className="text-slate-500">Toll-free customer care available round the clock.</p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center space-x-2 text-[#15803D] font-bold">
              <Mail className="w-4 h-4" />
              <span>Email Enquiries</span>
            </div>
            <p className="font-bold text-slate-800 text-sm">care@dhanashrihealthcare.com</p>
            <p className="text-slate-500">Reports and corporate health inquiries answered within 2 hours.</p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center space-x-2 text-[#15803D] font-bold">
              <MapPin className="w-4 h-4" />
              <span>Central Laboratory Facility</span>
            </div>
            <p className="font-bold text-slate-800 text-sm">
              102 Health Avenue, Bannerghatta Road, Bengaluru, Karnataka 560076
            </p>
            <p className="text-slate-500">Open for walk-ins: Monday to Sunday (06:30 AM - 09:30 PM)</p>
          </div>
        </div>

        {/* Message Form */}
        <div className="lg:col-span-7 p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Send us a Message</h2>

          {submitted ? (
            <div className="p-6 rounded-2xl bg-[#F0FDF4] border border-emerald-200 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#16A34A] mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">Message Received!</h3>
              <p className="text-xs text-slate-600">Our patient care desk will reach out to your contact details shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Aditya Sharma"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Message / Test Query *</label>
                <textarea
                  rows="4"
                  required
                  placeholder="How can our clinical team help you today?"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-xl shadow-md transition"
              >
                Send Enquiry
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
