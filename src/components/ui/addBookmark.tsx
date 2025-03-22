import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { BookmarkForm } from "../bookmarkForm";
import { useInsertBookmarkMutation } from "@/lib/queries";
import { DrawerDialog } from "./drawerDialog";

export function AddBookmarkDrawerDialog() {
  const [open, setOpen] = useState(false);
  const insertBookmark = useInsertBookmarkMutation();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.key === "a") {
        event.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    window.androidBackCallback = function() {
      if (open) {
        setOpen(false);
        return false;
      }
      return true;
    };
    return () => {
      window.androidBackCallback = function() {
        return true;
      };
    };
  }, [open]);

  return (
    <DrawerDialog
      open={open}
      setOpen={setOpen}
      trigger={
        <Button variant={"ghost"}>
          <Plus />
        </Button>
      }
      content={
        <BookmarkForm handleSubmit={insertBookmark.mutate} setOpen={setOpen} />
      }
      description="Add a bookmark to the current database."
      title="Create Bookmark"
    />
  );
}
