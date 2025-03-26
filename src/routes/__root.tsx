import { Toaster } from "@/components/ui/sonner";
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <div className="flex select-none min-h-screen justify-center px-3 py-4 md:p-4">
      <Outlet />
      <Toaster />
    </div>
  ),
});
