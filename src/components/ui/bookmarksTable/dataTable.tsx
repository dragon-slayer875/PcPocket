import {
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState,
  RowSelectionState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  Table as ReactTable,
  Row,
} from "@tanstack/react-table";

import {
  useVirtualizer,
  VirtualItem,
  Virtualizer,
} from "@tanstack/react-virtual";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  RefObject,
  useMemo,
  MouseEvent,
} from "react";
import { Button } from "../button";
import { AddBookmarkDrawerDialog } from "../addBookmark";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { toast } from "sonner";
import { Edit, Import, Trash } from "lucide-react";
import { DataTablePagination } from "./tablePagination";
import { ImportWizard } from "@/components/importWizard";
import {
  useDeleteBookmarkMutation,
  useDeleteMultipleBookmarksMutation,
  useGetAllTagsQuery,
  useGetBookmarksQuery,
  useUpdateBookmarkMutation,
  useUpdateTagsMutation,
} from "@/lib/queries";
import { columns } from "./columns";
import { BookmarkQueryItem } from "@/types";
import { useDebounce } from "@/lib/utils";
import AutocompleteInput from "../autoCompleteInput";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Badge } from "../badge";
import { DrawerDialog } from "../drawerDialog";
import { CopyButton } from "../copyButton";
import { BookmarkForm } from "@/components/bookmarkForm";
import { Separator } from "../separator";
import { Input } from "../input";
import { ShortcutsListDialog } from "@/components/shortcutsListDialog";

export function DataTable() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: Number(localStorage.getItem("bookmarksTablePageSize")) || 10,
  });
  const [allBookmarks, setAllBookmarks] = useState<boolean>(
    Boolean(localStorage.getItem("bookmarksTableAllRows")) || false,
  );
  const [filterInput, setFilter] = useState<string | undefined>(undefined);
  const debouncedFilterInput = useDebounce(filterInput || "", 250);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const { data } = useGetBookmarksQuery(
    pagination.pageSize,
    pagination.pageIndex,
    allBookmarks,
    columnFilters,
    sorting,
  );
  const { data: tags } = useGetAllTagsQuery();
  const [openImport, setOpenImport] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    id: false,
    tags: false,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const searchRef = useRef<HTMLInputElement>(null);

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const memoizedColumns = useMemo(() => columns, []);

  const table = useReactTable({
    data: data?.bookmarks || [],
    columns: memoizedColumns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    rowCount: data?.totalCount,
    pageCount: data?.totalPages,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  });

  const toggleTagsFilter = useCallback(
    (tags: string[]) => {
      if (!tags || tags.length === 0) {
        setColumnFilters((old) => {
          return old.filter((f) => f.id !== "tags");
        });
      } else {
        table.getColumn("tags")?.setFilterValue(tags);
      }
    },
    [table],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const activeElement = document.activeElement as HTMLElement | null;
      const isTyping =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        (activeElement && activeElement.isContentEditable);

      if (event.shiftKey && event.key === "Enter") {
        event.preventDefault();
        const selectedRows = table.getSelectedRowModel().rows;
        if (selectedRows.length === 1) {
          const selectedRow = selectedRows[0];
          const link = selectedRow.getValue("link") as string;
          openUrl(link);
        }
      }

      if (event.shiftKey && event.key === "Backspace") {
        event.preventDefault();
        setFilter("");
        setColumnFilters([]);
      }

      if (isTyping) return;

      if (event.ctrlKey && event.key === "a" && !event.altKey) {
        event.preventDefault();
        table.toggleAllRowsSelected();
      }

      if (event.ctrlKey && event.key === "c") {
        event.preventDefault();
        const selectedRows = table.getSelectedRowModel().rows;
        if (selectedRows.length === 1) {
          const selectedRow = selectedRows[0];
          writeText(selectedRow.getValue("link") as string);
          toast("Link copied to clipboard.");
        }
      }

      if ((event.ctrlKey && event.key === "f") || event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [table]);

  useEffect(() => {
    if (!debouncedFilterInput) {
      setColumnFilters((old) => {
        return old.filter((f) => f.id !== "title");
      });
      return;
    }

    // Update filters
    table.getColumn("title")?.setFilterValue(debouncedFilterInput);
  }, [debouncedFilterInput]);

  useEffect(() => {
    const firstRow = table.getRowModel().rows[0];
    setRowSelection(
      firstRow
        ? {
            [firstRow.id]: true,
          }
        : {},
    );
  }, [columnFilters]);

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex justify-between">
        <div className="flex gap-2 flex-1">
          <AutocompleteInput
            suggestions={tags}
            inputValue={filterInput}
            setInputValue={setFilter}
            inputRef={searchRef}
            selectedSuggestions={
              (table.getColumn("tags")?.getFilterValue() as string[]) || []
            }
            setSelectedSuggestions={toggleTagsFilter}
          />
          {columnFilters && columnFilters.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => {
                setColumnFilters([]);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <ShortcutsListDialog />
          <Actions
            rows={table.getSelectedRowModel().rows}
            tagFilters={columnFilters.reduce((acc: string[], filter) => {
              if (filter.id === "tags") {
                return filter.value as string[];
              }
              return acc;
            }, [])}
          />
          <ImportWizard
            open={openImport}
            setOpen={setOpenImport}
            trigger={
              <Button className="flex justify-between">
                <Import />
                <span>Import</span>
              </Button>
            }
          />
          <AddBookmarkDrawerDialog />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="ml-auto">
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel
            defaultSize={20}
            collapsible
            className="flex flex-col flex-1 gap-4"
          >
            <TagBadgesList
              tags={tags || []}
              selectedTags={
                (table.getColumn("tags")?.getFilterValue() as string[]) || []
              }
              onToggleTag={toggleTagsFilter}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel className="flex flex-col flex-1 gap-4 pl-4">
            <div
              ref={tableContainerRef}
              className="rounded-md border overflow-auto relative flex-1"
            >
              <Table className="relative grid flex-1">
                <TableHeader className="sticky grid top-0 z-1">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      className="bg-secondary flex w-full"
                      key={headerGroup.id}
                    >
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead
                            key={header.id}
                            className="flex items-center"
                            style={{ width: header.getSize() }}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                {table.getRowModel().rows.length === 0 && (
                  <TableBody>
                    <TableRow>
                      <TableCell
                        className="text-muted-foreground flex items-center justify-center"
                        colSpan={table.getAllColumns().length}
                      >
                        No bookmarks found
                      </TableCell>
                    </TableRow>
                  </TableBody>
                )}
                <TableBodyVirtual
                  table={table}
                  tableContainerRef={tableContainerRef}
                />
              </Table>
            </div>
            <CurrentSelectionDetails rows={table.getSelectedRowModel().rows} />
            <DataTablePagination
              table={table}
              setAllRows={setAllBookmarks}
              allRows={allBookmarks}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

interface TableBodyVirtualProps {
  table: ReactTable<BookmarkQueryItem>;
  tableContainerRef: RefObject<HTMLDivElement | null>;
}

function TableBodyVirtual({ table, tableContainerRef }: TableBodyVirtualProps) {
  const [dragging, setDragging] = useState(false);
  const { rows } = table.getRowModel();

  useEffect(() => {
    // Force recalculation when the component mounts or when data changes
    if (rows.length > 0) {
      rowVirtualizer.measure();
    }
  }, [rows.length]);

  // Important: Keep the row virtualizer in the lowest component possible to avoid unnecessary re-renders.
  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,
    estimateSize: () => 33, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    //measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== "undefined" &&
      navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
    scrollToFn: (offset, _canSmooth, instance) => {
      const scrollElement = instance.scrollElement;
      if (scrollElement) {
        scrollElement.scrollTop = offset;
      }
    },
    // This enables the virtualizer to recalculate when needed
    initialOffset: 0,
  });

  const handleSelect = useCallback(
    (event: MouseEvent, row: Row<BookmarkQueryItem>) => {
      // For mousedown events (start of drag)
      if (event.type === "mousedown") {
        if (!event.shiftKey) {
          table.setRowSelection({});
        }
        row.toggleSelected();
        setDragging(true);
      }

      // For mouseup events (end of drag)
      else if (event.type === "mouseup") {
        setDragging(false);
      }

      // For mouseenter events (during drag)
      else if (event.type === "mouseenter") {
        if (dragging) {
          row.toggleSelected(true); // Force select during drag
        }
      }

      // Prevent default browser behavior where appropriate
      if (["mousedown", "click"].includes(event.type)) {
        event.preventDefault();
      }
    },
    [dragging, table, setDragging],
  );

  return (
    <TableBody
      className="grid relative"
      style={{
        height: `${rowVirtualizer.getTotalSize()}px`, //tells scrollbar how big the table is
      }}
    >
      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
        const row = rows[virtualRow.index] as Row<BookmarkQueryItem>;
        return (
          <TableBodyVirtualRow
            key={row.id}
            row={row}
            virtualRow={virtualRow}
            rowVirtualizer={rowVirtualizer}
            handleSelect={handleSelect}
          />
        );
      })}
    </TableBody>
  );
}

interface TableBodyVirtualRowProps {
  row: Row<BookmarkQueryItem>;
  virtualRow: VirtualItem;
  rowVirtualizer: Virtualizer<HTMLDivElement, HTMLTableRowElement>;
}

function TableBodyVirtualRow({
  row,
  virtualRow,
  rowVirtualizer,
  handleSelect,
}: TableBodyVirtualRowProps & {
  handleSelect: (event: MouseEvent, row: Row<BookmarkQueryItem>) => void;
}) {
  return (
    <TableRow
      data-index={virtualRow.index} //needed for dynamic row height measurement
      ref={(node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
      key={row.id}
      className={`flex absolute w-full ${row.getIsSelected() ? "bg-accent-foreground/10" : ""}`}
      style={{
        transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
      }}
      onMouseEnter={(event) => {
        handleSelect(event, row);
      }}
      onMouseDown={(event) => {
        handleSelect(event, row);
      }}
      onMouseUp={(event) => {
        handleSelect(event, row);
      }}
    >
      {row.getVisibleCells().map((cell) => {
        return (
          <TableCell
            key={cell.id}
            className="flex items-center"
            style={{
              width: cell.column.getSize(),
            }}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        );
      })}
    </TableRow>
  );
}

function TagBadgesList({
  tags,
  selectedTags,
  onToggleTag,
}: {
  tags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string[]) => void;
}) {
  if (!tags || tags.length === 0) {
    return <div className="text-muted-foreground">No tags</div>;
  }

  return (
    <>
      <h3 className="text-muted-foreground">Tags</h3>
      <div className="px-2 py-1 flex flex-col gap-3 overflow-auto">
        {tags.map((tag) => (
          <Button
            key={tag}
            size="sm"
            variant="outline"
            className={`
            cursor-pointer transition-all h-7 w-min rounded-lg hover:bg-accent-foreground/10
            ${selectedTags.includes(tag) ? "ring-primary ring-2 ml-1" : ""}`}
            onClick={() => {
              if (selectedTags.includes(tag)) {
                onToggleTag(selectedTags.filter((t) => t !== tag));
              } else {
                onToggleTag([...selectedTags, tag]);
              }
            }}
          >
            {tag}
          </Button>
        ))}
      </div>
    </>
  );
}

function Actions({
  rows,
  tagFilters,
}: {
  rows: Row<BookmarkQueryItem>[];
  tagFilters: string[];
}) {
  const updateTags = useUpdateTagsMutation();
  const [tagsInputValue, setTagsInputValue] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagsToAdd, setTagsToAdd] = useState<string[]>([]);
  const [tagsToDelete, setTagsToDelete] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const updateBookmark = useUpdateBookmarkMutation();
  const deleteBookmark = useDeleteBookmarkMutation();
  const deleteMultipleBookmarks = useDeleteMultipleBookmarksMutation();

  useEffect(() => {
    setTagsToAdd([]);
    setTagsToDelete([]);
    setTagsInputValue("");
    setSelectedTags(tagFilters.length > 0 ? tagFilters : []);
  }, [rows]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const activeElement = document.activeElement as HTMLElement | null;
      const isTyping =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        (activeElement && activeElement.isContentEditable);

      if (isTyping) return;

      if (event.key === "Delete") {
        if (rows.length > 0) {
          event.preventDefault();
          setOpenDelete(true);
        }
      }

      if (event.ctrlKey && event.key === "e") {
        if (rows.length === 1 || (rows.length > 1 && selectedTags.length > 0)) {
          event.preventDefault();
          setOpen(true);
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [rows]);

  function handleDeleteTag(tag: string) {
    if (!tagsToDelete.includes(tag)) {
      setSelectedTags((prev) => prev.filter((t) => t !== tag));
      setTagsToDelete((prev) => [...prev, tag]);
    } else {
      setSelectedTags((prev) => [...prev, tag]);
      setTagsToDelete((prev) => prev.filter((t) => t !== tag));
    }
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-1 justify-center">
        <CopyButton text={""} disabled />
        <Button variant={"ghost"} disabled>
          <Edit />
        </Button>
        <Button
          variant={"ghost"}
          disabled
          className="text-destructive hover:text-destructive"
        >
          <Trash />
        </Button>
      </div>
    );
  }

  if (rows?.length === 1) {
    const row = rows[0];
    return (
      <div className="flex flex-1 justify-center">
        <CopyButton text={row.getValue("link")} />
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
                created_at: row.getValue("created_at") as number,
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
            <Button
              size={"lg"}
              variant={"destructive"}
              onClick={() => {
                deleteBookmark.mutate(row.getValue("id") as number);
                setOpenDelete(false);
              }}
            >
              Yes
            </Button>
          }
          description="Are you sure you want to remove this bookmark from the database?"
          title="Delete Bookmark"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 justify-center">
      <CopyButton text={""} disabled />
      <DrawerDialog
        open={open}
        setOpen={setOpen}
        trigger={
          <Button variant={"ghost"} disabled={selectedTags.length === 0}>
            <Edit />
          </Button>
        }
        content={
          <>
            <div className="flex gap-2 flex-wrap overflow-y-scroll">
              {selectedTags?.map((tag) => (
                <Button
                  size={"sm"}
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer rounded-lg"
                  onClick={() => handleDeleteTag(tag)}
                >
                  <span>{tag}</span>
                </Button>
              ))}
            </div>
            {tagsToDelete.length > 0 && <Separator />}
            <div className="flex gap-2 flex-wrap">
              {tagsToDelete.map((tag) => (
                <Button
                  size={"sm"}
                  key={tag}
                  className="cursor-pointer rounded-lg"
                  variant={"destructive"}
                  onClick={() => handleDeleteTag(tag)}
                >
                  <span>{tag}</span>
                </Button>
              ))}
            </div>
            <Input
              type="text"
              value={tagsInputValue}
              onChange={(e) => {
                setTagsInputValue(e.target.value);
                const tags = e.target.value.split(",").map((tag) => tag.trim());
                setTagsToAdd(tags);
              }}
              autoFocus
              placeholder="Enter tags to add: tag1,tag2"
            />
            <Button
              size={"lg"}
              hidden={tagsToDelete.length === 0 && tagsToAdd.length === 0}
              onClick={() => {
                const ids: number[] = rows.map((row) => row.getValue("id"));
                updateTags.mutate({
                  ids,
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
            <Button
              size={"lg"}
              variant={"destructive"}
              onClick={() => {
                const ids: number[] = rows.map((row) => row.getValue("id"));
                deleteMultipleBookmarks.mutate({
                  ids: ids,
                });
                setOpen(false);
              }}
            >
              Confirm
            </Button>
          </div>
        }
        description="Are you sure you want to remove multiple bookmarks from the database?"
        title="Delete bookmarks"
      />
    </div>
  );
}

function CurrentSelectionDetails({ rows }: { rows: Row<BookmarkQueryItem>[] }) {
  if (rows.length === 0) {
    return;
  }

  if (rows.length === 1) {
    const row = rows[0];
    return (
      <div className="flex justify-between items-center px-2">
        <div className="flex flex-col">
          <span>{row.getValue("title") as string}</span>
          <span className="text-muted-foreground text-sm">
            {row.getValue("link") as string}
          </span>
        </div>
        <div className="flex gap-2">
          {(row.getValue("tags") as string[])?.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      </div>
    );
  }
}
