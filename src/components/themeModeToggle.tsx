import { useTheme } from "./themeProvider";
import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeSelector() {
  const { mode, setMode } = useTheme();

  return (
    <div className="inline-flex items-center rounded-md border bg-background p-1 shadow-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setMode("light")}
        className={cn(
          "gap-1 rounded px-3",
          mode === "light" && "bg-secondary text-secondary-foreground",
        )}
      >
        <Sun className="h-4 w-4" />
        <span>Light</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setMode("dark")}
        className={cn(
          "gap-1 rounded px-3",
          mode === "dark" && "bg-secondary text-secondary-foreground",
        )}
      >
        <Moon className="h-4 w-4" />
        <span>Dark</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setMode("system")}
        className={cn(
          "gap-1 rounded px-3",
          mode === "system" && "bg-secondary text-secondary-foreground",
        )}
      >
        <Monitor className="h-4 w-4" />
        <span>System</span>
      </Button>
    </div>
  );
}
