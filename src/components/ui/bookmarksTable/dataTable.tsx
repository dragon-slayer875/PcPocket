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
} from "react";
import { Button } from "../button";
import { AddBookmarkDrawerDialog } from "../addBookmark";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { toast } from "sonner";
import { Import } from "lucide-react";
import { DataTablePagination } from "./tablePagination";
import { ImportWizard } from "@/components/importWizard";
import { useGetAllTagsQuery, useGetBookmarksQuery } from "@/lib/queries";
import { columns } from "./columns";
import { BookmarkQueryItem } from "@/types";
import { useDebounce } from "@/lib/utils";
import AutocompleteInput from "../autoCompleteInput";

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
    debugTable: true,
  });

  const handleFindShortcut = useCallback((event: KeyboardEvent) => {
    const activeElement = document.activeElement as HTMLElement | null;
    if ((event.ctrlKey && event.key === "f") || event.key === "/") {
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.isContentEditable
      ) {
        return;
      }
      event.preventDefault();
      searchRef.current?.focus();
    }
  }, []);

  const handleCopyShortcut = useCallback(
    (event: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement | null;
      if (event.ctrlKey && event.key === "c") {
        if (
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          (activeElement && activeElement.isContentEditable)
        ) {
          return;
        }
        event.preventDefault();
        const selectedRows = table.getSelectedRowModel().rows;
        if (selectedRows.length === 1) {
          const selectedRow = selectedRows[0];
          writeText(selectedRow.getValue("link") as string);
          toast("Link copied to clipboard.");
        }
      }
    },
    [table],
  );

  const handleSelectAllShortcut = useCallback(
    (event: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement | null;
      if (event.ctrlKey && event.key === "a") {
        if (
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          (activeElement && activeElement.isContentEditable)
        ) {
          return;
        }
        event.preventDefault();
        table.toggleAllRowsSelected();
      }
    },
    [table],
  );

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
    document.addEventListener("keydown", handleFindShortcut);
    document.addEventListener("keydown", handleCopyShortcut);
    document.addEventListener("keydown", handleSelectAllShortcut);

    return () => {
      document.removeEventListener("keydown", handleFindShortcut);
      document.removeEventListener("keydown", handleCopyShortcut);
      document.removeEventListener("keydown", handleSelectAllShortcut);
    };
  }, [handleFindShortcut, handleCopyShortcut, handleSelectAllShortcut]);

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

  // Optimize your second useEffect to avoid unnecessary operations
  useEffect(() => {
    // Only run this if filtering is active
    const filteredRowsLength = table.getFilteredRowModel().rows.length;
    const dataLength = data?.bookmarks?.length || 0;

    if (filteredRowsLength > 0 && filteredRowsLength < dataLength) {
      const firstRowId = table.getFilteredRowModel().rows[0].id;
      // Only update if selection needs to change
      if (!rowSelection[firstRowId]) {
        setRowSelection({ [firstRowId]: true });
      }
    } else if (
      Object.keys(rowSelection).length === 1 &&
      table.getSelectedRowModel().rows.length === 1
    ) {
      setRowSelection({});
    }
  }, [data?.bookmarks.length, table.getFilteredRowModel().rows.length]);

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
          <ResizablePanel className="flex flex-col flex-1 gap-4">
            <div
              ref={tableContainerRef}
              className="ml-4 rounded-md border overflow-auto relative flex-1"
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
            More details of currently selected row
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
}: TableBodyVirtualRowProps) {
  return (
    <TableRow
      data-index={virtualRow.index} //needed for dynamic row height measurement
      ref={(node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
      key={row.id}
      className="flex absolute w-full"
      style={{
        transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
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
            cursor-pointer transition-all h-7 w-min rounded-full hover:bg-accent-foreground/10
            ${selectedTags.includes(tag) ? "ring-primary ring-2" : ""}`}
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
