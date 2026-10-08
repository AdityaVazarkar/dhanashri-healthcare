import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { adminLogin, isAdminAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAdminAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAdminAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await adminLogin(email.trim(), password);
      navigate('/admin', { replace: true });
    } catch (err) {
      console.error('Admin login error:', err);
      setError(err.message || 'Admin authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoAdmin = () => {
    setEmail('admin@lab.com');
    setPassword('Admin@123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-900">
      <div className="max-w-md w-full space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2.5">
            <div className="w-12 h-12 rounded-2xl bg-[#16A34A] text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Activity className="w-7 h-7 stroke-[2.5]" />
            </div>
            <span className="text-2xl font-black text-white">
              Dhanashri <span className="text-emerald-400">ADMIN</span>
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Laboratory Management Portal</h2>
          <p className="text-xs text-slate-400">Authorized personnel and clinical pathologists only.</p>
        </div>

        {/* Login Card */}
        <div className="p-8 rounded-3xl bg-slate-800/90 border border-slate-700 shadow-2xl space-y-6">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-xs text-rose-300 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-300">Administrator Email</label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-500 ml-3 absolute pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@lab.com"
                  className="w-full py-3 pl-9 pr-3 rounded-xl border border-slate-700 bg-slate-900/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">Admin Password</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-500 ml-3 absolute pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full py-3 pl-9 pr-3 rounded-xl border border-slate-700 bg-slate-900/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-xl shadow-lg shadow-emerald-900/50 transition flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Authenticating Admin...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-2 border-t border-slate-700/60">
            <button
              type="button"
              onClick={handleFillDemoAdmin}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-700 text-xs font-bold text-emerald-400 transition flex items-center justify-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fill Demo Admin (admin@lab.com / Admin@123)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <Link to="/" className="text-slate-400 hover:text-white transition">
            ← Patient Portal
          </Link>
          <Link to="/partner/login" className="text-emerald-400 hover:text-emerald-300 font-bold transition">
            Partner Portal →
          </Link>
        </div>
      </div>
    </div>
  );
}
