import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [demoToken, setDemoToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSuccessMsg(res.data.message || 'Password reset link sent to your email.');
      if (res.data.demoToken) {
        setDemoToken(res.data.demoToken);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to process request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#16A34A] text-white flex items-center justify-center shadow-md">
              <Activity className="w-6 h-6 stroke-[2.5]" />
            </div>
            <span className="text-2xl font-black text-slate-900">Dhanashri <span className="text-[#16A34A]">Health Care</span></span>
          </Link>
          <h2 className="text-2xl font-black text-slate-900">Forgot Password</h2>
          <p className="text-xs text-slate-500">Enter your registered email to receive a password reset token.</p>
        </div>

        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-5">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-xl space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
              {demoToken && (
                <div className="pt-2 border-t border-emerald-200 text-[11px]">
                  <span>Local Demo Reset Link: </span>
                  <Link
                    to={`/reset-password?token=${demoToken}`}
                    className="font-bold text-[#15803D] underline"
                  >
                    Click here to reset password directly
                  </Link>
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="patient@example.com"
                className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Sending...' : 'Send Reset Link'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="text-center text-xs text-slate-500">
          Remembered your password?{' '}
          <Link to="/login" className="font-bold text-[#16A34A] hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
