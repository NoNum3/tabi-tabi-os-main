"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { PrimitiveAtom, useAtom, useSetAtom } from "jotai";
import {
  activeNoteIdAtom,
  createNewNoteAtom,
  deleteNoteAtom,
  notesAtom,
  updateNoteAtom,
} from "@/apps/notepad/atoms/notepadAtom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/infrastructure/lib/utils";
import { FilePlus, Pencil, Trash2 } from "lucide-react";
import { playSound } from "@/infrastructure/lib/utils";
import { useI18n } from '@/locales/client';

// Constants for resizing
const MIN_WIDTH = 150; // Minimum sidebar width in pixels
const MAX_WIDTH = 500; // Maximum sidebar width in pixels
const DEFAULT_WIDTH = 256; // Default width (w-64)

export const NoteListSidebar = () => {
  const t = useI18n();
  const [notes] = useAtom(notesAtom);
  const [activeNoteId, setActiveNoteId] = useAtom(
    activeNoteIdAtom as PrimitiveAtom<string | null>,
  );
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  const createNewNote = useSetAtom(createNewNoteAtom);
  const updateNote = useSetAtom(updateNoteAtom);
  const deleteNote = useSetAtom(deleteNoteAtom);

  // Load saved width from local storage (optional, can be added later)
  // useEffect(() => {
  //   const savedWidth = localStorage.getItem("notepadSidebarWidth");
  //   if (savedWidth) {
  //     setSidebarWidth(parseInt(savedWidth, 10));
  //   }
  // }, []);

  // Save width to local storage (optional)
  // useEffect(() => {
  //   localStorage.setItem("notepadSidebarWidth", sidebarWidth.toString());
  // }, [sidebarWidth]);

  useEffect(() => {
    if (editingNoteId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingNoteId]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = "col-resize"; // Change cursor during resize
  };

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      document.body.style.cursor = "default"; // Restore default cursor
    }
  }, [isResizing]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !sidebarRef.current) return;

      const currentX = e.clientX;
      const sidebarRect = sidebarRef.current.getBoundingClientRect();
      // Calculate new width relative to the sidebar's left edge
      let newWidth = currentX - sidebarRect.left;

      // Clamp the width within min/max bounds
      newWidth = Math.max(MIN_WIDTH, Math.min(newWidth, MAX_WIDTH));

      setSidebarWidth(newWidth);
    },
    [isResizing],
  );

  // Add and remove global mouse listeners for resizing
  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default"; // Ensure cursor is reset on unmount
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const handleCreateNote = () => {
    playSound("/sounds/click.mp3");
    createNewNote();
  };

  const handleDeleteNote = (
    noteId: string,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    playSound("/sounds/click.mp3");
    if (editingNoteId === noteId) {
      setEditingNoteId(null);
    }
    if (
      window.confirm(
        t('notepad.confirmDelete', { count: 1, title: notes.find((n) => n.id === noteId)?.title ?? t('notepad.untitledNote', { count: 1 }) })
      )
    ) {
      deleteNote(noteId);
    }
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditedName(event.target.value);
  };

  const handleSaveName = (noteId: string) => {
    if (editingNoteId === noteId && editedName.trim() !== "") {
      playSound("/sounds/click.mp3");
      console.log(
        "[NoteListSidebar] Saving title:",
        editedName.trim(),
        "for noteId:",
        noteId,
      );
      updateNote({ noteId: noteId, title: editedName.trim() });
    }
    setEditingNoteId(null);
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    noteId: string,
  ) => {
    if (event.key === "Enter") {
      handleSaveName(noteId);
    } else if (event.key === "Escape") {
      setEditingNoteId(null);
    }
  };

  const handleStartEditing = (
    noteId: string,
    currentName: string,
    event: React.MouseEvent<HTMLElement>,
  ) => {
    event.stopPropagation();
    playSound("/sounds/click.mp3");
    setEditingNoteId(noteId);
    setEditedName(currentName || t('notepad.untitledNote', { count: 1 }));
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      ref={sidebarRef}
      className="relative border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col h-full overflow-hidden"
      style={{ width: `${sidebarWidth}px`, flexShrink: 0 }} // Apply dynamic width and prevent shrinking
    >
      {/* Resize Handle */}
      <div
        className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize bg-transparent hover:bg-blue-200 dark:hover:bg-blue-700 active:bg-blue-300 dark:active:bg-blue-600 z-10"
        onMouseDown={handleMouseDown}
        title={t('notepad.resizeSidebar', { count: 1 })}
      />

      <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
        <h2 className="text-lg font-semibold dark:text-gray-200">{t('notepad.notes', { count: 1 })}</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCreateNote}
          title={t('notepad.newNote', { count: 1 })}
        >
          <FilePlus className="h-5 w-5" />
        </Button>
      </div>

      {/* Improved ScrollArea with proper constraints */}
      <div className="flex-grow overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="p-2">
            {notes.length === 0
              ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  {t('notepad.noNotes', { count: 1 })}
                </div>
              )
              : (
                <ul className="space-y-1">
                  {notes.map((note) => (
                    <li key={note.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (editingNoteId !== note.id) {
                            playSound("/sounds/click.mp3");
                            setActiveNoteId(note.id);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (
                            editingNoteId !== note.id &&
                            (e.key === "Enter" || e.key === " ")
                          ) {
                            e.preventDefault();
                            playSound("/sounds/click.mp3");
                            setActiveNoteId(note.id);
                          }
                        }}
                        className={cn(
                          "w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-300 dark:focus:ring-blue-600 flex justify-between items-start group cursor-pointer dark:text-gray-200",
                          activeNoteId === note.id
                            ? "bg-blue-100 dark:bg-blue-800 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-700"
                            : "",
                        )}
                      >
                        <div className="flex-grow overflow-hidden mr-2 w-0">
                          {editingNoteId === note.id
                            ? (
                              <Input
                                ref={inputRef}
                                value={editedName}
                                onBlur={() => handleSaveName(note.id)}
                                onChange={handleNameChange}
                                onKeyDown={(e) => handleKeyDown(e, note.id)}
                                onFocus={(e) => e.target.select()}
                                className="h-7 py-1 px-1.5 text-sm"
                                onClick={(e) => e.stopPropagation()}
                              />
                            )
                            : (
                              <>
                                <div className="font-medium truncate text-sm">
                                  {note.title || t('notepad.untitledNote', { count: 1 })}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {formatTimestamp(note.updated_at)}
                                </div>
                              </>
                            )}
                        </div>
                        {/* Action Buttons Container */}
                        <div className="flex flex-shrink-0 items-center space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          {/* Edit Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-6 w-6 p-0 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600",
                              // Make edit button visible if focused or active
                              activeNoteId === note.id && "opacity-100",
                            )}
                            onClick={(e) =>
                              handleStartEditing(
                                note.id,
                                note.title || t('notepad.untitledNote', { count: 1 }),
                                e,
                              )}
                            title={t('notepad.renameNote', { count: 1 })}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-6 w-6 p-0 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50",
                              // Make delete button visible if focused or active
                              activeNoteId === note.id && "opacity-100",
                            )}
                            onClick={(e) => handleDeleteNote(note.id, e)}
                            title={t('notepad.deleteNote', { count: 1 })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
