'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'sathya_selected_region';
const PROMPT_KEY = 'sathya_region_prompted';

export const SOUTH_INDIAN_STATES = [
  {
    id: 'tamil-nadu',
    name: 'Tamil Nadu',
    nativeName: 'தமிழ்நாடு',
    code: 'TN',
    tagline: 'Home of Sathya • 100+ Showrooms',
    deliveryTime: '24-48h Express Delivery',
    landmark: 'Meenakshi & Tanjore Gopuram',
    iconType: 'gopuram',
    popularCities: [
      'Chennai',
      'Coimbatore',
      'Madurai',
      'Trichy',
      'Salem',
      'Tirunelveli',
      'Erode',
      'Vellore',
      'Thoothukudi',
      'Dindigul',
      'Thanjavur',
      'Tiruppur',
      'Nagercoil',
      'Kanchipuram',
      'Hosur',
    ],
    accentColor: '#d72828',
    gradient: 'from-red-600 via-rose-600 to-red-700',
    lightBg: 'bg-red-50/70',
    borderColor: 'border-red-200',
    badgeBg: 'bg-red-600',
  },
  {
    id: 'kerala',
    name: 'Kerala',
    nativeName: 'കേരളം',
    code: 'KL',
    tagline: "God's Own Country • Express Hubs",
    deliveryTime: '24-48h Express Delivery',
    landmark: 'Traditional Houseboat & Palm Groves',
    iconType: 'houseboat',
    popularCities: [
      'Kochi',
      'Thiruvananthapuram',
      'Kozhikode',
      'Thrissur',
      'Kollam',
      'Palakkad',
      'Alappuzha',
      'Kannur',
      'Kottayam',
      'Malappuram',
    ],
    accentColor: '#059669',
    gradient: 'from-emerald-600 via-teal-600 to-emerald-700',
    lightBg: 'bg-emerald-50/70',
    borderColor: 'border-emerald-200',
    badgeBg: 'bg-emerald-600',
  },
  {
    id: 'karnataka',
    name: 'Karnataka',
    nativeName: 'ಕರ್ನಾಟಕ',
    code: 'KA',
    tagline: 'Tech Hub & Heritage • Fast Dispatch',
    deliveryTime: '24-48h Express Delivery',
    landmark: 'Mysore Palace & Vidhana Soudha',
    iconType: 'palace',
    popularCities: [
      'Bengaluru',
      'Mysuru',
      'Mangaluru',
      'Hubballi',
      'Belagavi',
      'Davangere',
      'Ballari',
      'Shivamogga',
      'Tumakuru',
      'Udupi',
    ],
    accentColor: '#d97706',
    gradient: 'from-amber-600 via-yellow-600 to-amber-700',
    lightBg: 'bg-amber-50/70',
    borderColor: 'border-amber-200',
    badgeBg: 'bg-amber-600',
  },
  {
    id: 'andhra-pradesh',
    name: 'Andhra Pradesh',
    nativeName: 'ఆంధ్రప్రదేశ్',
    code: 'AP',
    tagline: 'Sunrise State • Statewide Network',
    deliveryTime: '24-48h Express Delivery',
    landmark: 'Amaravati Stupa & Tirupati Arch',
    iconType: 'stupa',
    popularCities: [
      'Visakhapatnam',
      'Vijayawada',
      'Guntur',
      'Nellore',
      'Kurnool',
      'Tirupati',
      'Kakinada',
      'Rajahmundry',
      'Anantapur',
      'Kadapa',
    ],
    accentColor: '#4f46e5',
    gradient: 'from-indigo-600 via-blue-600 to-indigo-700',
    lightBg: 'bg-indigo-50/70',
    borderColor: 'border-indigo-200',
    badgeBg: 'bg-indigo-600',
  },
];

const RegionContext = createContext();

export const RegionProvider = ({ children }) => {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize region from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const matched = SOUTH_INDIAN_STATES.find(
          (s) => s.id === parsed.id || s.code === parsed.code || s.name?.toLowerCase() === parsed.name?.toLowerCase()
        );
        if (matched) {
          setSelectedRegion(matched);
        } else {
          setSelectedRegion(SOUTH_INDIAN_STATES[0]);
        }
      } else {
        // New visitor: Automatically open modal
        setIsRegionModalOpen(true);
      }
    } catch {
      setSelectedRegion(SOUTH_INDIAN_STATES[0]);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save selected region
  const selectRegion = useCallback((regionOrId) => {
    let targetRegion = null;
    if (typeof regionOrId === 'string') {
      targetRegion = SOUTH_INDIAN_STATES.find(
        (s) => s.id === regionOrId || s.code === regionOrId || s.name.toLowerCase() === regionOrId.toLowerCase()
      );
    } else if (regionOrId && typeof regionOrId === 'object') {
      targetRegion = SOUTH_INDIAN_STATES.find(
        (s) => s.id === regionOrId.id || s.code === regionOrId.code || s.name === regionOrId.name
      ) || regionOrId;
    }

    if (targetRegion) {
      setSelectedRegion(targetRegion);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(targetRegion));
        localStorage.setItem(PROMPT_KEY, 'true');
      } catch {
        // ignore quota
      }
    }
    setIsRegionModalOpen(false);
    setDetectionError(null);
  }, []);

  const openRegionModal = useCallback(() => {
    setDetectionError(null);
    setIsRegionModalOpen(true);
  }, []);

  const closeRegionModal = useCallback(() => {
    // Default fallback to Tamil Nadu if no region selected yet
    if (!selectedRegion) {
      const defaultState = SOUTH_INDIAN_STATES[0];
      setSelectedRegion(defaultState);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultState));
      } catch {}
    }
    setIsRegionModalOpen(false);
    setDetectionError(null);
  }, [selectedRegion]);

  // Detect user's location using HTML5 Geolocation
  const detectLocation = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator?.geolocation) {
      setDetectionError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetecting(true);
    setDetectionError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const address = data?.address || {};
          const detectedStateName = (address.state || address.region || '').toLowerCase();
          const detectedCity = (address.city || address.town || address.village || address.county || '').toLowerCase();

          const matched = SOUTH_INDIAN_STATES.find((s) => {
            const sn = s.name.toLowerCase();
            return (
              detectedStateName.includes(sn) ||
              sn.includes(detectedStateName) ||
              s.popularCities.some((c) => c.toLowerCase() === detectedCity)
            );
          });

          if (matched) {
            selectRegion(matched);
          } else {
            // Coordinate boundaries
            if (latitude >= 8.0 && latitude <= 13.5 && longitude >= 76.5 && longitude <= 80.5) {
              selectRegion(SOUTH_INDIAN_STATES[0]);
            } else if (longitude <= 77.2 && latitude >= 8.3 && latitude <= 12.8) {
              selectRegion(SOUTH_INDIAN_STATES[1]);
            } else if (latitude >= 12.0 && latitude <= 18.5 && longitude <= 78.5) {
              selectRegion(SOUTH_INDIAN_STATES[2]);
            } else if (longitude >= 78.5 && latitude >= 13.0 && latitude <= 19.5) {
              selectRegion(SOUTH_INDIAN_STATES[3]);
            } else {
              setDetectionError(
                `Your location was detected outside the 4 South Indian states. Please choose your state below.`
              );
            }
          }
        } catch {
          setDetectionError('Could not auto-detect state. Please select manually below.');
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        setIsDetecting(false);
        if (error.code === 1) {
          setDetectionError('Location permission denied. Please pick your state below.');
        } else {
          setDetectionError('Unable to detect location. Please choose your state manually.');
        }
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  }, [selectRegion]);

  return (
    <RegionContext.Provider
      value={{
        selectedRegion: selectedRegion || SOUTH_INDIAN_STATES[0],
        allRegions: SOUTH_INDIAN_STATES,
        isRegionModalOpen,
        isDetecting,
        detectionError,
        isInitialized,
        openRegionModal,
        closeRegionModal,
        selectRegion,
        detectLocation,
      }}
    >
      {children}
    </RegionContext.Provider>
  );
};

export const useRegion = () => {
  const context = useContext(RegionContext);
  if (!context) {
    throw new Error('useRegion must be used within a RegionProvider');
  }
  return context;
};
