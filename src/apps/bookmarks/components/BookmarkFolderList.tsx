import React, { useEffect, useMemo, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import { foldersAtom, foldersErrorAtom, fetchFoldersAtom, reorderFoldersAtom } from "../hooks/useFolders";
import type { Folder } from "../types/bookmarkTypes";
import { Button } from "@/components/ui/button";
import { Edit2, Star, Trash2, ArrowUp, ArrowDown, Search } from "lucide-react";
import clsx from "clsx";
import { useI18n } from '@/locales/client';

// Helper: Build a tree structure from flat folders
export type FolderTreeNode = Folder & { children: FolderTreeNode[] };
function buildTree(folders: Folder[], parentId: string | null = null, sort: string = 'custom'): FolderTreeNode[] {
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
  return children.map(child => ({
    ...child,
    children: buildTree(folders, child.id, sort)
  }));
}

export const BookmarkFolderList = ({ selectedFolder, onSelect, onEdit, sort = 'custom' }: {
  selectedFolder: string | null;
  onSelect: (id: string | null) => void;
  onEdit?: (folder: Folder) => void;
  sort?: string;
}) => {
  const [folders] = useAtom(foldersAtom);
  const [, fetchFolders] = useAtom(fetchFoldersAtom);
  const [error] = useAtom(foldersErrorAtom);
  const reorderFolders = useSetAtom(reorderFoldersAtom);
  const t = useI18n();
  const [search, setSearch] = useState("");

  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  // Filter folders by search
  const filteredFolders = useMemo(() => {
    if (!search.trim()) return folders;
    const lower = search.trim().toLowerCase();
    return folders.filter(f => f.name.toLowerCase().includes(lower));
  }, [folders, search]);

  const tree = useMemo(() => buildTree(filteredFolders, null, sort), [filteredFolders, sort]);

  // Move folder up/down among siblings
  const moveFolder = (folderId: string, direction: 'up' | 'down') => {
    // Find siblings
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;
    const siblings = folders.filter(f => f.parent_id === folder.parent_id)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const idx = siblings.findIndex(f => f.id === folderId);
    if (idx === -1) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= siblings.length) return;
    // Swap
    const reordered = [...siblings];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
    // Update sort_order
    const updates = reordered.map((f, i) => ({ id: f.id, parent_id: f.parent_id ?? null, sort_order: i }));
    reorderFolders(updates);
  };

  // Recursive render
  function renderTree(nodes: FolderTreeNode[], depth = 0) {
    return nodes.map((node, idx, arr) => (
      <div
        key={node.id}
        className={clsx(
          "group flex flex-col gap-0.5 rounded px-2 py-1 cursor-pointer text-sm transition-colors outline-none",
          selectedFolder === node.id ? "bg-accent text-accent-foreground" : "hover:bg-muted text-foreground"
        )}
        tabIndex={0}
        role="button"
        aria-pressed={selectedFolder === node.id}
        aria-label={`Select folder: ${node.name}`}
        onClick={() => onSelect(node.id)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onSelect(node.id); }}
        style={{ marginLeft: depth * 16 }}
      >
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center mr-1" tabIndex={-1}>
            {/* No drag handle */}
          </span>
          {node.color && (
            <span
              className="inline-block w-3 h-3 rounded-full border border-border mr-1 align-middle"
              style={{ backgroundColor: node.color }}
              aria-hidden="true"
              title={`Folder color: ${node.color}`}
            />
          )}
          <span className="truncate flex-1">{node.name}</span>
          {/* Up/Down buttons */}
          <Button
            variant="ghost"
            size="icon"
            className="ml-1"
            aria-label={t('moveUp', { count: 1 })}
            tabIndex={0}
            onClick={e => { e.stopPropagation(); moveFolder(node.id, 'up'); }}
            disabled={idx === 0}
          >
            <ArrowUp className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="ml-1"
            aria-label={t('moveDown', { count: 1 })}
            tabIndex={0}
            onClick={e => { e.stopPropagation(); moveFolder(node.id, 'down'); }}
            disabled={idx === arr.length - 1}
          >
            <ArrowDown className="size-4" />
          </Button>
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="ml-1 opacity-80 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
              aria-label={`Edit folder: ${node.name}`}
              tabIndex={0}
              onClick={e => { e.stopPropagation(); onEdit(node); }}
            >
              <Edit2 className="size-4" />
            </Button>
          )}
        </div>
        {node.description && (
          <div className="text-xs text-muted-foreground mt-0.5 ml-6 break-words max-w-xs" style={{ opacity: 0.85 }}>
            {node.description}
          </div>
        )}
        {/* Render children recursively */}
        {node.children && node.children.length > 0 && renderTree(node.children, depth + 1)}
      </div>
    ));
  }

  return (
    <nav aria-label="Bookmark folders" className="flex flex-col gap-1 p-4">
      <div className="flex gap-2 mb-2">
        <div
          key="favourites"
          className={clsx(
            "flex items-center gap-2 rounded px-2 py-1 cursor-pointer text-sm transition-colors outline-none",
            selectedFolder === 'FAVOURITES' ? "bg-accent text-accent-foreground" : "hover:bg-muted text-foreground"
          )}
          tabIndex={0}
          role="button"
          aria-pressed={selectedFolder === 'FAVOURITES'}
          aria-label={`Select folder: ${t('bookmarkFolderAll', { count: 1 })}`}
          onClick={() => onSelect('FAVOURITES')}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onSelect('FAVOURITES'); }}
        >
          <Star className="size-4 text-yellow-400" aria-hidden="true" />
          <span className="truncate" title={t('bookmarkFolderAll', { count: 1 })}>{t('bookmarkFolderAll', { count: 1 })}</span>
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
          aria-label={`Select folder: ${t('bookmarkFolderRecycleBin', { count: 1 })}`}
          onClick={() => onSelect('RECYCLE_BIN')}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") onSelect('RECYCLE_BIN'); }}
        >
          <Trash2 className="size-4 text-destructive" aria-hidden="true" />
          <span className="truncate" title={t('bookmarkFolderRecycleBin', { count: 1 })}>{t('bookmarkFolderRecycleBin', { count: 1 })}</span>
        </div>
      </div>
      {/* Improved Search UI */}
      <div className="relative mb-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('searchFolders', { count: 1 })}
          aria-label={t('searchFolders', { count: 1 })}
          className="w-full pl-9 pr-3 py-2 rounded-full bg-muted/60 shadow-sm border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          style={{ minWidth: 0 }}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      </div>
      {error && <div className="text-xs text-red-500 py-2" role="alert">{error}</div>}
      {renderTree(tree)}
    </nav>
  );
}; 