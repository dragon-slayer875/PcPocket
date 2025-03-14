import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { save, open } from "@tauri-apps/plugin-dialog";
import { load } from "@tauri-apps/plugin-store";

const store = await load("config.json");
store.set("dbPath", "");

export function useGetDbPathQuery() {
  return useQuery({
    queryKey: ["dbPath"],
    queryFn: async function() {
      return store.get("dbPath");
    },
  });
}

export function useCreateDbMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async function() {
      return save();
    },
    async onSuccess(dbPath) {
      await store.set("dbPath", dbPath);
      queryClient.invalidateQueries({ queryKey: ["dbPath"] });
    },
  });
}

export function useOpenDbMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async function() {
      return open();
    },
    async onSuccess(dbPath) {
      await store.set("dbPath", dbPath);
      queryClient.invalidateQueries({ queryKey: ["dbPath"] });
    },
  });
}

export function useGetBookmarksQuery(
  pageSize: number | "all",
  cursor?: number,
) {
  return useInfiniteQuery({
    queryKey: ["bookmarks", pageSize, cursor],
    queryFn: async () => {
      const bookmarks = await window.bookmarksAPI.get(pageSize, cursor);
      return bookmarks;
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      lastPage.nextStartIndex;
    },
    getPreviousPageParam: (firstPage) => {
      firstPage.prevStartIndex;
    },
  });
}

export function useImportBookmarksMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: window.bookmarksAPI.import,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}
