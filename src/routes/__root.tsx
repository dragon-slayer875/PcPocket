import { Toaster } from "@/components/ui/sonner";
import { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/appSidebar";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="flex select-none h-screen justify-center ">
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <Outlet />
        <Toaster />
      </SidebarProvider>
    </div>
  );
}
