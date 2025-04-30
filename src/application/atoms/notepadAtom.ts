import { atom } from "jotai";
import { supabase } from "@/lib/supabaseClient"; // Corrected path
import { userAtom } from "../../atoms/authAtoms"; // Corrected relative path
import type { WritableAtom } from "jotai";
// import type { PostgrestFilterBuilder } from "@supabase/supabase-js"; // Ensure this is removed

// --- Re-export userAtom ---
export { userAtom };

// --- Note Type Definition (Matches Supabase Table) ---
export interface Note {
    id: string; // Supabase UUID
    user_id: string;
    title: string | null; // Allow title to be null, matching DB
    content: string | null; // Serialized Lexical JSON state
    created_at: string; // ISO string
    updated_at: string; // ISO string
}

// --- Core State Atoms ---

// Holds the list of notes fetched from Supabase
export const notesAtom = atom<Note[]>([]);

// ID of the currently selected/active note for editing
export const activeNoteIdAtom = atom<string | null>(null);

// Loading and Error states for fetch operations
export const notesLoadingAtom = atom<boolean>(true);
export const notesErrorAtom = atom<string | null>(null);

// --- Derived Atoms ---

// Get the full Note object for the active note
export const activeNoteAtom = atom<Note | null>((get) => {
    const notes = get(notesAtom);
    const activeId = get(activeNoteIdAtom);
    if (!activeId) return null;
    return notes.find((note) => note.id === activeId) || null;
});

// Get the content string of the active note (for editor initial state)
export const activeNoteContentAtom = atom<string | null>((get) => {
    const activeNote = get(activeNoteAtom);
    return activeNote?.content || null;
});

// --- Async Action Atoms (Supabase Integration) ---

// Fetch notes for the current user
export const fetchNotesAtom = atom(null, async (get, set) => {
    const user = get(userAtom);
    if (!user) {
        set(notesAtom as WritableAtom<Note[], [Note[]], void>, []);
        set(
            activeNoteIdAtom as WritableAtom<
                string | null,
                [string | null],
                void
            >,
            null,
        ); // Clear active note if logged out
        set(notesLoadingAtom as WritableAtom<boolean, [boolean], void>, false);
        set(
            notesErrorAtom as WritableAtom<
                string | null,
                [string | null],
                void
            >,
            null,
        );
        return;
    }

    set(notesLoadingAtom as WritableAtom<boolean, [boolean], void>, true);
    set(
        notesErrorAtom as WritableAtom<string | null, [string | null], void>,
        null,
    );
    console.log("[fetchNotesAtom] Fetching notes for user:", user.id);

    try {
        const query = supabase
            .from("notes")
            .select("id, user_id, title, content, created_at, updated_at");

        const filteredQuery = query.eq("user_id", user.id);

        // Reverted to direct call without assertion
        const { data, error } = await filteredQuery.order("updated_at", {
            ascending: false,
        });

        if (error) throw error;

        console.log("[fetchNotesAtom] Notes received:", data?.length);
        const notes = data || [];
        set(notesAtom as WritableAtom<Note[], [Note[]], void>, notes);

        // If no active note is set OR the current active note doesn't exist anymore,
        // select the first note (most recently updated) if available.
        const currentActiveId = get(activeNoteIdAtom);
        const activeNoteStillExists = notes.some((note) =>
            note.id === currentActiveId
        );

        if ((!currentActiveId || !activeNoteStillExists) && notes.length > 0) {
            console.log(
                "[fetchNotesAtom] Setting active note to the first one:",
                notes[0].id,
            );
            set(
                activeNoteIdAtom as WritableAtom<
                    string | null,
                    [string | null],
                    void
                >,
                notes[0].id,
            );
        } else if (notes.length === 0) {
            console.log(
                "[fetchNotesAtom] No notes found, creating initial note...",
            );
            // Auto-create first note if none exist after fetch
            set(createNewNoteAtom);
        } else if (!activeNoteStillExists && currentActiveId) {
            console.log("[fetchNotesAtom] Active note gone, clearing ID");
            set(
                activeNoteIdAtom as WritableAtom<
                    string | null,
                    [string | null],
                    void
                >,
                null,
            ); // Clear if active note was deleted
        }
    } catch (error: unknown) {
        console.error("Error fetching notes:", error);
        const errorMessage = error instanceof Error
            ? error.message
            : "Failed to fetch notes";
        set(
            notesErrorAtom as WritableAtom<
                string | null,
                [string | null],
                void
            >,
            errorMessage,
        );
        set(notesAtom as WritableAtom<Note[], [Note[]], void>, []);
        set(
            activeNoteIdAtom as WritableAtom<
                string | null,
                [string | null],
                void
            >,
            null,
        );
    } finally {
        set(notesLoadingAtom as WritableAtom<boolean, [boolean], void>, false);
    }
});

// Create a new note
export const createNewNoteAtom = atom(null, async (get, set) => {
    const user = get(userAtom);
    if (!user) {
        set(
            notesErrorAtom as WritableAtom<
                string | null,
                [string | null],
                void
            >,
            "Cannot create note: User not logged in.",
        );
        return;
    }

    // Generate simple default empty state for Lexical
    const defaultEditorState = JSON.stringify({
        root: {
            children: [
                {
                    children: [],
                    direction: null,
                    format: "",
                    indent: 0,
                    type: "paragraph",
                    version: 1,
                },
            ],
            direction: null,
            format: "",
            indent: 0,
            type: "root",
            version: 1,
        },
    });

    console.log("[createNewNoteAtom] Creating new note for user:", user.id);

    try {
        const { data, error } = await supabase
            .from("notes")
            .insert({
                user_id: user.id,
                title: "Untitled Note",
                content: defaultEditorState,
            })
            .select() // Select all columns from the inserted row
            .single(); // Expect a single row back

        if (error) throw error;

        if (!data) { // data will be the single inserted note object, or null if not found after insert
            throw new Error("No data returned after insert or note not found");
        }
        const newNote = data as Note; // data is the new note object

        console.log("[createNewNoteAtom] New note created:", newNote.id);
        set(notesAtom as WritableAtom<Note[], [Note[]], void>, [
            newNote,
            ...get(notesAtom),
        ]);
        set(
            activeNoteIdAtom as WritableAtom<
                string | null,
                [string | null],
                void
            >,
            newNote.id,
        );
        set(
            notesErrorAtom as WritableAtom<
                string | null,
                [string | null],
                void
            >,
            null,
        );
    } catch (error: unknown) {
        console.error("Error creating new note:", error);
        const errorMessage = error instanceof Error
            ? error.message
            : "Failed to create note";
        set(
            notesErrorAtom as WritableAtom<
                string | null,
                [string | null],
                void
            >,
            errorMessage,
        );
    }
});

// Update an existing note (content or title)
export const updateNoteAtom = atom(
    null,
    async (
        get,
        set,
        update: { noteId: string; title?: string; content?: string },
    ) => {
        const { noteId, title, content } = update;
        const user = get(userAtom);
        if (!user) {
            set(
                notesErrorAtom as WritableAtom<
                    string | null,
                    [string | null],
                    void
                >,
                "Cannot update note: User not logged in.",
            );
            return;
        }

        const currentNotes = get(notesAtom);
        const noteIndex = currentNotes.findIndex((n) => n.id === noteId);
        if (noteIndex === -1) {
            console.warn(
                `[updateNoteAtom] Note with ID ${noteId} not found in local state.`,
            );
            // Optionally trigger a fetch here? Or rely on next fetch.
            return;
        }

        const originalNote = currentNotes[noteIndex];
        const payload: Partial<Note> = {};
        if (title !== undefined && title !== originalNote.title) {
            payload.title = title;
        }
        if (content !== undefined && content !== originalNote.content) {
            payload.content = content;
        }

        if (Object.keys(payload).length === 0) {
            // console.log(`[updateNoteAtom] No changes detected for note ${noteId}, skipping update.`);
            return;
        }

        console.log(
            `[updateNoteAtom] Updating note ${noteId} with payload:`,
            Object.keys(payload),
        );

        // Optimistic Update for both title and content
        const optimisticNote = {
            ...originalNote,
            ...payload, // Apply payload changes (title and/or content)
            updated_at: new Date().toISOString(), // Tentatively update timestamp
        };

        // Apply optimistic update to the local state immediately
        set(
            notesAtom as WritableAtom<Note[], [Note[]], void>,
            get(notesAtom).map((n) => (n.id === noteId ? optimisticNote : n)),
        );

        try {
            const { data, error } = await supabase
                .from("notes")
                .update(payload)
                .match({ id: noteId, user_id: user.id })
                .select()
                .single();

            if (error) throw error;

            // Update local state with confirmed data (especially updated_at and potentially title)
            console.log(
                `[updateNoteAtom] Note ${noteId} updated successfully.`,
            );
            const updatedNote = data as Note;
            set(notesAtom as WritableAtom<Note[], [Note[]], void>, [
                updatedNote,
                ...get(notesAtom).filter((n) => n.id !== noteId),
            ]);
            // Ensure notes remain sorted by update time if needed, or rely on next fetch
        } catch (error: unknown) {
            console.error(
                `[updateNoteAtom] Error updating note ${noteId}:`,
                error,
            );
            const errorMessage = error instanceof Error
                ? error.message
                : "Failed to update note";
            set(
                notesErrorAtom as WritableAtom<
                    string | null,
                    [string | null],
                    void
                >,
                errorMessage,
            );

            // Rollback optimistic update on error
            set(
                notesAtom as WritableAtom<Note[], [Note[]], void>,
                get(notesAtom).map((n) => (n.id === noteId ? originalNote : n)),
            );
        }
    },
);

// Delete a note
export const deleteNoteAtom = atom(null, async (get, set, noteId: string) => {
    const user = get(userAtom);
    if (!user) {
        set(
            notesErrorAtom as WritableAtom<
                string | null,
                [string | null],
                void
            >,
            "Cannot delete note: User not logged in.",
        );
        return;
    }

    const originalNotes = get(notesAtom);
    const currentActiveId = get(activeNoteIdAtom);

    // Optimistic Update
    set(
        notesAtom as WritableAtom<Note[], [Note[]], void>,
        get(notesAtom).filter((n) => n.id !== noteId),
    );
    // If deleting the active note, select the next one (or null)
    if (noteId === currentActiveId) {
        const remainingNotes = originalNotes.filter((n) => n.id !== noteId);
        const newActiveId = remainingNotes.length > 0
            ? remainingNotes[0].id
            : null;
        console.log(
            `[deleteNoteAtom] Deleting active note ${noteId}, setting new active ID to ${newActiveId}`,
        );
        set(
            activeNoteIdAtom as WritableAtom<
                string | null,
                [string | null],
                void
            >,
            newActiveId,
        );
    }

    console.log(`[deleteNoteAtom] Deleting note ${noteId}`);

    try {
        const { error } = await supabase
            .from("notes")
            .delete()
            .match({ id: noteId, user_id: user.id });

        if (error) throw error;

        console.log(`[deleteNoteAtom] Note ${noteId} deleted successfully.`);
        // State is already updated optimistically
    } catch (error: unknown) {
        console.error(`Error deleting note ${noteId}:`, error);
        const errorMessage = error instanceof Error
            ? error.message
            : `Failed to delete note ${noteId}`;
        set(
            notesErrorAtom as WritableAtom<
                string | null,
                [string | null],
                void
            >,
            errorMessage,
        );
        // Revert optimistic update
        set(notesAtom as WritableAtom<Note[], [Note[]], void>, originalNotes);
        // Revert active note ID if it was changed
        if (noteId === currentActiveId) {
            set(
                activeNoteIdAtom as WritableAtom<
                    string | null,
                    [string | null],
                    void
                >,
                currentActiveId,
            );
        }
    }
});
