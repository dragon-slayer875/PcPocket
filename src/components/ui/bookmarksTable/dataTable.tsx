import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  RowSelectionState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
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

import { useEffect, useRef, useState } from "react";
import { Button } from "../button";
import { AddBookmarkDrawerDialog } from "../addBookmark";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { toast } from "sonner";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    id: false,
    created_at: false,
  });
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const searchRef = useRef<HTMLInputElement>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  });

  useEffect(() => {
    function handleFindShortcut(event: KeyboardEvent) {
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
    }

    function handleCopyShortcut(event: KeyboardEvent) {
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
    }

    document.addEventListener("keydown", handleFindShortcut);
    document.addEventListener("keydown", handleCopyShortcut);

    return function () {
      document.removeEventListener("keydown", handleFindShortcut);
      document.removeEventListener("keydown", handleCopyShortcut);
    };
  }, []);

  useEffect(() => {
    // Assuming you have a filtering mechanism in place
    const filteredRows = table.getFilteredRowModel().rows;

    if (filteredRows.length > 0 && filteredRows.length < data.length) {
      const firstRowId = filteredRows[0].id;
      setRowSelection((prev) => ({
        ...prev,
        [firstRowId]: true,
      }));
    }

    return function () {
      if (table.getSelectedRowModel().rows.length === 1) setRowSelection({});
    };
  }, [data, table.getFilteredRowModel()]);

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
      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
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
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
