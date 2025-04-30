import { atom, WritableAtom } from "jotai";
import { supabase } from "@/lib/supabaseClient";
import { userAtom } from "./authAtoms"; // Assuming userAtom provides the user object

// Define the shape of a todo item, matching Supabase table + potential client state
export interface TodoItem {
    id: string; // Supabase UUID
    user_id: string;
    task: string;
    completed: boolean;
    created_at: string; // ISO string format from Supabase
}

// Atom to hold the list of todos fetched from Supabase
export const todosAtom = atom<TodoItem[]>([]);
todosAtom.debugLabel = "todosAtom";

// Atom to track loading state
export const todosLoadingAtom = atom<boolean>(true); // Start as true initially
todosLoadingAtom.debugLabel = "todosLoadingAtom";

// Atom to store any error messages
export const todosErrorAtom = atom<string | null>(null);
todosErrorAtom.debugLabel = "todosErrorAtom";

// --- Async Action Atoms ---

// Fetch todos for the current user
export const fetchTodosAtom = atom(null, async (get, set) => {
    const user = get(userAtom);
    if (!user) {
        set(todosAtom, []);
        set(todosLoadingAtom, false);
        set(todosErrorAtom as WritableAtom<string | null, [string | null], void>, "User not logged in.");
        console.log("Fetch Todos: No user logged in.");
        return;
    }

    console.log("Fetch Todos: User found, fetching...", user.id);
    set(todosLoadingAtom, true);
    set(todosErrorAtom as WritableAtom<string | null, [string | null], void>, null);

    try {
        const { data, error } = await supabase
            .from("todos")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }); // Order by creation date

        if (error) {
            throw error;
        }

        console.log("Fetch Todos: Data received", data);
        set(todosAtom, data || []);
    } catch (error: unknown) {
        console.error("Error fetching todos:", error);
        const errorMessage = error instanceof Error
            ? error.message
            : "Failed to fetch todos";
        set(todosErrorAtom as WritableAtom<string | null, [string | null], void>, errorMessage);
        set(todosAtom, []);
    } finally {
        set(todosLoadingAtom, false);
    }
});

// Add a new todo
export const addTodoAtom = atom(
    null,
    async (get, set, taskText: string) => {
        const user = get(userAtom);
        if (!user) {
            set(todosErrorAtom as WritableAtom<string | null, [string | null], void>, "Cannot add todo: User not logged in.");
            return;
        }
        if (!taskText.trim()) return; // Ignore empty tasks

        // Optimistic UI update (optional but improves UX)
        const optimisticId = `temp-${Date.now()}`;
        const optimisticTodo: TodoItem = {
            id: optimisticId,
            user_id: user.id,
            task: taskText.trim(),
            completed: false,
            created_at: new Date().toISOString(), // Use current time
        };
        set(todosAtom, (prev) => [optimisticTodo, ...prev]);

        try {
            const { data, error } = await supabase
                .from("todos")
                .insert([{ task: taskText.trim(), user_id: user.id }])
                .select() // Return the inserted row
                .single(); // Expecting a single row back

            if (error) {
                throw error;
            }

            // Replace optimistic update with real data
            set(
                todosAtom,
                (prev) =>
                    prev.map((
                        todo,
                    ) => (todo.id === optimisticId ? data : todo)),
            );
            console.log("Added todo:", data);
        } catch (error: unknown) {
            console.error("Error adding todo:", error);
            const errorMessage = error instanceof Error
                ? error.message
                : "Failed to add todo";
            set(todosErrorAtom as WritableAtom<string | null, [string | null], void>, errorMessage);
            // Optional: Revert optimistic update here if needed
        }
    },
);

// Toggle todo completion status
export const toggleTodoAtom = atom(
    null,
    async (get, set, todoId: string) => {
        const user = get(userAtom);
        if (!user) return; // Need user

        const currentTodos = get(todosAtom);
        const todoToToggle = currentTodos.find((t) => t.id === todoId);
        if (!todoToToggle) return;

        const newCompletedStatus = !todoToToggle.completed;

        // Optimistic UI update
        set(
            todosAtom,
            (prev) =>
                prev.map((t) =>
                    t.id === todoId
                        ? { ...t, completed: newCompletedStatus }
                        : t
                ),
        );

        try {
            const { error } = await supabase
                .from("todos")
                .update({ completed: newCompletedStatus })
                .match({ id: todoId, user_id: user.id }); // Ensure user owns the todo

            if (error) {
                throw error;
            }
            console.log("Toggled todo:", todoId);
        } catch (error: unknown) {
            console.error(`Error updating todo ${todoId}:`, error);
            const errorMessage = error instanceof Error
                ? error.message
                : `Failed to update todo ${todoId}`;
            set(todosErrorAtom as WritableAtom<string | null, [string | null], void>, errorMessage);
            // Revert optimistic update
            set(todosAtom, currentTodos);
        }
    },
);

// Remove a todo
export const removeTodoAtom = atom(
    null,
    async (get, set, todoId: string) => {
        const user = get(userAtom);
        if (!user) return;

        const originalTodos = get(todosAtom);

        // Optimistic UI update
        set(todosAtom, (prev) => prev.filter((t) => t.id !== todoId));

        try {
            const { error } = await supabase
                .from("todos")
                .delete()
                .match({ id: todoId, user_id: user.id }); // Ensure user owns the todo

            if (error) {
                throw error;
            }
            console.log("Removed todo:", todoId);
        } catch (error: unknown) {
            console.error(`Error deleting todo ${todoId}:`, error);
            const errorMessage = error instanceof Error
                ? error.message
                : `Failed to delete todo ${todoId}`;
            set(todosErrorAtom as WritableAtom<string | null, [string | null], void>, errorMessage);
            // Revert optimistic update
            set(todosAtom, originalTodos);
        }
    },
);

// --- Derived Atoms (Example) ---
export const pendingTodosCountAtom = atom((get) =>
    get(todosAtom).filter((todo) => !todo.completed).length
);
