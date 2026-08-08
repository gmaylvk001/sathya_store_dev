"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Load storefront third-party scripts (GTM only).
 * Typebot and Tawk were removed.
 */
export default function HomeOnlyScripts() {
  const pathname = usePathname();
  const loadedRef = useRef(false);
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) return;

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

    if (!loadedRef.current) {
      loadedRef.current = true;
      loadGTM();
    }
  }, [isAdmin]);

  return null;
}
