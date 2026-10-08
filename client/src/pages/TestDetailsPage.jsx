import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  Droplet,
  ShieldCheck,
  AlertCircle,
  FileText,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Share2
} from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function TestDetailsPage() {
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart, setIsCartOpen } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTestDetails = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/tests/${id}`);
        setTest(res.data.test || null);
      } catch (err) {
        console.error('Failed to load test details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTestDetails();
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Loading comprehensive test profile..." />;
  }

  if (!test) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Test not found</h2>
        <p className="text-xs text-slate-500">The requested test may have been removed or updated.</p>
        <Link to="/tests" className="inline-block px-5 py-2.5 bg-[#16A34A] text-white text-xs font-bold rounded-xl">
          Back to Test Catalog
        </Link>
      </div>
    );
  }

  const handleBookNow = () => {
    addToCart(test, 'test');
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: '/book',
          message: 'To book a test, please log in. If you are a new patient, please register first.'
        }
      });
    } else {
      navigate('/book');
    }
  };

  const handleAddToCart = () => {
    addToCart(test, 'test');
    setIsCartOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Back button */}
      <div>
        <Link
          to="/tests"
          className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Tests Catalog
        </Link>
      </div>

      {/* Main Test Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Information */}
        <div className="lg:col-span-8 space-y-8">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] text-xs font-extrabold uppercase tracking-wider">
                  {test.category_name || 'Hematology'}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">Code: {test.test_code}</span>
              </div>
              <span className="text-xs font-semibold text-emerald-700 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1" />
                NABL Accredited
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {test.name}
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                {test.description}
              </p>
            </div>

            {/* Key Test Attributes Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="text-slate-400 font-semibold flex items-center">
                  <Droplet className="w-3.5 h-3.5 mr-1 text-rose-500" />
                  Sample Type
                </div>
                <div className="font-bold text-slate-800">{test.sample_type || 'Blood'}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="text-slate-400 font-semibold flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Turnaround Time
                </div>
                <div className="font-bold text-slate-800">{test.report_time || 'Same Day'}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 col-span-2 sm:col-span-1">
                <div className="text-slate-400 font-semibold flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-500" />
                  Fasting Requirement
                </div>
                <div className={`font-bold ${test.fasting_required ? 'text-amber-700' : 'text-slate-800'}`}>
                  {test.fasting_required ? 'Overnight Fasting' : 'No Fasting Required'}
                </div>
              </div>
            </div>

            {/* Preparation instructions */}
            {test.preparation_instructions && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70 space-y-1.5 text-xs">
                <div className="font-bold text-amber-900 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1.5 text-amber-600" />
                  Patient Preparation Instructions:
                </div>
                <p className="text-amber-800 leading-relaxed pl-5.5">
                  {test.preparation_instructions}
                </p>
              </div>
            )}
          </div>

          {/* Parameters Included Section */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Parameters Tested</h3>
                <p className="text-xs text-slate-500">
                  {test.parameters?.length || 0} biological biomarker parameter(s) evaluated in this report.
                </p>
              </div>
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>

            {test.parameters && test.parameters.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                      <th className="py-3 px-4 font-bold">Parameter Name</th>
                      <th className="py-3 px-4 font-bold">Standard Unit</th>
                      <th className="py-3 px-4 font-bold">Biological Reference Range</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {test.parameters.map((p, idx) => (
                      <tr key={p.id || idx} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 font-bold text-slate-800">{p.name}</td>
                        <td className="py-3 px-4 font-medium text-slate-500">{p.unit || '-'}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{p.reference_range || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Standard clinical pathology parameters evaluated as per national reference values.
              </p>
            )}
          </div>
        </div>

        {/* Right Sticky Booking Card */}
        <div className="lg:col-span-4 sticky top-28 space-y-6">
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-6">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Test Price</span>
              <div className="flex items-baseline space-x-3">
                <span className="text-3xl font-black text-slate-900">
                  ₹{test.discount_price || test.price}
                </span>
                {test.discount_price && test.discount_price < test.price && (
                  <span className="text-sm text-slate-400 line-through">₹{test.price}</span>
                )}
              </div>
              {test.discount_price && test.discount_price < test.price && (
                <div className="text-xs font-bold text-emerald-700">
                  You save ₹{test.price - test.discount_price} ({Math.round(((test.price - test.discount_price) / test.price) * 100)}% off)
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleBookNow}
                className="w-full py-3.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center space-x-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Book This Test Now</span>
              </button>

              <button
                onClick={handleAddToCart}
                className="w-full py-3 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#15803D] text-xs font-bold rounded-xl border border-emerald-200 transition flex items-center justify-center space-x-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>Free Home Sample Collection Available</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>Verified by MD Pathologist</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>Online PDF Report via Portal & Email</span>
              </div>
            </div>
          </div>

          {/* Related tests */}
          {test.related_tests && test.related_tests.length > 0 && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Related Tests
              </h4>
              <div className="space-y-3">
                {test.related_tests.map((rt) => (
                  <Link
                    key={rt.id}
                    to={`/tests/${rt.id}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 transition border border-transparent hover:border-emerald-200"
                  >
                    <div className="pr-2">
                      <div className="text-xs font-bold text-slate-800 line-clamp-1">{rt.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{rt.test_code}</div>
                    </div>
                    <span className="text-xs font-black text-[#15803D]">
                      ₹{rt.discount_price || rt.price}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
