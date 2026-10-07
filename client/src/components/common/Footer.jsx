import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ShieldCheck,
  Award,
  Phone,
  Mail,
  MapPin,
  Clock,
  Heart,
  FileCheck2,
  Lock
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#17211B] text-slate-300 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust Badges Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-12 border-b border-slate-800">
          <div className="flex items-center space-x-3 p-3 rounded-2xl bg-white/5 border border-white/5">
            <ShieldCheck className="w-8 h-8 text-[#16A34A] flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">NABL Accredited</div>
              <div className="text-[11px] text-slate-400">Govt. Certified Testing</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-2xl bg-white/5 border border-white/5">
            <Award className="w-8 h-8 text-[#16A34A] flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">ISO 15189:2022</div>
              <div className="text-[11px] text-slate-400">International Quality Standard</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-2xl bg-white/5 border border-white/5">
            <FileCheck2 className="w-8 h-8 text-[#16A34A] flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">100% Barcoded</div>
              <div className="text-[11px] text-slate-400">Zero Error Robotics</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-2xl bg-white/5 border border-white/5">
            <Lock className="w-8 h-8 text-[#16A34A] flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">HIPAA Compliant</div>
              <div className="text-[11px] text-slate-400">Encrypted Medical Data</div>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 py-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#16A34A] text-white flex items-center justify-center">
                <Activity className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">Dhanashri <span className="text-[#16A34A]">Health Care</span></span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Dhanashri Health Care is a premier diagnostic laboratory network delivering high-precision clinical biochemistry, hematology, immunology and molecular testing with express turnarounds.
            </p>
            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-center text-slate-400">
                <Phone className="w-4 h-4 mr-2 text-[#16A34A]" />
                <span>+91 80 4920 1100 / +91 98765 43210</span>
              </div>
              <div className="flex items-center text-slate-400">
                <Mail className="w-4 h-4 mr-2 text-[#16A34A]" />
                <span>care@dhanashrihealthcare.com</span>
              </div>
              <div className="flex items-center text-slate-400">
                <MapPin className="w-4 h-4 mr-2 text-[#16A34A]" />
                <span>102 Health Avenue, Bannerghatta Road, Bengaluru, KA 560076</span>
              </div>
            </div>
          </div>

          {/* Popular Tests */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Popular Tests</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/tests?q=CBC" className="hover:text-emerald-400 transition">Complete Blood Count (CBC)</Link></li>
              <li><Link to="/tests?q=Lipid" className="hover:text-emerald-400 transition">Lipid Profile Test</Link></li>
              <li><Link to="/tests?q=Liver" className="hover:text-emerald-400 transition">Liver Function Test (LFT)</Link></li>
              <li><Link to="/tests?q=Kidney" className="hover:text-emerald-400 transition">Kidney Function Test (KFT)</Link></li>
              <li><Link to="/tests?q=Thyroid" className="hover:text-emerald-400 transition">Thyroid Profile (T3, T4, TSH)</Link></li>
              <li><Link to="/tests?q=HbA1c" className="hover:text-emerald-400 transition">HbA1c Blood Sugar</Link></li>
              <li><Link to="/tests?q=Vitamin+D" className="hover:text-emerald-400 transition">Vitamin D 25-Hydroxy</Link></li>
            </ul>
          </div>

          {/* Health Packages */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Health Packages</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/packages" className="hover:text-emerald-400 transition">Basic Health Checkup</Link></li>
              <li><Link to="/packages" className="hover:text-emerald-400 transition">Complete Full Body Checkup</Link></li>
              <li><Link to="/packages" className="hover:text-emerald-400 transition">Diabetes Care Package</Link></li>
              <li><Link to="/packages" className="hover:text-emerald-400 transition">Women's Wellness Package</Link></li>
              <li><Link to="/packages" className="hover:text-emerald-400 transition">Senior Citizen Men Profile</Link></li>
              <li><Link to="/packages" className="hover:text-emerald-400 transition">Heart & Cardiac Screening</Link></li>
            </ul>
          </div>

          {/* Timings & Portal */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Laboratory Hours</h4>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center text-emerald-400 font-semibold mb-1">
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  Sample Collection
                </div>
                <p className="text-slate-300">Mon - Sat: 06:30 AM - 09:30 PM</p>
                <p className="text-slate-300">Sunday: 07:00 AM - 05:00 PM</p>
              </div>

              <div className="pt-2">
                <Link
                  to="/admin/login"
                  className="inline-flex items-center text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  Admin & Pathologist Portal →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 space-y-4 md:space-y-0">
          <p>© {new Date().getFullYear()} Dhanashri Health Care Diagnostic & Laboratory. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <span>Medical Privacy Policy</span>
            <span>Terms of Service</span>
            <span>NABL Certification Info</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
