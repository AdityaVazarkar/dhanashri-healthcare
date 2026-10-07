import React from 'react';

export default function StatusBadge({ status, type = 'booking' }) {
  if (!status) return null;

  const getStyles = () => {
    const s = String(status).toLowerCase();

    // Booking statuses
    if (s === 'pending') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (s === 'confirmed') {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (s === 'sample collected') {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    if (s === 'processing' || s === 'testing in progress') {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (s === 'report ready' || s === 'ready') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold ring-1 ring-emerald-400/30';
    }
    if (s === 'completed') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
    if (s === 'cancelled' || s === 'inactive' || s === 'suspended') {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }

    // Active / Active status
    if (s === 'active') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    // Payment statuses
    if (s === 'paid') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStyles()}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-75"></span>
      {status}
    </span>
  );
}
