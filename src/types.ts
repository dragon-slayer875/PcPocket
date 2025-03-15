type BookmarkItemBase = {
  guid: string;
  title: string;
  index: number;
  dateAdded: number;
  lastModified: number;
  id: number;
  typeCode: number;
  type: string;
  root?: string;
  iconUri?: string;
};

type BookmarkFolder = BookmarkItemBase & {
  children: BookmarkItem[];
  uri?: never;
};

type BookmarkLink = BookmarkItemBase & {
  uri: string;
  children?: never;
};

export type BookmarkInsertItem = {
  link: string;
  title: string;
  id?: number | undefined;
  icon_link?: string | null | undefined;
  created_at?: Date | undefined;
};

export type BookmarkItem = BookmarkFolder | BookmarkLink;

export type BookmarkQueryItem = {
  id: number;
  title: string;
  link: string;
  icon_link?: string;
  created_at: Date;
  tags: string[];
};

export type BookmarkSelectItem = {
  id: number;
  title: string;
  link: string;
  icon_link?: string;
  created_at: Date;
  tag_name?: string;
};

export type BookmarkGetQueryResponse = {
  bookmarks: BookmarkQueryItem[];
  nextStartIndex: number | null;
  prevStartIndex: number | null;
};
