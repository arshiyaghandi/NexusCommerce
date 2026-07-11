import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCart, placeOrder } from '../services/api';
import { useNotification } from '../components/NotificationManager';

const Checkout = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [address, setAddress] = useState({ fullName: '', street: '', city: '', zip: '' });
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await getCart();
      setCartItems(response.data.items || []);
    } catch (err) {
      addNotification('Failed to load cart', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      addNotification('Cart is empty', 'error');
      return;
    }
    
    setPlacingOrder(true);
    try {
      await placeOrder();
      addNotification('Order placed successfully! Processing...', 'success');
      navigate('/orders');
    } catch (err) {
      addNotification('Failed to place order. Please try again.', 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) return <div className="text-center p-8 text-white">Loading checkout...</div>;

  const total = cartItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-6">Checkout</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="glass-card p-6 border border-white/10 rounded-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <h2 className="text-xl font-semibold text-white mb-4">Order Summary</h2>
          {cartItems.length === 0 ? (
            <p className="text-gray-400">Your cart is empty.</p>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.productId} className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                  <span className="text-gray-300">{item.productName} x {item.quantity}</span>
                  <span className="text-white font-medium">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-4 text-lg font-bold">
                <span className="text-white">Total</span>
                <span className="text-primary">${total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Shipping & Payment Form */}
        <div className="glass-card p-6 border border-white/10 rounded-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <h2 className="text-xl font-semibold text-white mb-4">Shipping Information</h2>
          <form onSubmit={handlePlaceOrder} className="space-y-4 relative z-10">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
              <input 
                type="text" 
                name="fullName"
                required
                value={address.fullName}
                onChange={handleInputChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Street Address</label>
              <input 
                type="text" 
                name="street"
                required
                value={address.street}
                onChange={handleInputChange}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">City</label>
                <input 
                  type="text" 
                  name="city"
                  required
                  value={address.city}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">ZIP Code</label>
                <input 
                  type="text" 
                  name="zip"
                  required
                  value={address.zip}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300" 
                />
              </div>
            </div>
            
            <div className="pt-4">
              <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg mb-4">
                <p className="text-sm text-primary flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Payment is handled automatically via our secure Nexus Saga.
                </p>
              </div>
              <button 
                type="submit" 
                disabled={placingOrder || cartItems.length === 0}
                className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-6 rounded-lg shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all duration-300 hover:shadow-[0_0_25px_rgba(139,92,246,0.7)] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {placingOrder ? 'Processing...' : `Pay $${total.toFixed(2)}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
