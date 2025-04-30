import { BookmarkQueryItem } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import { openUrl } from "@tauri-apps/plugin-opener";
// import { useEffect, useState } from "react";
// import { BookmarkForm } from "@/components/bookmarkForm";
// import {
//   useDeleteBookmarkMutation,
//   useDeleteMultipleBookmarksMutation,
//   useUpdateBookmarkMutation,
//   useUpdateTagsMutation,
// } from "@/lib/queries";
// import { DrawerDialog } from "../drawerDialog";

export const columns: ColumnDef<BookmarkQueryItem>[] = [
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
        <div className="text-left select-text items-center overflow-hidden overflow-ellipsis break-after-all whitespace-nowrap">
          {title}
        </div>
      );
    },
  },
  // {
  //   id: "actions",
  //   header: ({ table }) => {
  //     const [open, setOpen] = useState(false);
  //     const deleteBookmarks = useDeleteMultipleBookmarksMutation();
  //
  //     return (
  //       <div className="flex flex-1 gap-2 justify-center items-center">
  //         <span>Actions</span>
  //         {(table.getIsSomeRowsSelected() || table.getIsAllRowsSelected()) && (
  //           <DrawerDialog
  //             open={open}
  //             setOpen={setOpen}
  //             trigger={
  //               <Button
  //                 variant={"ghost"}
  //                 className="text-destructive hover:text-destructive"
  //               >
  //                 <Trash />
  //               </Button>
  //             }
  //             content={
  //               <div className="flex flex-col gap-4">
  //                 <Button
  //                   size={"lg"}
  //                   variant={"destructive"}
  //                   onClick={async function () {
  //                     const tableData = table.getSelectedRowModel();
  //                     const ids: number[] = tableData.rows.map((row) =>
  //                       row.getValue("id"),
  //                     );
  //                     await deleteBookmarks.mutateAsync({
  //                       ids: ids,
  //                     });
  //                     setOpen(false);
  //                   }}
  //                 >
  //                   Confirm
  //                 </Button>
  //               </div>
  //             }
  //             description="Remove multiple bookmark entries from the database."
  //             title="Delete bookmarks"
  //           />
  //         )}
  //       </div>
  //     );
  //   },
  //   cell: ({ row }) => {
  //   },
  // },
  {
    accessorKey: "link",
    minSize: 350,
    header: () => {
      return <span className="ml-4">Link</span>;
    },
    cell: ({ row }) => {
      const link = row.getValue("link") as string;
      return (
        <span
          className="text-primary underline-offset-4 hover:underline active:underline inline-block flex-1 overflow-hidden overflow-ellipsis select-text cursor-pointer"
          onClick={function() {
            openUrl(link);
          }}
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
    // header: ({ table }) => {
    //   const [open, setOpen] = useState(false);
    //   const updateTags = useUpdateTagsMutation();
    //   const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
    //   const [tagsToDelete, setTagsToDelete] = useState<Set<string>>(new Set());
    //   const [tagsToAdd, setTagsToAdd] = useState<Set<string>>(new Set());
    //   const [tagsInputValue, setTagsInputValue] = useState("");
    //
    //   useEffect(() => {
    //     const initialSelectedTags = new Set<string>();
    //     const tableData = table.getSelectedRowModel();
    //     tableData.rows.forEach((row) => {
    //       const tags = row.getValue("tags") as string[];
    //       tags.forEach((tag) => {
    //         initialSelectedTags.add(tag);
    //       });
    //     });
    //     setSelectedTags(initialSelectedTags);
    //
    //     return function() {
    //       setSelectedTags(initialSelectedTags);
    //       setTagsToDelete(new Set());
    //       setTagsToAdd(new Set());
    //       setTagsInputValue("");
    //     };
    //   }, [table.getSelectedRowModel()]);
    //
    //   function handleDeleteTag(tag: string) {
    //     if (selectedTags.has(tag)) {
    //       setSelectedTags((prev) => {
    //         prev.delete(tag);
    //         return new Set(prev);
    //       });
    //       setTagsToDelete((prev) => prev.add(tag));
    //     } else {
    //       setSelectedTags((prev) => prev.add(tag));
    //       setTagsToDelete((prev) => {
    //         prev.delete(tag);
    //         return new Set(prev);
    //       });
    //     }
    //   }
    //
    //   return (
    //     <div className="flex gap-2 items-center flex-1">
    //       <span>Tags</span>
    //       {(table.getIsSomeRowsSelected() || table.getIsAllRowsSelected()) && (
    //         <DrawerDialog
    //           open={open}
    //           setOpen={setOpen}
    //           trigger={
    //             <Button variant={"ghost"}>
    //               <Edit />
    //             </Button>
    //           }
    //           content={
    //             <>
    //               <div className="flex gap-2 flex-wrap overflow-y-scroll">
    //                 {Array.from(selectedTags).map((tag) => (
    //                   <Button
    //                     size={"sm"}
    //                     key={tag}
    //                     className="cursor-pointer rounded-lg"
    //                     onClick={function() {
    //                       handleDeleteTag(tag);
    //                     }}
    //                   >
    //                     <span>{tag}</span>
    //                   </Button>
    //                 ))}
    //               </div>
    //               {tagsToDelete.size > 0 && <Separator />}
    //               <div className="flex gap-2 flex-wrap">
    //                 {Array.from(tagsToDelete).map((tag) => (
    //                   <Button
    //                     size={"sm"}
    //                     key={tag}
    //                     className="cursor-pointer rounded-lg"
    //                     variant={"destructive"}
    //                     onClick={function() {
    //                       handleDeleteTag(tag);
    //                     }}
    //                   >
    //                     <span>{tag}</span>
    //                   </Button>
    //                 ))}
    //               </div>
    //               <Input
    //                 type="text"
    //                 value={tagsInputValue}
    //                 onChange={function(e) {
    //                   setTagsInputValue(e.target.value);
    //                   setTagsToAdd(new Set(e.target.value.split(",")));
    //                 }}
    //                 autoFocus
    //                 placeholder="Enter tags to add: tag1,tag2"
    //               />
    //               <Button
    //                 size={"lg"}
    //                 hidden={tagsToDelete.size === 0 && tagsToAdd.size === 0}
    //                 onClick={async function() {
    //                   const tableData = table.getSelectedRowModel();
    //                   const ids: number[] = tableData.rows.map((row) =>
    //                     row.getValue("id"),
    //                   );
    //                   await updateTags.mutateAsync({
    //                     ids: ids,
    //                     tagsToAdd: Array.from(tagsToAdd).filter((tag) => tag),
    //                     tagsToDelete: Array.from(tagsToDelete),
    //                   });
    //                   setOpen(false);
    //                 }}
    //               >
    //                 Update
    //               </Button>
    //             </>
    //           }
    //           description="Edit tags of multiple entries."
    //           title="Tags"
    //         />
    //       )}
    //     </div>
    //   );
    // },
    // cell: ({ row, table }) => {
    //   const tags = row.getValue("tags") as string[];
    //   return (
    //     <div className="flex gap-2">
    //       {tags.map((tag) => (
    //         <Badge
    //           key={tag}
    //           onClick={function() {
    //             const filters =
    //               (table.getColumn("tags")?.getFilterValue() as string[]) || [];
    //             table.getColumn("tags")?.setFilterValue([...filters, `${tag}`]);
    //           }}
    //           className="cursor-pointer"
    //         >
    //           {tag}
    //         </Badge>
    //       ))}
    //     </div>
    //   );
    // },
  },
];
