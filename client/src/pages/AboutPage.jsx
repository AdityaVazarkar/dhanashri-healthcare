import React from 'react';
import { Award, ShieldCheck, Microscope, HeartPulse, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
      <div className="max-w-3xl space-y-4">
        <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">About Dhanashri Health Care</span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
          Pioneering Accuracy & Trust in Modern Clinical Laboratory Diagnostics
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Founded with a patient-first mission, Dhanashri Health Care operates state-of-the-art diagnostic facilities providing high-sensitivity biochemistry, hematology, immunology, and endocrine assessments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">NABL & ISO 15189:2022</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every analytical cycle undergoes rigorous proficiency testing and international external quality assurance (EQAS).
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center">
            <Microscope className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Robotic Automation</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Barcoded samples are handled by automated track systems, minimizing pre-analytical and analytical errors to near zero.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center">
            <HeartPulse className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Pathologist Leadership</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Our medical board comprises senior MD Pathologists and biochemists who review and verify every abnormal biomarker profile.
          </p>
        </div>
      </div>

      <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-black">Ready to schedule your home blood test?</h2>
          <p className="text-xs text-slate-400">Our phlebotomists are available 7 days a week from 6:30 AM onwards.</p>
        </div>
        <Link
          to="/tests"
          className="px-6 py-3.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-md transition"
        >
          Explore All Tests
        </Link>
      </div>
    </div>
  );
}
