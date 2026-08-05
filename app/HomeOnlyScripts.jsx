"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function HomeOnlyScripts() {
  const pathname = usePathname();

  useEffect(() => {
    let typebotCancelled = false;

    // -------------------------
    // SPA-safe cleanup function
    // -------------------------
    const cleanupDOM = () => {
      // Remove GTM
      document.getElementById("gtm-script-1")?.remove();
      Array.from(document.scripts)
        .filter((s) => s.src.includes("GTM-KVT2Z9RR"))
        .forEach((s) => s.remove());

      // Remove Typebot
      document
        .querySelectorAll(
          "typebot-bubble, typebot-standard, typebot-container, [id^='typebot'], [class*='typebot']"
        )
        .forEach((el) => el.remove());
      window.__Typebot = null;

      // Hide Tawk.to widget instead of removing DOM
      if (window.Tawk_API && typeof window.Tawk_API.hideWidget === "function") {
        window.Tawk_API.hideWidget();
      }
    };

    // -------------------------
    // Load GTM
    // -------------------------
    const loadGTM = () => {
      if (!document.getElementById("gtm-script-1")) {
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
      }
    };

    // -------------------------
    // Load Typebot
    // -------------------------
    const loadTypebot = async () => {
      try {
        const { default: Typebot } = await import(
          /* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/@typebot.io/js@0.3.12/dist/web.js"
        );

        if (!typebotCancelled && !pathname?.startsWith("/admin")) {
          Typebot.initBubble({
            typebot: "bea-chatbot",
            apiHost: "https://chat.infozub.com",
            previewMessage: {
              message: "Chat Now!",
              avatarUrl: "https://infozub.com/wp-content/uploads/2024/02/BEA_logo.png",
            },
            theme: {
              button: { backgroundColor: "#0042DA" },
              chatWindow: { backgroundColor: "#ffffff" },
            },
          });
          window.__Typebot = Typebot;
              const style = document.createElement("style");
               style.id = "typebot-zindex-fix";
               style.textContent = `typebot-bubble { z-index: 100000 !important; }`;
               document.head.appendChild(style);
        }
      } catch (e) {
        console.error("Typebot failed to load", e);
      }
    };

    // -------------------------
    // SPA-safe Tawk.to show/hide
    // -------------------------
    const showTawk = () => {
      if (window.Tawk_API && typeof window.Tawk_API.showWidget === "function") {
        window.Tawk_API.showWidget();
      }
    };

    const loadTawk = () => {
      if (!window.Tawk_API) {
        window.Tawk_API = window.Tawk_API || {};
        window.Tawk_LoadStart = new Date();

        const tawkScript = document.createElement("script");
        tawkScript.async = true;
        tawkScript.src = "https://embed.tawk.to/YOUR_TAWK_ID/default"; // replace with your Tawk ID
        tawkScript.charset = "UTF-8";
        tawkScript.setAttribute("crossorigin", "*");
        document.head.appendChild(tawkScript);
      }
      showTawk();
    };

    // -------------------------
    // Main SPA logic
    // -------------------------
    if (pathname?.startsWith("/admin")) {
      cleanupDOM();
    } else {
      loadGTM();
      loadTypebot();
      loadTawk();
    }

    return () => {
      typebotCancelled = true;
      cleanupDOM();
    };
  }, [pathname]);

  return null;
}