import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowSelectionState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useEffect, useRef, useState, memo, useMemo, useCallback } from "react";
import { Button } from "../button";
import { AddBookmarkDrawerDialog } from "../addBookmark";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { toast } from "sonner";
import { useVirtualizer } from "@tanstack/react-virtual";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

// Create a memoized cell component
const MemoizedCell = memo(({ cell }: { cell: any }) => {
  return flexRender(cell.column.columnDef.cell, cell.getContext());
});

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [windowedData, setWindowedData] = useState<TData[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    id: false,
    created_at: false,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const searchRef = useRef<HTMLInputElement>(null);

  const memoizedColumns = useMemo(() => columns, [columns]);

  useEffect(() => {
    const renderCount = 0;

    return () => {
      console.log(`DataTable rendered ${renderCount} times`);
    };
  }, []);

  const table = useReactTable({
    data: windowedData,
    columns: memoizedColumns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const { rows } = table.getRowModel();

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    count: rows.length,
    estimateSize: () => 33, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    //measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== "undefined" &&
        navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => {
          // Only measure if the element exists and its height might have changed
          if (!element) return 33;
          return element.getBoundingClientRect().height;
        }
        : undefined,
    overscan: 3,
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

  useEffect(() => {
    document.addEventListener("keydown", handleFindShortcut);
    document.addEventListener("keydown", handleCopyShortcut);

    return () => {
      document.removeEventListener("keydown", handleFindShortcut);
      document.removeEventListener("keydown", handleCopyShortcut);
    };
  }, [handleFindShortcut, handleCopyShortcut]);

  // Optimize your second useEffect to avoid unnecessary operations
  useEffect(() => {
    // Only run this if filtering is active
    const filteredRowsLength = table.getFilteredRowModel().rows.length;
    const dataLength = data.length;

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
  }, [data.length, table.getFilteredRowModel().rows.length]);

  useEffect(() => {
    // Only load the first 1000 items initially
    setWindowedData(data.slice(0, 1000));

    // If you need to support filtering on all data, keep the full dataset
    // for filtering but only render the windowed subset
  }, [data]);

  let renderCount = 0;
  renderCount++;

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between mb-2">
        <Input
          placeholder="Filter links: title#tag1#tag2"
          ref={searchRef}
          value={(() => {
            const title =
              (table.getColumn("title")?.getFilterValue() as string) ?? "";
            const tags =
              (table.getColumn("tags")?.getFilterValue() as string[]) ?? [];
            return (
              title +
              [...tags.map((tag) => (tag ? `${tag}` : ""))]
                .filter(Boolean)
                .join("")
            );
          })()}
          onChange={(event) => {
            const inputValue = event.target.value;

            // Extract title (non-tag text at the beginning)
            const title = inputValue.match(/^[^#][\w\s]*/);

            // Extract tags (words after # symbols)
            const tags = inputValue.match(/#[\w\s]*/g) || [];

            // Update filters
            table.getColumn("title")?.setFilterValue(title);
            table.getColumn("tags")?.setFilterValue(tags);
          }}
          className="max-w-md"
        />
        <div className="flex gap-2">
          <AddBookmarkDrawerDialog />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
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
      <div
        className="rounded-md border overflow-auto relative"
        ref={tableContainerRef}
      >
        <Table className="grid">
          <TableHeader className="sticky grid top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="flex items-center w-full"
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="flex items-center flex-1"
                      style={{
                        width: header.getSize(),
                      }}
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
          <TableBody
            className="grid grid-cols-[repeat(auto)] relative"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`, //tells scrollbar how big the table is
            }}
          >
            {table.getRowModel().rows?.length ? (
              rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index];
                return (
                  <TableRow
                    data-index={virtualRow.index} //needed for dynamic row height measurement
                    ref={(node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="flex absolute w-full"
                    style={{
                      transform: `translateY(${virtualRow.start}px)`, //this should always be a `style` as it changes on scroll
                    }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      if (cell.column.id === "select") {
                        return (
                          <TableCell
                            key={cell.id}
                            className="flex items-center flex-1"
                            style={{
                              width: cell.column.getSize(),
                            }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        );
                      }
                      return (
                        // Use the memoized cell component
                        <TableCell
                          key={cell.id}
                          className="flex items-center flex-1"
                          style={{
                            width: cell.column.getSize(),
                          }}
                        >
                          {<MemoizedCell cell={cell} />}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
