"use client";
import React from "react";
import { cn } from "@/infrastructure/lib/utils";

interface CalendarGridProps {
    year: number;
    month: number; // 0-based
    eventDots: { [date: string]: string };
    selectedDate: string;
    onDayClick: (date: string) => void;
}

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const CalendarGrid: React.FC<CalendarGridProps> = (
    { year, month, eventDots, selectedDate, onDayClick },
) => {
    const today = new Date();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    // Build grid
    const grid: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) grid.push(null);
    for (let d = 1; d <= daysInMonth; d++) grid.push(d);
    while (grid.length % 7 !== 0) grid.push(null);

    return (
        <div className="w-full">
            <div className="grid grid-cols-7 gap-1 mb-2">
                {daysOfWeek.map((d) => (
                    <div
                        key={d}
                        className="text-xs font-semibold text-center text-muted-foreground py-1"
                    >
                        {d}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {grid.map((d, i) => {
                    if (!d) return <div key={i} className="h-8 w-full" />;
                    const dateStr = `${year}-${
                        String(month + 1).padStart(2, "0")
                    }-${String(d).padStart(2, "0")}`;
                    const isToday = today.getFullYear() === year &&
                        today.getMonth() === month && today.getDate() === d;
                    const isSelected = selectedDate === dateStr;
                    const dotColor = eventDots[dateStr];
                    return (
                        <button
                            key={i}
                            className={cn(
                                "h-8 w-full min-h-8 rounded flex flex-col items-center justify-center text-sm font-medium transition-colors",
                                isToday &&
                                    "bg-primary text-primary-foreground border border-primary",
                                isSelected && !isToday &&
                                    "bg-accent text-accent-foreground border border-accent",
                                !isToday && !isSelected && "hover:bg-muted",
                                dotColor && "ring-2 ring-secondary",
                            )}
                            onClick={() => onDayClick(dateStr)}
                            aria-label={`Select ${dateStr}`}
                        >
                            <span>{d}</span>
                            {dotColor && (
                                <span
                                    className="mt-0.5 w-1.5 h-1.5 rounded-full block"
                                    style={{ backgroundColor: dotColor }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
