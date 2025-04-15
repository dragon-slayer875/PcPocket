import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { save, open } from "@tauri-apps/plugin-dialog";
import { BookmarkMutationItem, BookmarkQueryItem } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import { Route } from "@/routes/main/bookmarks";
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

export function useGetBookmarksQuery(
  pageSize?: number,
  index: number = 0,
  all: boolean = true,
) {
  return useQuery({
    queryKey: ["bookmarks", pageSize],
    queryFn: async function(): Promise<BookmarkQueryItem[]> {
      const bookmarks = await invoke("get_bookmarks", {
        index,
        pageSize,
        all,
      });
      return bookmarks as BookmarkQueryItem[];
    },
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
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
    mutationFn: async function({
      filePath,
      parserName,
    }: {
      filePath: string;
      parserName: string;
    }) {
      invoke("import_bookmarks", {
        filePath,
        parserName,
      });
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
      const bookmarkClone = structuredClone(bookmark);
      if (bookmarkClone.tags) {
        delete bookmarkClone.tags;
      }
      return invoke("bookmark_insert", {
        bookmark: bookmarkClone,
        tags: bookmark.tags,
      });
    },
    async onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}

export function useUpdateBookmarkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async function(bookmark: BookmarkMutationItem) {
      const bookmarkClone = structuredClone(bookmark);
      if (bookmarkClone.tags) {
        delete bookmarkClone.tags;
        delete bookmarkClone.id;
      }
      return invoke("bookmark_update", {
        index: bookmark.id,
        bookmark: bookmarkClone,
        tags: bookmark.tags,
      });
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
      tagsToDelete: {
        id: number;
        tag_name: string;
        bookmark_id: number;
      }[];
    }) {
      return invoke("tags_update", {
        ids,
        tagsToAdd,
        tagsToDelete: tagsToDelete.map((tag) => tag.tag_name),
      });
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
      return invoke("bookmark_delete", {
        deleteId: id,
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}

export function useDeleteMultipleBookmarksMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async function({ ids }: { ids: number[] }) {
      return invoke("batch_delete", {
        ids,
      });
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}
