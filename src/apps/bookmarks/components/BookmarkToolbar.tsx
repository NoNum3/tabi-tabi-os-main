'use client';
import React, { useRef } from "react";
import { generateNetscapeBookmarksHTML, parseNetscapeBookmarksHTML, ExportFolder } from "../utils/bookmarkExportImport";
import { Button } from "@/components/ui/button";
import { FolderPlus, Upload, Download } from "lucide-react";
import { useAtom } from "jotai";
import { bookmarksAtom } from "../hooks/useBookmarks";
import { foldersAtom } from "../hooks/useFolders";
import { userAtom } from "@/application/atoms/authAtoms";
import { supabase } from "@/infrastructure/lib/supabaseClient";

export const BookmarkToolbar = ({ onAddFolder }: {
  onAddFolder?: () => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bookmarks] = useAtom(bookmarksAtom);
  const [folders] = useAtom(foldersAtom);
  const [user] = useAtom(userAtom);

  // Helper: recursively build folder tree
  function buildExportFolders(parentId: string | null): ExportFolder[] {
    return folders
      .filter((f) => f.parent_id === parentId)
      .map((f) => ({
        id: f.id,
        name: f.name,
        description: f.description || undefined,
        parent_id: f.parent_id,
        add_date: f.created_at ? Math.floor(new Date(f.created_at).getTime() / 1000) : undefined,
        children: [
          ...bookmarks
            .filter(b => b.folder_id === f.id)
            .map(b => ({
              id: b.id,
              url: b.url,
              title: b.title,
              description: b.description || undefined,
              favicon_url: b.favicon_url || undefined,
              add_date: b.created_at ? Math.floor(new Date(b.created_at).getTime() / 1000) : undefined,
              tags: b.tags || undefined,
              is_favorite: b.is_favorite || undefined,
            })),
          ...buildExportFolders(f.id),
        ],
      }));
  }

  // Bookmarks not in any folder
  const rootBookmarks = bookmarks.filter(b => !b.folder_id).map(b => ({
    id: b.id,
    url: b.url,
    title: b.title,
    description: b.description || undefined,
    favicon_url: b.favicon_url || undefined,
    add_date: b.created_at ? Math.floor(new Date(b.created_at).getTime() / 1000) : undefined,
    tags: b.tags || undefined,
    is_favorite: b.is_favorite || undefined,
  }));

  // Top-level folders
  const exportFolders: ExportFolder[] = [
    ...buildExportFolders(null),
    // Optionally, add a root folder for bookmarks not in any folder
    ...(rootBookmarks.length > 0
      ? [{
          id: "root",
          name: "Unsorted Bookmarks",
          children: rootBookmarks,
        }]
      : []),
  ];

  // Export bookmarks as HTML
  const handleExport = () => {
    const html = generateNetscapeBookmarksHTML(exportFolders);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookmarks.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import bookmarks from HTML
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const folders = await parseNetscapeBookmarksHTML(text);
    // Recursively insert folders and bookmarks into Supabase
    async function insertFolders(folders: ExportFolder[], parentId: string | null = null) {
      for (const folder of folders) {
        // Insert folder
        const { data: folderData, error: folderError } = await supabase
          .from("bookmark_folders")
          .insert({
            name: folder.name,
            description: folder.description || null,
            parent_id: parentId,
            user_id: user?.id,
          })
          .select("id")
          .single();
        if (folderError) continue;
        const newFolderId = folderData?.id;
        // Insert bookmarks in this folder
        for (const child of folder.children) {
          if ("url" in child) {
            await supabase.from("bookmarks").insert({
              url: child.url,
              title: child.title,
              description: child.description || null,
              favicon_url: child.favicon_url || null,
              folder_id: newFolderId,
              user_id: user?.id,
            });
          } else {
            await insertFolders([child], newFolderId);
          }
        }
      }
    }
    await insertFolders(folders);
    alert("Imported " + folders.length + " folders and their bookmarks into your account.");
    e.target.value = ""; // Reset input
  };

  return (
    <div className="flex items-center gap-2 p-4 border-b border-border bg-background">
      <Button variant="secondary" aria-label="Add folder" onClick={onAddFolder}>
        <FolderPlus className="size-4" /> Add Folder
      </Button>
      <Button variant="outline" aria-label="Import bookmarks" onClick={handleImportClick}>
        <Upload className="size-4" /> Import
        <input
          ref={fileInputRef}
          type="file"
          accept=".html,text/html"
          className="hidden"
          onChange={handleImportFile}
          aria-label="Import bookmarks HTML file"
        />
      </Button>
      <Button variant="outline" aria-label="Export bookmarks" onClick={handleExport}>
        <Download className="size-4" /> Export
      </Button>
    </div>
  );
}; 