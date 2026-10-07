import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, Mail, Lock, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(identifier, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoPatient = () => {
    setIdentifier('patient@example.com');
    setPassword('Patient@123');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#16A34A] text-white flex items-center justify-center shadow-md">
              <Activity className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="text-2xl font-black text-slate-900">Dhanashri <span className="text-[#16A34A]">Health Care</span></span>
          </Link>
          <h2 className="text-2xl font-black text-slate-900">Welcome Back</h2>
          <p className="text-xs text-slate-500">Sign in to access your appointments and medical reports.</p>
        </div>

        {/* Card Form */}
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Email Address or Mobile Number</label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@example.com or 9876543210"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A] text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-700">Password</label>
                <Link to="/forgot-password" className="text-[11px] font-semibold text-[#16A34A] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A] text-slate-800"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo User Quick-Fill */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleFillDemoPatient}
              className="w-full py-2.5 px-3 rounded-xl bg-[#F0FDF4] hover:bg-[#DCFCE7] border border-emerald-200 text-xs font-bold text-[#15803D] transition flex items-center justify-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>Fill Demo Patient Credentials</span>
            </button>
          </div>
        </div>

        {/* Footer links */}
        <div className="text-center text-xs text-slate-500 space-y-2">
          <div>
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-[#16A34A] hover:underline">
              Register now
            </Link>
          </div>
          <div>
            Are you a lab staff administrator?{' '}
            <Link to="/admin/login" className="font-bold text-slate-700 hover:underline">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
