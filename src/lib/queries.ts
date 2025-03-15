import {
  // useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { save, open } from "@tauri-apps/plugin-dialog";
import { load } from "@tauri-apps/plugin-store";
import { getBookmarks, importBookmarks } from "./utils";
import { BookmarkQueryItem } from "@/types";

async function accessStore(mode: "get" | "set", key: string, value?: any) {
  const store = await load("config.json");

  if (mode === "get") {
    return store.get(key);
  }
  if (mode === "set") {
    await store.set(key, value);
  }
}

export function useGetDbPathQuery() {
  return useQuery({
    queryKey: ["dbPath"],
    queryFn: async function() {
      return accessStore("get", "dbPath");
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
      await accessStore("set", "dbPath", dbPath);
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
      await accessStore("set", "dbPath", dbPath);
      queryClient.invalidateQueries({ queryKey: ["dbPath"] });
    },
  });
}

export function useGetBookmarksQuery(
  pageSize: number | "all",
  cursor?: number,
) {
  return useQuery({
    queryKey: ["bookmarks", pageSize, cursor],
    queryFn: async () => {
      const bookmarks: BookmarkQueryItem[] = await getBookmarks();
      return bookmarks;
    },
  });
}

export function useImportBookmarksMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async function() {
      const path = await open();
      if (path) await importBookmarks(path);
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}
