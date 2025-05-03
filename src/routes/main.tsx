import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/appSidebar";

export const Route = createFileRoute("/main")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <div className="p-3 py-4 md:p-4 flex flex-1">
        <Outlet />
      </div>
    </SidebarProvider>
  );
}
