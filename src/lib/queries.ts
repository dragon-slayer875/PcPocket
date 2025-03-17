import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { save, open } from "@tauri-apps/plugin-dialog";
import {
  accessStore,
  getBookmarks,
  importBookmarks,
  insertBookmark,
} from "./utils";
import { BookmarkInsertQueryItem, BookmarkQueryItem } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import { Route } from "@/routes/main";

export function useGetDbPathQuery() {
  return useQuery({
    queryKey: ["dbPath"],
    queryFn: async function () {
      return accessStore("get", "dbPath");
    },
  });
}

export function useCreateDbMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async function () {
      return save();
    },
    async onSuccess(dbPath) {
      await accessStore("set", "dbPath", dbPath);
      navigate({
        to: Route.to,
        replace: true,
      });
      queryClient.invalidateQueries({ queryKey: ["dbPath"] });
    },
  });
}

export function useOpenDbMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async function () {
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
    queryFn: async function () {
      const bookmarks: BookmarkQueryItem[] = await getBookmarks();
      return bookmarks;
    },
  });
}

export function useImportBookmarksMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async function () {
      const path = await open();
      if (path) await importBookmarks(path);
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}

export function useInsertBookmarkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async function (bookmark: BookmarkInsertQueryItem) {
      await insertBookmark(bookmark);
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}
