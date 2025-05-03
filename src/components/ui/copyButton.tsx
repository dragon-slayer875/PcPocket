import { Check, Clipboard } from "lucide-react";
import { Button } from "./button";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { useEffect, useState } from "react";

export function CopyButton({
  text,
  className,
  disabled,
}: {
  text: string;
  className?: string;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => {
        setCopied(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  return (
    <Button
      variant={"ghost"}
      className={`${className}`}
      onClick={() => {
        writeText(text);
        setCopied(true);
      }}
      disabled={disabled}
    >
      {copied ? (
        <Check className="h-4 w-4" />
      ) : (
        <Clipboard className="h-4 w-4" />
      )}
    </Button>
  );
}
