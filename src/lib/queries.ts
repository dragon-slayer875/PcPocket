import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { save, open } from "@tauri-apps/plugin-dialog";
import {
  deleteBookmark,
  insertBookmark,
  updateBookmark,
  updateTags,
} from "./utils";
import { BookmarkMutationItem, BookmarkQueryItem } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import { Route } from "@/routes/main";
import { getLinkPreview } from "link-preview-js";
import { invoke } from "@tauri-apps/api/core";

export function useGetDbPathQuery() {
  return useQuery({
    queryKey: ["dbPath"],
    queryFn: async function() {
      return invoke("get_db_path");
    },
  });
}

export function useCreateDbMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async function() {
      return save({
        defaultPath: "bookmarks.db",
      });
    },
    async onSuccess(dbPath) {
      if (!dbPath) return;
      await invoke("create_db", {
        path: dbPath,
      });
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
    mutationFn: async function() {
      return open();
    },
    async onSuccess(dbPath) {
      if (!dbPath) return;
      await invoke("open_db", {
        path: dbPath,
      });
      queryClient.invalidateQueries({ queryKey: ["dbPath"] });
    },
  });
}

export function useGetBookmarksQuery(pageSize: number | "all", index?: number) {
  return useQuery({
    queryKey: ["bookmarks", pageSize, index],
    queryFn: async function(): Promise<BookmarkQueryItem[]> {
      const bookmarks = await invoke("get_bookmarks", {
        index: 0,
        all: true,
      });
      return bookmarks as BookmarkQueryItem[];
    },
  });
}

export function useGetMetadataQuery(url: string) {
  return useQuery({
    queryKey: ["metadata", url],
    queryFn: async function() {
      return getLinkPreview(url);
    },
  });
}

export function useImportBookmarksMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async function() {
      const path = await open();
      if (path) {
        invoke("import_bookmarks", {
          filePath: path,
        });
      }
    },
    async onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}

export function useInsertBookmarkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async function(bookmark: BookmarkMutationItem) {
      await insertBookmark(bookmark);
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}

export function useUpdateBookmarkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async function(bookmark: BookmarkMutationItem) {
      await updateBookmark(bookmark);
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}

export function useUpdateTagsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async function({
      ids,
      tagsToAdd,
      tagsToDelete,
    }: {
      ids: number[];
      tagsToAdd: string[];
      tagsToDelete: string[];
    }) {
      await updateTags(ids, tagsToAdd, tagsToDelete);
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}

export function useDeleteBookmarkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async function(id: number) {
      await deleteBookmark(id);
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}
