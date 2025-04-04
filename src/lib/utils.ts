import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { load } from "@tauri-apps/plugin-store";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function accessStore(
  mode: "get" | "set",
  key: string,
  value?: any,
) {
  const store = await load("config.json");

  if (mode === "get") {
    return store.get<string>(key);
  }
  if (mode === "set") {
    await store.set(key, value);
  }
}
