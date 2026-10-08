import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Activity,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Truck,
  Eye,
  EyeOff,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function PartnerLoginPage() {
  const navigate = useNavigate();
  const { partnerLogin, isPartnerAuthenticated } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isPartnerAuthenticated) {
      navigate('/partner/dashboard', { replace: true });
    }
  }, [isPartnerAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await partnerLogin(identifier, password);
      navigate('/partner/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setIdentifier('partner@dhanashrilabs.com');
    setPassword('partner123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-2xl shadow-emerald-600/40 border border-emerald-400/30">
            <Truck className="w-8 h-8 stroke-[2.2]" />
          </div>
        </div>

        <h2 className="text-center text-2xl sm:text-3xl font-black text-white tracking-tight">
          Dhanashri Partner Portal
        </h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-slate-300 font-medium">
          Sample Collector & Phlebotomist Access
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-white/20">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Email Address or Mobile Number
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. partner@dhanashrilabs.com or 9876543210"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Partner Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your partner password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/30 text-white font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] transition disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing In to Partner Portal...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <span>Sign In as Partner</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          {/* Demo Login Quick Auto-fill */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={handleFillDemo}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center justify-center space-x-2 border border-emerald-200/60"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Fill Demo Partner Credentials</span>
            </button>
            <p className="mt-1.5 text-[11px] text-center text-slate-500">
              Demo: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">partner@dhanashrilabs.com</code> / <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">partner123</code>
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link to="/" className="text-emerald-700 hover:underline font-bold">
              ← Patient Website
            </Link>
            <Link to="/admin/login" className="text-slate-500 hover:text-slate-800 font-semibold">
              Lab Admin Portal →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
