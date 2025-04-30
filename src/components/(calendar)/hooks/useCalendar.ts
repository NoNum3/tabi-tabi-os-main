import { atom, WritableAtom } from "jotai";
import { supabase } from "@/lib/supabaseClient";
import { CalendarEvent } from "../types/calendarTypes";
import { userAtom } from "@/atoms/authAtoms";
import { useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";

// Main atom for all events
export const calendarEventsAtom = atom<CalendarEvent[]>([]);
export const calendarEventsErrorAtom = atom<string | null>(null);
export const calendarEventsLoadingAtom = atom<boolean>(false);

// Fetch all events for the current user
export const fetchCalendarEventsAtom = atom(
    null,
    async (get, set) => {
        const user = get(userAtom);
        set(calendarEventsLoadingAtom, true);
        set(calendarEventsErrorAtom as WritableAtom<string | null, [string | null], void>, null);
        if (!user) {
            set(calendarEventsLoadingAtom, false);
            set(calendarEventsErrorAtom as WritableAtom<string | null, [string | null], void>, "User not logged in");
            return;
        }
        const { data, error } = await supabase
            .from("calendar_events")
            .select("id, date, title, time, description, color")
            .eq("user_id", user.id)
            .order("date", { ascending: true });
        set(calendarEventsLoadingAtom, false);
        if (error) {
            set(calendarEventsErrorAtom as WritableAtom<string | null, [string | null], void>, error.message);
            return;
        }
        if (data) {
            set(
                calendarEventsAtom,
                data.map((item) => ({
                    ...item,
                    time: item.time ?? undefined,
                    description: item.description ?? undefined,
                    color: item.color ?? undefined,
                })) as CalendarEvent[],
            );
        }
    },
);

// Add a new event
export const addCalendarEventAtom = atom(
    null,
    async (get, set, event: Omit<CalendarEvent, "id">) => {
        const user = get(userAtom);
        set(calendarEventsLoadingAtom, true);
        set(calendarEventsErrorAtom as WritableAtom<string | null, [string | null], void>, null);
        if (!user) {
            set(calendarEventsLoadingAtom, false);
            set(calendarEventsErrorAtom as WritableAtom<string | null, [string | null], void>, "User not logged in");
            return;
        }
        const { data, error } = await supabase
            .from("calendar_events")
            .insert([{ ...event, user_id: user.id }])
            .select("id, date, title, time, description, color");
        set(calendarEventsLoadingAtom, false);
        if (error) {
            set(calendarEventsErrorAtom as WritableAtom<string | null, [string | null], void>, error.message);
            return;
        }
        if (data) {
            set(calendarEventsAtom, [
                ...get(calendarEventsAtom),
                ...data.map((item) => ({
                    ...item,
                    time: item.time ?? undefined,
                    description: item.description ?? undefined,
                    color: item.color ?? undefined,
                })),
            ]);
        }
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
        const { data, error } = await supabase
            .from("calendar_events")
            .update({
                date: event.date,
                title: event.title,
                time: event.time,
                description: event.description,
                color: event.color,
            })
            .eq("id", event.id)
            .eq("user_id", user.id)
            .select("id, date, title, time, description, color");
        set(calendarEventsLoadingAtom, false);
        if (error) {
            set(calendarEventsErrorAtom as WritableAtom<string | null, [string | null], void>, error.message);
            return;
        }
        if (data) {
            set(
                calendarEventsAtom,
                get(calendarEventsAtom).map((ev) =>
                    ev.id === event.id
                        ? {
                            ...data[0],
                            time: data[0].time ?? undefined,
                            description: data[0].description ?? undefined,
                            color: data[0].color ?? undefined,
                        }
                        : ev
                ),
            );
        }
    },
);

// Delete an event
export const deleteCalendarEventAtom = atom(
    null,
    async (get, set, eventId: string) => {
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
            .delete()
            .eq("id", eventId)
            .eq("user_id", user.id);
        set(calendarEventsLoadingAtom, false);
        if (error) {
            set(calendarEventsErrorAtom as WritableAtom<string | null, [string | null], void>, error.message);
            return;
        }
        set(
            calendarEventsAtom,
            get(calendarEventsAtom).filter((ev) => ev.id !== eventId),
        );
    },
);

export const useCalendarEventsRealtime = () => {
    const [user] = useAtom(userAtom);
    const setEvents = useSetAtom(calendarEventsAtom);
    const setError = useSetAtom(calendarEventsErrorAtom as WritableAtom<string | null, [string | null], void>);

    useEffect(() => {
        if (!user) return;
        const channel = supabase
            .channel("calendar_events")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "calendar_events",
                    filter: `user_id=eq.${user.id}`,
                },
                async () => {
                    const { data, error } = await supabase
                        .from("calendar_events")
                        .select("id, date, title, time, description, color")
                        .eq("user_id", user.id)
                        .order("date", { ascending: true });
                    if (!error && data) {
                        setEvents(data.map((item) => ({
                            ...item,
                            time: item.time ?? undefined,
                            description: item.description ?? undefined,
                            color: item.color ?? undefined,
                        })) as CalendarEvent[]);
                    }
                    if (error) setError(error.message);
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, setEvents, setError]);
};
