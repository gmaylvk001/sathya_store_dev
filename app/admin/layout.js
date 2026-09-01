"use client";

import { usePathname } from "next/navigation";
import AdminHeader from "@/app/admin/components/AdminHeader";
import AdminSider from "@/app/admin/components/AdminSider";
import AuthProvider from "@/app/admin/components/AuthProvider";
import AdminPageShell from "@/app/admin/components/AdminPageShell";
import { AdminNavLoadingProvider } from "@/app/admin/components/AdminNavLoading";

const SIDEBAR_WIDTH = "70px";
const HEADER_HEIGHT = "68px";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <AuthProvider>
      <AdminNavLoadingProvider>
        <div
          className="admin-layout grid h-screen overflow-hidden bg-gray-100 text-[15px]"
          style={{
            gridTemplateRows: `${HEADER_HEIGHT} minmax(0, 1fr)`,
            gridTemplateColumns: `${SIDEBAR_WIDTH} minmax(0, 1fr)`,
            "--admin-sidebar-width": SIDEBAR_WIDTH,
            "--admin-header-height": HEADER_HEIGHT,
          }}
        >
          <AdminHeader />
          <AdminSider collapsed />
          <main className="admin-main col-start-2 row-start-2 min-h-0 min-w-0 overflow-x-hidden overflow-y-auto bg-[#f5f6f8] px-3 py-3 sm:px-4 sm:py-4">
            <AdminPageShell>{children}</AdminPageShell>
          </main>
        </div>
      </AdminNavLoadingProvider>
    </AuthProvider>
  );
}
