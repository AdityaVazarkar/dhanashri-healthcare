import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Activity,
  ShoppingBag,
  User,
  LogOut,
  Calendar,
  FileText,
  Menu,
  X,
  Shield,
  ChevronDown,
  Home,
  Package,
  FlaskConical,
  PhoneCall
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount, setIsCartOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setIsUserDropdownOpen(false);
    navigate('/login');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Tests', path: '/tests' },
    { name: 'Packages', path: '/packages' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm transition">
      {/* Top micro bar for trust */}
      <div className="bg-[#15803D] text-white text-[11px] py-1 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Shield className="w-3.5 h-3.5 mr-1 text-[#DCFCE7]" />
              NABL Accredited & 100% Certified Automated Laboratory
            </span>
            <span className="text-emerald-200">|</span>
            <span>Free Home Sample Collection in 45 Minutes</span>
          </div>
          <div className="flex items-center space-x-4">
            <a href="tel:+918049201100" className="flex items-center hover:text-[#DCFCE7] transition">
              <PhoneCall className="w-3 h-3 mr-1" />
              24/7 Helpline: +91 80 4920 1100
            </a>
            <Link to="/admin/login" className="text-emerald-200 hover:text-white transition">
              Lab Staff / Admin
            </Link>
          </div>
        </div>
      </div>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#15803D] to-[#16A34A] text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition">
            <Activity className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Dhanashri</span>
              <span className="text-xs uppercase font-extrabold tracking-widest px-1.5 py-0.5 rounded bg-[#DCFCE7] text-[#15803D]">
                Health Care
              </span>
            </div>
            <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
              Diagnostic & Pathology Services
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center space-x-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition ${
                isActive(link.path)
                  ? 'text-[#16A34A] bg-[#F0FDF4]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Right CTA Actions */}
        <div className="hidden md:flex items-center space-x-3">
          {/* Cart Icon */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:text-[#16A34A] hover:border-emerald-300 hover:bg-[#F0FDF4] transition"
            aria-label="View Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#16A34A] text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-white">
                {itemCount}
              </span>
            )}
          </button>

          {/* Book Home Sample CTA */}
          <Link
            to="/tests"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-[#DCFCE7] text-[#15803D] hover:bg-emerald-200 text-xs font-bold transition border border-emerald-300"
          >
            <FlaskConical className="w-3.5 h-3.5 mr-1.5 text-[#16A34A]" />
            Book Home Collection
          </Link>

          {/* User Auth state */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center space-x-2.5 p-1.5 pr-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-slate-50 transition"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                  {user.full_name?.charAt(0) || 'U'}
                </div>
                <div className="text-left hidden xl:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {user.full_name?.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-slate-400">Patient</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {isUserDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-100 py-2 z-40">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-800">{user.full_name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F0FDF4] hover:text-[#16A34A]"
                    >
                      <Home className="w-4 h-4 mr-2.5 text-slate-400" />
                      Health Dashboard
                    </Link>

                    <Link
                      to="/bookings"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F0FDF4] hover:text-[#16A34A]"
                    >
                      <Calendar className="w-4 h-4 mr-2.5 text-slate-400" />
                      My Bookings
                    </Link>

                    <Link
                      to="/reports"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F0FDF4] hover:text-[#16A34A]"
                    >
                      <FileText className="w-4 h-4 mr-2.5 text-slate-400" />
                      My Reports
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setIsUserDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#F0FDF4] hover:text-[#16A34A]"
                    >
                      <User className="w-4 h-4 mr-2.5 text-slate-400" />
                      Profile & Settings
                    </Link>

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut className="w-4 h-4 mr-2.5 text-rose-400" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center space-x-2 lg:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-lg border border-slate-200 text-slate-700"
          >
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#16A34A] text-white text-[10px] font-bold flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`p-2.5 rounded-xl text-xs font-bold text-center ${
                  isActive(link.path)
                    ? 'bg-[#16A34A] text-white'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-3">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <p className="text-xs font-bold text-[#15803D]">Signed in as</p>
                  <p className="text-sm font-semibold text-slate-800">{user.full_name}</p>
                </div>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block p-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  Health Dashboard
                </Link>
                <Link
                  to="/bookings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block p-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  My Bookings
                </Link>
                <Link
                  to="/reports"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block p-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  My Reports
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left p-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2.5 text-center text-xs font-bold border border-slate-200 rounded-xl"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2.5 text-center text-xs font-bold bg-[#16A34A] text-white rounded-xl"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
