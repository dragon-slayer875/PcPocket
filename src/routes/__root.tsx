import { Toaster } from "@/components/ui/sonner";
import { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="flex select-none h-screen justify-center px-3 py-4 md:p-4">
      <Outlet />
      <Toaster />
    </div>
  );
}
