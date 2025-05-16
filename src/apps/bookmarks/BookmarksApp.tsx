import React, { useState } from "react";
import { BookmarkToolbar } from "@/apps/bookmarks/components/BookmarkToolbar";
import { BookmarkFolderList } from "@/apps/bookmarks/components/BookmarkFolderList";
import { BookmarkList } from "@/apps/bookmarks/components/BookmarkList";
import { BookmarkModal } from "@/apps/bookmarks/components/BookmarkModal";
import { BookmarkFolderModal } from "@/apps/bookmarks/components/BookmarkFolderModal";
import type { Bookmark, Folder } from "@/apps/bookmarks/types/bookmarkTypes";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useBookmarksRealtime } from "@/apps/bookmarks/hooks/useBookmarks";
import { useFoldersRealtime } from "@/apps/bookmarks/hooks/useFolders";
import { useAtom } from "jotai";
import { fetchBookmarksAtom } from "@/apps/bookmarks/hooks/useBookmarks";

const BOOKMARK_SORT_OPTIONS = [
  { value: 'manual', label: 'Manual (Drag & Drop)' },
  { value: 'title-asc', label: 'Title (A-Z)' },
  { value: 'title-desc', label: 'Title (Z-A)' },
  { value: 'date-desc', label: 'Date Added (Newest)' },
  { value: 'date-asc', label: 'Date Added (Oldest)' },
  { value: 'color', label: 'Color' },
];

const FOLDER_SORT_OPTIONS = [
  { value: 'custom', label: 'Manual (Drag & Drop)' },
  { value: 'custom-reverse', label: 'Manual (Reverse)' },
  { value: 'alpha', label: 'A-Z' },
  { value: 'alpha-desc', label: 'Z-A' },
  { value: 'date', label: 'Date Added (Newest)' },
  { value: 'date-asc', label: 'Date Added (Oldest)' },
  { value: 'color', label: 'Color' },
  { value: 'color-desc', label: 'Color (Reverse)' },
  { value: 'symbol', label: 'Symbol' },
];

export const BookmarksApp = () => {
  useBookmarksRealtime();
  useFoldersRealtime();
  const [, fetchBookmarks] = useAtom(fetchBookmarksAtom);
  React.useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  // Persist selectedFolder in localStorage
  const [selectedFolder, setSelectedFolder] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bookmarks.selectedFolder') || null;
    }
    return null;
  });
  React.useEffect(() => {
    if (selectedFolder !== null) {
      localStorage.setItem('bookmarks.selectedFolder', selectedFolder);
    } else {
      localStorage.removeItem('bookmarks.selectedFolder');
    }
  }, [selectedFolder]);

  const [bookmarkModalOpen, setBookmarkModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [bookmarkSort, setBookmarkSort] = useState('manual');
  const [folderSort, setFolderSort] = useState<
    'custom' | 'custom-reverse' | 'alpha' | 'alpha-desc' | 'date' | 'date-asc' | 'color' | 'color-desc' | 'symbol'
  >('custom');

  // Handlers for toolbar actions
  const handleAddBookmark = () => {
    setEditingBookmark(null);
    setBookmarkModalOpen(true);
  };
  const handleEditBookmark = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setBookmarkModalOpen(true);
  };
  const handleAddFolder = () => {
    setEditingFolder(null);
    setFolderModalOpen(true);
  };
  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setFolderModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground transition-colors">
      <BookmarkToolbar onAddFolder={handleAddFolder} />
      <div className="flex flex-row items-center gap-4 px-4 py-2 border-b border-border bg-background">
        <label className="flex items-center gap-2 text-sm">
          Folder sort:
          <Select value={folderSort} onValueChange={(value) => setFolderSort(value as 'custom' | 'custom-reverse' | 'alpha' | 'alpha-desc' | 'date' | 'date-asc' | 'color' | 'color-desc' | 'symbol')}>
            <SelectTrigger className="min-w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FOLDER_SORT_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          Bookmark sort:
          <Select value={bookmarkSort} onValueChange={setBookmarkSort}>
            <SelectTrigger className="min-w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BOOKMARK_SORT_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden md:block w-64 border-r border-border bg-muted h-full overflow-y-auto">
          <BookmarkFolderList selectedFolder={selectedFolder} onSelect={setSelectedFolder} onEdit={handleEditFolder} sort={folderSort} />
        </aside>
        <main className="flex-1 h-full overflow-y-auto p-4">
          <BookmarkList selectedFolder={selectedFolder} onEdit={handleEditBookmark} onAddBookmark={handleAddBookmark} sort={bookmarkSort} enableDragDrop={bookmarkSort === 'manual'} />
        </main>
      </div>
      <BookmarkModal open={bookmarkModalOpen} onClose={() => setBookmarkModalOpen(false)} bookmark={editingBookmark} folderId={selectedFolder} />
      <BookmarkFolderModal open={folderModalOpen} onClose={() => setFolderModalOpen(false)} folder={editingFolder} />
    </div>
  );
}; 