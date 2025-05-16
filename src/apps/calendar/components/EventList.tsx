"use client";
import React from "react";
import { CalendarEvent } from "../types/calendarTypes";

interface EventListProps {
    events: CalendarEvent[];
}

export const EventList: React.FC<EventListProps> = ({ events }) => {
    if (!events.length) {
        return (
            <div className="text-muted-foreground text-sm text-center py-4">
                No events for this day.
            </div>
        );
    }
    return (
        <ul className="space-y-2">
            {events.map((ev) => (
                <li
                    key={ev.id}
                    className="rounded border border-border bg-muted p-2"
                >
                    <div className="font-semibold text-primary mb-1">
                        {ev.title}
                    </div>
                    {ev.description && (
                        <div className="text-sm text-foreground">
                            {ev.description}
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );
};
