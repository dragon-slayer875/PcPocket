import { BookmarkQueryItem } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Clipboard, Edit, Globe, Trash } from "lucide-react";

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
import { useState } from "react";
import { BookmarkForm } from "@/components/bookmarkForm";
import {
  useDeleteBookmarkMutation,
  useUpdateBookmarkMutation,
} from "@/lib/queries";
import { DrawerDialog } from "../drawerDialog";

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
        <div className="text-left select-text flex items-center whitespace-pre-line line-clamp-3">
          {title}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const [open, setOpen] = useState(false);
      const [openDelete, setOpenDelete] = useState(false);
      const updateBookmark = useUpdateBookmarkMutation();
      const deleteBookmark = useDeleteBookmarkMutation();
      return (
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={"ghost"}
                  onClick={async function () {
                    writeText(row.getValue("link") as string);
                  }}
                >
                  <Clipboard />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy content to clipboard</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DrawerDialog
            open={open}
            setOpen={setOpen}
            trigger={
              <Button variant={"ghost"}>
                <Edit />
              </Button>
            }
            content={
              <BookmarkForm
                handleSubmit={updateBookmark.mutate}
                setOpen={setOpen}
                data={{
                  id: row.getValue("id") as number,
                  title: row.getValue("title") as string,
                  link: row.getValue("link") as string,
                  tags: row.getValue("tags") as string[],
                }}
              />
            }
            description="Update stored bookmark information."
            title="Edit Bookmark"
          />
          <DrawerDialog
            open={openDelete}
            setOpen={setOpenDelete}
            trigger={
              <Button
                variant={"ghost"}
                className="text-red-300 hover:text-red-400"
              >
                <Trash />
              </Button>
            }
            content={
              <div className="flex flex-col gap-4">
                <div>Are you sure you want to delete this bookmark?</div>
                <Button
                  size={"lg"}
                  variant={"destructive"}
                  onClick={async function () {
                    await deleteBookmark.mutateAsync(
                      row.getValue("id") as number,
                    );
                    setOpenDelete(false);
                  }}
                >
                  Yes
                </Button>
              </div>
            }
            title="Delete Bookmark"
          />
        </div>
      );
    },
  },
  {
    accessorKey: "link",
    header: "Link",
    cell: ({ row }) => {
      const link = row.getValue("link") as string;
      return (
        <div className="flex overflow-hidden line-clamp-3 text-left justify-start">
          <Button
            variant="link"
            onClick={async function () {
              await openUrl(link);
            }}
            className="cursor-pointer select-text text-left flex-1  justify-start whitespace-pre-wrap  break-all"
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
              onClick={function () {
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
