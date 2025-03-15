import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
  component: () => (
    <div className="flex min-h-screen justify-center px-3 py-4 md:p-4">
      <Outlet />
      <TanStackRouterDevtools />
    </div>
  ),
});
