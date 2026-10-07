import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FlaskConical, Calendar, FileText, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MobileBottomNav() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Hide on admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Tests', path: '/tests', icon: FlaskConical },
    { name: 'Bookings', path: isAuthenticated ? '/bookings' : '/login', icon: Calendar },
    { name: 'Reports', path: isAuthenticated ? '/reports' : '/login', icon: FileText },
    { name: 'Profile', path: isAuthenticated ? '/profile' : '/login', icon: User },
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 md:hidden pb-safe">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center space-y-1 transition ${
                active ? 'text-[#16A34A]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              <span className={`text-[10px] font-semibold ${active ? 'font-bold' : ''}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
