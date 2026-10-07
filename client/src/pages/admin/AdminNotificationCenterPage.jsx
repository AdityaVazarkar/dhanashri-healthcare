import React, { useState, useEffect } from 'react';
import { Bell, Calendar, FileText, UserPlus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminNotificationCenterPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/admin', {
        headers: { 'X-Admin-Request': 'true' }
      });
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error('Failed to load admin notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    if (type === 'booking') return <Calendar className="w-5 h-5 text-blue-600" />;
    if (type === 'report') return <FileText className="w-5 h-5 text-emerald-600" />;
    return <UserPlus className="w-5 h-5 text-purple-600" />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Laboratory Operations Activity Stream</h2>
        <p className="text-xs text-slate-500">Live feed of patient bookings, uploaded diagnostic reports, and registrations.</p>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching activity feed..." />
      ) : (
        <div className="rounded-3xl bg-white border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {notifications.map((item) => (
            <div key={item.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center">
                  {getIcon(item.type)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                  <p className="text-xs text-slate-500">{item.description}</p>
                  <span className="text-[10px] text-slate-400">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {item.link && (
                <Link
                  to={item.link}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-[#15803D] text-slate-700 text-xs font-bold transition flex items-center space-x-1"
                >
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
