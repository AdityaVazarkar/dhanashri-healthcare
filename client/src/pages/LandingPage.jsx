import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  Search,
  ShieldCheck,
  Clock,
  Home,
  Award,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Sparkles,
  PhoneCall,
  MapPin,
  HelpCircle,
  ChevronDown,
  Star,
  FlaskConical,
  HeartPulse,
  Droplet
} from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [popularTests, setPopularTests] = useState([]);
  const [packages, setPackages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testsRes, pkgsRes, catsRes] = await Promise.all([
          api.get('/tests?popular=true'),
          api.get('/packages?featured=true'),
          api.get('/categories')
        ]);
        setPopularTests(testsRes.data.tests?.slice(0, 6) || []);
        setPackages(pkgsRes.data.packages?.slice(0, 4) || []);
        setCategories(catsRes.data.categories?.slice(0, 6) || []);
      } catch (err) {
        console.error('Failed to load landing page data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tests?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/tests');
    }
  };

  const faqs = [
    {
      q: 'How does the Home Sample Collection service work?',
      a: 'Once you select your tests and schedule a preferred date and time, a certified, vaccinated phlebotomist visits your doorstep with sterile, barcoded sample collection kits. Samples are safely transported in temperature-controlled boxes to our central NABL-accredited laboratory.'
    },
    {
      q: 'Do I need to fast before my blood test?',
      a: 'Tests like Fasting Blood Sugar, Lipid Profile, and comprehensive health packages typically require 10 to 12 hours of overnight fasting. Only plain water is permitted. Each test page clearly mentions whether fasting is required.'
    },
    {
      q: 'How soon will I receive my laboratory test reports?',
      a: 'Most routine routine blood tests (CBC, Glucose, Liver, Kidney, Lipid) are verified and published the same day within 6 to 12 hours. You can view and download verified PDF reports on your patient dashboard and via email.'
    },
    {
      q: 'Are your test results certified and NABL accredited?',
      a: 'Yes. Dhanashri Health Care operates with full NABL (National Accreditation Board for Testing and Calibration Laboratories) accreditation and ISO 15189:2022 compliance with automated robotic analyzers and multi-tier pathologist verification.'
    },
    {
      q: 'Can I book a test for family members?',
      a: 'Absolutely. During checkout, you can specify individual patient details (name, age, gender) for each test booked under your account.'
    }
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* --- HERO SECTION --- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F0FDF4] via-white to-white pt-10 sm:pt-16 pb-12 sm:pb-20 border-b border-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#DCFCE7] border border-emerald-200 text-[#15803D] text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>NABL Accredited & Certified Diagnostics</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
                Accurate Testing.{' '}
                <span className="text-[#16A34A] block sm:inline">Better Health.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
                Reliable diagnostic testing with fast and accurate laboratory reports. Book certified blood tests with doorstep phlebotomy and same-day digital verification.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  to="/tests"
                  className="w-full sm:w-auto px-7 py-3.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center space-x-2"
                >
                  <span>Book a Test</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/packages"
                  className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-800 text-sm font-bold rounded-xl border border-slate-200 shadow-sm transition flex items-center justify-center"
                >
                  <span>Explore Packages</span>
                </Link>
              </div>

              {/* Global Search Bar */}
              <form onSubmit={handleSearchSubmit} className="pt-4 max-w-xl mx-auto lg:mx-0">
                <div className="relative flex items-center shadow-md rounded-2xl overflow-hidden border border-emerald-200 bg-white focus-within:ring-2 focus-within:ring-[#16A34A]">
                  <div className="pl-4 text-slate-400">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by test name, organ or package (e.g. CBC, Thyroid, Sugar, Lipid)..."
                    className="w-full py-4 pl-3 pr-24 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl transition"
                  >
                    Search
                  </button>
                </div>
                {/* Search suggestion pills */}
                <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-500">
                  <span className="font-semibold text-slate-400">Popular:</span>
                  {['CBC', 'Lipid Profile', 'Thyroid', 'HbA1c', 'Vitamin D'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => navigate(`/tests?q=${encodeURIComponent(item)}`)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#DCFCE7] hover:text-[#15803D] transition text-[11px] font-medium"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </form>
            </div>

            {/* Right Visual Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Decorative glow */}
                <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-3xl blur-2xl opacity-20"></div>

                <div className="relative rounded-3xl bg-white border border-emerald-100 p-6 sm:p-8 shadow-xl space-y-6">
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center">
                        <Home className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="font-bold text-slate-800 text-sm">Doorstep Phlebotomy</h2>
                        <p className="text-xs text-slate-500">Certified Blood Sample Collection</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                      Free Home Visit
                    </span>
                  </div>

                  {/* Highlights list */}
                  <div className="space-y-3.5 text-xs text-slate-600">
                    <div className="flex items-start space-x-3">
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0 mt-0.5" />
                      <span>Certified & vaccinated phlebotomist at your preferred 1-hour time slot.</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0 mt-0.5" />
                      <span>100% sterile barcoded vacutainer tubes with automated chain-of-custody.</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0 mt-0.5" />
                      <span>Same-day digital report verified by MD Pathologist delivered online.</span>
                    </div>
                  </div>

                  {/* Booking CTA banner */}
                  <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-emerald-200 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>Available Time Slots Today:</span>
                      <span className="text-[#15803D] font-bold">9 Slots Left</span>
                    </div>
                    <Link
                      to="/book"
                      className="w-full flex items-center justify-center space-x-2 py-3 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-md transition"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Book Home Sample Collection</span>
                    </Link>
                  </div>

                  {/* Trust footer */}
                  <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1 text-[#16A34A]" />
                      NABL Certified
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-[#16A34A]" />
                      6-Hour Turnaround
                    </span>
                    <span className="flex items-center">
                      <Star className="w-3.5 h-3.5 mr-1 text-amber-500 fill-amber-500" />
                      4.9/5 Rating
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- STATS STRIP --- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl">
          <div className="text-center sm:text-left space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-emerald-400">500,000+</div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Patients Served</div>
          </div>
          <div className="text-center sm:text-left space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-emerald-400">100%</div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">NABL Accredited</div>
          </div>
          <div className="text-center sm:text-left space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-emerald-400">60+ Min</div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Doorstep Arrival</div>
          </div>
          <div className="text-center sm:text-left space-y-1">
            <div className="text-3xl sm:text-4xl font-black text-emerald-400">4.9 / 5</div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Patient Trust Score</div>
          </div>
        </div>
      </section>

      {/* --- POPULAR TESTS SECTION --- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 space-y-3 md:space-y-0">
          <div>
            <div className="text-xs font-bold text-[#16A34A] uppercase tracking-wider mb-1">
              Diagnostic Excellence
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Popular Blood Tests
            </h2>
          </div>
          <Link
            to="/tests"
            className="inline-flex items-center text-sm font-bold text-[#16A34A] hover:text-[#15803D]"
          >
            <span>View All Tests</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Fetching popular diagnostic tests..." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularTests.map((test) => (
              <div
                key={test.id}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition duration-150 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-[#15803D] border border-emerald-200">
                      {test.category_name || 'Hematology'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono font-medium">{test.test_code}</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#16A34A] transition line-clamp-1">
                    {test.name}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {test.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-slate-500 border-t border-slate-100">
                    <div className="flex items-center space-x-1.5">
                      <Droplet className="w-3.5 h-3.5 text-rose-500" />
                      <span className="truncate">{test.sample_type || 'Blood'}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="truncate">{test.report_time || 'Same Day'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xl font-black text-slate-900">
                      ₹{test.discount_price || test.price}
                    </div>
                    {test.discount_price && test.discount_price < test.price && (
                      <span className="text-xs text-slate-400 line-through">₹{test.price}</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/tests/${test.id}`}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                    >
                      Details
                    </Link>
                    <button
                      onClick={() => addToCart(test, 'test')}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#16A34A] hover:bg-[#15803D] text-white shadow-sm transition"
                    >
                      Book Test
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- HEALTH PACKAGES SECTION --- */}
      <section className="bg-[#F0FDF4] py-16 border-y border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#16A34A]">
              Comprehensive Care
            </span>
            <h2 className="text-3xl font-black text-slate-900">
              Preventive Health Packages
            </h2>
            <p className="text-sm text-slate-600">
              Complete full-body profiles curated by senior pathologists to detect metabolic and organ risks early.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg) => {
              const benefits = typeof pkg.benefits === 'string' ? JSON.parse(pkg.benefits || '[]') : (pkg.benefits || []);
              return (
                <div
                  key={pkg.id}
                  className="rounded-3xl bg-white border border-emerald-200 p-6 shadow-sm hover:shadow-xl transition flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-[#15803D] text-[10px] font-bold uppercase tracking-wider">
                        {pkg.is_featured ? '⭐ Most Popular' : 'Wellness'}
                      </span>
                      <span className="text-xs font-bold text-emerald-600">
                        Save {Math.round(((pkg.original_price - pkg.discount_price) / pkg.original_price) * 100)}%
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-900 line-clamp-1">{pkg.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{pkg.description}</p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {benefits.slice(0, 3).map((b, idx) => (
                        <div key={idx} className="flex items-start text-xs text-slate-600 space-x-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100">
                    <div className="flex items-baseline space-x-2 mb-4">
                      <span className="text-2xl font-black text-slate-900">₹{pkg.discount_price}</span>
                      <span className="text-xs text-slate-400 line-through">₹{pkg.original_price}</span>
                    </div>
                    <button
                      onClick={() => addToCart(pkg, 'package')}
                      className="w-full py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-md transition"
                    >
                      Book Package
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link
              to="/packages"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-white border border-emerald-300 text-sm font-bold text-[#15803D] hover:bg-emerald-50 shadow-sm transition"
            >
              <span>Explore All Health Packages</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS SECTION --- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#16A34A]">
            Simple 4-Step Process
          </span>
          <h2 className="text-3xl font-black text-slate-900">
            How Doorstep Diagnostic Testing Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { step: '01', title: 'Select Test', desc: 'Browse our catalog of 150+ blood tests or select a full-body preventive package.' },
            { step: '02', title: 'Choose Slot', desc: 'Select home sample collection and choose your convenient 1-hour time window.' },
            { step: '03', title: 'Sample Collection', desc: 'Our certified phlebotomist arrives with single-use, sterile vacuum tubes.' },
            { step: '04', title: 'Digital Report', desc: 'Verified PDF report is generated same-day with digital pathologist signature.' }
          ].map((item, idx) => (
            <div key={idx} className="relative p-6 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-sm">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#DCFCE7] text-[#15803D] font-black text-lg flex items-center justify-center">
                {item.step}
              </div>
              <h3 className="font-bold text-slate-800 text-base">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- WHY CHOOSE US --- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white">
          <div className="max-w-3xl space-y-4 mb-10">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              Uncompromising Quality
            </span>
            <h2 className="text-3xl font-black">
              Why Doctors & Patients Trust Dhanashri Health Care
            </h2>
            <p className="text-sm text-slate-400">
              We leverage fully automated robotic immunoassay analyzers and strict internal quality controls to eliminate human sampling errors.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Award, title: 'NABL & ISO Certified', desc: 'Stringent multi-level quality controls and calibrated equipment.' },
              { icon: ShieldCheck, title: '100% Barcoded Safety', desc: 'Unique two-factor barcode labeling on every sample container.' },
              { icon: Clock, title: '6-Hour Express Reports', desc: 'Rapid turnaround for critical routine blood parameters.' },
              { icon: HeartPulse, title: 'MD Pathologist Sign-off', desc: 'Every report verified by clinical pathologists before publishing.' },
              { icon: Home, title: 'Free Home Collection', desc: 'Punctual phlebotomy visits in temperature-monitored carrier kits.' },
              { icon: Activity, title: 'Digital Health Records', desc: 'Lifetime secure access to historical reports and health trends.' }
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-sm">{feature.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#16A34A]">
            Patient Experiences
          </span>
          <h2 className="text-3xl font-black text-slate-900">
            Trusted by Thousands of Families
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'Dr. Rajesh Deshmukh',
              role: 'Consultant Physician',
              review: 'Dhanashri Health Care provides unmatched analytical accuracy. I regularly prescribe their lipid and thyroid profiles for my cardiac patients.'
            },
            {
              name: 'Priyanka Sen',
              role: 'Corporate Executive',
              review: 'The phlebotomist was on time at 7 AM, completely painless sample draw, and I received my CBC and Vitamin D report on my phone by evening.'
            },
            {
              name: 'Anand Kulkarni',
              role: 'Senior Citizen',
              review: 'Booking the Complete Health Checkup for my wife and me was seamless. The digital report viewer is very easy to read and understand.'
            }
          ].map((t, idx) => (
            <div key={idx} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">"{t.review}"</p>
              <div className="pt-2 border-t border-slate-100">
                <div className="font-bold text-sm text-slate-900">{t.name}</div>
                <div className="text-xs text-slate-400">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#16A34A]">
            Got Questions?
          </span>
          <h2 className="text-3xl font-black text-slate-900">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-slate-800 hover:text-[#16A34A] transition"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform text-slate-400 ${
                    openFaq === idx ? 'rotate-180 text-[#16A34A]' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* --- CALL TO ACTION BAR --- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-[#15803D] to-[#16A34A] text-white p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-black">
              Need Help Choosing the Right Blood Test?
            </h2>
            <p className="text-sm text-emerald-100">
              Speak with our diagnostic counsellors for personalized guidance or quick booking assistance.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <a
              href="tel:+918049201100"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white text-[#15803D] hover:bg-emerald-50 text-xs font-bold shadow-md transition flex items-center justify-center space-x-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call Helpline</span>
            </a>
            <Link
              to="/tests"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-800/40 border border-white/20 text-white hover:bg-emerald-800/60 text-xs font-bold transition flex items-center justify-center"
            >
              <span>Explore All Tests</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
