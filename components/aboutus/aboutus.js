'use client';
import Image from 'next/image';
import Link from 'next/link';
import { BsFillAwardFill } from "react-icons/bs";
import { FaUserGroup } from "react-icons/fa6";
import { GiNetworkBars } from "react-icons/gi";
import { FaThumbsUp } from "react-icons/fa";
import { FiHeadphones,  FiSettings,FiTag, FiTarget, FiMapPin, FiAward, FiUsers,FiUser,  FiMonitor, FiSpeaker, FiShoppingCart, FiStar, FiHome, FiBriefcase, FiPackage, FiCreditCard, FiTrendingUp, FiGift } from 'react-icons/fi';
import { useRouter } from "next/navigation";
import { useModal } from "@/context/ModalContext";

const AboutUs = () => {
    const router = useRouter();
    const { openLiveDemoModal } = useModal();
    const chooseData = [{
        image: "/uploads/productss.png",
        icon: <FiMapPin />,
        title: "100% Genuine Products",
        desc: "Authorized retailer for leading electronics and home appliance brands."
    },
    {
        image: "/uploads/wide_product.png",
        icon: <FiShoppingCart />,
        title: "Wide Product Range",
        desc: "5000+ products including TVs, refrigerators, ACs and mobiles."
    },
    {
        image: "/uploads/customer_first_approach.png",
        icon: <FiUsers />,
        title: "Customer First Approach",
        desc: "Trusted by families for honest advice and better service."
    },
    {
        image: "/uploads/47_store.png",
        icon: <FiHome />,
        title: "427+ Store Network",
        desc: "Always near you with 427+ showrooms across South India."
    },
    {
        image: "/uploads/flexiable_finance_options.png",
        icon: <FiCreditCard />,
        title: "Flexible Finance Options",
        desc: "Easy EMI & finance solutions from leading banks."
    },
    {
        image: "/uploads/realiable_support.png",
        icon: <FiHeadphones />,
        title: "Reliable Support",
        desc: "Before & after purchase support, installation & service."
    }];

    const storeExperience = [{
        image: "/uploads/tv_zone.png",
        title: "TV Experience Zone",
        },
        {
            image: "/uploads/kitchen_appliances.png",
            title: "Kitchen Appliance Zone",
        },
        {
            image: "/uploads/ref_zone.png",
            title: "Refrigerator Zone",
        },
        {
            image: "/uploads/ac_zone.png",
            title: "AC Experience Zone",
        },
        {
            image: "/uploads/customer_interaction.png",
            title: "Customer Interaction",
        },
        {
            image: "/uploads/fast_safe_delivery.png",
            title: "Fast & Safe Delivery",
        },
    ];

    const brands = [
        "/uploads/Brands/brand_1778758654308.png",
        "/uploads/Brands/brand_1778764524439.png",
        "/uploads/Brands/brand_1778994553980.png",
        "/uploads/Brands/brand_1778996291806.png",
        "/uploads/Brands/brand_1779078793650.png",
        "/uploads/Brands/panasonic.jpg",
        "/uploads/Brands/brand_1778764090037.png",
        "/uploads/Brands/brand-1754720247059.webp",
        "/uploads/Brands/VIw4LetLiEoOuqOk.webp",
        "/uploads/Brands/brand-1754545986132.webp",
    ];

    return (
        <>
         {/* 🟠 About us Header Bar */}
            <div className="bg-red-50 py-6 px-4 md:px-8 lg:px-10 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                <Link href="/" className="text-gray-600 hover:text-[#d72828]">🏠 Home</Link>
                <span className="text-gray-500">›</span>
                <span className="text-[#d72828] font-semibold">About us</span>
                </div>
            </div>
<section className="w-full">
    {/* Desktop/Laptop - overlay layout */}
    <div className="relative w-full hidden lg:block">
    <Image 
        src="/uploads/aboutus-banner1.png" 
        width={1920}
        height={650}
        alt="Sathya Stores Store" 
        className="relative z-0 w-full h-auto block"
        priority
    />
    {/* Adjusted padding to pull content directly to the margin edge */}
    <div className="absolute inset-0 z-[2] flex items-center px-4 md:px-8 lg:px-10">
        <div className="w-[50%] lg:w-[45%] xl:w-[40%] 2xl:w-[35%]">
            <p className="text-sm xl:text-base 2xl:text-lg text-gray-500 mb-1">Tamil Nadu's</p>
            <h1 className="text-2xl lg:text-3xl xl:text-4xl 2xl:text-6xl font-bold leading-tight text-[#0a1d56]">Most Trusted <br />Electronics Destination</h1>
           <h2 className="text-2xl lg:text-3xl xl:text-4xl 2xl:text-6xl font-bold text-[#d72828] mt-2">Since 1987</h2>
            <p className="mt-2 text-gray-600 text-sm xl:text-base 2xl:text-xl leading-7 2xl:leading-9">Sathya Agencies Limited is one of South India&apos;s largest consumer durables and electronics retailers, with 427+ stores across Tamil Nadu, Andhra Pradesh, Kerala, Karnataka and Puducherry.</p>
            <div className="flex flex-wrap gap-3 mt-6">
                <button onClick={() => router.push("/location")} className="bg-[#d72828] text-white px-5 py-2.5 2xl:px-7 2xl:py-3 rounded-lg font-semibold text-sm 2xl:text-base flex items-center gap-2 hover:bg-[#1d45b8] transition">
                    <FiMapPin size={16} />
                    Explore Our Stores
                </button>
                <button onClick={() => router.push("/")} className="border border-[#d72828] text-[#d72828] px-5 py-2.5 2xl:px-7 2xl:py-3 rounded-lg font-semibold text-sm 2xl:text-base flex items-center gap-2 hover:bg-[#d72828] hover:text-white transition">
                    <FiShoppingCart size={16} />
                    Shop Now
                </button>
            </div>
        </div>
    </div>
</div>

    {/* Tablet/Mobile - stacked layout */}
    <div className="lg:hidden">
        <Image 
            src="/uploads/aboutus-banner.webp" 
            width={1920}
            height={650}
            alt="Sathya Stores Store" 
            className="w-full h-auto block"
            priority
        />
        {/* Matched responsive padding */}
        <div className="px-4 md:px-8 py-10 bg-gradient-to-b from-[#f5f8ff] to-white">
            <p className="text-sm text-gray-500 mb-1">Tamil Nadu's</p>
            <h1 className="text-2xl font-bold leading-tight text-[#0a1d56]">Most Trusted <br />Electronics Destination</h1>
            <h2 className="text-2xl font-bold text-[#d72828] mt-2">Since 1987</h2>
            <p className="mt-2 text-gray-600 text-sm leading-7">Sathya Agencies Limited is one of South India&apos;s largest consumer durables and electronics retailers, with 427+ stores across Tamil Nadu, Andhra Pradesh, Kerala, Karnataka and Puducherry.</p>
            <div className="flex flex-wrap gap-3 mt-6">
                <button onClick={() => router.push("/location")} className="bg-[#d72828] text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-[#1d45b8] transition">
                    <FiMapPin size={16} />
                    Explore Our Stores
                </button>
                <button onClick={() => router.push("/")} className="border border-[#d72828] text-[#d72828] px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-[#d72828] hover:text-white transition">
                    <FiShoppingCart size={16} />
                    Shop Now
                </button>
            </div>
        </div>
    </div>
</section>
        <div className="w-full max-w-full sm:max-w-[720px] md:max-w-[960px] lg:max-w-[1320px] xl:max-w-[1520px] 2xl:max-w-[1680px] mx-auto px-0 sm:px-3 md:px-6 lg:px-8">
           
            {/* Statistics Bar (Kept constraints strictly as requested) */}
            <section className="-mt-8 relative z-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="bg-white rounded-2xl shadow-lg p-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                            {[{
                                count: "25+",
                                label: (<>Years of <br />Excellence</>),
                                icon: <FiAward size={32} className="text-[#d72828]" />
                            },
                            {
                                count: "427+",
                                label: (<>Showrooms <br />Across Tamil Nadu </>),
                                icon: <FiHome size={32} className="text-[#d72828]" />
                            },
                            {
                                count: "17+",
                                label: (<>Cities <br /> We Serve</>),
                                icon: <FiMapPin size={32} className="text-[#d72828]" />
                            },
                            {
                                count: "50 Lakh+",
                                label: (<>Happy <br /> Customers</>),
                                icon: <FiUsers size={32} className="text-[#d72828]" />
                            },
                            {
                                count: "30+",
                                label: (<>Leading <br />Brand Partners</>),
                                icon: <FiBriefcase size={32} className="text-[#d72828]" />
                            },
                            {
                                count: "5000+",
                                label: (<>Products <br /> Across Categories</>),
                                icon: <FiPackage size={32} className="text-[#d72828]" />
                            },].map((item, i) => (
                                <div key={i} className={`flex items-center gap-4 px-4 py-0 ${ i !== 5 ? "lg:border-r border-gray-200" : ""}`}>
                                    {/* Left Icon */}
                                    <div className="flex-shrink-0">{item.icon}</div>
                                    {/* Right Content */}
                                    <div>
                                        <h3 className="text-2xl font-bold text-[#d72828]">{item.count}</h3>
                                        <p className="text-gray-600 text-sm leading-5">{item.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Why Choose Sathya Stores (Stretched to margins) */}
            <section className="py-6 bg-white">
                <div className="w-full px-4 md:px-8 lg:px-10">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-[#2b3a79]">Why Customers Choose Sathya Stores?</h2>
                        <div className="w-12 h-1 bg-[#d72828] mx-auto mt-2 rounded-full"></div>
                    </div>
                    <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {chooseData.map((item, i) => (
                            <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition duration-300">
                                {/* Image */}
                                <div className="relative">
                                    <img src={item.image} alt={item.title} className="w-full h-30 object-cover"/>
                                    {/* Floating Icon */}
                                    <div className="absolute -bottom-4 left-4 w-9 h-9 rounded-full bg-white border-2 border-[#d72828] flex items-center justify-center text-[#d72828] shadow-md">{item.icon}</div>
                                </div>

                                {/* Content */}
                                <div className="pt-7 px-3 pb-4 text-center">
                                    <h3 className="font-bold text-[#2b3a79] text-sm leading-5 min-h-[40px]">{item.title}</h3>
                                    <p className="text-[12px] text-gray-600 mt-1 leading-5">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            
            {/* Sathya Stores Live Demo */}
            <section className="py-6 bg-white">
                <div className="w-full px-4 md:px-8 lg:px-10">
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 rounded-2xl border border-[#c4b5fd] bg-gradient-to-br from-[#f8f6ff] via-[#f5f7ff] to-[#eef3ff] overflow-hidden px-5 sm:px-8 pt-5 sm:pt-6 pb-0">
                        <div className="flex-1 min-w-0 py-2 sm:py-4 text-center sm:text-left">
                            <h2 className="text-[#0a1d56] font-extrabold text-xl sm:text-2xl leading-tight mb-2">
                                Experience Sathya Stores From Anywhere
                            </h2>
                            <p className="text-sm sm:text-[15px] text-gray-600 leading-relaxed mb-4 max-w-xl">
                                Can&apos;t visit one of our showrooms? Let us bring the store to you.
                            </p>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-5 text-left max-w-lg mx-auto sm:mx-0">
                                {[
                                    "Live Product Demonstration",
                                    "Compare Products",
                                    "Expert Buying Advice",
                                    "Google Meet / WhatsApp Video",
                                ].map((item) => (
                                    <li key={item} className="flex items-center gap-2 text-sm font-medium text-[#0a1d56]">
                                        <span className="text-[#d72828] font-bold shrink-0">✓</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <button
                                type="button"
                                onClick={openLiveDemoModal}
                                className="inline-flex items-center justify-center gap-2 bg-[#5B4CF5] hover:bg-[#4a3de0] text-white text-sm font-bold py-3 px-6 rounded-xl transition-colors"
                            >
                                Book Sathya Stores Live Demo
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </div>
                        <div className="shrink-0 w-[150px] sm:w-[180px] md:w-[210px] self-end">
                            <img
                                src="/uploads/live-video-phone.png"
                                alt="Sathya Stores Live Demo"
                                className="w-full h-auto object-contain bg-transparent"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Store Experience Section (Stretched to margins) */}
            <section className="pb-8 bg-white">
                <div className="w-full px-4 md:px-8 lg:px-10">
                    <div className="text-center mb-5">
                        <h2 className="text-2xl font-bold text-[#2b3a79]">Experience Sathya Stores</h2>
                        <div className="w-12 h-1 bg-[#d72828] mx-auto mt-2 rounded-full"></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">

                    {storeExperience.map((item, i) => (
                        <div
                        key={i}
                        className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
                        >

                        {/* Image */}
                        <div className="overflow-hidden">
                            <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-30 object-cover hover:scale-105 transition duration-300"
                            />
                        </div>

                        {/* Title */}
                        <div className="py-2 px-2">
                            <h3 className="text-[12px] font-semibold text-center text-[#2b3a79] leading-4">
                            {item.title}
                            </h3>
                        </div>

                        </div>
                    ))}

                    </div>
                </div>
            </section>

            {/* Company Journey Timeline & Subsequent Blocks (Stretched to margins) */}
            <section className="py-12">
                <div className="w-full px-4 md:px-8 lg:px-10">
                    
                    {/* Row 1 */}
                   <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-5 mb-5">
                        {/* Journey (Added shadow-lg) */}
                        <div className="bg-white rounded-2xl p-6 border shadow-lg">
                            <h2 className="text-2xl font-bold text-[#1f3bb3] mb-8">Our Journey</h2>
                            <div className="relative">
                                {/* Connecting Line */}
                               <div className="hidden md:block absolute top-7 left-[8%] right-[8%] h-[3px] bg-gradient-to-r from-[#d72828] via-purple-400 to-orange-400"></div>
                               <div className="grid grid-cols-3 md:grid-cols-6 gap-2 relative z-10">
                                    {[
                                        {
                                            year: "1987",
                                            title: "Our Beginning",
                                            desc: "Established in Tuticorin, Tamil Nadu as a proprietorship venture.",
                                            icon: <FiHome size={22} />,
                                            color: "bg-[#d72828]",
                                        },
                                        {
                                            year: "1990",
                                            title: "Sathya Agencies",
                                            desc: "Expanded as a partnership firm under the name Sathya Agencies.",
                                            icon: <FiBriefcase size={22} />,
                                            color: "bg-orange-500",
                                        },
                                        {
                                            year: "2005",
                                            title: "Incorporation",
                                            desc: "Incorporated as Sathya Agencies Limited.",
                                            icon: <FiTrendingUp size={22} />,
                                            color: "bg-green-500",
                                        },
                                        {
                                            year: "2015",
                                            title: "Growing Network",
                                            desc: "Expanded retail presence across South India.",
                                            icon: <FiAward size={22} />,
                                            color: "bg-purple-500",
                                        },
                                        {
                                            year: "2020",
                                            title: "Digital Transformation",
                                            desc: "Enhanced online presence and customer experience.",
                                            icon: <FiMapPin size={22} />,
                                            color: "bg-[#d72828]",
                                        },
                                        {
                                            year: "2026",
                                            title: "427+ Stores",
                                            desc: "Operating across Tamil Nadu, Andhra Pradesh, Kerala, Karnataka and Puducherry.",
                                            icon:  <FiGift size={22} />,
                                            color: "bg-orange-500",
                                        },
                                    ].map((item, i) => (
                                        <div key={i} className="text-center">
                                            <div className={`w-14 h-14 mx-auto rounded-full ${item.color} border-4 border-white shadow-lg flex items-center justify-center text-white`}>
                                                {item.icon}
                                            </div>
                                            <h4 className="text-[#1f3bb3] font-bold mt-3">{item.year}</h4>
                                            <p className="text-[12px] font-semibold">{item.title}</p>
                                            <p className="text-[10px] text-gray-500 mt-1">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Vision */}
                        <div className="bg-[#f7f9ff] rounded-xl border overflow-hidden shadow-lg p-5 md:p-6 flex flex-col justify-center">
                          <h3 className="text-xl font-bold text-[#2b3a79] mb-3">Our Vision</h3>
                          <p className="text-[12px] text-gray-600 leading-6">Sathya Agencies Limited brings world-class electronics and home appliances closer to every home across South India.</p>
                          <p className="text-[12px] text-gray-600 leading-6 mt-3">With 427+ stores and partnerships with 150+ leading brands, we combine trust, technology and customer experience.</p>
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5 items-start">
                        
                        {/* Tamil Nadu (Added shadow-lg) */}
                        <div className="bg-[#f7f9ff] rounded-xl border border-gray-200 p-4 lg:p-6 shadow-lg">
                            <h3 className="text-xl font-bold text-[#1f3bb3] mb-1">Sathya Stores Across Tamil Nadu</h3>
                            <p className="text-sm text-gray-600 mb-4">Serving customers across</p>
                           <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4 items-start">
                                {/* Locations */}
                                <div>
                                    <ul className="space-y-3 text-sm text-gray-700">
                                        <li className="flex gap-2">
                                            <span className="text-[#d72828]">📍</span>Coimbatore
                                        </li>

                                        <li className="flex items-center gap-2">
                                            <span className="text-[#d72828]">📍</span>Salem
                                        </li>

                                        <li className="flex items-center gap-2">
                                            <span className="text-[#d72828]">📍</span>Erode
                                        </li>

                                        <li className="flex items-center gap-2">
                                            <span className="text-[#d72828]">📍</span>Tirupur
                                        </li>

                                        <li className="flex items-center gap-2">
                                            <span className="text-[#d72828]">📍</span>Namakkal
                                        </li>

                                        <li className="flex items-center gap-2">
                                            <span className="text-[#d72828]">📍</span>Trichy
                                        </li>

                                        <li className="flex items-center gap-2">
                                            <span className="text-[#d72828]">📍</span>Dharmapuri
                                        </li>

                                        <li className="flex items-center gap-2">
                                            <span className="text-[#d72828]">📍</span>Krishnagiri
                                        </li>

                                        <li className="text-[#d72828] font-medium text-sm pt-1">
                                            <a href="/location">and many more...</a>
                                        </li>
                                    </ul>
                                </div>

                                {/* Map */}
                                <div className="flex justify-center">
                                <img src="/uploads/aboutus-map.png" alt="Sathya Stores Across Tamil Nadu" className="max-w-[200px] object-cover" />
                                          </div>
                            </div>
                        </div>

                        {/* Brand Partners (Added shadow-lg) */}
                        <div className="bg-white rounded-2xl border shadow-lg p-6 lg:p-9 h-full">
                            <h3 className="text-2xl font-bold text-[#1f3bb3] mb-2">Our Premium Brand Partners</h3>
                            <p className="text-gray-500 text-sm mb-5">Sathya Stores brings together the world's leading electronics and home appliance brands under one roof.</p>
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                                {brands.map((logo, i) => (
                                    <div key={i} className="h-16 bg-white border rounded-xl flex items-center justify-center hover:shadow-md transition">
                                        <img src={logo} alt="" className="max-h-8 object-contain"/>
                                    </div>
                                ))}
                            </div>
                            <div className="text-center mt-6">
                                <button className="bg-[#1f3bb3] text-white px-6 py-3 rounded-lg">View All Brands →</button>
                            </div>
                        </div>
                    </div>

                    {/* Row 3 */}
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        
                        {/* Team Banner (Added shadow-lg) */}
                        <div className="relative rounded-2xl overflow-hidden shadow-lg">
                            <img src="/uploads/drivenByPeople.png" alt="" className="w-full object-cover h-[320px] lg:h-full"/>

                            <div className="absolute inset-0 to-transparent"></div>

                            <div className="absolute left-6 top-6 text-[#ffffff] max-w-md ">
                            <h3 className="text-3xl font-bold mb-2">
                                Built on Trust. Driven by People.
                            </h3>

                            <p className="text-sm">
                                Meet the people behind Sathya Stores who believe
                                in customer happiness, innovation and excellence.
                            </p>
                            </div>
                        </div>

                        {/* Testimonials (Added shadow-lg) */}
                        <div className="bg-[#f7f9ff] rounded-2xl border shadow-lg p-4 lg:p-6 h-full">
                            <h3 className="text-xl font-bold text-center text-[#2b3a79] mb-6">What Our Customers Say</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    {
                                        name: "Ramesh Kumar",
                                        city: "Coimbatore",
                                        review: "Best place to buy electronics.",
                                        image: "/uploads/user1.jpg",
                                    },
                                    {
                                        name: "Priya Natarajan",
                                        city: "Chennai",
                                        review: "Wide range of products.",
                                        image: "/uploads/user2.jpg",
                                    },
                                    {
                                        name: "Karthik Vel",
                                        city: "Madurai",
                                        review: "Finance options are easy.",
                                        image: "/uploads/user3.jpg",
                                    },
                                ].map((item, i) => (
                                    <div key={i} className="border bg-white rounded-xl p-4 hover:shadow-md transition">
                                        <div className="text-yellow-500 mb-2 text-lg">★★★★★</div>
                                        <p className="text-sm text-gray-600 mb-5">"{item.review}"</p>
                                        {/* User Info */}
                                        <div className="flex items-center gap-3">
                                            {/* Option 2: If no image, use icon */}
                                            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-[#1f3bb3]">
                                                <FiUser size={20} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-[#1f3bb3] text-sm">{item.name}</p>
                                                <p className="text-xs text-gray-500 flex items-center gap-1">📍 {item.city}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </section>
        </div>
        </>
    );
};

export default AboutUs;