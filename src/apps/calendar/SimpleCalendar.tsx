"use client";
import React, { useEffect, useState } from "react";
import { useAtom, useSetAtom } from "jotai";
import {
    addCalendarEventAtom,
    calendarEventsAtom,
    deleteCalendarEventAtom,
    fetchCalendarEventsAtom,
    useCalendarEventsRealtime,
    updateCalendarEventAtom,
} from "./hooks/useCalendar";
import { CalendarGrid } from "./components/CalendarGrid";
import { EventModal } from "./components/EventModal";
import { CalendarEvent } from "./types/calendarTypes";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Edit2 } from "lucide-react";
import { focusWindowAtom } from "@/application/atoms/windowAtoms";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { userAtom } from "@/application/atoms/authAtoms";
import { useI18n } from "@/locales/client";

const MONTH_KEYS = [
    "calendar_month_january",
    "calendar_month_february",
    "calendar_month_march",
    "calendar_month_april",
    "calendar_month_may",
    "calendar_month_june",
    "calendar_month_july",
    "calendar_month_august",
    "calendar_month_september",
    "calendar_month_october",
    "calendar_month_november",
    "calendar_month_december",
] as const;
const WEEKDAY_KEYS = [
    "calendar_weekday_sun",
    "calendar_weekday_mon",
    "calendar_weekday_tue",
    "calendar_weekday_wed",
    "calendar_weekday_thu",
    "calendar_weekday_fri",
    "calendar_weekday_sat",
] as const;

type MonthKey = typeof MONTH_KEYS[number];
type WeekdayKey = typeof WEEKDAY_KEYS[number];

function getMonthName(month: number, t?: (k: MonthKey) => string) {
    if (t) return t(MONTH_KEYS[month]);
    // fallback: English month name
    return [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ][month];
}

const today = new Date();
const todayStr = `${today.getFullYear()}-${
    String(today.getMonth() + 1).padStart(2, "0")
}-${String(today.getDate()).padStart(2, "0")}`;

interface SimpleCalendarProps {
    windowId?: string;
}

const VIEW_MODES = ["Month", "Week", "Year"] as const;
type ViewMode = typeof VIEW_MODES[number];

// Add a mapping from view mode to translation key, with explicit string literal types
const VIEW_MODE_LABELS: Record<
    ViewMode,
    "calendar_month" | "calendar_week" | "calendar_year"
> = {
    Month: "calendar_month",
    Week: "calendar_week",
    Year: "calendar_year",
};

// Helper to format a date as localized 'Month Day' (e.g., '五月 11')
function formatMonthDay(date: Date, t: (k: MonthKey) => string) {
    const month = date.getMonth();
    const day = date.getDate();
    return `${t(MONTH_KEYS[month])} ${day}`;
}
// Helper to format a date as localized 'Month Day, Year' (e.g., '五月 17, 2025')
function formatMonthDayYear(date: Date, t: (k: MonthKey) => string) {
    const month = date.getMonth();
    const day = date.getDate();
    const year = date.getFullYear();
    return `${t(MONTH_KEYS[month])} ${day}, ${year}`;
}

const SimpleCalendar: React.FC<SimpleCalendarProps> = ({ windowId }) => {
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalDate, setModalDate] = useState<string>(todayStr);
    const [viewMode, setViewMode] = useState<ViewMode>("Month");
    const focusWindow = useSetAtom(focusWindowAtom);
    const [currentWeekStart, setCurrentWeekStart] = useState(
        startOfWeek(today, { weekStartsOn: 0 }),
    );
    const [showWeekSidebar, setShowWeekSidebar] = useState(false);
    const [showDaySidebar, setShowDaySidebar] = useState(false);
    const [showYearSidebar, setShowYearSidebar] = useState(false);
    const addEvent = useSetAtom(addCalendarEventAtom);
    const deleteEvent = useSetAtom(deleteCalendarEventAtom);
    const [events] = useAtom(calendarEventsAtom);
    const fetchEvents = useSetAtom(fetchCalendarEventsAtom);
    const [user] = useAtom(userAtom);
    const t = useI18n();
    // Helper to adapt t to (k: MonthKey) => string for helpers
    const typedT = (k: MonthKey) => t(k, { count: 1 });
    const typedWeekdayT = (k: WeekdayKey) => t(k, { count: 1 });
    useCalendarEventsRealtime();
    const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
    const updateEvent = useSetAtom(updateCalendarEventAtom);

    useEffect(() => {
        if (user) {
            fetchEvents();
        }
    }, [user, fetchEvents]);

    // Map of date string to event dot color (first event's color or default)
    const eventDotMap: { [date: string]: string } = {};
    events.forEach((ev) => {
        const dateKey = ev.start_time ? ev.start_time.slice(0, 10) : undefined;
        if (dateKey && !eventDotMap[dateKey]) {
            eventDotMap[dateKey] = ev.color || "#3b82f6";
        }
    });

    const handleDayClick = (date: string) => {
        setSelectedDate(date);
        setShowDaySidebar(true);
        if (windowId) focusWindow(windowId);
        // Do not open modal directly; open sidebar
    };

    const handleEditEvent = (event: CalendarEvent) => {
        setEditEvent(event);
        setModalDate(event.start_time.slice(0, 10));
        setModalOpen(true);
    };

    const handleSaveEvent = async (ev: Omit<CalendarEvent, "id">) => {
        if (editEvent) {
            // Update existing event
            await updateEvent({ ...editEvent, ...ev });
            setEditEvent(null);
        } else {
            // Add new event
            await addEvent(ev);
        }
        setModalOpen(false);
    };

    const goToPrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear((y) => y - 1);
        } else {
            setCurrentMonth((m) => m - 1);
        }
    };
    const goToNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear((y) => y + 1);
        } else {
            setCurrentMonth((m) => m + 1);
        }
    };

    const goToPrevWeek = () => {
        setCurrentWeekStart((prev) => addDays(prev, -7));
    };
    const goToNextWeek = () => {
        setCurrentWeekStart((prev) => addDays(prev, 7));
    };
    const goToToday = () => {
        setCurrentMonth(today.getMonth());
        setCurrentYear(today.getFullYear());
        setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 0 }));
        setSelectedDate(todayStr);
        setShowDaySidebar(false); // Auto-hide day sidebar on Today
    };

    const openAddEventModal = (date?: string) => {
        setModalDate(date || selectedDate || todayStr);
        setModalOpen(true);
    };

    // --- View Switcher ---
    const renderViewSwitcher = () => (
        <div className="flex gap-2 mb-2">
            {VIEW_MODES.map((mode) => (
                <Button
                    key={mode}
                    variant={viewMode === mode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode(mode)}
                >
                    {t(VIEW_MODE_LABELS[mode], { count: 1 })}
                </Button>
            ))}
        </div>
    );

    // --- Week Sidebar ---
    const renderWeekSidebar = (weekDays: Date[]) => {
        // Gather all events for the week, grouped by day
        const weekEvents: { [date: string]: CalendarEvent[] } = {};
        weekDays.forEach((date) => {
            const dateStr = format(date, "yyyy-MM-dd");
            weekEvents[dateStr] = events.filter((ev) => ev.start_time && ev.start_time.slice(0, 10) === dateStr);
        });
        return (
            <div className="fixed right-0 top-0 h-full w-80 bg-background border-l border-border shadow-lg z-[9999] flex flex-col p-4 transition-transform">
                <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-primary">
                        {t("calendar_events_this_week", { count: 1 })}
                    </div>
                    <Button size="sm" onClick={() => openAddEventModal()}>
                        {t("calendar_add_event", { count: 1 })}
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {weekDays.map((date) => {
                        const dateStr = format(date, "yyyy-MM-dd");
                        const dayEvents = weekEvents[dateStr];
                        return (
                            <div key={dateStr} className="mb-4">
                                <div className="text-sm font-semibold text-muted-foreground mb-1">
                                    {format(date, "EEE, MMM d")}
                                </div>
                                {dayEvents.length > 0
                                    ? (
                                        <ul className="space-y-1">
                                            {dayEvents.map((ev) => (
                                                <li
                                                    key={ev.id}
                                                    className="rounded border border-border bg-muted p-2 flex items-center justify-between"
                                                >
                                                    <div>
                                                        <span
                                                            className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                                                            style={{
                                                                backgroundColor:
                                                                    ev.color ||
                                                                    "#3b82f6",
                                                            }}
                                                        />
                                                        <span className="font-medium text-primary">
                                                            {ev.title}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            deleteEvent(ev.id)}
                                                        title={t(
                                                            "calendar_delete_event",
                                                            { count: 1 },
                                                        )}
                                                    >
                                                        <span
                                                            role="img"
                                                            aria-label={t(
                                                                "calendar_delete_event",
                                                                { count: 1 },
                                                            )}
                                                        >
                                                            🗑️
                                                        </span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleEditEvent(ev)}
                                                        title={t(
                                                            "calendar_edit_event",
                                                            { count: 1 },
                                                        )}
                                                    >
                                                        <Edit2 size={16} />
                                                    </Button>
                                                </li>
                                            ))}
                                        </ul>
                                    )
                                    : (
                                        <div className="text-xs text-muted-foreground">
                                            {t("calendar_no_events", {
                                                count: 1,
                                            })}
                                        </div>
                                    )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // --- Month Sidebar ---
    const renderMonthSidebar = () => {
        // Gather all events for the current month, grouped by day
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0)
            .getDate();
        const monthDays = Array.from(
            { length: daysInMonth },
            (_, i) => new Date(currentYear, currentMonth, i + 1),
        );
        const monthEvents: { [date: string]: CalendarEvent[] } = {};
        monthDays.forEach((date) => {
            const dateStr = format(date, "yyyy-MM-dd");
            monthEvents[dateStr] = events.filter((ev) => ev.start_time && ev.start_time.slice(0, 10) === dateStr);
        });
        return (
            <div className="fixed right-0 top-0 h-full w-80 bg-background border-l border-border shadow-lg z-[9999] flex flex-col p-4 transition-transform">
                <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-primary">
                        Events This Month
                    </div>
                    <Button size="sm" onClick={() => openAddEventModal()}>
                        {t("calendar_add_event", { count: 1 })}
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {monthDays.map((date) => {
                        const dateStr = format(date, "yyyy-MM-dd");
                        const dayEvents = monthEvents[dateStr];
                        return (
                            <div key={dateStr} className="mb-4">
                                <div className="text-sm font-semibold text-muted-foreground mb-1">
                                    {format(date, "EEE, MMM d")}
                                </div>
                                {dayEvents.length > 0
                                    ? (
                                        <ul className="space-y-1">
                                            {dayEvents.map((ev) => (
                                                <li
                                                    key={ev.id}
                                                    className="rounded border border-border bg-muted p-2 flex items-center justify-between"
                                                >
                                                    <div>
                                                        <span
                                                            className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                                                            style={{
                                                                backgroundColor:
                                                                    ev.color ||
                                                                    "#3b82f6",
                                                            }}
                                                        />
                                                        <span className="font-medium text-primary">
                                                            {ev.title}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            deleteEvent(ev.id)}
                                                        title="Delete Event"
                                                    >
                                                        <span
                                                            role="img"
                                                            aria-label="Delete"
                                                        >
                                                            🗑️
                                                        </span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleEditEvent(ev)}
                                                        title={t(
                                                            "calendar_edit_event",
                                                            { count: 1 },
                                                        )}
                                                    >
                                                        <Edit2 size={16} />
                                                    </Button>
                                                </li>
                                            ))}
                                        </ul>
                                    )
                                    : (
                                        <div className="text-xs text-muted-foreground">
                                            No events
                                        </div>
                                    )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // --- Year Sidebar ---
    const renderYearSidebar = () => {
        // Gather all events for the current year, grouped by month and day
        const yearEvents: {
            [month: number]: { [date: string]: CalendarEvent[] };
        } = {};
        for (let m = 0; m < 12; m++) {
            const daysInMonth = new Date(currentYear, m + 1, 0).getDate();
            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${currentYear}-${
                    String(m + 1).padStart(2, "0")
                }-${String(d).padStart(2, "0")}`;
                const dayEvents = events.filter((ev) => ev.start_time && ev.start_time.slice(0, 10) === dateStr);
                if (dayEvents.length) {
                    if (!yearEvents[m]) yearEvents[m] = {};
                    yearEvents[m][dateStr] = dayEvents;
                }
            }
        }
        return (
            <div className="fixed right-0 top-0 h-full w-96 bg-background border-l border-border shadow-lg z-[9999] flex flex-col p-4 transition-transform">
                <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-primary mb-2">
                        Events This Year
                    </div>
                    <Button size="sm" onClick={() => openAddEventModal()}>
                        {t("calendar_add_event", { count: 1 })}
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {Object.keys(yearEvents).length === 0 && (
                        <div className="text-xs text-muted-foreground">
                            No events this year.
                        </div>
                    )}
                    {Object.entries(yearEvents).map(([monthIdx, days]) => (
                        <div key={monthIdx} className="mb-6">
                            <div className="text-base font-bold text-primary mb-2">
                                {getMonthName(Number(monthIdx), typedT)}
                            </div>
                            {Object.entries(days).map((
                                [dateStr, dayEvents],
                            ) => (
                                <div key={dateStr} className="mb-2">
                                    <div className="text-sm font-semibold text-muted-foreground mb-1">
                                        {dateStr}
                                    </div>
                                    <ul className="space-y-1">
                                        {dayEvents.map((ev) => (
                                            <li
                                                key={ev.id}
                                                className="rounded border border-border bg-muted p-2 flex items-center justify-between"
                                            >
                                                <div>
                                                    <span
                                                        className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                                                        style={{
                                                            backgroundColor:
                                                                ev.color ||
                                                                "#3b82f6",
                                                        }}
                                                    />
                                                    <span className="font-medium text-primary">
                                                        {ev.title}
                                                    </span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        deleteEvent(ev.id)}
                                                    title="Delete Event"
                                                >
                                                    <span
                                                        role="img"
                                                        aria-label="Delete"
                                                    >
                                                        🗑️
                                                    </span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        handleEditEvent(ev)}
                                                    title={t(
                                                        "calendar_edit_event",
                                                        { count: 1 },
                                                    )}
                                                >
                                                    <Edit2 size={16} />
                                                </Button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    // --- Mini Month Grid for Year View ---
    const renderMiniMonth = (year: number, month: number) => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const grid: (number | null)[] = [];
        for (let i = 0; i < firstDay; i++) grid.push(null);
        for (let d = 1; d <= daysInMonth; d++) grid.push(d);
        while (grid.length % 7 !== 0) grid.push(null);
        return (
            <div className="grid grid-cols-7 gap-0.5">
                {grid.map((d, i) => {
                    if (!d) return <div key={i} className="h-3" />;
                    const dateStr = `${year}-${
                        String(month + 1).padStart(2, "0")
                    }-${String(d).padStart(2, "0")}`;
                    const dotColor = eventDotMap[dateStr];
                    return (
                        <div
                            key={i}
                            className="relative flex flex-col items-center justify-center h-4 w-4 text-[10px]"
                        >
                            <span>{d}</span>
                            {dotColor && (
                                <span
                                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full block"
                                    style={{ backgroundColor: dotColor }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // --- Calendar Views ---
    const renderCalendarView = () => {
        switch (viewMode) {
            case "Month":
                return (
                    <>
                        <div className="flex items-center justify-between mb-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={goToToday}
                            >
                                {t("calendar_today", { count: 1 })}
                            </Button>
                            <Button
                                variant={showDaySidebar ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowDaySidebar((v) => !v)}
                            >
                                {showDaySidebar
                                    ? t("calendar_hide_events", { count: 1 })
                                    : t("calendar_show_events", { count: 1 })}
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => openAddEventModal()}
                            >
                                {t("calendar_add_event", { count: 1 })}
                            </Button>
                        </div>
                        <div className="text-lg font-bold mb-2">
                            {getMonthName(currentMonth, typedT)} {currentYear}
                        </div>
                        <CalendarGrid
                            year={currentYear}
                            month={currentMonth}
                            eventDots={eventDotMap}
                            selectedDate={selectedDate || todayStr}
                            onDayClick={handleDayClick}
                        />
                        {showDaySidebar && renderMonthSidebar()}
                    </>
                );
            case "Week": {
                const weekDays = Array.from(
                    { length: 7 },
                    (_, i) => addDays(currentWeekStart, i),
                );
                return (
                    <div className="flex h-full">
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={goToPrevWeek}
                                        aria-label={t("calendar_prev_week", {
                                            count: 1,
                                        })}
                                    >
                                        <ChevronLeft />
                                    </Button>
                                    <div className="text-lg font-bold">
                                        {formatMonthDay(weekDays[0], typedT)} -
                                        {" "}
                                        {formatMonthDayYear(
                                            weekDays[6],
                                            typedT,
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={goToNextWeek}
                                        aria-label={t("calendar_next_week", {
                                            count: 1,
                                        })}
                                    >
                                        <ChevronRight />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={goToToday}
                                    >
                                        {t("calendar_today", { count: 1 })}
                                    </Button>
                                </div>
                                <Button
                                    variant={showWeekSidebar
                                        ? "default"
                                        : "outline"}
                                    size="sm"
                                    onClick={() =>
                                        setShowWeekSidebar((v) => !v)}
                                >
                                    {showWeekSidebar
                                        ? t("calendar_hide_events", {
                                            count: 1,
                                        })
                                        : t("calendar_show_events", {
                                            count: 1,
                                        })}
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => openAddEventModal()}
                                >
                                    {t("calendar_add_event", { count: 1 })}
                                </Button>
                            </div>
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {weekDays.map((date, i) => (
                                    <div
                                        key={date.toISOString()}
                                        className="text-xs font-semibold text-center text-muted-foreground py-1"
                                    >
                                        {typedWeekdayT(WEEKDAY_KEYS[i])}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {weekDays.map((date) => {
                                    const dateStr = format(date, "yyyy-MM-dd");
                                    const isToday = isSameDay(date, today);
                                    const isSelected = selectedDate === dateStr;
                                    const dotColor = eventDotMap[dateStr];
                                    return (
                                        <button
                                            key={dateStr}
                                            className={[
                                                "h-16 w-full rounded flex flex-col items-center justify-center text-sm font-medium transition-colors p-1 border",
                                                isToday
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : isSelected
                                                    ? "bg-accent text-accent-foreground border-accent"
                                                    : "hover:bg-muted border-border",
                                                dotColor
                                                    ? "ring-2 ring-secondary"
                                                    : "",
                                            ].join(" ")}
                                            onClick={() =>
                                                handleDayClick(dateStr)}
                                            aria-label={`Select ${dateStr}`}
                                        >
                                            <span>{format(date, "d")}</span>
                                            {dotColor && (
                                                <span
                                                    className="mt-0.5 w-1.5 h-1.5 rounded-full block"
                                                    style={{
                                                        backgroundColor:
                                                            dotColor,
                                                    }}
                                                />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        {showWeekSidebar && renderWeekSidebar(weekDays)}
                    </div>
                );
            }
            case "Year": {
                return (
                    <div className="flex h-full">
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            setCurrentYear((y) => y - 1)}
                                        aria-label={t("calendar_prev_year", {
                                            count: 1,
                                        })}
                                    >
                                        <ChevronLeft />
                                    </Button>
                                    <div className="text-lg font-bold">
                                        {currentYear}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            setCurrentYear((y) => y + 1)}
                                        aria-label={t("calendar_next_year", {
                                            count: 1,
                                        })}
                                    >
                                        <ChevronRight />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setCurrentYear(today.getFullYear())}
                                    >
                                        {t("calendar_this_year", { count: 1 })}
                                    </Button>
                                </div>
                                <Button
                                    variant={showYearSidebar
                                        ? "default"
                                        : "outline"}
                                    size="sm"
                                    onClick={() =>
                                        setShowYearSidebar((v) => !v)}
                                >
                                    {showYearSidebar
                                        ? t("calendar_hide_events", {
                                            count: 1,
                                        })
                                        : t("calendar_show_events", {
                                            count: 1,
                                        })}
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => openAddEventModal()}
                                >
                                    {t("calendar_add_event", { count: 1 })}
                                </Button>
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                {Array.from({ length: 12 }, (_, m) => (
                                    <div
                                        key={m}
                                        className="border rounded-lg p-2 cursor-pointer hover:bg-muted transition-colors"
                                        onClick={() => {
                                            setCurrentMonth(m);
                                            setViewMode("Month");
                                        }}
                                    >
                                        <div className="text-center font-semibold mb-1">
                                            {t(MONTH_KEYS[m], { count: 1 })}
                                        </div>
                                        {renderMiniMonth(currentYear, m)}
                                    </div>
                                ))}
                            </div>
                        </div>
                        {showYearSidebar && renderYearSidebar()}
                    </div>
                );
            }
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-full w-full p-4 bg-background text-foreground relative">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    {viewMode === "Month" && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={goToPrevMonth}
                                aria-label="Previous Month"
                            >
                                <ChevronLeft />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={goToNextMonth}
                                aria-label="Next Month"
                            >
                                <ChevronRight />
                            </Button>
                        </>
                    )}
                </div>
                {renderViewSwitcher()}
            </div>
            <div className="relative flex-1">
                <div
                    className={modalOpen
                        ? "pointer-events-none opacity-40 blur-sm grayscale transition-all"
                        : "transition-all"}
                >
                    {renderCalendarView()}
                </div>
                <EventModal
                    open={modalOpen}
                    date={modalDate}
                    event={editEvent || undefined}
                    onSave={handleSaveEvent}
                    onClose={() => {
                        setModalOpen(false);
                        setEditEvent(null);
                    }}
                />
            </div>
        </div>
    );
};

export default SimpleCalendar;
