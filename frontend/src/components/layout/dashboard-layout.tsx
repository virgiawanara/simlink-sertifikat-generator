import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useUser } from "@/hooks/use-user"; // Mengimpor hook useUser
import * as React from "react";

// DashboardLayout yang diperbarui untuk menggunakan useUser hook
export default function DashboardLayout() {
  // Dapatkan data user, status loading, dan fungsi logout dari hook
  const { user, loading, logout } = useUser();

  // Tampilkan loading state jika data masih dimuat
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }>
      {/* Teruskan user dan logout sebagai prop ke AppSidebar */}
      <AppSidebar user={user} logout={logout} variant="inset" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <Outlet /> {/* 🟦 Semua halaman dashboard akan tampil di sini */}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
