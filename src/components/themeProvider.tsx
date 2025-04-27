import { createContext, useContext, useEffect, useState } from "react";

export const themeStyles = [
  {
    name: "Default",
    value: "default",
    color: "oklch(0.985 0 0)",
  },
  {
    name: "One Dark",
    value: "one-dark",
    color: "oklch(0.65 0.22 264)",
  },
  {
    name: "Rose",
    value: "rose",
    color: "oklch(0.645 0.246 16.439)",
  },
  {
    name: "Blue",
    value: "blue",
    color: "oklch(0.546 0.245 262.881)",
  },
];

export const themeModes = [
  { name: "Light", value: "light" },
  { name: "Dark", value: "dark" },
  { name: "System", value: "system" },
];

type Mode = (typeof themeModes)[number]["value"];
type Theme = (typeof themeStyles)[number]["value"];

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultMode?: Mode;
  themeStorageKey?: string;
  modeStorageKey?: string;
};

type ThemeProviderState = {
  mode: Mode;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  setMode: (mode: Mode) => void;
};

const modes: Mode[] = themeModes.map((mode) => mode.value);
const themes: Theme[] = themeStyles.map((theme) => theme.value);

const initialState: ThemeProviderState = {
  mode: "system",
  theme: "default",
  setTheme: () => null,
  setMode: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultMode = "system",
  defaultTheme = "default",
  themeStorageKey = "vite-ui-theme",
  modeStorageKey = "vite-ui-mode",
  ...props
}: ThemeProviderProps) {
  const [mode, setMode] = useState<Mode>(
    () => (localStorage.getItem(modeStorageKey) as Mode) || defaultMode,
  );
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(themeStorageKey) as Theme) || defaultTheme,
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove(...themes);
    root.classList.remove(...modes);

    if (mode === "system") {
      const systemMode = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(theme);
      root.classList.add(systemMode);
      return;
    }

    root.classList.add(theme);
    root.classList.add(mode);
  }, [mode, theme]);

  const value = {
    theme,
    mode,
    setMode: (mode: Mode) => {
      localStorage.setItem(modeStorageKey, mode);
      setMode(mode);
    },
    setTheme: (theme: Theme) => {
      localStorage.setItem(themeStorageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
