"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import AdminHeader from "@/app/admin/components/AdminHeader";
import AdminSider from "@/app/admin/components/AdminSider";
import AuthProvider from "@/app/admin/components/AuthProvider";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // 🆕 Add sidebar state

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-gray-100">
        <AdminSider collapsed={sidebarCollapsed} />
        <div className={`flex-1 min-w-0 ${sidebarCollapsed ? "ms-[4rem]" : "ms-[13.25rem]"}`}>
          <AdminHeader toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
          <main className="flex-1 mt-0 px-6 h-[calc(100vh-3.5rem)] min-w-0 overflow-y-auto overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
