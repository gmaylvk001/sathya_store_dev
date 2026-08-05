import { useEffect } from "react";

const RazorpayOffers = ({ amount }) => {
  useEffect(() => {
    const scriptId = "razorpay-affordability-script";
    const widgetId = "razorpay-affordability-widget";

    const initializeWidget = () => {
      const interval = setInterval(() => {
        if (typeof window.RazorpayAffordabilitySuite !== "undefined") {
          clearInterval(interval); // Stop checking

          const widgetConfig = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_TEST_KEY,// "rzp_live_KrAP9KEDGHrelP",
            amount: amount * 100, // in paise
            features: { offers: { list: [  ] } },
          };

          const rzpAffordabilitySuite = new window.RazorpayAffordabilitySuite(widgetConfig);
          rzpAffordabilitySuite.render();
        }
      }, 100); // Check every 100ms
    };

    // Clear the widget container
    const widgetEl = document.getElementById(widgetId);
    if (widgetEl) widgetEl.innerHTML = "";

    // Load script only if not already loaded
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdn.razorpay.com/widgets/affordability/affordability.js";
      script.async = true;
      script.onload = initializeWidget;
      document.body.appendChild(script);
    } else {
      initializeWidget(); // If script is already loaded
    }
  }, [amount]);

 return (
    <div className="w-full overflow-hidden">
      <div id="razorpay-affordability-widget" className="w-full overflow-hidden"></div>
    </div>
  );
};

export default RazorpayOffers;
