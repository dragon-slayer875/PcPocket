import { createFileRoute } from "@tanstack/react-router";
import { Config } from "@/components/config";

export const Route = createFileRoute("/main/config")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="container mx-auto max-w-4xl py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Config />
    </div>
  );
}
