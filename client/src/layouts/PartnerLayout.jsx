import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  LogOut,
  UserCheck,
  Phone,
  MapPin,
  TrendingUp,
  Percent,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PartnerLayout() {
  const { partner, partnerLogout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    partnerLogout();
    navigate('/partner/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand */}
            <div className="flex items-center space-x-3">
              <Link to="/partner/dashboard" className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
                  <Activity className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="font-black text-white text-base sm:text-lg tracking-tight flex items-center space-x-2">
                    <span>Dhanashri</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.5 rounded border border-emerald-500/40 uppercase tracking-wider">
                      Partner Portal
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                    Phlebotomist & Sample Collection Network
                  </p>
                </div>
              </Link>
            </div>

            {/* Partner Info & Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {partner && (
                <div className="hidden md:flex items-center space-x-3 px-3 py-1.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="text-left text-xs leading-tight">
                    <div className="font-bold text-white flex items-center space-x-1.5">
                      <span>{partner.name}</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1 rounded">
                        {partner.commission_rate}% Comm
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 text-slate-400" />
                      <span className="truncate max-w-[120px]">{partner.area || partner.city || 'Field Agent'}</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 text-xs font-bold transition shadow-sm"
                title="Log out of Partner Portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            © {new Date().getFullYear()} Dhanashri Health Care & Laboratory — Sample Collection Network
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span className="flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mr-1" />
              Verified Partner Session
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
