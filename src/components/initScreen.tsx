import { useCreateDbMutation, useOpenDbMutation } from "@/lib/queries";
import { Button } from "./ui/button";
import { FolderOpen, PlusCircle } from "lucide-react";
import { SiGithub } from "@icons-pack/react-simple-icons";

export function InitScreen() {
  const createDbMutation = useCreateDbMutation();
  const openDbMutation = useOpenDbMutation();
  return (
    <div className="flex-1 grid grid-rows-2 sm:max-w-sm">
      <h1 className="text-4xl sm:text-5xl mx-auto mt-auto">
        Welcome to <br />{" "}
        <span className="text-amber-200 font-bold">Pookie!</span>
      </h1>
      <div className="flex flex-col gap-2 p-5 self-end sm:self-baseline">
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
        <a href="https://www.github.com" target="_blank" className="flex">
          <Button
            size="lg"
            variant="outline"
            className="w-full flex items-center justify-between"
          >
            <span>View Source</span>
            <SiGithub />
          </Button>
        </a>
      </div>
    </div>
  );
}
