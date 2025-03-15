import {
  useGetBookmarksQuery,
  useImportBookmarksMutation,
} from "@/lib/queries";
import { Button } from "./ui/button";
import { Import, Plus, PlusCircle } from "lucide-react";
import { MainListItem } from "./ui/mainListItem";

export function HomeScreen() {
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
          <p className="sm:text-md">
            No bookmarks yet.
            <br />
            Create new,
            <br />
            Import from browser.
          </p>
        </div>
        <div className="flex flex-col gap-2 p-5 self-end sm:self-baseline">
          <Button
            onClick={function() {
              importBookmarksMutation.mutate();
            }}
            className="flex justify-between"
          >
            <span>Import</span>
            <Import />
          </Button>
          <Button variant="secondary" className="flex justify-between">
            <span>Create New</span>
            <Plus />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-2">
      {data.map((bookmark) => (
        <MainListItem key={bookmark.id} bookmark={bookmark} />
      ))}
    </div>
  );
}
