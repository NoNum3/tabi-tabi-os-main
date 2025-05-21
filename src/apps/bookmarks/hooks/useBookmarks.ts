import { atom, WritableAtom } from "jotai";
import { supabase } from "@/infrastructure/lib/supabaseClient";
import { Bookmark } from "../types/bookmarkTypes";
import { userAtom } from "@/application/atoms/authAtoms";
import { useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import type { TablesInsert, Json } from "@/types/supabase";

export const bookmarksAtom = atom<Bookmark[]>([]);
export const bookmarksErrorAtom = atom<string | null>(null);
export const bookmarksLoadingAtom = atom<boolean>(false);

export const fetchBookmarksAtom = atom(
  null,
  async (get, set) => {
    const user = get(userAtom);
    const bookmarks = get(bookmarksAtom);
    if (!bookmarks || bookmarks.length === 0) {
      set(bookmarksLoadingAtom, true);
    }
    set(bookmarksErrorAtom as WritableAtom<string | null, [string | null], void>, null);
    if (!user) {
      set(bookmarksLoadingAtom, false);
      set(bookmarksErrorAtom as WritableAtom<string | null, [string | null], void>, "bookmarkUserNotLoggedIn");
      set(bookmarksAtom, []);
      return;
    }
    const { data, error } = await supabase
      .from("bookmarks")
      .select("id, user_id, url, title, description, tags, favicon_url, folder_id, is_favorite, is_pinned, symbol, color, sort_order, created_at, updated_at, deleted_at")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    set(bookmarksLoadingAtom, false);
    if (error) {
      set(bookmarksErrorAtom as WritableAtom<string | null, [string | null], void>, error.message);
      set(bookmarksAtom, []);
      return;
    }
    set(bookmarksAtom, data as Bookmark[]);
  },
);

export const addBookmarkAtom = atom(
  null,
  async (get, set, bookmark: Omit<Bookmark, "id" | "created_at" | "updated_at" | "deleted_at" | "user_id">) => {
    const user = get(userAtom);
    set(bookmarksLoadingAtom, true);
    set(bookmarksErrorAtom as WritableAtom<string | null, [string | null], void>, null);
    if (!user) {
      set(bookmarksLoadingAtom, false);
      set(bookmarksErrorAtom as WritableAtom<string | null, [string | null], void>, "bookmarkUserNotLoggedIn");
      return;
    }
    const insertData: TablesInsert<'bookmarks'> = {
      ...bookmark,
      user_id: user.id,
      symbol: bookmark.symbol || null,
      color: bookmark.color || null,
      is_pinned: bookmark.is_pinned || false,
      custom_metadata: bookmark.custom_metadata ? (bookmark.custom_metadata as Json) : null,
      title: bookmark.title,
      url: bookmark.url,
    };
    const { error } = await supabase
      .from("bookmarks")
      .insert([insertData]);
    set(bookmarksLoadingAtom, false);
    if (error) {
      set(bookmarksErrorAtom as WritableAtom<string | null, [string | null], void>, error.message);
      return;
    }
    await set(fetchBookmarksAtom);
  },
);

export const updateBookmarkAtom = atom(
  null,
  async (get, set, bookmark: Bookmark) => {
    const user = get(userAtom);
    set(bookmarksLoadingAtom, true);
    set(bookmarksErrorAtom as WritableAtom<string | null, [string | null], void>, null);
    if (!user) {
      set(bookmarksLoadingAtom, false);
      set(bookmarksErrorAtom as WritableAtom<string | null, [string | null], void>, "bookmarkUserNotLoggedIn");
      return;
    }
    const { error } = await supabase
      .from("bookmarks")
      .update({
        url: bookmark.url,
        title: bookmark.title,
        description: bookmark.description,
        tags: bookmark.tags,
        favicon_url: bookmark.favicon_url,
        folder_id: bookmark.folder_id,
        is_favorite: bookmark.is_favorite,
        is_pinned: bookmark.is_pinned || false,
        symbol: bookmark.symbol || null,
        color: bookmark.color || null,
        deleted_at: bookmark.deleted_at ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookmark.id)
      .eq("user_id", user.id);
    set(bookmarksLoadingAtom, false);
    if (error) {
      set(bookmarksErrorAtom as WritableAtom<string | null, [string | null], void>, error.message);
      return;
    }
    await set(fetchBookmarksAtom);
  },
);

export const deleteBookmarkAtom = atom(
  null,
  async (get, set, bookmarkId: string) => {
    const user = get(userAtom);
    set(bookmarksLoadingAtom, true);
    set(bookmarksErrorAtom as WritableAtom<string | null, [string | null], void>, null);
    if (!user) {
      set(bookmarksLoadingAtom, false);
      set(bookmarksErrorAtom as WritableAtom<string | null, [string | null], void>, "bookmarkUserNotLoggedIn");
      return;
    }
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", bookmarkId)
      .eq("user_id", user.id);
    set(bookmarksLoadingAtom, false);
    if (error) {
      set(bookmarksErrorAtom as WritableAtom<string | null, [string | null], void>, error.message);
      return;
    }
    await set(fetchBookmarksAtom);
  },
);

export const reorderBookmarksAtom = atom(
  null,
  async (get, set, orderedIds: string[]) => {
    const user = get(userAtom);
    if (!user) return;
    const prevBookmarks = get(bookmarksAtom);
    // Optimistically update local order
    const newOrder = orderedIds
      .map(id => prevBookmarks.find(b => b.id === id))
      .filter(Boolean) as Bookmark[];
    set(bookmarksAtom, newOrder);
    // Try to update Supabase
    try {
      await Promise.all(
        orderedIds.map((id, idx) =>
          supabase
            .from("bookmarks")
            .update({ sort_order: idx })
            .eq("id", id)
            .eq("user_id", user.id)
        )
      );
    } catch {
      // Revert on error
      set(bookmarksAtom, prevBookmarks);
      set(bookmarksErrorAtom as WritableAtom<string | null, [string | null], void>, "Failed to reorder bookmarks");
    }
  }
);

export const useBookmarksRealtime = () => {
  const user = useAtom(userAtom)[0];
  const setBookmarks = useSetAtom(bookmarksAtom);
  const setError = useSetAtom(bookmarksErrorAtom as WritableAtom<string | null, [string | null], void>);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("bookmarks")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmarks",
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          const { data, error } = await supabase
            .from("bookmarks")
            .select("id, user_id, url, title, description, tags, favicon_url, folder_id, is_favorite, is_pinned, symbol, color, sort_order, created_at, updated_at, deleted_at")
            .eq("user_id", user.id)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false });
          if (!error && data) {
            setBookmarks(data as Bookmark[]);
          }
          if (error) setError(error.message);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, setBookmarks, setError]);
}; 