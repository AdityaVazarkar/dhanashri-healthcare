import React from 'react';
import { Activity } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading details...', size = 'md' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div className="relative">
        <div className={`animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600 ${sizeClasses[size] || sizeClasses.md}`}></div>
        <div className="absolute inset-0 flex items-center justify-center text-emerald-600">
          <Activity className="w-3 h-3 animate-pulse" />
        </div>
      </div>
      {message && <p className="text-sm font-medium text-slate-500">{message}</p>}
    </div>
  );
}
