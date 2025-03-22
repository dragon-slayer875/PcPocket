import { BookmarkQueryItem } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Clipboard, Edit, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "../badge";
import { openUrl } from "@tauri-apps/plugin-opener";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { useState } from "react";
import useMediaQuery from "@/lib/hooks";
import { InsertBookmarkForm } from "@/components/insertBookmarkForm";

export type Payment = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};

export const columns: ColumnDef<BookmarkQueryItem>[] = [
  {
    accessorKey: "id",
    header: "Id",
  },
  {
    accessorKey: "icon_link",
    header: "Icon",
    cell: ({ row }) => {
      const iconLink = row.getValue("icon_link") as string;
      if (!iconLink) {
        return <Globe className="h-7 w-7 mr-2.5" />;
      }
      return (
        <img
          src={iconLink}
          alt="icon"
          className="h-7 w-7"
          onError={(e) => {
            e.currentTarget.src =
              "https://www.google.com/s2/favicons?domain=" +
              row.getValue("link");
          }}
        />
      );
    },
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      const title = row.getValue("title") as string;
      return (
        <div className="text-left flex items-center whitespace-pre-line line-clamp-3">
          {title}
        </div>
      );
    },
  },
  {
    accessorKey: "link",
    header: "Link",
    cell: ({ row }) => {
      const link = row.getValue("link") as string;
      const [isCopied, setIsCopied] = useState("Copy to clipboard");
      const [open, setOpen] = useState(false);
      const [isTooltipOpen, setIsTooltipOpen] = useState(false);
      const isDesktop = useMediaQuery("(min-width: 640px)");
      return (
        <div className="flex overflow-hidden line-clamp-3 text-left justify-start">
          <TooltipProvider>
            <Tooltip open={isTooltipOpen}>
              <TooltipTrigger asChild>
                <Button
                  variant={"ghost"}
                  onMouseEnter={() => setIsTooltipOpen(true)}
                  onMouseLeave={() => setIsTooltipOpen(false)}
                  onClick={async function() {
                    writeText(link);
                    setIsCopied("Copied!");
                    setTimeout(() => {
                      setIsCopied("Copy to clipboard");
                    }, 750);
                  }}
                >
                  <Clipboard />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isCopied}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {isDesktop ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant={"ghost"}>
                  <Edit />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Bookmark</DialogTitle>
                  <DialogDescription>
                    Update stored bookmark information.
                  </DialogDescription>
                </DialogHeader>
                <InsertBookmarkForm
                  setOpen={setOpen}
                  data={{
                    title: row.getValue("title") as string,
                    link: row.getValue("link") as string,
                    tags: row.getValue("tags") as string[],
                  }}
                />
              </DialogContent>
            </Dialog>
          ) : (
            <Drawer open={open} onOpenChange={setOpen}>
              <DrawerTrigger asChild>
                <Button variant={"ghost"}>
                  <Edit />
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader className="text-left">
                  <DrawerTitle className="text-[1.2rem]">
                    Edit bookmark
                  </DrawerTitle>
                  <DrawerDescription>
                    Update stored bookmark information.
                  </DrawerDescription>
                </DrawerHeader>
                <InsertBookmarkForm
                  setOpen={setOpen}
                  data={{
                    title: row.getValue("title") as string,
                    link: row.getValue("link") as string,
                    tags: row.getValue("tags") as string[],
                  }}
                />
                <DrawerFooter className="pt-2">
                  <DrawerClose asChild>
                    <Button size={"lg"} variant="outline">
                      Cancel
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          )}
          <Button
            variant="link"
            onClick={async function() {
              await openUrl(link);
            }}
            className="cursor-pointer text-left flex-1  justify-start whitespace-pre-wrap  break-all"
          >
            {link}
          </Button>
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      let date = row.getValue("created_at") as Date;
      date = new Date(date);
      return date.toLocaleDateString();
    },
  },
  {
    accessorKey: "tags",
    header: "Tags",
    filterFn: (row, _, filterValue: string[]) => {
      const tags = row.getValue("tags") as string[];
      const cleanedFilterValue = filterValue.map((value) =>
        value.toLowerCase().slice(1),
      );

      return cleanedFilterValue.every((filter) =>
        tags.some(
          (tag) => tag.toLowerCase().includes(filter) || tag === filter,
        ),
      );
    },
    cell: ({ row, table }) => {
      const tags = row.getValue("tags") as string[];
      return (
        <div className="flex gap-2 flex-wrap">
          {tags.map((tag) => (
            <Badge
              key={tag}
              onClick={function() {
                const filters =
                  (table.getColumn("tags")?.getFilterValue() as string[]) || [];
                table
                  .getColumn("tags")
                  ?.setFilterValue([...filters, `#${tag}`]);
              }}
              className="cursor-pointer"
            >
              {tag}
            </Badge>
          ))}
        </div>
      );
    },
  },
];
