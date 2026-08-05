"use client";

import { useEffect } from "react";

export default function VisitorTracker() {
  useEffect(() => {
    fetch("/api/visitorlog", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        page: window.location.pathname,
        referer: document.referrer,
        userAgent: navigator.userAgent,
      }),
    });
  }, []);

  return null;
}