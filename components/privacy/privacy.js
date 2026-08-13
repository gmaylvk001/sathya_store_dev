"use client";
import React, { useState, useEffect } from "react";
import Link from 'next/link';
import { FiShield, FiLock, FiMail, FiCookie } from 'react-icons/fi';
import { FaCookieBite } from 'react-icons/fa';
import { IoIosInformationCircle } from "react-icons/io";
import { MdOutlineSecurity } from "react-icons/md";
import { MdPolicy } from "react-icons/md";
import { MdOutlineCollectionsBookmark } from "react-icons/md";


const PrivacyPolicy = () => {

    const [currentDate, setCurrentDate] = useState('');
    
    useEffect(() => {
        // This will only run on client side after hydration
        setCurrentDate(new Date().toLocaleDateString());
    }, []);
    return (

        <div>
            {/* 🟠 About us Header Bar */}
            <div className="bg-red-50 py-6 px-8 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Privacy Policy</h2>
                    <div className="flex items-center space-x-2">
                        <Link href="/" className="text-gray-600 hover:text-[#d72828]">🏠 Home</Link>
                            <span className="text-gray-500">›</span>
                            <span className="text-[#d72828] font-semibold">Privacy policy</span>
                    </div>
            </div>

            <div className="bg-gray-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8 animate-fade-in">
                 <div className="max-w-9xl mx-auto ">
                    {/* Header Section */}
                    <div className="text-center mb-16 animate-fade-in-up">
                        <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiShield className="text-[#d72828] text-3xl" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-customBlue mb-4">Privacy Policy</h1>
                            {currentDate && (
                                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                                    Last updated: {currentDate}
                                </p>
                            )}
                    </div>

                    {/* Policy Content */}
                    <div className=" rounded-xl shadow-md overflow-hidden animate-fade-in-up delay-100  bg-gradient-to-br from-red-50 to-indigo-50">
                        {/* Introduction */}
                        <div className="p-8 border-b border-gray-100">
                            <h2 className="text-2xl font-bold text-customBlue mb-4 flex items-center gap-2">
                                <FiLock className="text-customBlue" />Your Privacy Matters
                            </h2>
                            <p className="text-gray-600 mb-4">
                                    This privacy policy sets out how Sathya Stores uses and protects any 
                                    information that you give when using this website.
                            </p>
                            <p className="text-gray-600">
                                    Sathya Stores is committed to ensuring that your privacy is protected. 
                                    Should we ask you to provide certain information by which you can be identified when using 
                                    this website, you can be assured that it will only be used in accordance with this privacy 
                                    statement.
                            </p>
                        </div>

                        {/* Policy Updates */}
                        <div className="p-8 border-b border-gray-100 bg-red-50/30">
                        <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2"><MdPolicy className="text-2xl" />
                            Policy Updates
                       </h3>

                                <p className="text-gray-600">
                                    Sathya Stores may change this policy from time to time by updating 
                                    this page. You should check this page periodically to ensure you're happy with any changes.
                                </p>
                         </div>

                        {/* Information Collection */}
                        <div className="p-8 border-b border-gray-100">
                            <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2"><IoIosInformationCircle className="text-2xl" />Information We Collect</h3>
                                <p className="text-gray-600 mb-4">
                                    We may collect the following information:
                                </p>
                                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                                    <li className="animate-fade-in-right delay-200">Name and job title</li>
                                    <li className="animate-fade-in-right delay-300">Contact information including email address</li>
                                    <li className="animate-fade-in-right delay-400">Demographic information such as postcode, preferences and interests</li>
                                    <li className="animate-fade-in-right delay-500">Other information relevant to customer surveys and/or offers</li>
                                </ul>
                        </div>

                        {/* Use of Information */}
                        <div className="p-8 border-b border-gray-100 bg-red-50/30">
                            <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2"><MdOutlineCollectionsBookmark className="text-2xl"/>How We Use Your Information</h3>
                                <p className="text-gray-600 mb-4">
                                    We require this information to understand your needs and provide better service, 
                                    and in particular for:
                                </p>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {[
                                        "Internal record keeping",
                                        "Improving our products and services",
                                        "Periodic promotional emails",
                                        "Market research contact",
                                        "Website customization",
                                        "Special offers information"
                                    ].map((item, index) => (
                                        <div 
                                            key={index} 
                                            className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 animate-fade-in-up"
                                            style={{ animationDelay: `${200 + (index * 100)}ms` }}
                                        >
                                            {item}
                                        </div>
                                    ))}
                                </div>
                        </div>

                        {/* Security */}
                        <div className="p-8 border-b border-gray-100">
                            <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center gap-2"> <MdOutlineSecurity className="text-2xl"/>Data Security</h3>
                                <p className="text-gray-600">
                                    We are committed to ensuring your information is secure. To prevent unauthorized access 
                                    or disclosure, we have implemented suitable physical, electronic and managerial procedures.
                                </p>
                        </div>

                        {/* Cookies */}
                        <div className="p-8 border-b border-gray-100 bg-red-50/30">
                            <h3 className="text-xl font-semibold text-customBlue mb-3 flex items-center gap-2">
                                <FaCookieBite className="text-customBlue" />How We Use Cookies
                            </h3>
                            <p className="text-gray-600 mb-4">
                                    A cookie is a small file which asks permission to be placed on your computer's hard drive. 
                                    Once you agree, the file is added and the cookie helps analyze web traffic or lets you know 
                                    when you visit a particular site.
                            </p>
                            <p className="text-gray-600 mb-4">
                                    We use traffic log cookies to identify which pages are being used. This helps us analyze 
                                    data about webpage traffic and improve our website to tailor it to customer needs. We only 
                                    use this information for statistical analysis purposes.
                            </p>
                            <p className="text-gray-600">
                                    You can choose to accept or decline cookies. Most web browsers automatically accept cookies, 
                                    but you can usually modify your browser setting to decline cookies if you prefer.
                            </p>
                            </div>

                            {/* Controlling Personal Info */}
                            <div className="p-8">
                                <h3 className="text-xl font-semibold text-customBlue mb-3 flex items-center gap-2">
                                    <FiMail className="text-customBlue" />
                                    Controlling Your Personal Information
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    You may choose to restrict the collection or use of your personal information:
                                </p>
                                <ul className="list-disc pl-5 space-y-2 text-gray-600 mb-6">
                                    <li>Look for opt-out boxes in forms to prevent direct marketing use</li>
                                    <li>Change previous marketing consent by emailing us at customercare@sathya.store</li>
                                    <li>We won't sell/distribute your information without your permission</li>
                                </ul>
                                <p className="text-gray-600">
                                    If you believe any information we hold is incorrect, please email us at the above address. 
                                    We will promptly correct any information found to be incorrect.
                                </p>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="mt-12 bg-white rounded-xl shadow-md p-8 text-center animate-fade-in-up delay-300">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">
                                Contact Us About Privacy
                            </h3>
                            <p className="text-gray-600 mb-6">
                                For any questions about our privacy policy, please contact:
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
        );
    };

export default PrivacyPolicy;