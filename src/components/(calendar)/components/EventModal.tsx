"use client";
import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CalendarEvent } from "../types/calendarTypes";

interface EventModalProps {
    open: boolean;
    date: string;
    event?: CalendarEvent;
    onSave: (event: Omit<CalendarEvent, "id">) => void;
    onClose: () => void;
}

export const EventModal: React.FC<EventModalProps> = (
    { open, date, event, onSave, onClose },
) => {
    const [title, setTitle] = useState("");
    const [time, setTime] = useState("");
    const [description, setDescription] = useState("");
    const [color, setColor] = useState("#3b82f6");

    useEffect(() => {
        if (event) {
            setTitle(event.title);
            setTime(event.time || "");
            setDescription(event.description || "");
            setColor(event.color || "#3b82f6");
        } else {
            setTitle("");
            setTime("");
            setDescription("");
            setColor("#3b82f6");
        }
    }, [event, open]);

    const handleSave = () => {
        if (!title.trim()) return;
        onSave({ date, title, time, description, color });
        setTitle("");
        setTime("");
        setDescription("");
        setColor("#3b82f6");
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-background border border-border">
                <DialogHeader>
                    <DialogTitle>
                        {event ? "Edit Event" : `Add Event for ${date}`}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                    <Input
                        placeholder="Event Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full"
                        autoFocus
                    />
                    <Input
                        placeholder="Time (optional)"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full"
                        type="time"
                    />
                    <Textarea
                        placeholder="Description (optional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full"
                        rows={3}
                    />
                    <div className="flex items-center gap-2 mt-2">
                        <label
                            htmlFor="event-color"
                            className="text-sm text-muted-foreground"
                        >
                            Dot Color:
                        </label>
                        <input
                            id="event-color"
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-8 h-8 p-0 border-none bg-transparent cursor-pointer"
                            title="Choose event color"
                        />
                    </div>
                </div>
                <DialogFooter className="mt-2 flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose} type="button">
                        Cancel
                    </Button>
                    <Button
                        variant="default"
                        onClick={handleSave}
                        type="button"
                        disabled={!title.trim()}
                    >
                        {event ? "Save Changes" : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
