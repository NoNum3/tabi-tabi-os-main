import { atom, WritableAtom } from "jotai";
import { supabase } from "@/infrastructure/lib/supabaseClient";
import { Folder } from "../types/bookmarkTypes";
import { userAtom } from "@/application/atoms/authAtoms";
import { useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";

export const foldersAtom = atom<Folder[]>([]);
export const foldersErrorAtom = atom<string | null>(null);
export const foldersLoadingAtom = atom<boolean>(false);

export const fetchFoldersAtom = atom(
  null,
  async (get, set) => {
    const user = get(userAtom);
    // Only show loading if folders are empty (initial load)
    const folders = get(foldersAtom);
    if (!folders || folders.length === 0) {
      set(foldersLoadingAtom, true);
    }
    set(foldersErrorAtom as WritableAtom<string | null, [string | null], void>, null);
    if (!user) {
      set(foldersLoadingAtom, false);
      set(foldersErrorAtom as WritableAtom<string | null, [string | null], void>, "User not logged in");
      set(foldersAtom, []);
      return;
    }
    const { data, error } = await supabase
      .from("bookmark_folders")
      .select("id, user_id, name, description, parent_id, symbol, color, is_pinned, sort_order, created_at, updated_at, deleted_at")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    set(foldersLoadingAtom, false);
    if (error) {
      set(foldersErrorAtom as WritableAtom<string | null, [string | null], void>, error.message);
      set(foldersAtom, []);
      return;
    }
    set(foldersAtom, data as Folder[]);
  },
);

export const addFolderAtom = atom(
  null,
  async (get, set, folder: Omit<Folder, "id" | "created_at" | "updated_at" | "deleted_at" | "user_id">) => {
    const user = get(userAtom);
    set(foldersLoadingAtom, true);
    set(foldersErrorAtom as WritableAtom<string | null, [string | null], void>, null);
    if (!user) {
      set(foldersLoadingAtom, false);
      set(foldersErrorAtom as WritableAtom<string | null, [string | null], void>, "User not logged in");
      return;
    }
    const { error } = await supabase
      .from("bookmark_folders")
      .insert([{ ...folder, user_id: user.id, symbol: folder.symbol || null, color: folder.color || null, is_pinned: folder.is_pinned || false }]);
    set(foldersLoadingAtom, false);
    if (error) {
      set(foldersErrorAtom as WritableAtom<string | null, [string | null], void>, error.message);
      return;
    }
    await set(fetchFoldersAtom);
  },
);

export const updateFolderAtom = atom(
  null,
  async (get, set, folder: Folder) => {
    const user = get(userAtom);
    set(foldersLoadingAtom, true);
    set(foldersErrorAtom as WritableAtom<string | null, [string | null], void>, null);
    if (!user) {
      set(foldersLoadingAtom, false);
      set(foldersErrorAtom as WritableAtom<string | null, [string | null], void>, "User not logged in");
      return;
    }
    const { error } = await supabase
      .from("bookmark_folders")
      .update({
        name: folder.name,
        description: folder.description,
        parent_id: folder.parent_id,
        symbol: folder.symbol || null,
        color: folder.color || null,
        is_pinned: folder.is_pinned || false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", folder.id)
      .eq("user_id", user.id);
    set(foldersLoadingAtom, false);
    if (error) {
      set(foldersErrorAtom as WritableAtom<string | null, [string | null], void>, error.message);
      return;
    }
    await set(fetchFoldersAtom);
  },
);

export const deleteFolderAtom = atom(
  null,
  async (get, set, folderId: string) => {
    const user = get(userAtom);
    set(foldersLoadingAtom, true);
    set(foldersErrorAtom as WritableAtom<string | null, [string | null], void>, null);
    if (!user) {
      set(foldersLoadingAtom, false);
      set(foldersErrorAtom as WritableAtom<string | null, [string | null], void>, "User not logged in");
      return;
    }
    const { error } = await supabase
      .from("bookmark_folders")
      .delete()
      .eq("id", folderId)
      .eq("user_id", user.id);
    set(foldersLoadingAtom, false);
    if (error) {
      set(foldersErrorAtom as WritableAtom<string | null, [string | null], void>, error.message);
      return;
    }
    await set(fetchFoldersAtom);
  },
);

export const reorderFoldersAtom = atom(
  null,
  async (get, set, updates: {id: string, parent_id: string | null, sort_order: number}[]) => {
    const user = get(userAtom);
    if (!user) return;
    const prevFolders = get(foldersAtom);
    // Optimistically update local order and nesting
    const newFolders = [...prevFolders];
    updates.forEach(update => {
      const idx = newFolders.findIndex(f => f.id === update.id);
      if (idx !== -1) {
        newFolders[idx] = {
          ...newFolders[idx],
          parent_id: update.parent_id,
          sort_order: update.sort_order,
        };
      }
    });
    set(foldersAtom, newFolders);
    // Try to update Supabase
    try {
      await Promise.all(
        updates.map(u =>
          supabase
            .from("bookmark_folders")
            .update({ parent_id: u.parent_id, sort_order: u.sort_order })
            .eq("id", u.id)
            .eq("user_id", user.id)
        )
      );
    } catch {
      set(foldersAtom, prevFolders);
      set(foldersErrorAtom as WritableAtom<string | null, [string | null], void>, "Failed to reorder folders");
    }
  }
);

export const useFoldersRealtime = () => {
  const user = useAtom(userAtom)[0];
  const setFolders = useSetAtom(foldersAtom);
  const setError = useSetAtom(foldersErrorAtom as WritableAtom<string | null, [string | null], void>);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("folders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookmark_folders",
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          const { data, error } = await supabase
            .from("bookmark_folders")
            .select("id, user_id, name, description, parent_id, symbol, color, is_pinned, sort_order, created_at, updated_at, deleted_at")
            .eq("user_id", user.id)
            .is("deleted_at", null)
            .order("created_at", { ascending: false });
          if (!error && data) {
            setFolders(data as Folder[]);
          }
          if (error) setError(error.message);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, setFolders, setError]);
}; 