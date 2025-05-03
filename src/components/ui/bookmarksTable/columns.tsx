import { BookmarkQueryItem } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import { openUrl } from "@tauri-apps/plugin-opener";

export const columns: ColumnDef<BookmarkQueryItem>[] = [
  {
    accessorKey: "id",
    size: 60,
    header: "Id",
  },
  {
    accessorKey: "icon_link",
    size: 60,
    header: () => {
      return <span className="ml-2">Icon</span>;
    },
    cell: ({ row }) => {
      const iconLink = row.getValue("icon_link") as string;
      if (!iconLink) {
        return <Globe className="h-7 w-7 mx-2.5" />;
      }
      return (
        <img
          src={iconLink}
          alt="icon"
          className="h-7 w-7 mx-2.5"
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
    minSize: 350,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const title = row.getValue("title") as string;
      return (
        <div className="text-left items-center overflow-hidden overflow-ellipsis break-after-all whitespace-nowrap">
          {title}
        </div>
      );
    },
  },
  {
    accessorKey: "link",
    minSize: 350,
    header: "Link",
    cell: ({ row }) => {
      const link = row.getValue("link") as string;
      return (
        <span
          className="text-primary underline-offset-4 hover:underline active:underline inline-block flex-1 overflow-hidden overflow-ellipsis cursor-pointer"
          onClick={() => openUrl(link)}
        >
          {link}
        </span>
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
      const dateValue = new Date(
        row.getValue("created_at"),
      ).toLocaleDateString();
      return <div className="text-center flex-1">{dateValue}</div>;
    },
  },
  {
    accessorKey: "tags",
    enableHiding: false,
  },
];
