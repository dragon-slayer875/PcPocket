import { BookmarkQueryItem } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Clipboard, Edit, Globe, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "../badge";
import { openUrl } from "@tauri-apps/plugin-opener";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { useEffect, useState } from "react";
import { BookmarkForm } from "@/components/bookmarkForm";
import {
  useDeleteBookmarkMutation,
  useDeleteMultipleBookmarksMutation,
  useUpdateBookmarkMutation,
  useUpdateTagsMutation,
} from "@/lib/queries";
import { DrawerDialog } from "../drawerDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "../separator";
import { Input } from "../input";

export const columns: ColumnDef<BookmarkQueryItem>[] = [
  {
    id: "select",
    size: 50,
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="mx-2 border-foreground"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="mx-2 border-foreground"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    size: 60,
    header: "Id",
  },
  {
    accessorKey: "icon_link",
    size: 60,
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
    minSize: 350,
    header: "Title",
    cell: ({ row }) => {
      const title = row.getValue("title") as string;
      return (
        <div className="text-left select-text items-center overflow-hidden overflow-ellipsis break-after-all whitespace-nowrap">
          {title}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: ({ table }) => {
      const [open, setOpen] = useState(false);
      const deleteBookmarks = useDeleteMultipleBookmarksMutation();

      return (
        <div className="flex flex-1 gap-2 justify-center items-center">
          <span>Actions</span>
          {(table.getIsSomeRowsSelected() || table.getIsAllRowsSelected()) && (
            <DrawerDialog
              open={open}
              setOpen={setOpen}
              trigger={
                <Button
                  variant={"ghost"}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash />
                </Button>
              }
              content={
                <div className="flex flex-col gap-4">
                  <Button
                    size={"lg"}
                    variant={"destructive"}
                    onClick={async function () {
                      const tableData = table.getSelectedRowModel();
                      const ids: number[] = tableData.rows.map((row) =>
                        row.getValue("id"),
                      );
                      await deleteBookmarks.mutateAsync({
                        ids: ids,
                      });
                      setOpen(false);
                    }}
                  >
                    Confirm
                  </Button>
                </div>
              }
              description="Remove multiple bookmark entries from the database."
              title="Delete bookmarks"
            />
          )}
        </div>
      );
    },
    cell: ({ row }) => {
      const [open, setOpen] = useState(false);
      const [openDelete, setOpenDelete] = useState(false);
      const updateBookmark = useUpdateBookmarkMutation();
      const deleteBookmark = useDeleteBookmarkMutation();
      return (
        <div className="flex flex-1 justify-center">
          <Button
            variant={"ghost"}
            onClick={async function () {
              writeText(row.getValue("link") as string);
            }}
          >
            <Clipboard />
          </Button>
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
                className="text-destructive hover:text-destructive"
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
    minSize: 350,
    header: () => {
      return <span className="ml-4">Link</span>;
    },
    cell: ({ row }) => {
      const link = row.getValue("link") as string;
      return (
        <Button
          variant={"link"}
          className="inline-block flex-1 overflow-hidden h-max overflow-ellipsis text-left justify-start select-text cursor-pointer"
          onClick={function () {
            openUrl(link);
          }}
        >
          {link}
        </Button>
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
    header: ({ table }) => {
      const [open, setOpen] = useState(false);
      const updateTags = useUpdateTagsMutation();
      const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
      const [tagsToDelete, setTagsToDelete] = useState<Set<string>>(new Set());
      const [tagsToAdd, setTagsToAdd] = useState<Set<string>>(new Set());
      const [tagsInputValue, setTagsInputValue] = useState("");

      useEffect(() => {
        const initialSelectedTags = new Set<string>();
        const tableData = table.getSelectedRowModel();
        tableData.rows.forEach((row) => {
          const tags = row.getValue("tags") as string[];
          tags.forEach((tag) => {
            initialSelectedTags.add(tag);
          });
        });
        setSelectedTags(initialSelectedTags);

        return function () {
          setSelectedTags(initialSelectedTags);
          setTagsToDelete(new Set());
          setTagsToAdd(new Set());
          setTagsInputValue("");
        };
      }, [table.getSelectedRowModel()]);

      function handleDeleteTag(tag: string) {
        if (selectedTags.has(tag)) {
          setSelectedTags((prev) => {
            prev.delete(tag);
            return new Set(prev);
          });
          setTagsToDelete((prev) => prev.add(tag));
        } else {
          setSelectedTags((prev) => prev.add(tag));
          setTagsToDelete((prev) => {
            prev.delete(tag);
            return new Set(prev);
          });
        }
      }

      return (
        <div className="flex gap-2 items-center flex-1">
          <span>Tags</span>
          {(table.getIsSomeRowsSelected() || table.getIsAllRowsSelected()) && (
            <DrawerDialog
              open={open}
              setOpen={setOpen}
              trigger={
                <Button variant={"ghost"}>
                  <Edit />
                </Button>
              }
              content={
                <>
                  <div className="flex gap-2 flex-wrap overflow-y-scroll">
                    {Array.from(selectedTags).map((tag) => (
                      <Button
                        size={"sm"}
                        key={tag}
                        className="cursor-pointer rounded-lg"
                        onClick={function () {
                          handleDeleteTag(tag);
                        }}
                      >
                        <span>{tag}</span>
                      </Button>
                    ))}
                  </div>
                  {tagsToDelete.size > 0 && <Separator />}
                  <div className="flex gap-2 flex-wrap">
                    {Array.from(tagsToDelete).map((tag) => (
                      <Button
                        size={"sm"}
                        key={tag}
                        className="cursor-pointer rounded-lg"
                        variant={"destructive"}
                        onClick={function () {
                          handleDeleteTag(tag);
                        }}
                      >
                        <span>{tag}</span>
                      </Button>
                    ))}
                  </div>
                  <Input
                    type="text"
                    value={tagsInputValue}
                    onChange={function (e) {
                      setTagsInputValue(e.target.value);
                      setTagsToAdd(new Set(e.target.value.split(",")));
                    }}
                    autoFocus
                    placeholder="Enter tags to add: tag1,tag2"
                  />
                  <Button
                    size={"lg"}
                    hidden={tagsToDelete.size === 0 && tagsToAdd.size === 0}
                    onClick={async function () {
                      const tableData = table.getSelectedRowModel();
                      const ids: number[] = tableData.rows.map((row) =>
                        row.getValue("id"),
                      );
                      await updateTags.mutateAsync({
                        ids: ids,
                        tagsToAdd: Array.from(tagsToAdd).filter((tag) => tag),
                        tagsToDelete: Array.from(tagsToDelete),
                      });
                      setOpen(false);
                    }}
                  >
                    Update
                  </Button>
                </>
              }
              description="Edit tags of multiple entries."
              title="Tags"
            />
          )}
        </div>
      );
    },
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
        <div className="flex gap-2">
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
