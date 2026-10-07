import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, Clock, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await api.get('/packages');
        setPackages(res.data.packages || []);
      } catch (err) {
        console.error('Failed to load packages:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const handleBookPackage = (pkg) => {
    addToCart(pkg, 'package');
    navigate('/book');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#F0FDF4] via-emerald-50 to-white p-6 sm:p-10 border border-emerald-100 space-y-3 max-w-4xl">
        <span className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">
          Preventive Diagnostic Wellness
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
          Full Body Health Checkup Packages
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Affordable, comprehensive diagnostic batteries designed to detect early indicators of cardiovascular risk, diabetes, liver and kidney imbalances, thyroid disorders, and micronutrient deficiencies.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading health checkup packages..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.map((pkg) => {
            const benefits = typeof pkg.benefits === 'string' ? JSON.parse(pkg.benefits || '[]') : (pkg.benefits || []);
            const includedTests = pkg.included_tests || [];
            const savingsPercent = Math.round(((pkg.original_price - pkg.discount_price) / pkg.original_price) * 100);

            return (
              <div
                key={pkg.id}
                className="rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-300 transition duration-150 flex flex-col justify-between overflow-hidden"
              >
                {/* Card Top */}
                <div className="p-6 sm:p-7 space-y-5">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      pkg.is_featured
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-[#DCFCE7] text-[#15803D] border border-emerald-200'
                    }`}>
                      {pkg.is_featured ? '⭐ Recommended' : 'Essential'}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                      Save {savingsPercent}%
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900">{pkg.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {pkg.description}
                    </p>
                  </div>

                  {/* Pricing Box */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-baseline justify-between">
                    <div>
                      <div className="text-xs text-slate-400 font-semibold">Special Package Offer</div>
                      <div className="text-2xl font-black text-slate-900">₹{pkg.discount_price}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400 line-through">₹{pkg.original_price}</div>
                      <div className="text-[11px] font-bold text-[#15803D]">Includes Home Visit</div>
                    </div>
                  </div>

                  {/* Included Tests Pill List */}
                  {includedTests.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Tests Included ({includedTests.length})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {includedTests.map((t) => (
                          <span
                            key={t.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50/70 border border-emerald-100 text-[11px] font-semibold text-slate-700"
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Benefits checklist */}
                  {benefits.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {benefits.map((b, idx) => (
                        <div key={idx} className="flex items-start text-xs text-slate-600 space-x-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {pkg.preparation_instructions && (
                    <div className="flex items-start space-x-2 text-[11px] text-amber-800 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>{pkg.preparation_instructions}</span>
                    </div>
                  )}
                </div>

                {/* Card Action */}
                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleBookPackage(pkg)}
                    className="flex-1 py-3 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-md transition text-center"
                  >
                    Book Package
                  </button>
                  <button
                    onClick={() => addToCart(pkg, 'package')}
                    className="px-4 py-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition"
                  >
                    + Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
