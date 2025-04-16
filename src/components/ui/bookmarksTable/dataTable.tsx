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

import { useEffect, useRef, useState, memo, useCallback, useMemo } from "react";
import { Button } from "../button";
import { AddBookmarkDrawerDialog } from "../addBookmark";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { toast } from "sonner";
import { Import } from "lucide-react";
import { DataTablePagination } from "./tablePagination";
import { ImportWizard } from "@/components/importWizard";
import { useGetBookmarksQuery } from "@/lib/queries";
import { columns } from "./columns";

// interface DataTableProps<TData, TValue> { }

// Create a memoized cell component
const MemoizedCell = memo(({ cell }: { cell: any }) => {
  return flexRender(cell.column.columnDef.cell, cell.getContext());
});

export function DataTable() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const { data } = useGetBookmarksQuery(
    pagination.pageSize,
    pagination.pageIndex,
  );
  console.log(data);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [openImport, setOpenImport] = useState(false);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    id: false,
    created_at: false,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const searchRef = useRef<HTMLInputElement>(null);

  const memoizedColumns = useMemo(() => columns, [columns]);

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
    rowCount: data?.totalCount,
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
          className="max-w-md mr-1"
        />
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
      <div className="rounded-md border overflow-auto relative">
        <Table>
          <TableHeader className="sticky top-0 z-1">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
          <TableBody>
            {data || table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => {
                      if (cell.column.id === "select") {
                        return (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        );
                      }
                      return (
                        // Use the memoized cell component
                        <TableCell key={cell.id}>
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
      <DataTablePagination table={table} />
    </div>
  );
}
