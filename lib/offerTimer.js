export const OFFER_TIMER_STATES = [
  { label: "Tamilnadu", value: "tamilnadu" },
  { label: "Andhra", value: "andhra" },
  { label: "Kerala", value: "kerala" },
  { label: "Karnataka", value: "karnataka" },
  { label: "Telangana", value: "telangana" },
];

export function normalizeOfferStates(selectedStates = []) {
  const picked = [...new Set(
    (Array.isArray(selectedStates) ? selectedStates : [])
      .map((item) => String(item).trim().toLowerCase())
      .filter(Boolean)
  )];

  if (picked.includes("all") || picked.length === 0) {
    return { state: "all", offerViewStates: ["all"] };
  }

  const allowed = new Set(OFFER_TIMER_STATES.map((item) => item.value));
  const states = picked.filter((item) => allowed.has(item));
  if (!states.length) {
    return { state: "all", offerViewStates: ["all"] };
  }

  return { state: "selected", offerViewStates: states };
}

export function formatOfferStates(states = []) {
  if (!states.length || states.includes("all")) return "all";
  return states.join(", ");
}

export function formatTimerDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
