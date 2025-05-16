import { atom, WritableAtom } from "jotai";
import { supabase } from "@/infrastructure/lib/supabaseClient";
import { CalendarEvent } from "../types/calendarTypes";
import { userAtom } from "@/application/atoms/authAtoms";
import { useEffect } from "react";
import { useSetAtom } from "jotai";

// Main atom for all events
export const calendarEventsAtom = atom<CalendarEvent[]>([]);
export const calendarEventsErrorAtom = atom<string | null>(null);
export const calendarEventsLoadingAtom = atom<boolean>(false);

// Fetch all events for the current user
export const fetchCalendarEventsAtom = atom(
    null,
    async (get, set) => {
        set(calendarEventsLoadingAtom, true);
        set(calendarEventsErrorAtom as WritableAtom<string | null, [string | null], void>, null);
        const { data, error } = await supabase
            .from("calendar_events")
            .select("id, title, description, start_time, end_time, all_day, location, color, recurrence, recurrence_rule, created_at, updated_at, deleted_at, user_id")
            .is("deleted_at", null)
            .order("start_time", { ascending: true });
        console.log('Fetched all calendar events', data, error);
        set(calendarEventsLoadingAtom, false);
        if (error) {
            set(calendarEventsErrorAtom as WritableAtom<string | null, [string | null], void>, error.message);
            set(calendarEventsAtom, []);
            return;
        }
        set(calendarEventsAtom, data as CalendarEvent[]);
    },
);

// Add a new event
export const addCalendarEventAtom = atom(
    null,
    async (get, set, event: Omit<CalendarEvent, "id" | "created_at" | "updated_at" | "deleted_at" | "user_id">) => {
        const user = get(userAtom);
        set(calendarEventsLoadingAtom, true);
        set(calendarEventsErrorAtom as WritableAtom<string | null, [string | null], void>, null);
        if (!user) {
            set(calendarEventsLoadingAtom, false);
            set(calendarEventsErrorAtom as WritableAtom<string | null, [string | null], void>, "User not logged in");
            return;
        }
        const { error } = await supabase
            .from("calendar_events")
            .insert([{ ...event, user_id: user.id }]);
        set(calendarEventsLoadingAtom, false);
        if (error) {
            console.error("Supabase insert error:", error);
            alert("Supabase insert error: " + error.message);
            set(calendarEventsErrorAtom as WritableAtom<string | null, [string | null], void>, error.message);
            return;
        }
        // Always refetch after add
        await set(fetchCalendarEventsAtom);
    },
);

// Update an event
export const updateCalendarEventAtom = atom(
    null,
    async (get, set, event: CalendarEvent) => {
        const user = get(userAtom);
        set(calendarEventsLoadingAtom, true);
        set(calendarEventsErrorAtom as WritableAtom<string | null, [string | null], void>, null);
        if (!user) {
            set(calendarEventsLoadingAtom, false);
            set(calendarEventsErrorAtom as WritableAtom<string | null, [string | null], void>, "User not logged in");
            return;
        }
        const { error } = await supabase
            .from("calendar_events")
            .update({
                title: event.title,
                description: event.description,
                start_time: event.start_time,
                end_time: event.end_time,
                all_day: event.all_day,
                location: event.location,
                color: event.color,
                recurrence: event.recurrence,
                recurrence_rule: event.recurrence_rule,
                updated_at: new Date().toISOString(),
            })
            .eq("id", event.id);
        set(calendarEventsLoadingAtom, false);
        if (error) {
            set(calendarEventsErrorAtom as WritableAtom<string | null, [string | null], void>, error.message);
            return;
        }
        // Always refetch after update
        await set(fetchCalendarEventsAtom);
    },
);

// Soft delete an event
export const deleteCalendarEventAtom = atom(
    null,
    async (get, set, eventId: string) => {
        set(calendarEventsLoadingAtom, true);
        set(calendarEventsErrorAtom as WritableAtom<string | null, [string | null], void>, null);
        const { error } = await supabase
            .from("calendar_events")
            .delete()
            .eq("id", eventId);
        set(calendarEventsLoadingAtom, false);
        if (error) {
            console.error("Supabase delete error:", error);
            alert("Supabase delete error: " + error.message);
            set(calendarEventsErrorAtom as WritableAtom<string | null, [string | null], void>, error.message);
            return;
        }
        // Refetch events to ensure UI is in sync
        await set(fetchCalendarEventsAtom);
    },
);

export const useCalendarEventsRealtime = () => {
    const setEvents = useSetAtom(calendarEventsAtom);
    const setError = useSetAtom(calendarEventsErrorAtom as WritableAtom<string | null, [string | null], void>);

    useEffect(() => {
        const channel = supabase
            .channel("calendar_events")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "calendar_events",
                },
                async () => {
                    const { data, error } = await supabase
                        .from("calendar_events")
                        .select("id, title, description, start_time, end_time, all_day, location, color, recurrence, recurrence_rule, created_at, updated_at, deleted_at, user_id")
                        .is("deleted_at", null)
                        .order("start_time", { ascending: true });
                    if (!error && data) {
                        setEvents(data as CalendarEvent[]);
                    }
                    if (error) setError(error.message);
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [setEvents, setError]);
};
