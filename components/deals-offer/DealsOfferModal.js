"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { FiX } from "react-icons/fi";
import { getOfferStatus, calculateCountdown, resolveImageUrl } from "@/lib/offerTimerHelper";

export default function DealsOfferModal({
  isOpen,
  onClose,
  timer,
  onTimerExpire,
}) {
  const [mounted, setMounted] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1-second ticking live countdown
  useEffect(() => {
    if (!isOpen) return;
    setNowMs(Date.now());
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Handle ESC key to dismiss modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen && mounted) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, mounted]);

  const offerStatus = useMemo(() => getOfferStatus(timer, nowMs), [timer, nowMs]);
  const timeUnits = useMemo(() => calculateCountdown(offerStatus.diffMs), [offerStatus.diffMs]);

  // Trigger optional callback when timer expires / transitions
  useEffect(() => {
    if (offerStatus.diffMs <= 0 && onTimerExpire) {
      onTimerExpire();
    }
  }, [offerStatus.diffMs, onTimerExpire]);

  if (!mounted || !isOpen || !timer) return null;

  // Resolve banner image (dealsPopupImage -> topBanner -> fallback)
  const rawImg =
    timer.dealsPopupImage ||
    timer.popup_image_url ||
    timer.topBanner ||
    timer.top_banner_url ||
    null;

  const resolvedImg = resolveImageUrl(rawImg, "topbanner");
  const fallbackImg = "/uploads/topbanner/deals-popup-1788955833206-Screenshot_2026-09-09_173902.png";
  const displayImg = imgError || !resolvedImg ? fallbackImg : resolvedImg;

  // Resolve title
  const offerTitle =
    timer.offerHeading ||
    timer.offerTitle ||
    timer.offer_title ||
    "FULL MOON SALE 3";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="deals-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-[2px] animate-fadeIn transition-opacity duration-200"
      onClick={onClose}
    >
      {/* Modal Card */}
      <div
        className="bg-white rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.35)] w-full max-w-[520px] relative p-6 sm:p-8 flex flex-col items-center text-center transform transition-all duration-200 scale-100 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button 'X' */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:scale-95 transition-all p-1.5 rounded-full z-10 cursor-pointer"
        >
          <FiX size={20} strokeWidth={2.5} />
        </button>

        {/* Top Deals Popup Image (Matches Reference Screenshot) */}
        <div className="w-full max-w-[340px] h-20 sm:h-24 relative mb-3 flex items-center justify-center overflow-hidden">
          <Image
            src={displayImg}
            alt={offerTitle}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 280px, 340px"
            priority
            onError={() => setImgError(true)}
            unoptimized
          />
        </div>

        {/* Offer Title (e.g. FULL MOON SALE 3) */}
        <h2
          id="deals-modal-title"
          className="text-xl sm:text-2xl md:text-3xl font-black tracking-wide text-gray-900 uppercase font-sans mb-1"
        >
          {offerTitle}
        </h2>

        {/* Subtitle: "Starts In" (or "Ends In") */}
        <div className="text-[#ff7a00] font-bold text-base sm:text-lg mb-6 tracking-wide">
          {offerStatus.label}
        </div>

        {/* 4 Orange Countdown Blocks (Matches Screenshot Exactly) */}
        <div className="grid grid-cols-4 gap-2.5 sm:gap-4 w-full max-w-[440px] px-1 sm:px-2">
          {/* Days */}
          <div className="bg-[#ff7a00] rounded-2xl py-3 sm:py-4 px-1 flex flex-col items-center justify-center shadow-lg shadow-orange-500/25">
            <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-none mb-1 font-sans">
              {timeUnits.days}
            </span>
            <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-wider">
              DAYS
            </span>
          </div>

          {/* Hours */}
          <div className="bg-[#ff7a00] rounded-2xl py-3 sm:py-4 px-1 flex flex-col items-center justify-center shadow-lg shadow-orange-500/25">
            <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-none mb-1 font-sans">
              {timeUnits.hours}
            </span>
            <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-wider">
              HOURS
            </span>
          </div>

          {/* Minutes */}
          <div className="bg-[#ff7a00] rounded-2xl py-3 sm:py-4 px-1 flex flex-col items-center justify-center shadow-lg shadow-orange-500/25">
            <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-none mb-1 font-sans">
              {timeUnits.minutes}
            </span>
            <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-wider">
              MINUTES
            </span>
          </div>

          {/* Seconds */}
          <div className="bg-[#ff7a00] rounded-2xl py-3 sm:py-4 px-1 flex flex-col items-center justify-center shadow-lg shadow-orange-500/25">
            <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-none mb-1 font-sans">
              {timeUnits.seconds}
            </span>
            <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-wider">
              SECONDS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
