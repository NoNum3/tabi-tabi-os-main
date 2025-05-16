import React, { useEffect, useMemo } from "react";
import { useAtom, useSetAtom } from "jotai";
import { foldersAtom, fetchFoldersAtom, foldersLoadingAtom, foldersErrorAtom, reorderFoldersAtom } from "../hooks/useFolders";
import type { Folder } from "../types/bookmarkTypes";
import { Button } from "@/components/ui/button";
import { Edit2, GripVertical, Star, Trash2 } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import clsx from "clsx";

function buildFolderTree(
  folders: Folder[],
  parentId: string | null = null,
  sort: 'custom' | 'custom-reverse' | 'alpha' | 'alpha-desc' | 'date' | 'date-asc' | 'color' | 'color-desc' | 'symbol' = 'custom'
): Folder[] {
  let children = folders.filter(f => f.parent_id === parentId);
  if (sort === 'alpha') {
    children = [...children].sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'alpha-desc') {
    children = [...children].sort((a, b) => b.name.localeCompare(a.name));
  } else if (sort === 'date') {
    children = [...children].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  } else if (sort === 'date-asc') {
    children = [...children].sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
  } else if (sort === 'color') {
    children = [...children].sort((a, b) => (a.color || '').localeCompare(b.color || ''));
  } else if (sort === 'color-desc') {
    children = [...children].sort((a, b) => (b.color || '').localeCompare(a.color || ''));
  } else if (sort === 'symbol') {
    children = [...children].sort((a, b) => (a.symbol || '').localeCompare(b.symbol || ''));
  } else if (sort === 'custom-reverse') {
    children = [...children].sort((a, b) => (b.sort_order ?? 0) - (a.sort_order ?? 0));
  } else {
    children = [...children].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }
  return children;
}

function flattenTree(
  folders: Folder[],
  parentId: string | null = null,
  depth = 0,
  sort: 'custom' | 'custom-reverse' | 'alpha' | 'alpha-desc' | 'date' | 'date-asc' | 'color' | 'color-desc' | 'symbol' = 'custom'
): { folder: Folder, depth: number }[] {
  let result: { folder: Folder, depth: number }[] = [];
  buildFolderTree(folders, parentId, sort).forEach(f => {
    result.push({ folder: f, depth });
    result = result.concat(flattenTree(folders, f.id, depth + 1, sort));
  });
  return result;
}

export const BookmarkFolderList = ({ selectedFolder, onSelect, onEdit, sort = 'custom' }: {
  selectedFolder: string | null;
  onSelect: (id: string | null) => void;
  onEdit?: (folder: Folder) => void;
  sort?: 'custom' | 'custom-reverse' | 'alpha' | 'alpha-desc' | 'date' | 'date-asc' | 'color' | 'color-desc' | 'symbol';
}) => {
  const [folders] = useAtom(foldersAtom);
  const [, fetchFolders] = useAtom(fetchFoldersAtom);
  const [loading] = useAtom(foldersLoadingAtom);
  const [error] = useAtom(foldersErrorAtom);
  const reorderFolders = useSetAtom(reorderFoldersAtom);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const flatFolders = useMemo(() => flattenTree(folders, null, 0, sort), [folders, sort]);

  // Only allow drag-and-drop in custom sort mode
  const enableDragDrop = sort === 'custom';

  const handleDragEnd = (result: DropResult) => {
    if (!enableDragDrop) return;
    if (!result.destination) return;
    const sourceIdx = result.source.index;
    const destIdx = result.destination.index;
    if (sourceIdx === destIdx) return;
    // Only support reordering at the same parent for now
    const moving = flatFolders[sourceIdx];
    const siblings = flatFolders.filter(f => f.folder.parent_id === moving.folder.parent_id);
    const siblingIds = siblings.map(f => f.folder.id);
    const oldIdx = siblingIds.indexOf(moving.folder.id);
    const newIdx = destIdx;
    // Reorder siblings
    const newSiblings = [...siblings];
    const [removed] = newSiblings.splice(oldIdx, 1);
    newSiblings.splice(newIdx, 0, removed);
    // Prepare updates
    const updates = newSiblings.map((f, idx) => ({
      id: f.folder.id,
      parent_id: f.folder.parent_id,
      sort_order: idx
    }));
    reorderFolders(updates);
  };

  return (
    <nav aria-label="Bookmark folders" className="flex flex-col gap-1 p-4">
      <div
        key="favourites"
        className={clsx(
          "flex items-center gap-2 rounded px-2 py-1 cursor-pointer text-sm transition-colors outline-none",
          selectedFolder === 'FAVOURITES' ? "bg-accent text-accent-foreground" : "hover:bg-muted text-foreground"
        )}
        tabIndex={0}
        role="button"
        aria-pressed={selectedFolder === 'FAVOURITES'}
        aria-label="Select folder: Favourites"
        onClick={() => onSelect('FAVOURITES')}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onSelect('FAVOURITES'); }}
      >
        <Star className="size-4 text-yellow-400" aria-hidden="true" />
        <span className="truncate" title="Favourites">Favourites</span>
      </div>
      <div
        key="recycle-bin"
        className={clsx(
          "flex items-center gap-2 rounded px-2 py-1 cursor-pointer text-sm transition-colors outline-none",
          selectedFolder === 'RECYCLE_BIN' ? "bg-destructive text-destructive-foreground" : "hover:bg-muted text-foreground"
        )}
        tabIndex={0}
        role="button"
        aria-pressed={selectedFolder === 'RECYCLE_BIN'}
        aria-label="Select folder: Recycle Bin"
        onClick={() => onSelect('RECYCLE_BIN')}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onSelect('RECYCLE_BIN'); }}
      >
        <Trash2 className="size-4 text-destructive" aria-hidden="true" />
        <span className="truncate" title="Recycle Bin">Recycle Bin</span>
      </div>
      {loading && <div className="text-xs text-muted-foreground py-2">Loading folders…</div>}
      {error && <div className="text-xs text-red-500 py-2" role="alert">{error}</div>}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="folders-droppable" isDropDisabled={!enableDragDrop}>
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {flatFolders.map(({ folder, depth }, idx) => (
                <Draggable key={folder.id} draggableId={folder.id} index={idx} isDragDisabled={!enableDragDrop || flatFolders.length < 2}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...(enableDragDrop ? provided.draggableProps : {})}
                      className={clsx(
                        "group flex flex-col gap-0.5 rounded px-2 py-1 cursor-pointer text-sm transition-colors outline-none",
                        selectedFolder === folder.id ? "bg-accent text-accent-foreground" : "hover:bg-muted text-foreground"
                      )}
                      tabIndex={0}
                      role="button"
                      aria-pressed={selectedFolder === folder.id}
                      aria-label={`Select folder: ${folder.name}`}
                      onClick={() => onSelect(folder.id)}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onSelect(folder.id); }}
                      style={{ marginLeft: depth * 16 }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          {...(enableDragDrop ? provided.dragHandleProps : {})}
                          aria-label={enableDragDrop ? "Drag to reorder" : "Drag disabled in this sort mode"}
                          className={clsx(
                            "flex items-center justify-center cursor-grab mr-1",
                            !enableDragDrop ? "opacity-30 pointer-events-none" : ""
                          )}
                          tabIndex={-1}
                        >
                          <GripVertical className="size-4 opacity-60 group-hover:opacity-100" />
                        </span>
                        {folder.color && (
                          <span
                            className="inline-block w-3 h-3 rounded-full border border-border mr-1 align-middle"
                            style={{ backgroundColor: folder.color }}
                            aria-hidden="true"
                            title={`Folder color: ${folder.color}`}
                          />
                        )}
                        <span className="truncate flex-1">{folder.name}</span>
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-1 opacity-80 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                            aria-label={`Edit folder: ${folder.name}`}
                            tabIndex={0}
                            onClick={e => { e.stopPropagation(); onEdit(folder); }}
                          >
                            <Edit2 className="size-4" />
                          </Button>
                        )}
                      </div>
                      {folder.description && (
                        <div className="text-xs text-muted-foreground mt-0.5 ml-6 break-words max-w-xs" style={{ opacity: 0.85 }}>
                          {folder.description}
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </nav>
  );
}; 