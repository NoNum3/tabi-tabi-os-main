import React from "react";
import { useAtom, useSetAtom } from "jotai";
import { bookmarksAtom, bookmarksErrorAtom, updateBookmarkAtom, deleteBookmarkAtom, reorderBookmarksAtom } from "../hooks/useBookmarks";
import type { Bookmark as BookmarkType } from "../types/bookmarkTypes";
import { Button } from "@/components/ui/button";
import { Star, StarOff, Edit2, Trash2, Bookmark as BookmarkIcon, GripVertical, BookmarkX, Plus, XCircle } from "lucide-react";
import Image from "next/image";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useI18n } from '@/locales/client';

export const BookmarkList = ({ selectedFolder, onEdit, onAddBookmark, sort = 'custom', enableDragDrop = true }: {
  selectedFolder: string | null;
  onEdit?: (bookmark: BookmarkType) => void;
  onAddBookmark?: () => void;
  sort?: string;
  enableDragDrop?: boolean;
}) => {
  const [bookmarks] = useAtom(bookmarksAtom);
  const [error] = useAtom(bookmarksErrorAtom);
  const setUpdateBookmark = useSetAtom(updateBookmarkAtom);
  const setDeleteBookmark = useSetAtom(deleteBookmarkAtom);
  const reorderBookmarks = useSetAtom(reorderBookmarksAtom);
  const t = useI18n();

  let filtered: BookmarkType[] = [];
  if (selectedFolder === 'RECYCLE_BIN') {
    filtered = bookmarks.filter(b => b.deleted_at);
  } else if (selectedFolder === 'FAVOURITES') {
    filtered = bookmarks.filter(b => b.is_favorite && !b.deleted_at);
  } else if (selectedFolder) {
    filtered = bookmarks.filter(b => b.folder_id === selectedFolder && !b.deleted_at);
  } else {
    filtered = [];
  }
  if (sort === 'title-asc') {
    filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === 'title-desc') {
    filtered = [...filtered].sort((a, b) => b.title.localeCompare(a.title));
  } else if (sort === 'date-asc') {
    filtered = [...filtered].sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
  } else if (sort === 'date-desc') {
    filtered = [...filtered].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  } else if (sort === 'color') {
    filtered = [...filtered].sort((a, b) => (a.color || '').localeCompare(b.color || ''));
  } else {
    filtered = [...filtered].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }

  const handleToggleFavorite = (bookmark: BookmarkType) => {
    setUpdateBookmark({ ...bookmark, is_favorite: !bookmark.is_favorite });
  };

  const handleDelete = (bookmark: BookmarkType) => {
    if (selectedFolder === 'RECYCLE_BIN' || bookmark.deleted_at) {
      if (window.confirm("This will permanently delete the bookmark. This action cannot be undone. Are you sure?")) {
        setDeleteBookmark(bookmark.id);
      }
    } else {
      // Move to recycle bin (soft delete)
      setUpdateBookmark({ ...bookmark, deleted_at: new Date().toISOString() });
    }
  };

  const handleRestore = (bookmark: BookmarkType) => {
    setUpdateBookmark({ ...bookmark, deleted_at: null });
  };

  // Drag-and-drop logic
  const handleDragEnd = (result: DropResult) => {
    if (!enableDragDrop) return;
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;
    if (filtered.length < 2) return;
    // Only reorder bookmarks in the current folder (filtered)
    const newOrder = Array.from(filtered);
    const [removed] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, removed);
    // Update sort_order for all bookmarks in this folder
    reorderBookmarks(newOrder.map(b => b.id));
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-red-500" role="alert">
        {t(error, { count: 1 }) !== error ? t(error, { count: 1 }) : error}
      </div>
    );
  }
  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <span className="mb-4 flex items-center justify-center w-20 h-20 rounded-full border-2 border-dashed border-muted-foreground/40 bg-muted">
          <BookmarkX className="size-10 opacity-70" aria-hidden="true" />
        </span>
        <p className="font-medium mb-4">{t('bookmarkNoBookmarks', { count: 1 })}</p>
        {onAddBookmark && selectedFolder !== 'RECYCLE_BIN' && (
          <button
            type="button"
            onClick={onAddBookmark}
            aria-label="Add bookmark"
            className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-primary/90 text-primary-foreground shadow-lg hover:bg-primary focus:outline-none focus:ring-2 focus:ring-accent transition-all text-4xl"
          >
            <Plus className="size-8" />
          </button>
        )}
        {onAddBookmark && selectedFolder !== 'RECYCLE_BIN' && (
          <span className="mt-2 text-xs text-muted-foreground">{t('bookmarkAddFirstBookmark', { count: 1 })}</span>
        )}
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <DragDropContext onDragEnd={enableDragDrop ? handleDragEnd : () => {}}>
        <Droppable droppableId="bookmark-list" isDropDisabled={!enableDragDrop || filtered.length < 2}>
          {(provided) => (
            <ul className="space-y-2 overflow-y-auto max-h-full" ref={provided.innerRef} {...provided.droppableProps}>
              {filtered.map((b, idx) => (
                <Draggable key={b.id} draggableId={b.id} index={idx} isDragDisabled={!enableDragDrop || filtered.length < 2}>
                  {(provided, snapshot) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex items-center gap-3 p-3 rounded-xl bg-card shadow-sm hover:bg-muted transition-colors ${snapshot.isDragging ? "ring-2 ring-accent" : ""}`}
                    >
                      <span {...provided.dragHandleProps} className={`cursor-grab active:cursor-grabbing text-muted-foreground ${!enableDragDrop ? 'opacity-30 pointer-events-none' : ''}`} aria-label="Drag to reorder">
                        <GripVertical className="size-5" />
                      </span>
          {b.favicon_url && b.favicon_url.startsWith("http") ? (
                        <Image
              src={b.favicon_url}
              alt="Favicon"
                          width={24}
                          height={24}
              className="w-6 h-6 rounded"
              style={{ background: "#fff" }}
              aria-hidden="true"
                          unoptimized
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            b.symbol ? (
              <span className="w-6 h-6 flex items-center justify-center rounded bg-muted text-xl" aria-label="Bookmark symbol">
                {b.symbol}
              </span>
            ) : (
              <span className="w-6 h-6 flex items-center justify-center rounded bg-muted text-muted-foreground" aria-hidden="true">
                <BookmarkIcon className="size-5" />
              </span>
            )
          )}
          <div className="flex-1 min-w-0">
            {/* Title and color dot inline */}
            <div className="flex items-center gap-2">
              <a
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {b.title}
              </a>
            </div>
            <div className="text-xs text-muted-foreground truncate">{b.url}</div>
            {b.description && <div className="text-sm text-foreground mt-1">{b.description}</div>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={b.is_favorite ? "Unfavorite" : "Favorite"}
            tabIndex={0}
            onClick={() => handleToggleFavorite(b)}
            className={b.is_favorite ? "text-yellow-400" : "text-muted-foreground"}
          >
            {b.is_favorite ? <Star className="size-5 fill-yellow-400" /> : <StarOff className="size-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit bookmark"
            tabIndex={0}
            onClick={() => onEdit?.(b)}
          >
            <Edit2 className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={selectedFolder === 'RECYCLE_BIN' ? t('bookmarkFolderRecycleBin', { count: 1 }) : "Move to Recycle Bin"}
            tabIndex={0}
            onClick={() => handleDelete(b)}
            className={selectedFolder === 'RECYCLE_BIN' ? "text-destructive" : "text-muted-foreground"}
            title={selectedFolder === 'RECYCLE_BIN' ? t('bookmarkFolderRecycleBin', { count: 1 }) : "Move to Recycle Bin"}
          >
            {selectedFolder === 'RECYCLE_BIN' ? <XCircle className="size-5" /> : <Trash2 className="size-5" />}
          </Button>
          {selectedFolder === 'RECYCLE_BIN' && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Restore bookmark"
              tabIndex={0}
              onClick={() => handleRestore(b)}
              className="text-green-600"
              title="Restore"
            >
              <BookmarkIcon className="size-5" />
            </Button>
          )}
          {b.color && (
            <span
              className="inline-block w-3 h-3 rounded-full border border-border ml-2 align-middle"
              style={{ backgroundColor: b.color }}
              aria-hidden="true"
              title={`Bookmark color: ${b.color}`}
            />
          )}
        </li>
                  )}
                </Draggable>
      ))}
              {provided.placeholder}
    </ul>
          )}
        </Droppable>
      </DragDropContext>
      {onAddBookmark && (
        <button
          type="button"
          onClick={onAddBookmark}
          aria-label="Add bookmark"
          className="fixed left-1/2 bottom-10 -translate-x-1/2 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-primary/80 text-primary-foreground shadow-lg hover:bg-primary focus:outline-none focus:ring-2 focus:ring-accent transition-all opacity-80 hover:opacity-100 focus:opacity-100 scale-100 hover:scale-110 focus:scale-110"
        >
          <Plus className="size-7" />
        </button>
      )}
    </div>
  );
}; 