import { Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ShortcutsListDialog() {
  const shortcuts = [
    { key: ["Ctrl F", "/"], description: "Find" },
    { key: ["Shift Backspace"], description: "Clear all filters" },
    { key: ["Ctrl E"], description: "Edit selected bookmark(s)" },
    { key: ["Shift Enter"], description: "Open selected bookmark" },
    { key: ["Ctrl C"], description: "Copy selected bookmark" },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Keyboard className="h-4 w-4" />
          <span className="sr-only">Keyboard shortcuts</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Some keyboard shortcuts to help you navigate the application.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 overflow-auto max-h-[60vh] px-4">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {shortcut.description}
              </span>
              <div className="flex gap-2">
                {shortcut.key.map((key) => (
                  <kbd
                    key={key}
                    className="pointer-events-none inline-flex h-8 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-sm font-medium text-muted-foreground"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
