"use client";

import { useState } from 'react';
import Link from 'next/link';
import { FiChevronRight} from 'react-icons/fi';
import { RiAccountCircleFill } from "react-icons/ri";
import { FaAddressBook } from "react-icons/fa";
import { HiShoppingBag } from "react-icons/hi2";
import { FaHeart } from "react-icons/fa6";


export default function Profile() {
  const [profileData, setProfileData] = useState({
    firstName: 'Sathya Stores',
    lastName: 'Admin',
    email: 'ecom@sathya.store',
    mobile: '9842248610',
    store: '100 FEET ROAD'
  });

  // Profile functions
  const handleProfileSave = (e) => {
    e.preventDefault();
    // Save profile data
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header with Breadcrumb */}
      <div className="bg-red-50 py-6 px-8 flex justify-between items-center border-b border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800">Profile</h2>
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">🏠 Home</span>
          <FiChevronRight className="text-gray-400" />
          <span className="text-gray-500">Shop</span>
          <FiChevronRight className="text-gray-400" />
          <span className="text-customBlue font-semibold">Profile</span>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-white p-6 rounded-xl border border-gray-200  hover:border-customBlue transition-all duration-300 shadow-sm">
              <h3 className="text-lg font-semibold text-customBlue mb-6 pb-2 border-b border-gray-100 hover:border-customBlue transition-all duration-300">My Account</h3>
              <nav className="space-y-2">
              <Link href="/profile" className="w-full flex items-center gap-2 px-5 py-3 text-lg text-base font-medium text-gray-700 rounded-lg transition-all duration-200 hover:text-customBlue hover:bg-red-100 hover:pl-6">
                <RiAccountCircleFill className="text-customBlue text-2xl" />
                  <span>Profile</span>
              </Link>
              <Link href="/address" className="w-full flex items-center gap-2 px-5 py-3 text-lg text-base font-medium text-gray-600 rounded-lg transition-all duration-200 hover:text-customBlue hover:bg-red-100 hover:pl-6">
                <FaAddressBook className="text-customBlue text-2xl"/>
                  <span>Addresses</span>
              </Link>
              <Link href="/orders" className="w-full flex items-center gap-2 px-5 py-3 text-lg text-base font-medium text-gray-600 rounded-lg transition-all duration-200 hover:text-customBlue hover:bg-red-100 hover:pl-6">
                <HiShoppingBag className="text-customBlue text-2xl"/>
                  <span>Orders</span>
              </Link>
              <Link href="/wishlist" className="w-full flex items-center gap-2 px-5 py-3 text-lg text-base font-medium text-gray-600 rounded-lg transition-all duration-200 hover:text-customBlue hover:bg-red-100 hover:pl-6">
                <FaHeart className="text-customBlue text-2xl"/>
                  <span>Wishlist</span>
              </Link>
              </nav>
            </div>
          </div>

          {/* Main Content - Profile */}
          <div className="flex-1">
            <div className="bg-white p-8 rounded-xl border border-gray-200 hover:border-customBlue transition-all duration-300 shadow-sm">
              <h2 className="text-xl font-semibold text-customBlue mb-8 pb-3 hover:border-customBlue transition-all duration-300 border-b border-gray-100">
                Edit Account Information
              </h2>
              <form onSubmit={handleProfileSave} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="block text-xl font-medium text-gray-700">
                      First name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={profileData.firstName}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-[#d72828] transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="lastName" className="block text-xl font-medium text-gray-700">
                      Last name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={profileData.lastName}
                      onChange={handleProfileChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-[#d72828] transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-xl font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-[#d72828] transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="mobile" className="block text-xl font-medium text-gray-700">
                    Mobile
                  </label>
                  <input
                    id="mobile"
                    name="mobile"
                    type="text"
                    value={profileData.mobile}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-[#d72828] transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="store" className="block text-xl font-medium text-gray-700">
                    Store near you
                  </label>
                  <input
                    id="store"
                    name="store"
                    type="text"
                    value={profileData.store}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-[#d72828] transition-all duration-200"
                  />
                </div>

                <div className="pt-6 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-customBlue hover:bg-[#d72828] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 hover:scale-105"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}