import { EllipsisVertical, Globe } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import { BookmarkQueryItem } from "src/types";
import { openUrl } from "@tauri-apps/plugin-opener";

export function MainListItem({ bookmark }: { bookmark: BookmarkQueryItem }) {
  return (
    <div
      className="p-1 flex gap-1  rounded-md"
      role="listitem"
      key={bookmark.id}
    >
      <div
        onClick={async function () {
          await openUrl(bookmark.link);
        }}
        className="cursor-pointer flex-1 flex gap-4 flex-col hover:bg-accent active:bg-accent rounded-md p-4"
      >
        <div className="flex items-center rounded-md">
          {bookmark.icon_link ? (
            <img
              src={bookmark.icon_link}
              alt={bookmark.title}
              className="h-7 w-7 mr-2.5"
            />
          ) : (
            <Globe className="h-7 w-7 mr-2.5" />
          )}
          <div className="overflow-hidden w-[180px] sm:w-sm">
            <h1
              role=""
              className="overflow-ellipsis overflow-hidden whitespace-nowrap"
            >
              {bookmark.title}
            </h1>
            <p className="text-gray-400 text-xs overflow-ellipsis overflow-hidden whitespace-nowrap">
              {bookmark.link}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {bookmark.tags.map((tag) => {
            return (
              <Badge className="bg-amber-50" key={tag}>
                {tag}
              </Badge>
            );
          })}
        </div>
      </div>
      <Button
        className="self-center h-full"
        variant={"ghost"}
        onClick={function () {
          console.log("Edit");
        }}
      >
        <EllipsisVertical />
      </Button>
    </div>
  );
}
