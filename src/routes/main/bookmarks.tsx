import { DataTable } from "@/components/ui/bookmarksTable/dataTable";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useQueryClient } from "@tanstack/react-query";
import { BookmarkQueryItem } from "@/types";
import { invoke } from "@tauri-apps/api/core";

export const Route = createFileRoute("/main/bookmarks")({
  component: RouteComponent,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery({
      queryKey: ["bookmarks", ""],
      queryFn: async function(): Promise<BookmarkQueryItem[]> {
        const bookmarks = await invoke("get_bookmarks", {
          index: 0,
          pageSize: 50,
          all: false,
        });
        return bookmarks as BookmarkQueryItem[];
      },
    });
    return {};
  },
});

function RouteComponent() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unlistenBookmarksUpdate = listen("bookmarks-updated", () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    });

    return () => {
      unlistenBookmarksUpdate.then((unlisten) => {
        unlisten();
      });
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-2">
      <DataTable />
    </div>
  );
}
