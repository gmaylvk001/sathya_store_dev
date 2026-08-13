"use client";
import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useHeaderdetails } from '@/context/HeaderContext';

export const AuthModal = ({ onClose, onSuccess, error }) => {
  const [activeTab, setActiveTab] = useState('login');
    const { updateHeaderdetails, setIsLoggedIn, setUserData,setIsAdmin } = useHeaderdetails();
  const [formData, setFormData] = useState({ email: '', password: '', name: '', mobile: '' });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: ''
  });
  const { updateCartCount } = useCart();
  const { updateWishlist } = useWishlist();

  const clearErrors = () => {
    setFormError('');
    setFieldErrors({
      email: '',
      password: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearErrors();
    const guestId = localStorage.getItem("guestCartId");
    try {
      const endpoint = activeTab === 'login' ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeTab === 'login' ? {
          email: formData.email,
          password: formData.password,
          guestId: guestId
        } : {
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          password: formData.password
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        // Handle field-specific errors
        if (data.errorType === 'email') {
          setFieldErrors(prev => ({ ...prev, email: data.error }));
        } else if (data.errorType === 'password') {
          setFieldErrors(prev => ({ ...prev, password: data.error }));
        } else {
          throw new Error(data.error || 'Authentication failed');
        }
        return;
      }
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        
         const response = await fetch('/api/auth/check', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': data.token ? `Bearer ${data.token}` : '',
          }
        });
        
        const details = await response.json();

              
        if (details.loggedIn) {
          updateHeaderdetails({ user: details.user });
            setIsLoggedIn(true);
          const role = details.role;
          if(role == 'admin'){
            setIsAdmin(true);
          }
        }else{
          setIsLoggedIn(false);
          return;
        }

        // Fetch both cart and wishlist counts after login
        const [cartResponse, wishlistResponse] = await Promise.all([
          fetch('/api/cart/count', {
            headers: { 'Authorization': `Bearer ${data.token}` }
          }),
          fetch('/api/wishlist', {
            headers: { 'Authorization': `Bearer ${data.token}` }
          })
        ]);

        if (cartResponse.ok) {
          const cartData = await cartResponse.json();
          updateCartCount(cartData.count);
        }

        if (wishlistResponse.ok) {
          const wishlistData = await wishlistResponse.json();
          updateWishlist(wishlistData.items, wishlistData.count);
        }

        // 👇 Optional: clear guestId after merge
        localStorage.removeItem("guestCartId");
        location.reload();
      }
      
      onSuccess();
    } catch (error) {
      console.error('Authentication error:', error);
      setFormError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-96 max-w-full relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
        >
          &times;
        </button>

        <div className="flex gap-4 mb-6 border-b">
          <button
            className={`pb-2 px-1 ${
              activeTab === 'login' 
                ? 'border-b-2 border-[#d72828] text-[#d72828]' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => {
              setActiveTab('login');
              clearErrors();
            }}
          >
            Login
          </button>
          <button
            className={`pb-2 px-1 ${
              activeTab === 'register'
                ? 'border-b-2 border-[#d72828] text-[#d72828]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => {
              setActiveTab('register');
              clearErrors();
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'register' && (
            <div>
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
          )}
          
          <div>
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => {
                setFormData({...formData, email: e.target.value});
                if (fieldErrors.email) clearErrors();
              }}
              className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500 ${
                fieldErrors.email ? 'border-red-500' : ''
              }`}
              required
            />
            {fieldErrors.email && (
              <p className="mt-1 text-sm text-red-500">{fieldErrors.email}</p>
            )}
          </div>
          
          {activeTab === 'register' && (
            <div>
              <input
                type="mobile"
                placeholder="Mobile"
                value={formData.mobile}
                onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
          )}
          
          <div>
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => {
                setFormData({...formData, password: e.target.value});
                if (fieldErrors.password) clearErrors();
              }}
              className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500 ${
                fieldErrors.password ? 'border-red-500' : ''
              }`}
              required
            />
            {fieldErrors.password && (
              <p className="mt-1 text-sm text-red-500">{fieldErrors.password}</p>
            )}
          </div>
          
          {(formError || error) && (
            <div className="text-red-500 text-sm">
              {formError || error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#d72828] text-white py-2 px-4 rounded hover:bg-[#d72828] disabled:bg-gray-400 transition-colors duration-200"
          >
            {loading ? 'Processing...' : activeTab === 'login' ? 'Login' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};