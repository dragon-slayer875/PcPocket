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

export type BookmarkItem = BookmarkFolder | BookmarkLink;

export type BookmarkQueryItem = {
  id: number;
  title: string;
  link: string;
  iconLink?: string;
  createdAt: Date;
  tags: string[];
};

export type BookmarkGetQueryResponse = {
  bookmarks: BookmarkQueryItem[];
  nextStartIndex: number | null;
  prevStartIndex: number | null;
};
