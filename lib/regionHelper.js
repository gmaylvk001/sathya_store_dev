import axios from "axios";

export const SUPPORTED_REGIONS = [
  "tamilnadu",
  "andhra",
  "kerala",
  "karnataka",
  "telangana",
  "all",
];

export const DEFAULT_LOCATION = {
  pincode: "600001",
  city: "chennai",
  region: "tamilnadu",
  stateName: "Tamil Nadu",
  code: "TN",
};

export const STATE_DEFAULTS = {
  tamilnadu: {
    id: "tamilnadu",
    name: "Tamil Nadu",
    nativeName: "தமிழ்நாடு",
    code: "TN",
    defaultPincode: "600001",
    defaultCity: "chennai",
    accentColor: "#d72828",
    badgeBg: "bg-red-600",
    popularCities: [
      "Chennai",
      "Coimbatore",
      "Madurai",
      "Trichy",
      "Salem",
      "Tirunelveli",
      "Erode",
      "Vellore",
      "Thoothukudi",
      "Dindigul",
      "Thanjavur",
      "Tiruppur",
      "Nagercoil",
      "Kanchipuram",
      "Hosur",
    ],
  },
  kerala: {
    id: "kerala",
    name: "Kerala",
    nativeName: "കേരളം",
    code: "KL",
    defaultPincode: "695001",
    defaultCity: "thiruvananthapuram",
    accentColor: "#059669",
    badgeBg: "bg-emerald-600",
    popularCities: [
      "Kochi",
      "Thiruvananthapuram",
      "Kozhikode",
      "Thrissur",
      "Kollam",
      "Palakkad",
      "Alappuzha",
      "Kannur",
      "Kottayam",
      "Malappuram",
    ],
  },
  karnataka: {
    id: "karnataka",
    name: "Karnataka",
    nativeName: "ಕರ್ನಾಟಕ",
    code: "KA",
    defaultPincode: "560001",
    defaultCity: "bengaluru",
    accentColor: "#d97706",
    badgeBg: "bg-amber-600",
    popularCities: [
      "Bengaluru",
      "Mysuru",
      "Mangaluru",
      "Hubballi",
      "Belagavi",
      "Davangere",
      "Ballari",
      "Shivamogga",
      "Tumakuru",
      "Udupi",
    ],
  },
  andhra: {
    id: "andhra",
    name: "Andhra Pradesh",
    nativeName: "ఆంధ్రప్రదేశ్",
    code: "AP",
    defaultPincode: "517501",
    defaultCity: "tirupati",
    accentColor: "#4f46e5",
    badgeBg: "bg-indigo-600",
    popularCities: [
      "Visakhapatnam",
      "Vijayawada",
      "Guntur",
      "Nellore",
      "Kurnool",
      "Tirupati",
      "Kakinada",
      "Rajahmundry",
      "Anantapur",
      "Kadapa",
    ],
  },
  telangana: {
    id: "telangana",
    name: "Telangana",
    nativeName: "తెలంగాణ",
    code: "TG",
    defaultPincode: "500001",
    defaultCity: "hyderabad",
    accentColor: "#8b5cf6",
    badgeBg: "bg-purple-600",
    popularCities: [
      "Hyderabad",
      "Warangal",
      "Nizamabad",
      "Khammam",
      "Karimnagar",
      "Ramagundam",
      "Mahbubnagar",
      "Nalgonda",
    ],
  },
};

/**
 * Normalizes state name string to canonical region key
 */
export const normalizeRegion = (stateString) => {
  if (!stateString || typeof stateString !== "string") return "tamilnadu";
  const s = stateString.toLowerCase().trim();
  if (s.includes("tamil")) return "tamilnadu";
  if (s.includes("andhra")) return "andhra";
  if (s.includes("kerala")) return "kerala";
  if (s.includes("karnataka")) return "karnataka";
  if (s.includes("telangana")) return "telangana";
  return "tamilnadu";
};

/**
 * Validates 6-digit Indian pincode format
 */
export const isValidPincode = (pincode) => {
  if (!pincode) return false;
  const clean = pincode.toString().trim();
  return /^[1-9][0-9]{5}$/.test(clean);
};

/**
 * Checks if pincode falls in Karnataka postal range (560xxx to 591xxx)
 */
export const isKarnatakaPincode = (pincode) => {
  if (!pincode) return false;
  const clean = pincode.toString().replace(/\D/g, "");
  if (clean.length < 3) return false;
  const prefix = parseInt(clean.substring(0, 3), 10);
  return prefix >= 560 && prefix <= 591;
};

// Major South Indian City Coordinates Fallback Table
export const CITY_COORDINATES = {
  chennai: { lat: 13.0827, lng: 80.2707 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  madurai: { lat: 9.9252, lng: 78.1198 },
  trichy: { lat: 10.7905, lng: 78.7047 },
  salem: { lat: 11.6643, lng: 78.1460 },
  tirunelveli: { lat: 8.7139, lng: 77.7567 },
  erode: { lat: 11.3410, lng: 77.7172 },
  vellore: { lat: 12.9165, lng: 79.1325 },
  thoothukudi: { lat: 8.7642, lng: 78.1348 },
  dindigul: { lat: 10.3673, lng: 77.9803 },
  thanjavur: { lat: 10.7870, lng: 79.1378 },
  tiruppur: { lat: 11.1085, lng: 77.3411 },
  nagercoil: { lat: 8.1833, lng: 77.4119 },
  kanchipuram: { lat: 12.8342, lng: 79.7036 },
  hosur: { lat: 12.7409, lng: 77.8253 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  mysuru: { lat: 12.2958, lng: 76.6394 },
  mangaluru: { lat: 12.9141, lng: 74.8560 },
  hubballi: { lat: 15.3647, lng: 75.1240 },
  belagavi: { lat: 15.8497, lng: 74.4977 },
  kochi: { lat: 9.9312, lng: 76.2673 },
  thiruvananthapuram: { lat: 8.5241, lng: 76.9366 },
  trivandrum: { lat: 8.5241, lng: 76.9366 },
  kozhikode: { lat: 11.2588, lng: 75.7804 },
  thrissur: { lat: 10.5276, lng: 76.2144 },
  hyderabad: { lat: 17.3850, lng: 78.4867 },
  warangal: { lat: 17.9689, lng: 79.5941 },
  visakhapatnam: { lat: 17.6868, lng: 83.2185 },
  vijayawada: { lat: 16.5062, lng: 80.6480 },
  guntur: { lat: 16.3067, lng: 80.4365 },
  tirupati: { lat: 13.6288, lng: 79.4192 },
  chittoor: { lat: 13.2172, lng: 79.1003 },
  kurnool: { lat: 15.8281, lng: 78.0373 },
  namakkal: { lat: 11.2189, lng: 78.1674 },
};

/**
 * Resolves location details and geographic coordinates for a 6-digit pincode
 */
export const lookupPincode = async (pincode) => {
  const cleanPin = pincode.toString().trim();
  if (!isValidPincode(cleanPin)) {
    return {
      status: "error",
      message: "Invalid 6-digit pincode",
      ...DEFAULT_LOCATION,
    };
  }

  let city = "unknown";
  let stateName = "Tamil Nadu";
  let region = "tamilnadu";
  let latitude = null;
  let longitude = null;

  try {
    const res = await axios.get(
      `https://api.postalpincode.in/pincode/${cleanPin}`,
      { timeout: 3500 }
    );
    const data = res.data;

    if (Array.isArray(data) && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
      const po = data[0].PostOffice[0];
      city = (po.District || po.Name || "unknown").toLowerCase();
      stateName = po.State || "Tamil Nadu";
      region = normalizeRegion(stateName);
    }
  } catch (err) {
    console.error("Postal API error:", err.message);
  }

  if (region === "tamilnadu" && city === "unknown") {
    const prefix2 = parseInt(cleanPin.substring(0, 2), 10);
    if (prefix2 >= 60 && prefix2 <= 64) region = "tamilnadu";
    else if (prefix2 >= 67 && prefix2 <= 69) region = "kerala";
    else if (prefix2 >= 56 && prefix2 <= 59) region = "karnataka";
    else if (prefix2 >= 51 && prefix2 <= 53) region = "andhra";
    else if (prefix2 === 50) region = "telangana";

    const meta = STATE_DEFAULTS[region] || STATE_DEFAULTS.tamilnadu;
    stateName = meta.name;
    city = meta.defaultCity;
  }

  // Attempt Nominatim forward geocoding to retrieve exact latitude/longitude
  try {
    const nomRes = await axios.get(
      `https://nominatim.openstreetmap.org/search?postalcode=${cleanPin}&country=India&format=jsonv2`,
      {
        headers: { "User-Agent": "SathyaStore/1.0" },
        timeout: 3000,
      }
    );
    if (Array.isArray(nomRes.data) && nomRes.data.length > 0) {
      latitude = parseFloat(nomRes.data[0].lat);
      longitude = parseFloat(nomRes.data[0].lon);
    }
  } catch {
    // ignore geocoding timeout
  }

  // Fallback to city coordinates if Nominatim returned null
  if (!latitude || !longitude) {
    const cityCoords = CITY_COORDINATES[city] || CITY_COORDINATES[STATE_DEFAULTS[region]?.defaultCity] || CITY_COORDINATES.chennai;
    latitude = cityCoords.lat;
    longitude = cityCoords.lng;
  }

  const stateMeta = STATE_DEFAULTS[region] || STATE_DEFAULTS.tamilnadu;

  return {
    status: "success",
    pincode: cleanPin,
    city,
    stateName,
    region,
    code: stateMeta.code,
    latitude,
    longitude,
  };
};

/**
 * Reverse geocodes latitude/longitude via OpenStreetMap Nominatim
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const res = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
      {
        headers: { "User-Agent": "SathyaStore/1.0" },
        timeout: 4000,
      }
    );
    const data = res.data;
    const address = data?.address || {};
    const stateName = address.state || address.region || "Tamil Nadu";
    const region = normalizeRegion(stateName);
    const stateMeta = STATE_DEFAULTS[region] || STATE_DEFAULTS.tamilnadu;
    const city = (address.city || address.town || address.district || address.county || stateMeta.defaultCity).toLowerCase();
    const pincode = isValidPincode(address.postcode) ? address.postcode : stateMeta.defaultPincode;

    return {
      status: "success",
      pincode,
      city,
      stateName,
      region,
      code: stateMeta.code,
      displayName: data?.display_name || "",
    };
  } catch (err) {
    console.error("Reverse geocoding error:", err.message);
    return {
      status: "fallback",
      ...DEFAULT_LOCATION,
    };
  }
};
