"use client";
import React, { useState, useEffect } from "react";
import Link from 'next/link';
import { FiFileText, FiBook, FiShield, FiMail, FiLink } from 'react-icons/fi';
import { MdOutlinePolicy, MdOutlineSecurity } from "react-icons/md";

const TermsAndConditions = () => {
  const [currentDate, setCurrentDate] = useState('');
  
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
  }, []);

  return (
    <div>
      {/* Header Bar */}
      <div className="bg-red-50 py-6 px-8 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Terms & Conditions</h2>
        <div className="flex items-center space-x-2">
          <Link href="/" className="text-gray-600 hover:text-[#d72828]">🏠 Home</Link>
          <span className="text-gray-500">›</span>
          <span className="text-[#d72828] font-semibold">Terms & Conditions</span>
        </div>
      </div>

      <div className="bg-gray-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-9xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16">
            <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiFileText className="text-[#d72828] text-3xl" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-customBlue mb-4">TERMS & CONDITIONS</h1>
            {currentDate && (
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Last updated: {currentDate}
              </p>
            )}
          </div>

          {/* Terms Content */}
          <div className="rounded-xl shadow-md overflow-hidden bg-gradient-to-br from-red-50 to-indigo-50">
            {/* Introduction */}
            <div className="p-8 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-customBlue mb-4 flex items-center gap-2">
                <FiBook className="text-customBlue" /> Website Terms
              </h2>
              <p className="text-gray-600 mb-4">
                The Website Owner, including subsidiaries and affiliates www.sathya.store provides the information contained on the website or any of the pages comprising the website www.sathya.store to visitors ("visitors") (cumulatively referred to as "you" or "your" hereinafter) subject to the terms and conditions set out in these website terms and conditions, the privacy policy and any other relevant terms and conditions, policies and notices which may be applicable to a specific section or module of the website.
              </p>
              <p className="text-gray-600 mb-4">
                Welcome to our website. If you continue to browse and use this website, you are agreeing to comply with and be bound by the following terms and conditions of use, which, together with our privacy policy, govern Sathya Stores relationship with you in relation to this website.
              </p>
              <p className="text-gray-600">
                The term Sathya Stores refers to the owner of the website whose registered/operational office is 383, 100 Feet Road, Gandhipuram, Coimbatore Tamilnadu 641012. The term 'you' refers to the user or viewer of our website.
              </p>
            </div>

            {/* Terms of Use */}
            <div className="p-8 border-b border-gray-100 bg-red-50/30">
              <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <MdOutlinePolicy className="text-2xl" />
                Terms of Use
              </h3>
              <p className="text-gray-600 mb-4">
                The use of this website is subject to the following terms of use:
              </p>
              <ul className="list-disc pl-5 space-y-3 text-gray-600">
                <li>The content of the pages of this website is for your general information and use only. It is subject to change without notice.</li>
                <li>Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, performance, completeness or suitability of the information and materials found or offered on this website for any particular purpose. You acknowledge that such information and materials may contain inaccuracies or errors and we expressly exclude liability for any such inaccuracies or errors to the fullest extent permitted by law.</li>
                <li>Your use of any information or materials on this website is entirely at your own risk, for which we shall not be liable. It shall be your own responsibility to ensure that any products, services or information available through this website meet your specific requirements.</li>
                <li>This website contains material which is owned by or licensed to us. This material includes, but is not limited to, the design, layout, look, appearance and graphics. Reproduction is prohibited other than in accordance with the copyright notice, which forms part of these terms and conditions.</li>
                <li>All trademarks reproduced in this website which are not the property of, or licensed to, the operator are acknowledged on the website.</li>
                <li>Unauthorized use of this website may give rise to a claim for damages and/or be a criminal offense.</li>
                <li>From time to time this website may also include links to other websites. These links are provided for your convenience to provide further information.</li>
                <li>You may not create a link to this website from another website or document without Sathya Stores' prior written consent.</li>
                <li>Your use of this website and any dispute arising out of such use of the website is subject to the laws of India or other regulatory authority.</li>
                <li>We, as a merchant shall be under no liability whatsoever in respect of any loss or damage arising directly or indirectly out of the decline of authorization for any Transaction, on Account of the Cardholder having exceeded the preset limit mutually agreed by us with our acquiring bank from time to time.</li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="p-8">
              <h3 className="text-xl font-semibold text-customBlue mb-3 flex items-center gap-2">
                <FiMail className="text-customBlue" />
                Contact Information
              </h3>
              <p className="text-gray-600 mb-6">
                For any questions about our terms and conditions, please contact us at:
              </p>
              <a 
                href="mailto:customercare@sathya.store" 
                className="inline-block bg-[#d72828] hover:bg-[#d72828] text-white font-medium py-3 px-6 rounded-lg transition-colors duration-300"
              >
                customercare@sathya.store
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;