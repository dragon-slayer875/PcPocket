import {
  useGetBookmarksQuery,
  useImportBookmarksMutation,
} from "@/lib/queries";
import { Button } from "./ui/button";
import { Import, Plus, PlusCircle } from "lucide-react";
import { MainListItem } from "./ui/mainListItem";
import { Fragment } from "react/jsx-runtime";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

export function HomeScreen() {
  const { ref, inView } = useInView();
  const {
    data,
    error,
    isPending,
    isError,
    isFetchingNextPage,
    isFetchingPreviousPage,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
  } = useGetBookmarksQuery("all");

  useEffect(() => {
    if (inView) {
      fetchNextPage();
    }
  }, [fetchNextPage, inView]);

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: {error.message}</div>;
  }

  if (data.pages.length === 0) {
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
          <Button onClick={function() { }} className="flex justify-between">
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
      {data.pages.map((page) => {
        return (
          <Fragment key={page.nextStartIndex}>
            {page.nextStartIndex}
            {page.bookmarks.map((bookmark) => {
              return <MainListItem bookmark={bookmark} />;
            })}
          </Fragment>
        );
      })}
    </div>
  );
}
