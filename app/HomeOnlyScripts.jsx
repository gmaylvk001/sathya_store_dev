"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Storefront third-party scripts: GTM + Tawk.to live chat.
 * Loads once; on route change only show/hide Tawk (no reload).
 *
 * Set in .env:
 *   NEXT_PUBLIC_TAWK_PROPERTY_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 *   NEXT_PUBLIC_TAWK_WIDGET_ID=default
 *
 * Find IDs in Tawk.to → Administration → Channels → Chat Widget → Direct Chat Link
 * URL format: https://embed.tawk.to/{PROPERTY_ID}/{WIDGET_ID}
 */
const TAWK_PROPERTY_ID = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID || "";
const TAWK_WIDGET_ID = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID || "default";

export default function HomeOnlyScripts() {
  const pathname = usePathname();
  const loadedRef = useRef(false);
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    const loadGTM = () => {
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
    };

    const loadTawk = () => {
      if (!TAWK_PROPERTY_ID) return;
      if (document.getElementById("tawk-script")) return;

      window.Tawk_API = window.Tawk_API || {};
      window.Tawk_LoadStart = new Date();

      const tawkScript = document.createElement("script");
      tawkScript.id = "tawk-script";
      tawkScript.async = true;
      tawkScript.src = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;
      tawkScript.charset = "UTF-8";
      tawkScript.setAttribute("crossorigin", "*");
      document.head.appendChild(tawkScript);
    };

    const setTawkVisible = (visible) => {
      if (!window.Tawk_API) return;
      if (visible && typeof window.Tawk_API.showWidget === "function") {
        window.Tawk_API.showWidget();
      } else if (!visible && typeof window.Tawk_API.hideWidget === "function") {
        window.Tawk_API.hideWidget();
      }
    };

    if (!loadedRef.current) {
      loadedRef.current = true;
      loadGTM();
      if (!isAdmin) loadTawk();
    }

    setTawkVisible(!isAdmin);
  }, [isAdmin]);

  return null;
}
