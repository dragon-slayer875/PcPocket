import { BookmarkQueryItem } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Clipboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "../badge";
import { openUrl } from "@tauri-apps/plugin-opener";

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
    enableHiding: true,
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => {
      const title = row.getValue("title") as string;
      return (
        <div className="text-left whitespace-pre-line line-clamp-3">
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
      return (
        <div className="flex overflow-hidden line-clamp-3 text-left justify-start">
          <Button variant={"ghost"}>
            <Clipboard />
          </Button>
          <Button
            variant="link"
            onClick={async function () {
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
