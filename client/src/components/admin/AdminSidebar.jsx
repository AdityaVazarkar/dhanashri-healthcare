import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FlaskConical,
  FolderTree,
  Package,
  CalendarCheck,
  FileText,
  Bell,
  LogOut,
  Activity,
  UserCheck,
  ShieldCheck,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminSidebar({ isOpen, setIsOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { adminLogout, admin } = useAuth();

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Partners', path: '/admin/partners', icon: UserCheck },
    { name: 'Tests', path: '/admin/tests', icon: FlaskConical },
    { name: 'Categories', path: '/admin/categories', icon: FolderTree },
    { name: 'Packages', path: '/admin/packages', icon: Package },
    { name: 'Bookings', path: '/admin/bookings', icon: CalendarCheck },
    { name: 'Reports', path: '/admin/reports', icon: FileText },
    { name: 'Notifications', path: '/admin/notifications', icon: Bell },
  ];

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Lab Logo & Brand */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/40">
          <Link to="/admin" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#16A34A] text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="font-black text-white tracking-wide text-base flex items-center space-x-1.5">
                <span>Dhanashri</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-extrabold px-1.5 py-0.5 rounded border border-emerald-500/30">
                  ADMIN
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                Lab Management Portal
              </p>
            </div>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Admin Tag */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-700/40 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs">
              {admin?.name?.charAt(0) || 'A'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{admin?.name || 'Lab Admin'}</div>
              <div className="text-[10px] text-emerald-400 flex items-center">
                <ShieldCheck className="w-3 h-3 mr-1" />
                {admin?.role || 'Super Admin'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  active
                    ? 'bg-[#16A34A] text-white shadow-md shadow-emerald-900/40'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 mr-3 ${active ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-950/40 transition border border-transparent hover:border-rose-900/40"
          >
            <LogOut className="w-4 h-4 mr-3" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>
    </>
  );
}
