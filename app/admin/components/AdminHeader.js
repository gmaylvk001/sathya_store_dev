'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; // Import useRouter

const AdminHeader = ({ toggleSidebar }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const router = useRouter();

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);
  const toggleNotif = async () => {
    // Mark all notifications as read when opening dropdown
    if (!notifOpen && unreadCount > 0) {
      try {
        await fetch('/api/notification', { method: 'POST' });
        // Update notifications to read:true locally
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch (err) {
        console.error('Failed to mark notifications as read:', err);
      }
    }
    setNotifOpen((prev) => !prev);
  };

  // Sign out function
  const handleSignOut = (e) => {
    e.preventDefault();
    // try {
    //   localStorage.removeItem('authToken');
    //   localStorage.removeItem('userData');
    //   sessionStorage.removeItem('authToken');
    //   sessionStorage.removeItem('userData');

    //   document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

    //   router.push('/admin/login');
    // } catch (error) {
    //   console.error('Error during sign out:', error);
    // }
    try {
      // ###### Clear all LocalStorage ###### //
      localStorage.clear();
      sessionStorage.clear();
    
      router.push('/admin/login');
      
    } catch (error) {
      console.error('Sign out error:', error);
      window.location.href = '/admin/login';
    }
  };

  // Poll notifications every 2 minutes
  useEffect(() => {
    let intervalId;
    const fetchNotifications = async () => {
      try {
        // No userId needed, fetch all notifications
        const res = await fetch(`/api/notification`);
        const data = await res.json();
        console.log('Fetched notifications:', data.notifications);
        if (data.success) setNotifications(data.notifications);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };
    fetchNotifications();
    intervalId = setInterval(fetchNotifications, 120000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.profile-dropdown') && !e.target.closest('.notification-dropdown')) {
        setDropdownOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="navbar-header border-b border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 py-3 px-6 flex items-center justify-between">
      {/* Left side - Sidebar toggle and search */}
      <div className="flex items-center space-x-4">
        {/* Sidebar toggle button */}
        <button onClick={toggleSidebar} className="text-gray-600 dark:text-white focus:outline-none">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Right side - Notification and Avatar */}
      <div className="flex items-center space-x-4">
        {/* Notification icon */}
        <div className="notification-dropdown relative">
          <button onClick={toggleNotif} className="relative focus:outline-none">
            <svg className="w-7 h-7 text-gray-600 dark:text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-neutral-700 rounded-md shadow-lg py-2 z-50 max-h-96 overflow-y-auto">
              <div className="px-4 py-2 text-lg font-semibold border-b dark:border-neutral-600">Notifications</div>
              {notifications.length === 0 ? (
                <div className="px-4 py-4 text-gray-500">No notifications</div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif._id} className={`px-4 py-2 border-b dark:border-neutral-600 text-sm ${!notif.read ? 'bg-red-50 dark:bg-neutral-800' : ''}`}>
                    <div className="font-medium">{notif.message}</div>
                    {notif.userId && (
                      <div className="text-xs text-gray-500">User: {notif.userId.name} ({notif.userId.email})</div>
                    )}
                    {notif.orderId && (
                      <div className="text-xs text-gray-500">Order: #{notif.orderId.order_number} | Amount: {notif.orderId.order_amount} | Status: {notif.orderId.order_status}</div>
                    )}
                     {notif.type === 'feedback' && notif.feedbackId && (
      <div className="text-xs text-gray-500 mt-1">
        <div>Name: {notif.feedbackId.name}</div>
        <div>Email: {notif.feedbackId.email_address}</div>
        <div>Invoice: {notif.feedbackId.invoice_number}</div>
      </div>
    )}

     {notif.type === 'contact' && notif.contactId && (
      <div className="text-xs text-gray-500 mt-1">
        <div>Name: {notif.contactId.name}</div>
        <div>Email: {notif.contactId.email_address}</div>
        <div>Message: {notif.contactId.message}</div>
      </div>
    )}
                    <div className="text-xs text-gray-400">{new Date(notif.createdAt).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="profile-dropdown relative">
          <button
            onClick={toggleDropdown}
            className="flex items-center focus:outline-none"
          >
            <div className="w-11 h-11 rounded-full bg-gray-300 dark:bg-neutral-600 overflow-hidden flex items-center justify-center">
              <Image
                src="/admin/assets/images/user.png"
                alt="User Avatar"
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-700 rounded-md shadow-lg py-1 z-50">
              <a
                href="#"
                onClick={handleSignOut}
                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-600"
              >
                Sign out
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;