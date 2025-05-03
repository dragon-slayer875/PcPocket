import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { save, open } from "@tauri-apps/plugin-dialog";
import {
  BookmarkGetQueryResponse,
  BookmarkMutationItem,
  ParserConfigType,
} from "@/types";
import { useNavigate } from "@tanstack/react-router";
import { Route } from "@/routes/main/bookmarks";
import { getLinkPreview } from "link-preview-js";
import { invoke } from "@tauri-apps/api/core";
import { ColumnFiltersState, SortingState } from "@tanstack/react-table";

export function useGetDbPathQuery() {
  return useQuery({
    queryKey: ["dbPath"],
    queryFn: async function () {
      return invoke("get_db_path");
    },
  });
}

export function useCreateDbMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async function () {
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
      });
      queryClient.invalidateQueries({ queryKey: ["dbPath"] });
    },
  });
}

export function useOpenDbMutation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async function () {
      return open();
    },
    async onSuccess(dbPath) {
      if (!dbPath) return;
      await invoke("open_db", {
        path: dbPath,
      });
      navigate({
        to: Route.to,
      });
      queryClient.invalidateQueries({ queryKey: ["dbPath"] });
    },
  });
}

export function useGetBookmarksQuery(
  pageSize?: number,
  page: number = 1,
  all: boolean = false,
  filters: ColumnFiltersState = [],
  sort: SortingState = [],
) {
  return useQuery({
    queryKey: ["bookmarks", page, pageSize, all, filters, sort],
    queryFn: async function (): Promise<BookmarkGetQueryResponse> {
      const response = await invoke("get_bookmarks", {
        page,
        pageSize,
        all,
        filters,
        sort,
      });
      return response as BookmarkGetQueryResponse;
    },
    placeholderData: keepPreviousData,
    gcTime: 0,
  });
}

export function useGetAllTagsQuery() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async function () {
      const response = await invoke("get_all_tags");
      return response as string[];
    },
  });
}

export function useGetMetadataQuery(url: string) {
  return useQuery({
    queryKey: ["metadata", url],
    queryFn: async function () {
      return getLinkPreview(url);
    },
  });
}

export function useGetCustomParsersQuery() {
  return useQuery({
    queryKey: ["customParsers"],
    queryFn: async function (): Promise<ParserConfigType[]> {
      return invoke("list_all_custom_parsers");
    },
    placeholderData: keepPreviousData,
    staleTime: 5000,
  });
}

export function useImportBookmarksMutation() {
  return useMutation({
    mutationFn: async function ({
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
  });
}

export function useInsertBookmarkMutation() {
  return useMutation({
    mutationFn: async function (bookmark: BookmarkMutationItem) {
      const bookmarkClone = structuredClone(bookmark);
      if (bookmarkClone.tags) {
        delete bookmarkClone.tags;
      }
      return invoke("bookmark_insert", {
        bookmark: bookmarkClone,
        tags: bookmark.tags,
      });
    },
  });
}

export function useUpdateBookmarkMutation() {
  return useMutation({
    mutationFn: async function (bookmark: BookmarkMutationItem) {
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
  });
}

export function useUpdateTagsMutation() {
  return useMutation({
    mutationFn: async function ({
      ids,
      tagsToAdd,
      tagsToDelete,
    }: {
      ids: number[];
      tagsToAdd: string[];
      tagsToDelete: string[];
    }) {
      return invoke("tags_update", {
        ids,
        tagsToAdd,
        tagsToDelete,
      });
    },
  });
}

export function useDeleteBookmarkMutation() {
  return useMutation({
    mutationFn: async function (id: number) {
      return invoke("bookmark_delete", {
        deleteId: id,
      });
    },
  });
}

export function useDeleteMultipleBookmarksMutation() {
  return useMutation({
    mutationFn: async function ({ ids }: { ids: number[] }) {
      return invoke("batch_delete", {
        ids,
      });
    },
  });
}

export function useAddCustomParserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async function (parser: {
      name: string;
      type: "python";
      path: string;
      supportedFormats: string[];
    }) {
      return invoke("add_custom_parser", {
        parserConfig: parser,
      });
    },
    async onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["customParsers"] });
    },
  });
}
