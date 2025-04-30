import { atom, WritableAtom } from "jotai";
import { supabase } from "@/lib/supabaseClient";
import { userAtom } from "./authAtoms";

// Define the shape of a bookmark item
export interface BookmarkItem {
    id: string; // Supabase UUID
    user_id: string;
    title: string;
    url: string;
    type: string; // e.g., 'general', 'social'
    created_at: string; // ISO string format
}

// Atom to hold the list of bookmarks
export const bookmarksAtom = atom<BookmarkItem[]>([]);
bookmarksAtom.debugLabel = "bookmarksAtom";

// Loading and error state atoms
export const bookmarksLoadingAtom = atom<boolean>(true);
bookmarksLoadingAtom.debugLabel = "bookmarksLoadingAtom";
export const bookmarksErrorAtom = atom<string | null>(null);
bookmarksErrorAtom.debugLabel = "bookmarksErrorAtom";

// --- Async Action Atoms ---

// Fetch bookmarks for the current user
export const fetchBookmarksAtom = atom(null, async (get, set) => {
    const user = get(userAtom);
    if (!user) {
        set(bookmarksAtom, []);
        set(bookmarksLoadingAtom, false);
        set(bookmarksErrorAtom as WritableAtom<string | null, [string | null], void>, "User not logged in.");
        return;
    }

    set(bookmarksLoadingAtom, true);
    set(bookmarksErrorAtom as WritableAtom<string | null, [string | null], void>, null);

    try {
        const { data, error } = await supabase
            .from("bookmarks")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) throw error;
        set(bookmarksAtom, data || []);
    } catch (error: unknown) {
        console.error("Error fetching bookmarks:", error);
        const errorMessage = error instanceof Error
            ? error.message
            : "Failed to fetch bookmarks";
        set(bookmarksErrorAtom as WritableAtom<string | null, [string | null], void>, errorMessage);
        set(bookmarksAtom, []);
    } finally {
        set(bookmarksLoadingAtom, false);
    }
});

// Add a new bookmark
export const addBookmarkAtom = atom(
    null,
    async (
        get,
        set,
        newBookmark: Omit<BookmarkItem, "id" | "user_id" | "created_at">,
    ) => {
        const user = get(userAtom);
        if (!user) {
            set(bookmarksErrorAtom as WritableAtom<string | null, [string | null], void>, "Cannot add bookmark: User not logged in.");
            return;
        }
        if (!newBookmark.title.trim() || !newBookmark.url.trim()) {
            set(bookmarksErrorAtom as WritableAtom<string | null, [string | null], void>, "Title and URL cannot be empty.");
            return;
        }

        // Basic URL validation (add more robust validation if needed)
        try {
            new URL(newBookmark.url);
        } catch {
            set(bookmarksErrorAtom as WritableAtom<string | null, [string | null], void>, "Invalid URL format.");
            return;
        }

        // Optimistic update
        const optimisticId = `temp-${Date.now()}`;
        const optimisticBookmark: BookmarkItem = {
            id: optimisticId,
            user_id: user.id,
            created_at: new Date().toISOString(),
            ...newBookmark,
        };
        set(bookmarksAtom, (prev) => [optimisticBookmark, ...prev]);

        try {
            const { data, error } = await supabase
                .from("bookmarks")
                .insert({
                    ...newBookmark,
                    user_id: user.id,
                })
                .select()
                .single();

            if (error) throw error;

            // Replace optimistic with real data
            set(
                bookmarksAtom,
                (prev) => prev.map((bm) => bm.id === optimisticId ? data : bm),
            );
            console.log("Added bookmark:", data);
        } catch (error: unknown) {
            console.error("Error adding bookmark:", error);
            const errorMessage = error instanceof Error
                ? error.message
                : "Failed to add bookmark";
            set(bookmarksErrorAtom as WritableAtom<string | null, [string | null], void>, errorMessage);
            // Revert optimistic update
            set(
                bookmarksAtom,
                (prev) => prev.filter((bm) => bm.id !== optimisticId),
            );
        }
    },
);

// Remove a bookmark
export const removeBookmarkAtom = atom(
    null,
    async (get, set, bookmarkId: string) => {
        const user = get(userAtom);
        if (!user) return;

        const originalBookmarks = get(bookmarksAtom);

        // Optimistic update
        set(bookmarksAtom, (prev) => prev.filter((bm) => bm.id !== bookmarkId));

        try {
            const { error } = await supabase
                .from("bookmarks")
                .delete()
                .match({ id: bookmarkId, user_id: user.id });

            if (error) throw error;
            console.log("Removed bookmark:", bookmarkId);
        } catch (error: unknown) {
            console.error(`Error deleting bookmark ${bookmarkId}:`, error);
            const errorMessage = error instanceof Error
                ? error.message
                : `Failed to delete bookmark ${bookmarkId}`;
            set(bookmarksErrorAtom as WritableAtom<string | null, [string | null], void>, errorMessage);
            // Revert optimistic update
            set(bookmarksAtom, originalBookmarks);
        }
    },
);

// Derived atom example: Group bookmarks by type
export const groupedBookmarksAtom = atom((get) => {
    const bookmarks = get(bookmarksAtom);
    return bookmarks.reduce((acc, bm) => {
        const type = bm.type || "general";
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(bm);
        return acc;
    }, {} as Record<string, BookmarkItem[]>);
});
