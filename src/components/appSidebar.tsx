import { Home, Info, Settings } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { Link } from "@tanstack/react-router";

// Menu items.
const items = [
  {
    title: "Bookmarks",
    url: "/main/bookmarks/",
    icon: Home,
  },
  {
    title: "Config",
    url: "/main/config/",
    icon: Settings,
  },
  {
    title: "About",
    url: "/main/about/",
    icon: Info,
  },
];

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarMenu className="gap-3 p-2">
          <SidebarTrigger className="p-3" />
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link to={item.url} className="p-5">
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
