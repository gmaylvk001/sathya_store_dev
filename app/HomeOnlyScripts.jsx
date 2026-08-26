"use client";

import { useEffect, useRef } from "react";

function removeTawkWidgets() {
  if (typeof document === "undefined") return;
  document
    .querySelectorAll(
      'script[src*="tawk.to"], iframe[src*="tawk.to"], iframe[title*="chat widget"], [id*="tawk"], [class*="tawk"]'
    )
    .forEach((el) => el.remove());
  if (window.Tawk_API && typeof window.Tawk_API.hideWidget === "function") {
    try {
      window.Tawk_API.hideWidget();
    } catch {
      /* ignore */
    }
  }
}

/** Storefront third-party scripts: GTM. Loads once. */
export default function HomeOnlyScripts() {
  const loadedRef = useRef(false);

  useEffect(() => {
    removeTawkWidgets();
    const timer = setInterval(removeTawkWidgets, 1000);
    const stop = setTimeout(() => clearInterval(timer), 15000);
    return () => {
      clearInterval(timer);
      clearTimeout(stop);
    };
  }, []);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    if (document.getElementById("gtm-script-1")) return;

    const gtmScript = document.createElement("script");
    gtmScript.id = "gtm-script-1";
    gtmScript.textContent = `
      (function(w,d,s,l,i){w[l]=w[l]||[];
      w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
      var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
      j.async=true;
      j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
      f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','GTM-KVT2Z9RR');
    `;
    document.head.appendChild(gtmScript);
  }, []);

  return null;
}
