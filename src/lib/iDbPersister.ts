import { get, set, del } from "idb-keyval";
import {
  PersistedClient,
  Persister,
} from "@tanstack/react-query-persist-client";

export function createIDBPersister(idbValidKey: IDBValidKey = "reactQuery") {
  return {
    persistClient: async (client: PersistedClient) => {
      await set(idbValidKey, JSON.stringify(client));
    },
    restoreClient: async () => {
      return (await JSON.parse(
        (await get(idbValidKey)) || "null",
      )) as PersistedClient;
    },
    removeClient: async () => {
      await del(idbValidKey);
    },
  } satisfies Persister;
}
