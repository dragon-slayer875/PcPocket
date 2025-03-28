import { columns } from "@/components/ui/bookmarksTable/columns";
import { DataTable } from "@/components/ui/bookmarksTable/dataTable";
import { Button } from "@/components/ui/button";
// import { MainListItem } from "@/components/ui/mainListItem";
// import { MobileSearchBar } from "@/components/ui/mobileSearchBar";
// import { Separator } from "@/components/ui/separator";
import {
  useGetBookmarksQuery,
  useImportBookmarksMutation,
} from "@/lib/queries";
import { createFileRoute } from "@tanstack/react-router";
import { Import, Plus, PlusCircle } from "lucide-react";

export const Route = createFileRoute("/main/")({
  component: RouteComponent,
});

function RouteComponent() {
  const importBookmarksMutation = useImportBookmarksMutation();
  const { data, error, isPending, isError } = useGetBookmarksQuery("all");

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  if (data.length === 0) {
    return (
      <div className="flex-1 grid grid-rows-2 sm:max-w-sm">
        <div className="flex gap-3 items-center self-end justify-center">
          <PlusCircle className="h-10 w-10" />
          <p className="sm:text-md">Nothing to show yet.</p>
        </div>
        <div className="flex flex-col gap-2 p-5 self-end sm:self-baseline">
          <Button
            onClick={function() {
              importBookmarksMutation.mutate();
            }}
            size={"lg"}
            className="flex justify-between"
          >
            <span>Import</span>
            <Import />
          </Button>
          <Button
            size={"lg"}
            variant="secondary"
            className="flex justify-between"
          >
            <span>Create New</span>
            <Plus />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-2">
        <DataTable data={data} columns={columns} />
      </div>
    </>
  );
}
