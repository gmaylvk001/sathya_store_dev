import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/app/ClientLayout";
import Script from "next/script";
import HomeOnlyScripts from "@/app/HomeOnlyScripts";
import VisitorTracker from "@/components/VisitorTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html lang="en">
       <head>
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-15V9VS13Q7"></Script>
        <Script id="gtm-new" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-15V9VS13Q7');
          `}
        </Script>

        {/* Google Tag Manager */}
        <Script id="gtm-script" strategy="afterInteractive" dangerouslySetInnerHTML={{
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Google Tag Manager (noscript) */}
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-P7LW8D7X" height="0" width="0" style={{ display: "none", visibility: "hidden" }}></iframe></noscript>

        <ClientLayout>{children}</ClientLayout>
        <HomeOnlyScripts/>
        <VisitorTracker/>
      </body>
    </html>
  );
}
