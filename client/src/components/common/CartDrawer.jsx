import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Clock, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function CartDrawer() {
  const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, subtotal, totalSavings, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    setIsCartOpen(false);
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-emerald-50/60">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Your Test Cart</h3>
                <p className="text-xs text-slate-500">{cartItems.length} item(s) selected</p>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-700">Your test cart is empty</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Browse our diagnostic tests or preventive packages to book an appointment.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs text-slate-400 uppercase font-semibold">
                  <span>Selected Tests</span>
                  <button onClick={clearCart} className="text-rose-500 hover:underline">
                    Clear all
                  </button>
                </div>

                {cartItems.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex items-start justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:border-emerald-200 transition"
                  >
                    <div className="space-y-1 pr-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {item.type}
                        </span>
                        <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</h4>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-slate-500">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-slate-400" />
                          {item.reportTime}
                        </span>
                        {item.fastingRequired && (
                          <span className="text-amber-600 font-medium">Fasting Req.</span>
                        )}
                      </div>
                      <div className="text-sm font-bold text-emerald-700">
                        ₹{item.price}
                        {item.originalPrice > item.price && (
                          <span className="text-xs text-slate-400 line-through ml-2 font-normal">
                            ₹{item.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id, item.type)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Footer & Checkout */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
              {totalSavings > 0 && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between">
                  <span>🎉 Package Discount Savings</span>
                  <span>- ₹{totalSavings}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500">Total Payable Amount</span>
                  <div className="text-2xl font-black text-slate-900">₹{subtotal}</div>
                </div>
                <div className="text-right text-xs text-emerald-700 font-medium flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600" />
                  Free Home Collection
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition"
              >
                <span>{isAuthenticated ? 'Proceed to Book Slot' : 'Login to Book Slot'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {!isAuthenticated && (
                <p className="text-[11px] text-center text-slate-500 font-medium">
                  🔒 New patient? You can quickly register during checkout.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
