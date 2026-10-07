import React from 'react';
import { Menu, ExternalLink, Bell, Search, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminHeader({ onToggleSidebar, title = 'Administration' }) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-bold text-slate-800">{title}</h1>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Quick link to Patient Portal */}
        <Link
          to="/"
          target="_blank"
          className="hidden sm:inline-flex items-center text-xs font-semibold text-slate-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
        >
          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
          View Patient Portal
        </Link>

        {/* Notifications Icon */}
        <Link
          to="/admin/notifications"
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
        </Link>

        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>NABL Central Lab</span>
        </div>
      </div>
    </header>
  );
}
