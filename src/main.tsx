import { scan } from "react-scan"; // must be imported before React and React DOM
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";

import { routeTree } from "@/routeTree.gen";

import { ThemeProvider } from "./components/themeProvider";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createIDBPersister } from "./lib/iDbPersister";

scan({
  enabled: true,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
    },
  },
});

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
});

const persister = createIDBPersister();

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <ThemeProvider
        defaultMode="system"
        defaultTheme="default"
        themeStorageKey="vite-ui-theme"
        modeStorageKey="vite-ui-mode"
      >
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister }}
        >
          <RouterProvider router={router} />
          <ReactQueryDevtools initialIsOpen={false} />
        </PersistQueryClientProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}
