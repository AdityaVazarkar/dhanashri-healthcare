import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import CartDrawer from '../components/common/CartDrawer';
import MobileBottomNav from '../components/common/MobileBottomNav';

export default function PatientLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>
      <CartDrawer />
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
