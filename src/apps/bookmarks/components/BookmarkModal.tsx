import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useSetAtom, useAtom } from "jotai";
import { addBookmarkAtom, updateBookmarkAtom, bookmarksLoadingAtom, bookmarksErrorAtom } from "../hooks/useBookmarks";
import { foldersAtom } from "../hooks/useFolders";
import type { Bookmark } from "../types/bookmarkTypes";
import { WritableAtom } from "jotai";
import { useI18n } from '@/locales/client';

const EMOJI_OPTIONS = ["⭐", "🔖", "📚", "💡", "🔥", "🎵", "📺", "📝", "🔗", "📦", "🧩", "📁", "🧠", "🌟", "🚀", "❤️", "💻", "📷", "🎮", "🛒", "🏷️"];

export const BookmarkModal = ({ open, onClose, bookmark, folderId }: {
  open: boolean;
  onClose: () => void;
  bookmark?: Bookmark | null;
  folderId?: string | null;
}) => {
  const isEdit = !!bookmark;
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string>("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [faviconUrl, setFaviconUrl] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(folderId || null);
  const [folders] = useAtom(foldersAtom);
  const setAddBookmark = useSetAtom(addBookmarkAtom);
  const setUpdateBookmark = useSetAtom(updateBookmarkAtom);
  const [loading] = useAtom(bookmarksLoadingAtom);
  const [error, setError] = useAtom(bookmarksErrorAtom as WritableAtom<string | null, [string | null], void>);
  const [symbol, setSymbol] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const t = useI18n();

  useEffect(() => {
    if (bookmark) {
      setUrl(bookmark.url || "");
      setTitle(bookmark.title || "");
      setDescription(bookmark.description || "");
      setTags((bookmark.tags || []).join(", "));
      setIsFavorite(!!bookmark.is_favorite);
      setFaviconUrl(bookmark.favicon_url || "");
      setSelectedFolderId(bookmark.folder_id || null);
      setSymbol(bookmark.symbol || "");
      setColor(bookmark.color || "");
    } else {
      setUrl("");
      setTitle("");
      setDescription("");
      setTags("");
      setIsFavorite(false);
      setFaviconUrl("");
      setSelectedFolderId(folderId || null);
      setSymbol("");
      setColor("");
    }
    setError(null);
  }, [bookmark, open, setError, folderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError("URL is required.");
      return;
    }
    const tagArr = tags.split(",").map(t => t.trim()).filter(Boolean);
    const data = {
      url: url.trim(),
      title: title.trim() || url.trim(),
      description: description.trim() || null,
      tags: tagArr.length ? tagArr : null,
      is_favorite: isFavorite,
      favicon_url: faviconUrl.trim() || null,
      folder_id: selectedFolderId || null,
      symbol: symbol || null,
      color: color || null,
    };
    if (isEdit && bookmark) {
      await setUpdateBookmark({ ...bookmark, ...data });
    } else {
      await setAddBookmark(data);
    }
    if (!bookmarksErrorAtom) {
      onClose();
    }
  };

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div className="bg-card rounded-xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-lg font-semibold mb-4">{isEdit ? t('bookmarkEdit', { count: 1 }) : t('bookmarkAdd', { count: 1 })}</h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1">
            <span className="font-medium">{t('bookmarkUrl', { count: 1 })}</span>
            <Input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder={t('bookmarkUrlPlaceholder', { count: 1 })} required aria-label="Bookmark URL" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">{t('bookmarkTitle', { count: 1 })}</span>
            <Input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('bookmarkTitlePlaceholder', { count: 1 })} aria-label="Bookmark title (optional)" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">{t('bookmarkDescription', { count: 1 })}</span>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t('bookmarkDescriptionPlaceholder', { count: 1 })} rows={2} aria-label="Bookmark description" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">{t('bookmarkTags', { count: 1 })}</span>
            <Input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder={t('bookmarkTagsPlaceholder', { count: 1 })} aria-label="Bookmark tags" />
          </label>
          <label className="flex items-center gap-2">
            <Checkbox id="favorite" checked={isFavorite} onCheckedChange={v => setIsFavorite(!!v)} aria-label="Favorite" />
            <span>{t('bookmarkFavorite', { count: 1 })}</span>
            <Star className="size-4 text-yellow-400" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">{t('bookmarkFolder', { count: 1 })}</span>
            <select
              value={selectedFolderId || ""}
              onChange={e => setSelectedFolderId(e.target.value || null)}
              className="border border-border rounded px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
              aria-label="Bookmark folder"
            >
              <option value="">{t('bookmarkAllBookmarks', { count: 1 })}</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">{t('bookmarkSymbol', { count: 1 })}</span>
            <select value={symbol} onChange={e => setSymbol(e.target.value)} aria-label="Bookmark symbol" className="border border-border rounded px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-colors">
              <option value="">None</option>
              {EMOJI_OPTIONS.map((emoji) => (
                <option key={emoji} value={emoji}>{emoji}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium">Color</span>
            <input type="color" value={color} onChange={e => setColor(e.target.value)} aria-label="Bookmark color" className="w-10 h-8 p-0 border-none bg-transparent" />
          </label>
          {error && (
            <div className="text-destructive text-sm mt-2" role="alert">
              {t(error, { count: 1 }) !== error ? t(error, { count: 1 }) : error}
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose} aria-label="Cancel" disabled={loading}>Cancel</Button>
            <Button type="submit" variant="default" aria-label={isEdit ? "Save changes" : "Add bookmark"} disabled={loading}>{loading ? "Saving..." : isEdit ? "Save" : "Add"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}; 