import { useMediaQuery } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { InsertBookmarkForm } from "../insertBookmarkForm";

export function AddBookmarkDrawerDialog() {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 640px)");

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

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Add bookmark</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Bookmark</DialogTitle>
            <DialogDescription>
              Add a new bookmark to your current database.
            </DialogDescription>
          </DialogHeader>
          <InsertBookmarkForm />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button className="rounded-full p-6 bg-amber-50" size={"icon"}>
          <Plus />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-[1.2rem]">Create bookmark</DrawerTitle>
          <DrawerDescription>
            Add a new bookmark to your current database.
          </DrawerDescription>
        </DrawerHeader>
        <InsertBookmarkForm />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button size={"lg"} variant="outline">
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
