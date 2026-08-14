"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRegion } from "@/context/RegionContext";
import { FiSearch, FiX } from "react-icons/fi";

// Bespoke Line-Art Icons for the 4 South Indian States
const StateLineArt = ({
  type,
  isSelected,
  className = "w-11 h-11 sm:w-12 sm:h-12",
}) => {
  const color = isSelected ? "#dc2626" : "#4b5563";

  switch (type) {
    case "gopuram":
      // Tamil Nadu - Dravidian Temple Gopuram Line Art
      return (
        <svg
          viewBox="0 0 64 64"
          fill="none"
          stroke={color}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M30 4H34M32 2V6M28 6H36" />
          <path d="M26 8H38L36 14H28L26 8Z" />
          <path d="M30 10H34M32 8V12" />
          <path d="M24 14H40L38 22H26L24 14Z" />
          <path d="M28 17H36M32 14V20" />
          <path d="M22 22H42L40 32H24L22 22Z" />
          <path d="M26 27H38M32 22V30M28 25V29M36 25V29" />
          <path d="M20 32H44L42 44H22L20 32Z" />
          <path d="M24 38H40M32 32V42M27 35V41M37 35V41" />
          <path d="M16 44H48V56H16V44Z" />
          <path d="M28 56V48C28 46 30 45 32 45C34 45 36 46 36 48V56" />
          <path d="M12 56H52M10 59H54" />
        </svg>
      );

    case "houseboat":
      // Kerala - Backwaters Houseboat & Palm Tree Line Art
      return (
        <svg
          viewBox="0 0 64 64"
          fill="none"
          stroke={color}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M18 42C17 30 20 18 24 10" strokeWidth="1.6" />
          <path d="M24 10C18 9 10 13 8 20" />
          <path d="M24 10C21 5 15 4 10 7" />
          <path d="M24 10C27 4 34 5 36 10" />
          <path d="M24 10C28 13 32 18 31 24" />
          <path d="M24 10C21 15 18 22 19 25" />
          <path d="M12 46C20 47 44 47 52 46C56 46 58 48 56 51C52 56 42 57 32 57C22 57 12 56 8 51C6 48 8 46 12 46Z" />
          <path d="M20 46C20 34 26 26 38 26C46 26 50 33 50 46H20Z" />
          <path d="M26 37H32V42H26V37Z" />
          <path d="M36 37H42V42H36V37Z" />
          <path d="M6 60C14 59 18 61 26 60M34 60C42 59 48 61 58 60" />
        </svg>
      );

    case "palace":
      // Karnataka - Mysore Palace / Vidhana Soudha Line Art
      return (
        <svg
          viewBox="0 0 64 64"
          fill="none"
          stroke={color}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M32 4V8M30 8H34" />
          <path d="M26 20C26 13 32 9 32 9C32 9 38 13 38 20H26Z" />
          <path d="M18 16V18M16 26C16 20 20 18 20 18C20 18 24 20 24 26H16Z" />
          <path d="M46 16V18M40 26C40 20 44 18 44 18C44 18 48 20 48 26H40Z" />
          <path d="M14 26H50V36H14V26Z" />
          <path d="M20 36V26M28 36V26M36 36V26M44 36V26" />
          <path d="M10 36H54V54H10V36Z" />
          <path d="M28 54V42C28 40 30 38 32 38C34 38 36 40 36 42V54" />
          <path d="M18 54V44M23 54V44M41 54V44M46 54V44" />
          <path d="M8 54H56M6 57H58" />
        </svg>
      );

    case "stupa":
      // Andhra Pradesh - Amaravati Stupa / Heritage Line Art
      return (
        <svg
          viewBox="0 0 64 64"
          fill="none"
          stroke={color}
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M32 4V12M28 7H36M25 10H39" />
          <path d="M27 12H37V16H27V12Z" />
          <path d="M18 38C18 24 24 16 32 16C40 16 46 24 46 38H18Z" />
          <path d="M15 38H49V46H15V38Z" />
          <path d="M21 38V46M27 38V46M32 38V46M37 38V46M43 38V46" />
          <path d="M12 46H52V56H12V46Z" />
          <path d="M26 56V49C26 47 29 46 32 46C35 46 38 47 38 49V56" />
          <circle cx="32" cy="28" r="2.5" />
          <path d="M8 56H56M6 59H58" />
        </svg>
      );

    default:
      return null;
  }
};

export default function RegionSelectorModal() {
  const {
    selectedRegion,
    allRegions,
    isRegionModalOpen,
    isDetecting,
    detectionError,
    closeRegionModal,
    selectRegion,
    detectLocation,
  } = useRegion();

  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredRegionId, setHoveredRegionId] = useState(null);
  const [showAllCities, setShowAllCities] = useState(false);
  const modalRef = useRef(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isRegionModalOpen) {
        closeRegionModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRegionModalOpen, closeRegionModal]);

  // Lock body scroll completely when modal is open without layout shift
  useEffect(() => {
    if (isRegionModalOpen) {
      const scrollBarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }
      setHoveredRegionId(null);
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      setSearchQuery("");
      setShowAllCities(false);
      setHoveredRegionId(null);
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isRegionModalOpen]);

  // Active hovered region object
  const activeHoveredRegion = useMemo(() => {
    if (!hoveredRegionId) return null;
    return allRegions.find((r) => r.id === hoveredRegionId) || null;
  }, [allRegions, hoveredRegionId]);

  // Search filter across the 4 states and their cities
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    const matches = [];
    allRegions.forEach((region) => {
      const stateMatch =
        region.name.toLowerCase().includes(q) ||
        region.nativeName.toLowerCase().includes(q) ||
        region.code.toLowerCase().includes(q);

      region.popularCities.forEach((city) => {
        if (city.toLowerCase().includes(q) || stateMatch) {
          matches.push({
            city,
            region,
          });
        }
      });
    });

    return matches;
  }, [allRegions, searchQuery]);

  // Handle city selection
  const handleSelectCity = (region, city) => {
    selectRegion(region);
    closeRegionModal();
  };

  if (!isRegionModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex justify-center items-start pt-5 sm:pt-8 p-3 sm:p-4 overflow-hidden select-none">
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeRegionModal}
      />

      {/* Main Small & Compact Modal Card */}
      <div
        ref={modalRef}
        className="relative w-full max-w-[540px] bg-white rounded-xl shadow-2xl overflow-hidden z-10 border border-gray-100/90 transition-all duration-300 p-5 sm:p-6 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow:
            "0 20px 50px -10px rgba(0, 0, 0, 0.35), 0 0 1px 1px rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* Top Search Input with Close Button */}
        <div className="relative flex items-center w-full">
          <FiSearch className="absolute left-3.5 sm:left-4 text-gray-400 text-base sm:text-lg pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for your city"
            autoFocus
            className="w-full pl-10 sm:pl-11 pr-10 py-2.5 bg-white border border-gray-300 hover:border-gray-400 focus:border-gray-400 rounded-lg text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none transition-colors"
          />
          <button
            type="button"
            onClick={() => {
              if (searchQuery) {
                setSearchQuery("");
              } else {
                closeRegionModal();
              }
            }}
            className="absolute right-3 text-gray-400 hover:text-gray-600 p-1 transition-colors cursor-pointer"
            aria-label="Close or clear"
          >
            <FiX size={17} />
          </button>
        </div>

        {/* Sub-header: Detect Location & Selected State */}
        <div className="flex items-center justify-between mt-2.5 sm:mt-3 text-xs">
          <button
            type="button"
            onClick={detectLocation}
            disabled={isDetecting}
            className="text-[#dc2626] hover:text-[#b91c1c] font-normal flex items-center gap-1 cursor-pointer active:scale-95 transition-all disabled:opacity-60 text-xs"
          >
            <span className="text-[#dc2626] text-xs">✦</span>
            <span>
              {isDetecting ? "Detecting location..." : "Detect my location"}
            </span>
          </button>

          <div className="text-gray-500 text-xs">
            <span>Selected: </span>
            <strong className="text-gray-900 font-semibold">
              {selectedRegion?.name || "Tamil Nadu"}
            </strong>
          </div>
        </div>

        {/* Detection Error message if any */}
        {detectionError && (
          <div className="mt-2 px-3 py-1.5 bg-red-50 border border-red-100 rounded-md text-xs text-red-700 flex items-center justify-between">
            <span>{detectionError}</span>
            <button
              onClick={() => useRegion().setDetectionError?.(null)}
              className="text-red-500 hover:text-red-700 ml-2 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content View: Search Results OR 4 States */}
        {searchQuery ? (
          /* Search Results View */
          <div className="mt-4 pt-3 border-t border-gray-100 min-h-[120px] max-h-[200px] overflow-hidden">
            <p className="text-xs text-gray-400 font-medium mb-2">
              Matching Cities & States ({searchResults?.length || 0}):
            </p>
            {searchResults && searchResults.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto">
                {searchResults.slice(0, 15).map(({ city, region }, idx) => (
                  <button
                    key={`${region.id}-${city}-${idx}`}
                    onClick={() => handleSelectCity(region, city)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-gray-200 rounded-md text-xs font-medium text-gray-700 transition-all active:scale-95 cursor-pointer"
                  >
                    <span>{city}</span>
                    <span className="text-[10px] text-gray-400 font-normal">
                      ({region.code})
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-gray-500">
                No matching city found for "{searchQuery}".
              </div>
            )}
          </div>
        ) : showAllCities ? (
          /* All Cities Directory View */
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                All Cities
              </span>
              <button
                onClick={() => setShowAllCities(false)}
                className="text-xs text-[#dc2626] hover:underline font-medium cursor-pointer"
              >
                Back to States
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {allRegions.map((region) => (
                <div key={region.id} className="space-y-1">
                  <div
                    onClick={() => {
                      selectRegion(region);
                      closeRegionModal();
                    }}
                    className="text-xs font-bold text-gray-900 hover:text-red-600 cursor-pointer"
                  >
                    {region.name}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {region.popularCities.slice(0, 5).map((city) => (
                      <button
                        key={city}
                        onClick={() => handleSelectCity(region, city)}
                        className="text-left text-[11px] text-gray-600 hover:text-red-600 transition-colors py-0.5 truncate cursor-pointer"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Default 4 States Layout */
          <div className="mt-4" onMouseLeave={() => setHoveredRegionId(null)}>
            {/* Centered "Popular Cities" Title */}
            <div className="text-center text-xs text-gray-500 font-normal mb-3">
              Popular Cities
            </div>

            {/* Exactly 4 South Indian States */}
            <div className="grid grid-cols-4 gap-2 items-start justify-center">
              {allRegions.map((region) => {
                const isHovered = hoveredRegionId === region.id;
                const isSelected = selectedRegion?.id === region.id;
                const isActive = isHovered || (!hoveredRegionId && isSelected);

                return (
                  <div
                    key={region.id}
                    className="flex flex-col items-center justify-center cursor-pointer group select-none py-1 rounded-lg transition-all"
                    onMouseEnter={() => setHoveredRegionId(region.id)}
                    onClick={() => {
                      selectRegion(region);
                      closeRegionModal();
                    }}
                  >
                    {/* Landmark Line Art Icon */}
                    <div
                      className={`flex items-center justify-center transition-transform duration-150 ${
                        isActive ? "scale-105" : "group-hover:scale-105"
                      }`}
                    >
                      <StateLineArt
                        type={region.iconType}
                        isSelected={isActive}
                        className="w-11 h-11 sm:w-12 sm:h-12 transition-colors duration-150"
                      />
                    </div>

                    {/* State Name */}
                    <span
                      className={`mt-1.5 text-xs text-center leading-tight transition-colors duration-150 ${
                        isActive
                          ? "text-gray-900 font-bold"
                          : "text-gray-600 group-hover:text-gray-900"
                      }`}
                    >
                      {region.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Slot: Sub-cities Gray Banner on Hover OR "View All Cities" Button */}
            <div className="mt-4 min-h-[36px] flex items-center justify-center">
              {activeHoveredRegion ? (
                <div
                  className="w-full bg-[#f4f4f4] rounded-md px-3.5 py-2 flex items-center justify-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-gray-700 overflow-x-hidden whitespace-nowrap animate-fadeIn"
                  onMouseEnter={() => setHoveredRegionId(activeHoveredRegion.id)}
                >
                  {activeHoveredRegion.popularCities
                    .slice(0, 6)
                    .map((city, idx) => (
                      <button
                        key={`${activeHoveredRegion.id}-${city}-${idx}`}
                        onClick={() =>
                          handleSelectCity(activeHoveredRegion, city)
                        }
                        className="text-gray-700 hover:text-[#dc2626] hover:font-semibold transition-colors cursor-pointer text-left whitespace-nowrap flex-shrink-0"
                      >
                        {city}
                      </button>
                    ))}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAllCities(true)}
                  className="text-xs text-[#dc2626] hover:text-[#b91c1c] font-normal transition-all cursor-pointer"
                >
                  View All Cities
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
