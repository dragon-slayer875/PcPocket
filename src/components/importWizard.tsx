import { useEffect, useState } from "react";
import { DrawerDialog } from "./ui/drawerDialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { Separator } from "./ui/separator";
import { useImportBookmarksMutation } from "@/lib/queries";

function ImportForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  const [filePath, setFilePath] = useState<string>("");
  const [supportedParsers, setSupportedParsers] = useState<string[]>([]);
  const importBookmarks = useImportBookmarksMutation();

  useEffect(() => {
    invoke("list_supported_parsers", {
      requiredFormat: filePath.split(".").pop(),
    }).then((parsers) => {
      setSupportedParsers(parsers as string[]);
    });
  }, [filePath]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex">
        <Input
          readOnly
          aria-readonly
          value={filePath}
          placeholder="Choose a file"
          className="w-full select-text"
        />
        <Button
          className="ml-2"
          onClick={async function () {
            const path = await open();
            if (path) {
              setFilePath(path);
            }
          }}
        >
          Choose File
        </Button>
      </div>
      {supportedParsers.length !== 0 && <Separator />}
      {supportedParsers.map((parser) => (
        <Button
          key={parser}
          variant="secondary"
          onClick={async () => {
            setOpen(false);
            importBookmarks.mutate({
              filePath,
              parserName: parser,
            });
          }}
        >
          {parser}
        </Button>
      ))}
    </div>
  );
}

export function ImportWizard({
  open,
  setOpen,
  trigger,
}: {
  trigger: React.ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  return (
    <DrawerDialog
      open={open}
      setOpen={setOpen}
      trigger={trigger}
      content={<ImportForm setOpen={setOpen} />}
      description="Import bookmarks from a file."
      title="Import Bookmarks"
    />
  );
}
