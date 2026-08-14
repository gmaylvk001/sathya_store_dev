import { Poppins } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/app/ClientLayout";
import Script from "next/script";
import HomeOnlyScripts from "@/app/HomeOnlyScripts";
import WhatsAppFloat from "@/app/WhatsappFloat";
import VisitorTracker from "@/components/VisitorTracker";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
  preload: true,
});

export const metadata = {
  title: "Sathya Stores",
  description: "Sathya Stores",
  icons: {
    icon: "/uploads/sathyalogo.webp",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${poppins.variable} ${poppins.className}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <Script
          id="adtarbo-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(dd, ss, idd) {
                var js, ajs = dd.getElementsByTagName(ss)[0];
                if (dd.getElementById(idd)) {return;}
                js = dd.createElement(ss);
                js.id = idd;
                js.aun_id = "GXNFAIR40psC";
                js.src = "https://pixel.adtarbo.com/pixelTrack1.js";
                ajs.parentNode.insertBefore(js, ajs)
              } (document, 'script', 'adtarbo-js-v2'));
            `,
          }}
        />
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-15V9VS13Q7"
        ></Script>
        <Script id="gtm-new" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-15V9VS13Q7');
          `}
        </Script>
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];
              w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
              var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
              j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
              f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-P7LW8D7X');`,
          }}
        />
      </head>
      <body className={`${poppins.className} font-sans antialiased`}>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-P7LW8D7X"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        <ClientLayout>{children}</ClientLayout>
        <HomeOnlyScripts />
        <WhatsAppFloat />
        <VisitorTracker />
      </body>
    </html>
  );
}
