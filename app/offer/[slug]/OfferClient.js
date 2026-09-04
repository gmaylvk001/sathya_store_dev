"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from '@iconify/react';

export default function OfferClient({ offer, products }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Breadcrumb */}
      <div className="bg-white py-3 border-b">
        <div className="container mx-auto px-4 lg:px-8 flex justify-end">
          <div className="text-sm text-gray-500 font-medium">
            <Link href="/" className="hover:text-red-600">HOME</Link>
            <span className="mx-2">/</span>
            <span className="uppercase">{offer.offerName}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 mt-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold text-red-600 uppercase">{offer.offerName}</h1>
          <div className="flex gap-2">
            <span className="bg-yellow-400 font-bold px-4 py-2 text-sm">BIG DISCOUNT</span>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-red-600 text-white font-bold px-4 py-2 text-sm hover:bg-red-700 transition"
            >
              Enquire Now
            </button>
          </div>
        </div>

        {/* Product Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {products.map((product) => (
              <div key={product._id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden group">
                <div className="p-4 flex justify-center items-center h-48 bg-white relative">
                  {product.primaryImage ? (
                    <Image
                      src={`/uploads/OfferProducts/${product.primaryImage}`}
                      alt={product.productName}
                      fill
                      className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  ) : (
                    <div className="text-gray-300 text-sm">No Image Available</div>
                  )}
                </div>
                <div className="p-4 text-center border-t border-gray-50">
                  <h3 className="text-sm font-medium text-gray-800 line-clamp-2 min-h-[40px] mb-2">{product.productName}</h3>
                  <div className="flex justify-center items-baseline gap-2 mb-4">
                    {product.price && (
                      <span className="text-gray-400 text-sm line-through">₹{parseFloat(product.price).toLocaleString()}</span>
                    )}
                    {product.specialPrice && (
                      <span className="text-gray-900 font-bold text-lg">₹{parseFloat(product.specialPrice).toLocaleString()}</span>
                    )}
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold w-full py-2 text-sm transition-colors"
                  >
                    KNOW MORE
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No products found for this offer yet.
          </div>
        )}
      </div>

      {/* Enquiry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white shadow-xl w-full max-w-md relative flex flex-col">
            {/* Close Button */}
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl leading-none"
            >
              &times;
            </button>

            {/* Modal Header */}
            <div className="px-4 py-3 text-center border-b border-gray-200">
              <h2 className="text-lg font-semibold text-red-600 mb-1">CONNECT TO STORE</h2>
              <p className="text-gray-500 text-xs">
                Fill in the form below. Our store manager will get in touch with you soon!
              </p>
            </div>

            {/* Modal Body */}
            <div className="px-5 py-3 flex-grow">
              <h3 className="font-semibold text-gray-800 text-[13px] mb-2">Leave Your Details For Us To Call You Back</h3>
              <form className="space-y-2">
                <div>
                  <input
                    type="text"
                    placeholder="Enquiry Type"
                    className="w-full border border-gray-300 rounded py-1.5 px-2 text-[13px] text-gray-700 bg-gray-100 focus:outline-none"
                    readOnly
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Name"
                    className="w-full border border-gray-300 rounded py-1.5 px-2 text-[13px] text-gray-700 focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full border border-gray-300 rounded py-1.5 px-2 text-[13px] text-gray-700 focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="Mobile"
                    className="w-full border border-gray-300 rounded py-1.5 px-2 text-[13px] text-gray-700 focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Select store near you"
                    className="w-full border border-gray-300 rounded py-1.5 px-2 text-[13px] text-gray-700 bg-gray-100 focus:outline-none"
                    readOnly
                  />
                </div>
                <div>
                  <textarea
                    placeholder="Remark"
                    rows="2"
                    className="w-full border border-gray-300 rounded py-1.5 px-2 text-[13px] text-gray-700 focus:outline-none focus:border-gray-400 resize-none"
                  ></textarea>
                </div>
                
                <div className="pt-1">
                  <h3 className="font-semibold text-gray-800 text-[13px] mb-1.5">Do You Have A Preferred Time For Us To Call You Back?</h3>
                  <input
                    type="text"
                    placeholder="10 - 12AM"
                    className="w-full border border-gray-300 rounded py-1.5 px-2 text-[13px] text-gray-700 bg-gray-100 focus:outline-none"
                    readOnly
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      // Prevent actual submission for now since user requested design only
                      setIsModalOpen(false);
                    }}
                    className="bg-[#d72828] hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded text-sm tracking-wide"
                  >
                    SUBMIT
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
