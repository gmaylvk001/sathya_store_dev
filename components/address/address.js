"use client";

import { useState } from 'react';
import Link from 'next/link';
import { FiChevronRight } from 'react-icons/fi';
import { RiAccountCircleFill } from "react-icons/ri";
import { FaAddressBook } from "react-icons/fa";
import { HiShoppingBag } from "react-icons/hi2";
import { FaHeart } from "react-icons/fa6";
import {  FiHome,  FiBriefcase, FiUser, FiMapPin, FiPhone, FiEdit2, FiTrash2  } from 'react-icons/fi';

export default function Address() {
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  
  const [addressData, setAddressData] = useState({
    name: 'Praveen',
    mobile: '9900076774',
    pincode: '641037',
    landmark: '',
    address: 'Andra Pradesh',
    state: 'Pondicherry',
    city: 'Pondicherry',
    alternatePhone: '2232323',
    type: 'office'
  });

  // Address functions
  const handleAddressEdit = () => {
    setIsEditingAddress(true);
    setIsAddingAddress(false);
  };

  const handleAddAddress = () => {
    setIsAddingAddress(true);
    setIsEditingAddress(false);
    setAddressData({
      name: '',
      mobile: '',
      pincode: '',
      landmark: '',
      address: '',
      state: '',
      city: '',
      alternatePhone: '',
      type: ''
    });
  };

  const handleAddressSave = (e) => {
    e.preventDefault();
    setIsEditingAddress(false);
    setIsAddingAddress(false);
  };

  const handleCancel = () => {
    setIsEditingAddress(false);
    setIsAddingAddress(false);
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header with Breadcrumb */}
      <div className="bg-blue-50 py-6 px-8 flex justify-between items-center border-b border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-800">
          {isEditingAddress ? 'Edit Address' : isAddingAddress ? 'Add Address' : 'Addresses'}
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">🏠 Home</span>
          <FiChevronRight className="text-gray-400" />
          <span className="text-gray-500">Shop</span>
          <FiChevronRight className="text-gray-400" />
          <span className="text-customBlue font-semibold">Addresses</span>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-white p-6 rounded-xl border border-gray-200  hover:border-customBlue transition-all duration-300 shadow-sm">
              <h3 className="text-lg font-semibold text-customBlue mb-6 pb-2 hover:border-customBlue transition-all duration-300 border-b border-gray-100">My Account</h3>
              <nav className="space-y-2">
              {/* <Link href="/profile" className="w-full flex items-center gap-2 px-5 py-3 text-lg text-base font-medium text-gray-700 rounded-lg transition-all duration-200 hover:text-customBlue hover:bg-blue-100 hover:pl-6">
                <RiAccountCircleFill className="text-customBlue text-2xl" />
                  <span>Profile</span>
              </Link>
              <Link href="/address" className="w-full flex items-center gap-2 px-5 py-3 text-lg text-base font-medium text-gray-600 rounded-lg transition-all duration-200 hover:text-customBlue hover:bg-blue-100 hover:pl-6">
                <FaAddressBook className="text-customBlue text-2xl"/>
                  <span>Addresses</span>
              </Link> */}
              <Link href="/orders" className="w-full flex items-center gap-2 px-5 py-3 text-lg text-base font-medium text-gray-600 rounded-lg transition-all duration-200 hover:text-customBlue hover:bg-blue-100 hover:pl-6">
                <HiShoppingBag className="text-customBlue text-2xl"/>
                  <span>Orders</span>
              </Link>
              <Link href="/wishlist" className="w-full flex items-center gap-2 px-5 py-3 text-lg text-base font-medium text-gray-600 rounded-lg transition-all duration-200 hover:text-customBlue hover:bg-blue-100 hover:pl-6">
                <FaHeart className="text-customBlue text-2xl"/>
                  <span>Wishlist</span>
              </Link>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 transition-all duration-300">
            {(isEditingAddress || isAddingAddress) ? (
              <div className="bg-white p-8 rounded-xl border border-gray-200 hover:border-customBlue transition-all duration-300 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-customBlue ">
                    {isEditingAddress ? 'Edit Address' : 'Add Address'}
                  </h2>
                  <button 
                    onClick={handleCancel}
                    className="text-customBlue hover:underline"
                  >
                    ← Back
                  </button>
                </div>
                
                <form onSubmit={handleAddressSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-xl font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        value={addressData.name}
                        onChange={handleAddressChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="mobile" className="block text-xl font-medium text-gray-700 mb-1">
                        10-digit mobile number
                      </label>
                      <input
                        id="mobile"
                        name="mobile"
                        type="tel"
                        value={addressData.mobile}
                        onChange={handleAddressChange}
                        pattern="[0-9]{10}"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="pincode" className="block text-xl font-medium text-gray-700 mb-1">
                        Pincode
                      </label>
                      <input
                        id="pincode"
                        name="pincode"
                        type="text"
                        value={addressData.pincode}
                        onChange={handleAddressChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="landmark" className="block text-xl font-medium text-gray-700 mb-1">
                        Landmark (Optional)
                      </label>
                      <input
                        id="landmark"
                        name="landmark"
                        type="text"
                        value={addressData.landmark}
                        onChange={handleAddressChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-xl font-medium text-gray-700 mb-1">
                      Address (Area and Street)
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={addressData.address}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="state" className="block text-xl font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <select
                        id="state"
                        name="state"
                        value={addressData.state}
                        onChange={handleAddressChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select State</option>
                        <option value="Pondicherry">Pondicherry</option>
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="city" className="block text-xl font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        value={addressData.city}
                        onChange={handleAddressChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="alternatePhone" className="block text-xl font-medium text-gray-700 mb-1">
                        Alternate Phone (Optional)
                      </label>
                      <input
                        id="alternatePhone"
                        name="alternatePhone"
                        type="tel"
                        value={addressData.alternatePhone}
                        onChange={handleAddressChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="type" className="block text-xl font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        id="type"
                        name="type"
                        value={addressData.type}
                        onChange={handleAddressChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select</option>
                        <option value="home">Home</option>
                        <option value="office">Office</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-6 flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-customBlue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:scale-105"
                    >
                      {isEditingAddress ? 'Save Changes' : 'Save and Deliver Here'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-xl border border-gray-200 hover:border-customBlue transition-all duration-300 shadow-sm">
                <h2 className="text-xl font-semibold text-customBlue mb-8 pb-3 border-b border-gray-100 hover:border-customBlue transition-all duration-300">
                  Addresses
                </h2>
                
                {/* Address Card */}
            
                <div className="mb-6 p-6 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 ${
                        addressData.type === 'home' ? 'bg-blue-100 text-blue-600' : 
                        addressData.type === 'office' ? 'bg-purple-100 text-purple-600' : 
                        'bg-gray-100 text-gray-600'
                    }`}>
                        {addressData.type === 'home' ? (
                        <FiHome className="h-5 w-5" />
                        ) : (
                        <FiBriefcase className="h-5 w-5" />
                        )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 capitalize">{addressData.type}</h3>
                    </div>
                    {addressData.type && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        addressData.type === 'home' ? 'bg-blue-50 text-blue-700' : 
                        addressData.type === 'office' ? 'bg-purple-50 text-purple-700' : 
                        'bg-gray-50 text-gray-700'
                    }`}>
                        {addressData.type === 'home' ? 'Primary' : 'Secondary'}
                    </span>
                    )}
                </div>

                <div className="space-y-3 text-gray-700">
                    <div className="flex items-start">
                    <FiUser className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="font-medium">{addressData.name}</p>
                    </div>
                    
                    <div className="flex items-start">
                    <FiMapPin className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                        <p>{addressData.address}</p>
                        <p className="text-gray-500">{addressData.city}, {addressData.pincode}</p>
                        <p className="text-gray-500">{addressData.state}</p>
                    </div>
                    </div>
                    
                    <div className="flex items-center">
                    <FiPhone className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0" />
                    <div>
                        <p>{addressData.mobile}</p>
                        {addressData.alternatePhone && (
                        <p className="text-gray-500">{addressData.alternatePhone} (Alternate)</p>
                        )}
                    </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end space-x-3">
                    <button 
                    onClick={handleAddressEdit}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center"
                    >
                    <FiEdit2 className="h-4 w-4 mr-2" />
                    Edit
                    </button>
                    <button 
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200 flex items-center"
                    >
                    <FiTrash2 className="h-4 w-4 mr-2" />
                    Remove
                    </button>
                </div>
                </div>
                {/* Add New Address Button */}
                <button 
                  onClick={handleAddAddress}
                  className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-customBlue hover:bg-blue-50 transition-all duration-200"
                >
                  <span className="text-customBlue text-lg font-medium">+ Add Address</span>
                  <span className="text-gray-500 text-sm mt-1">Add a new delivery address</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}