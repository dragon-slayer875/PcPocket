import { Button } from "@/components/ui/button";
import { useCreateDbMutation, useOpenDbMutation } from "@/lib/queries";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { createFileRoute } from "@tanstack/react-router";
import { openUrl } from "@tauri-apps/plugin-opener";
import { FolderOpen, PlusCircle } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const createDbMutation = useCreateDbMutation();
  const openDbMutation = useOpenDbMutation();
  return (
    <div className="flex-1 grid gap-5 grid-rows-2 sm:max-w-sm">
      <h1 className="text-4xl sm:text-5xl mx-auto mt-auto">
        Welcome to <br />{" "}
        <span className="text-amber-200 font-bold">PcPocket!</span>
      </h1>
      <div className="flex flex-col gap-2 self-end sm:self-baseline">
        <Button
          onClick={function() {
            createDbMutation.mutate();
          }}
          size="lg"
          className="flex items-center justify-between"
        >
          <span>Create Database</span>
          <PlusCircle />
        </Button>
        <Button
          onClick={function() {
            openDbMutation.mutate();
          }}
          size="lg"
          variant="secondary"
          className="flex items-center justify-between"
        >
          <span>Open Database</span>
          <FolderOpen />
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full flex items-center justify-between"
          onClick={async function() {
            await openUrl("https://www.github.com");
          }}
        >
          <span>View Source</span>
          <SiGithub />
        </Button>
      </div>
    </div>
  );
}
