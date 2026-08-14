"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export default function WhatsAppFloat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const whatsappUrl = "https://wa.me/919842344323?text=hello";

  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      {/* ── Popup ── */}
      {open && (
        <div className="fixed bottom-44 right-4 md:bottom-48 md:right-6 z-[9998] w-[300px] md:w-[320px] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
          {/* Header */}
          <div className="bg-[#075E54] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                <img
                  src="/uploads/sathyalogo.webp"
                  alt="Sathya Stores"
                  className="w-12 h-12 object-contain"
                />
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Sathya Stores</p>
                <p className="text-green-300 text-xs">Typically replies within minutes</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white text-xl leading-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Chat bubble */}
          <div className="bg-[#ECE5DD] px-4 py-5">
            <div className="bg-white rounded-xl rounded-tl-none px-4 py-3 shadow-sm max-w-[85%]">
              <p className="text-xs font-semibold text-[#075E54] mb-1">Sathya Stores</p>
              <p className="text-sm text-gray-700 leading-snug">
                👋 Hi there! How can we help you today? Connect with us to know more.
              </p>
            </div>
          </div>

          {/* Start Chat button */}
          <div className="bg-[#ECE5DD] px-4 pb-4">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20c05c] text-white font-bold py-3 rounded-full text-sm transition active:scale-[0.97]"
            >
              {/* WhatsApp icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="18" height="18" fill="white">
                <path d="M16 0C7.163 0 0 7.163 0 16c0 2.833.741 5.526 2.041 7.872L0 32l8.347-2.004A15.93 15.93 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.267 13.267 0 0 1-6.757-1.845l-.485-.287-5.017 1.205 1.241-4.872-.317-.499A13.267 13.267 0 0 1 2.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.878c-.398-.199-2.354-1.162-2.72-1.295-.366-.133-.632-.199-.898.199-.266.398-1.031 1.295-1.264 1.561-.232.266-.465.299-.863.1-.398-.199-1.681-.619-3.203-1.977-1.184-1.057-1.982-2.362-2.215-2.76-.232-.398-.025-.613.175-.811.179-.178.398-.465.597-.698.199-.232.266-.398.398-.664.133-.266.066-.498-.033-.697-.1-.199-.898-2.166-1.23-2.965-.324-.779-.653-.673-.898-.686l-.765-.013c-.266 0-.697.1-1.063.498-.366.398-1.396 1.362-1.396 3.322s1.43 3.852 1.629 4.118c.199.266 2.815 4.298 6.822 6.029.953.412 1.697.657 2.277.841.957.304 1.828.261 2.516.158.767-.114 2.354-.962 2.686-1.891.332-.929.332-1.726.232-1.891-.1-.165-.366-.265-.764-.464z" />
              </svg>
              Start Chat
            </a>
          </div>
        </div>
      )}

      {/* ── Floating Button ── */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-20 right-4 md:bottom-24 md:right-6 z-[9999] flex items-center gap-2 bg-[#25D366] hover:bg-[#20c05c] text-white font-bold px-4 py-3 md:px-5 md:py-3.5 rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
        aria-label="Chat with Us on WhatsApp"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-5 h-5 md:w-5 md:h-5 flex-shrink-0" fill="white">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 2.833.741 5.526 2.041 7.872L0 32l8.347-2.004A15.93 15.93 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0zm0 29.333a13.267 13.267 0 0 1-6.757-1.845l-.485-.287-5.017 1.205 1.241-4.872-.317-.499A13.267 13.267 0 0 1 2.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.878c-.398-.199-2.354-1.162-2.72-1.295-.366-.133-.632-.199-.898.199-.266.398-1.031 1.295-1.264 1.561-.232.266-.465.299-.863.1-.398-.199-1.681-.619-3.203-1.977-1.184-1.057-1.982-2.362-2.215-2.76-.232-.398-.025-.613.175-.811.179-.178.398-.465.597-.698.199-.232.266-.398.398-.664.133-.266.066-.498-.033-.697-.1-.199-.898-2.166-1.23-2.965-.324-.779-.653-.673-.898-.686l-.765-.013c-.266 0-.697.1-1.063.498-.366.398-1.396 1.362-1.396 3.322s1.43 3.852 1.629 4.118c.199.266 2.815 4.298 6.822 6.029.953.412 1.697.657 2.277.841.957.304 1.828.261 2.516.158.767-.114 2.354-.962 2.686-1.891.332-.929.332-1.726.232-1.891-.1-.165-.366-.265-.764-.464z" />
        </svg>
        {/* Desktop/Tablet only text */}
        <span className="hidden md:inline text-sm">Chat with Us</span>
      </button>
    </>
  );
}
