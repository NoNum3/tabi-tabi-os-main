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
import { useAtom, useSetAtom } from "jotai";
import { fetchBookmarksAtom, bookmarksErrorAtom } from "@/apps/bookmarks/hooks/useBookmarks";
import { fetchFoldersAtom, foldersErrorAtom } from "@/apps/bookmarks/hooks/useFolders";
import { useCurrentLocale } from "@/locales/client";
import { WritableAtom } from "jotai";
import { userAtom } from "@/application/atoms/authAtoms";
import { useAtomValue } from "jotai";
import { useI18n } from '@/locales/client';

export const BookmarksApp = () => {
  const t = useI18n();

  const BOOKMARK_SORT_OPTIONS = [
    { value: 'manual', label: t('bookmarkSortManual', { count: 1 }) },
    { value: 'title-asc', label: t('bookmarkSortTitleAsc', { count: 1 }) },
    { value: 'title-desc', label: t('bookmarkSortTitleDesc', { count: 1 }) },
    { value: 'date-desc', label: t('bookmarkSortDateDesc', { count: 1 }) },
    { value: 'date-asc', label: t('bookmarkSortDateAsc', { count: 1 }) },
    { value: 'color', label: t('bookmarkSortColor', { count: 1 }) },
  ];

  const FOLDER_SORT_OPTIONS = [
    { value: 'custom', label: t('folderSortManual', { count: 1 }) },
    { value: 'custom-reverse', label: t('folderSortManualReverse', { count: 1 }) },
    { value: 'alpha', label: t('folderSortAlpha', { count: 1 }) },
    { value: 'alpha-desc', label: t('folderSortAlphaDesc', { count: 1 }) },
    { value: 'date', label: t('folderSortDate', { count: 1 }) },
    { value: 'date-asc', label: t('folderSortDateAsc', { count: 1 }) },
    { value: 'color', label: t('folderSortColor', { count: 1 }) },
    { value: 'color-desc', label: t('folderSortColorDesc', { count: 1 }) },
    { value: 'symbol', label: t('folderSortSymbol', { count: 1 }) },
  ];

  useBookmarksRealtime();
  useFoldersRealtime();
  const [, fetchBookmarks] = useAtom(fetchBookmarksAtom);
  const setBookmarksError = useSetAtom(bookmarksErrorAtom as WritableAtom<string | null, [string | null], void>);
  const [, fetchFolders] = useAtom(fetchFoldersAtom);
  const setFoldersError = useSetAtom(foldersErrorAtom as WritableAtom<string | null, [string | null], void>);
  const currentLocale = useCurrentLocale();
  const user = useAtomValue(userAtom);
  React.useEffect(() => {
    if (user) {
      fetchBookmarks();
      setBookmarksError(null);
      fetchFolders();
      setFoldersError(null);
    }
  }, [user, currentLocale, fetchBookmarks, setBookmarksError, fetchFolders, setFoldersError]);

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
    <div key={currentLocale} className="flex flex-col h-full bg-background text-foreground transition-colors">
      <BookmarkToolbar onAddFolder={handleAddFolder} />
      <div className="flex flex-row items-center gap-4 px-4 py-2 border-b border-border bg-background">
        <label className="flex items-center gap-2 text-sm">
          {t('folderSortLabel', { count: 1 })}
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
          {t('bookmarkSortLabel', { count: 1 })}
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
      <div className="flex flex-1">
        <aside className="hidden md:block w-64 border-r border-border bg-muted h-full overflow-y-auto">
          <BookmarkFolderList selectedFolder={selectedFolder} onSelect={setSelectedFolder} onEdit={handleEditFolder} sort={folderSort} />
        </aside>
        <main className="flex-1 h-full p-4">
          <BookmarkList selectedFolder={selectedFolder} onEdit={handleEditBookmark} onAddBookmark={handleAddBookmark} sort={bookmarkSort} enableDragDrop={bookmarkSort === 'manual'} />
        </main>
      </div>
      <BookmarkModal open={bookmarkModalOpen} onClose={() => setBookmarkModalOpen(false)} bookmark={editingBookmark} folderId={selectedFolder} />
      <BookmarkFolderModal open={folderModalOpen} onClose={() => setFolderModalOpen(false)} folder={editingFolder} />
    </div>
  );
}; 