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
import { useCallback, useEffect, useMemo } from "react";
import { listen } from "@tauri-apps/api/event";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/main/")({
  component: RouteComponent,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery({
      queryKey: ["bookmarks", "all"],
      queryFn: () => { },
    });
    return {};
  },
});

function RouteComponent() {
  const importBookmarksMutation = useImportBookmarksMutation();
  const { data, error, isFetching, isLoading, isError, fetchNextPage } =
    useGetBookmarksQuery(10);
  const queryClient = useQueryClient();

  const flatData = useMemo(
    () => data?.pages?.flatMap((page) => page) ?? [],
    [data],
  );
  if (isLoading) {
    toast("Loading bookmarks");
  }

  if (isError) {
    toast.error(`Error loading bookmarks: ${error}`);
  }

  const totalDBRowCount = 1000;
  const totalFetched = flatData.length;
  const fetchMoreOnBottomReached = useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        //once the user has scrolled within 500px of the bottom of the table, fetch more data if we can
        if (
          scrollHeight - scrollTop - clientHeight < 500 &&
          !isFetching &&
          totalFetched < totalDBRowCount
        ) {
          fetchNextPage();
        }
      }
    },
    [fetchNextPage, isFetching, totalFetched, totalDBRowCount],
  );

  useEffect(() => {
    const unlistenImportStart = listen("import-started", () => {
      toast("Importing bookmarks", {});
    });

    const unlistenBookmarksUpdate = listen("bookmarks-updated", () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast("Bookmarks Updated");
    });

    const unlistenImportError = listen("import-failed", () => {
      toast.error("Import Failed");
    });

    const unlistenImportFinish = listen("import-finished", () => {
      toast.dismiss();
      toast("Import Finished");
    });

    return () => {
      unlistenImportStart.then((unlisten) => {
        unlisten();
      });
      unlistenBookmarksUpdate.then((unlisten) => {
        unlisten();
      });
      unlistenImportError.then((unlisten) => {
        unlisten();
      });
      unlistenImportFinish.then((unlisten) => {
        unlisten();
      });
    };
  }, []);

  if (data!.pages[0].length === 0) {
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
    <div className="flex flex-1 flex-col gap-2 px-3 py-4 md:p-4">
      <DataTable
        fetchMoreOnBottomReached={fetchMoreOnBottomReached}
        data={flatData}
        columns={columns}
      />
    </div>
  );
}
