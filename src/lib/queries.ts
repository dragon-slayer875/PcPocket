import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { save, open } from "@tauri-apps/plugin-dialog";
import {
  accessStore,
  deleteBookmark,
  getBookmarks,
  importBookmarks,
  insertBookmark,
  updateBookmark,
} from "./utils";
import { BookmarkMutationItem, BookmarkQueryItem } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import { Route } from "@/routes/main";
// import {
//   BaseDirectory,
//   copyFile,
//   readFile,
//   writeFile,
// } from "@tauri-apps/plugin-fs";
// import { sendNotification } from "@tauri-apps/plugin-notification";
// import { join } from "@tauri-apps/api/path";
import { getLinkPreview } from "link-preview-js";
import { BaseDirectory, copyFile } from "@tauri-apps/plugin-fs";

export function useGetDbPathQuery() {
  return useQuery({
    queryKey: ["dbPath"],
    queryFn: async function() {
      return accessStore("get", "dbPath");
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
    mutationFn: async function() {
      return open();
    },
    async onSuccess(dbPath) {
      await accessStore("set", "dbPath", dbPath);
      await copyFile(dbPath!, "bookmarks.tmp", {
        toPathBaseDir: BaseDirectory.AppConfig,
      });
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
    queryFn: async function() {
      const bookmarks: BookmarkQueryItem[] = await getBookmarks();
      return bookmarks;
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
      if (path) await importBookmarks(path);
    },
    async onSuccess() {
      // let gotPath = await accessStore("get", "dbPath");
      // const data = await readFile("bookmarks.tmp", {
      //   baseDir: BaseDirectory.AppConfig,
      // });
      // await writeFile(gotPath!, data)
      //   .then(() => {
      //     sendNotification({
      //       title: "Data Imported",
      //       largeBody: `Data has been imported to the database ${gotPath}`,
      //       icon: "success",
      //     });
      //   })
      //   .catch((e) => {
      //     sendNotification({
      //       title: "Data Import Failed",
      //       largeBody: e,
      //       icon: "error",
      //     });
      //     console.error(e);
      //   });
      // if (gotPath) {
      //   gotPath = await join(gotPath);
      // }
      // await copyFile("bookmarks.tmp", gotPath!, {
      //   fromPathBaseDir: BaseDirectory.AppConfig,
      // })
      //   .then(() => {
      //     sendNotification({
      //       title: "Data Copied",
      //       largeBody: "Data has been copied to the database",
      //       icon: "success",
      //     });
      //   })
      //   .catch((e) => {
      //     sendNotification({
      //       title: "Data Copy Failed",
      //       largeBody: e,
      //       icon: "error",
      //     });
      //     console.error(e);
      //   });
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
