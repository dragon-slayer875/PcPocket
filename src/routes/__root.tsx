import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
  component: () => (
    <div className="flex min-h-screen justify-center p-2 md:p-4">
      <Outlet />
      <TanStackRouterDevtools />
    </div>
  ),
});
