import { useEffect, useState } from "react";
import { Menu, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "./button";
import { AddBookmarkDrawerDialog } from "./addBookmark";

export function MobileSearchBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]);

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-2 fixed bottom-4 left-0 right-0 z-50 mx-auto w-full max-w-md px-4 transition-all duration-300",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0",
        )}
      >
        <AddBookmarkDrawerDialog />
        <div className="relative flex flex-1 items-center rounded-full bg-background shadow-lg">
          <Search className="absolute left-4 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="rounded-full border-none pl-11 pr-6 py-6 focus-visible:ring-0"
          />
        </div>
        <Button className="rounded-full p-6 bg-amber-50" size={"icon"}>
          <Menu />
        </Button>
      </div>
    </>
  );
}
