import type { Database } from "@/types/supabase";

export type CalendarEvent = Database["public"]["Tables"]["calendar_events"]["Row"];
