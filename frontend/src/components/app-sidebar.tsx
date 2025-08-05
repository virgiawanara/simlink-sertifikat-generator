import * as React from "react";
import { IconLayoutDashboardFilled } from "@tabler/icons-react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";

// This is sample data.
const navData = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: IconLayoutDashboardFilled,
    isActive: true,
    items: [
      {
        title: "Buat Sertifikat",
        url: "/",
      },
      {
        title: "Daftar Sertifikat",
        url: "/dashboard/list",
      },
    ],
  },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: { email: string; name?: string } | null;
  logout: () => void;
}

export function AppSidebar({ user, logout, ...props }: AppSidebarProps) {
  const userProfile = user
    ? {
        name: user.name || user.email.split("@")[0],
        email: user.email,
        avatar: "/avatars/shadcn.jpg", // Ganti dengan URL avatar yang sebenarnya jika ada
      }
    : null;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={navData} />
      </SidebarContent>
      <SidebarFooter>
        {userProfile ? (
          <NavUser user={userProfile} logout={logout} />
        ) : (
          <div className="flex items-center p-2 rounded-md bg-gray-100">
            <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
              CN
            </div>
            <div>
              <div className="font-semibold text-gray-800">Guest</div>
              <div className="text-sm text-gray-600">guest@example.com</div>
            </div>
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
