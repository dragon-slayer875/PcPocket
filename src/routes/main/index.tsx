import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/main/")({
  component: RouteComponent,
});

function RouteComponent() {
  <Outlet />;
}
