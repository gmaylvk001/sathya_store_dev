import Link from "next/link";
import { Icon } from "@iconify/react";

export default function LocationComingSoon() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4">
      <div className="text-center max-w-2xl mx-auto">
        {/* Icon Container */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center relative">
            <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-25"></div>
            <Icon icon="mdi:map-marker-outline" className="w-12 h-12 text-[#ED1C24]" />
          </div>
        </div>

        {/* Text Content */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
          Store Locator <span className="text-[#ED1C24]">Coming Soon</span>
        </h1>
        
        <p className="text-lg text-gray-600 mb-10 leading-relaxed max-w-lg mx-auto">
          We're currently building a seamless experience to help you find our stores easily. 
          Check back shortly to explore our locations!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="https://sathya.adtarbo.com/stores"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#ED1C24] hover:bg-[#C4161D] text-white px-8 py-3.5 rounded-full font-medium transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <Icon icon="mdi:map-marker" className="w-5 h-5" />
            Go to Store Locator
          </a>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-3.5 rounded-full font-medium transition-all"
          >
            <Icon icon="mdi:arrow-left" className="w-5 h-5" />
            Back to Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
