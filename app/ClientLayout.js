"use client";

import { usePathname } from "next/navigation";
import CustomHeader from "@/components/Headernew";
import CustomFooter from "@/components/Footer";
import GlobalModals from "@/components/GlobalModals";
import { AuthProvider } from "@/context/AuthContext";
import { ModalProvider } from "@/context/ModalContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CartProvider } from "@/context/CartContext";
import { HeaderProvider } from "@/context/HeaderContext";
import { RegionProvider } from "@/context/RegionContext";

export default function ClientLayout({ children }) {
  const pathname = usePathname();

  return (
    <RegionProvider>
      <HeaderProvider>
        <ModalProvider>
          <WishlistProvider>
            <CartProvider>
              <AuthProvider>
                <div className="flex flex-col min-h-screen">
                  {!pathname?.startsWith("/admin") && <CustomHeader />}
                  <main className="relative flex-grow min-h-[calc(100vh-280px)]">{children}</main>
                  {!pathname?.startsWith("/admin") && <CustomFooter />}
                  {!pathname?.startsWith("/admin") && <GlobalModals />}
                </div>
              </AuthProvider>
            </CartProvider>
          </WishlistProvider>
        </ModalProvider>
      </HeaderProvider>
    </RegionProvider>
  );
}
