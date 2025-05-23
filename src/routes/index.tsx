import { Button } from "@/components/ui/button";
import { useCreateDbMutation, useOpenDbMutation } from "@/lib/queries";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { createFileRoute } from "@tanstack/react-router";
import { openUrl } from "@tauri-apps/plugin-opener";
import { FilePlus2, FolderOpen } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const createDbMutation = useCreateDbMutation();
  const openDbMutation = useOpenDbMutation();
  return (
    <div className="flex-1 grid gap-5 grid-rows-2 sm:max-w-sm mx-auto">
      <h1 className="text-4xl sm:text-5xl mx-auto mt-auto">
        Welcome to <br />{" "}
        <span className="text-primary font-bold">PcPocket!</span>
      </h1>
      <div className="flex flex-col gap-2 self-end sm:self-baseline">
        <Button
          onClick={() => createDbMutation.mutate()}
          size="lg"
          className="flex items-center justify-between"
        >
          <span>Create Database</span>
          <FilePlus2 />
        </Button>
        <Button
          onClick={() => openDbMutation.mutate()}
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
          onClick={() =>
            openUrl("https://github.com/dragon-slayer875/PcPocket")
          }
        >
          <span>View Source</span>
          <SiGithub />
        </Button>
      </div>
    </div>
  );
}
