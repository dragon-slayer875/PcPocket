import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/main")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="p-3 py-4 md:p-4 flex flex-1">
      <Outlet />
    </div>
  );
}
