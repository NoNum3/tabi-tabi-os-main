export interface CalendarEvent {
    id: string;
    date: string; // YYYY-MM-DD
    title: string;
    time?: string; // HH:mm
    description?: string;
    color?: string; // Optional: for event color/dot
}
