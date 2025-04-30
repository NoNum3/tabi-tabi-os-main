"use client";

import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    BookmarkPlus,
    ExternalLink,
    Loader2,
    Trash2,
    User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { sidebarOpenAtom } from "@/application/atoms/sidebarAtoms";
import { useI18n } from "@/locales/client";
import { profileAtom, userAtom } from "@/atoms/authAtoms";
import {
    addBookmarkAtom,
    BookmarkItem as BookmarkItemType,
    bookmarksAtom,
    bookmarksErrorAtom,
    fetchBookmarksAtom,
    groupedBookmarksAtom,
    removeBookmarkAtom,
} from "@/atoms/bookmarkAtoms";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/useToast";
import {
    TodoItem as TodoItemType,
    todosAtom,
    todosErrorAtom as todosErrorAtomAlias,
    todosLoadingAtom as todosLoadingAtomAlias,
    toggleTodoAtom,
} from "@/atoms/todoListAtoms";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

// --- Configuration for Sidebar Items ---

// TODO: Replace with actual user data and auth logic later

// --- Add Bookmark Form Component ---
const AddBookmarkForm = (
    { onAdd }: {
        onAdd: (
            bookmark: Omit<BookmarkItemType, "id" | "user_id" | "created_at">,
        ) => void;
    },
) => {
    const t = useI18n();
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [type, setType] = useState("general");
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!title.trim()) {
            setError("Title cannot be empty.");
            return;
        }
        if (!url.trim()) {
            setError("URL cannot be empty.");
            return;
        }
        // Simple validation
        try {
            new URL(url);
        } catch { // Ensure _ is removed or commented if it was the error at 99:18
            /* _ */ setError(
                "Invalid URL format. Make sure it includes http:// or https://",
            );
            return;
        }

        onAdd({ title, url, type });
        // Clear form is handled by DialogClose or parent
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="bookmark-title">
                    {t("bookmarkTitleLabel", { count: 1 })}
                </Label>
                <Input
                    id="bookmark-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("bookmarkTitlePlaceholder", { count: 1 })}
                    required
                />
            </div>
            <div>
                <Label htmlFor="bookmark-url">
                    {t("bookmarkUrlLabel", { count: 1 })}
                </Label>
                <Input
                    id="bookmark-url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    required
                />
            </div>
            <div>
                <Label htmlFor="bookmark-type">
                    {t("bookmarkTypeLabel", { count: 1 })}
                </Label>
                <Select value={type} onValueChange={setType}>
                    <SelectTrigger id="bookmark-type">
                        <SelectValue
                            placeholder={t("bookmarkTypePlaceholder", {
                                count: 1,
                            })}
                        />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="general">
                            {t("bookmarkTypeGeneral", { count: 1 })}
                        </SelectItem>
                        <SelectItem value="social">
                            {t("bookmarkTypeSocial", { count: 1 })}
                        </SelectItem>
                        <SelectItem value="work">
                            {t("bookmarkTypeWork", { count: 1 })}
                        </SelectItem>
                        {/* Add more types if needed */}
                    </SelectContent>
                </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">
                        {t("reset_dialog_cancel", { count: 1 })}
                    </Button>
                </DialogClose>
                <Button type="submit">
                    {t("bookmarkAddNew", { count: 1 })}
                </Button>
            </DialogFooter>
        </form>
    );
};

// --- Sidebar Component ---
export const Sidebar: React.FC = () => {
    const t = useI18n();
    const { toast } = useToast();
    const [isOpen] = useAtom(sidebarOpenAtom);

    // Auth State
    const user = useAtomValue(userAtom);
    const profile = useAtomValue(profileAtom);

    // Bookmark State
    const bookmarks = useAtomValue(bookmarksAtom);
    const errorBookmarks = useAtomValue(bookmarksErrorAtom);
    const addBookmark = useSetAtom(addBookmarkAtom);
    const removeBookmark = useSetAtom(removeBookmarkAtom);
    const fetchBookmarks = useSetAtom(fetchBookmarksAtom);

    // --- Todo State ---
    const todos = useAtomValue(todosAtom);
    const isLoadingTodos = useAtomValue(todosLoadingAtomAlias);
    const errorTodos = useAtomValue(todosErrorAtomAlias);
    const toggleTodo = useSetAtom(toggleTodoAtom);

    const allGroupedBookmarks = useAtomValue(groupedBookmarksAtom);
    const groupedBookmarks = !errorBookmarks ? allGroupedBookmarks : {};

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    // --- Add Filtering for Pending Todos ---
    const pendingTodos = todos.filter((todo) => !todo.completed);

    // Calculate account age
    let accountAge = "";
    if (user?.created_at) {
        try {
            accountAge = formatDistanceToNow(new Date(user.created_at), {
                addSuffix: true,
            });
        } catch {
            /* (e) */ accountAge = "Error calculating age";
        }
    }

    const handleAddBookmark = (
        newBookmark: Omit<BookmarkItemType, "id" | "user_id" | "created_at">,
    ) => {
        addBookmark(newBookmark).then(() => {
            setIsAddDialogOpen(false); // Close dialog on success
            toast({ title: t("bookmarkAddedSuccess", { count: 1 }) });
        }).catch(() => {
            // Error is handled by the atom, toast could be added here too
            toast({
                title: t("bookmarkAddedError", { count: 1 }),
                variant: "destructive",
            });
        });
    };

    const handleDeleteBookmark = (id: string) => {
        removeBookmark(id).then(() => {
            toast({ title: t("bookmarkRemovedSuccess", { count: 1 }) });
        }).catch(() => {
            toast({
                title: t("bookmarkRemovedError", { count: 1 }),
                variant: "destructive",
            });
        });
    };

    const handleToggleTodo = (todo: TodoItemType) => {
        toggleTodo(todo.id);
    };

    useEffect(() => {
        if (user) {
            fetchBookmarks();
        }
    }, [user, fetchBookmarks]);

    return (
        <aside
            className={cn(
                "fixed top-0 left-0 h-screen w-64 bg-background/90 backdrop-blur-sm border-r border-border z-50",
                "flex flex-col transition-transform duration-300 ease-in-out",
                isOpen ? "translate-x-0" : "-translate-x-full",
            )}
        >
            <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
                <h2 className="text-lg font-semibold text-foreground">
                    Bookmarks
                </h2>
            </div>

            <div className="p-4 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-3 mb-2">
                    <Avatar className="h-10 w-10 border">
                        <AvatarImage
                            src={profile?.avatar_url ?? undefined}
                            alt="User Avatar"
                        />
                        <AvatarFallback>
                            <User className="h-5 w-5" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium text-foreground truncate">
                            {profile?.full_name || "Guest"}
                        </p>
                        {accountAge && (
                            <p className="text-xs text-muted-foreground">
                                Member for {accountAge}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {user && (
                <div className="p-4 border-b border-border flex-shrink-0">
                    <Dialog
                        open={isAddDialogOpen}
                        onOpenChange={setIsAddDialogOpen}
                    >
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-2"
                            >
                                <BookmarkPlus className="size-4" />{" "}
                                {t("bookmarkAddNew", { count: 1 })}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {t("bookmarkAddDialogTitle", { count: 1 })}
                                </DialogTitle>
                            </DialogHeader>
                            <AddBookmarkForm onAdd={handleAddBookmark} />
                        </DialogContent>
                    </Dialog>
                </div>
            )}

            <ScrollArea className="flex-grow border-b border-border">
                <div className="p-4 space-y-4">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2 px-1">
                        {t("bookmarkAddDialogTitle", { count: 1 })}
                    </h3>
                    {errorBookmarks && !errorBookmarks && (
                        <div className="text-center text-destructive text-sm py-4">
                            <p>Error: {errorBookmarks}</p>
                        </div>
                    )}
                    {!errorBookmarks && user &&
                        Object.entries(groupedBookmarks).map((
                            [type, items],
                        ) => (
                            <div key={type}>
                                <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2 px-1">
                                    {t(
                                        `bookmarkType${
                                            type.charAt(0).toUpperCase() +
                                            type.slice(1)
                                        }` as keyof ReturnType<
                                            typeof t
                                        >,
                                        {},
                                    )}
                                </h3>
                                <ul className="space-y-1">
                                    {items.map((item) => (
                                        <li
                                            key={item.id}
                                            className="group flex items-center gap-2 text-sm"
                                        >
                                            <Link
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-grow truncate hover:text-primary hover:underline"
                                                title={item.url}
                                            >
                                                {item.title}
                                            </Link>
                                            <TooltipProvider
                                                delayDuration={100}
                                            >
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                                            onClick={() =>
                                                                handleDeleteBookmark(
                                                                    item.id,
                                                                )}
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent
                                                        side="right"
                                                        sideOffset={5}
                                                    >
                                                        <p>
                                                            {t(
                                                                "bookmarkRemovedSuccess",
                                                                { count: 1 },
                                                            )}
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                            <TooltipProvider
                                                delayDuration={100}
                                            >
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-6 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                                            onClick={() =>
                                                                window.open(
                                                                    item.url,
                                                                    "_blank",
                                                                )}
                                                        >
                                                            <ExternalLink className="size-3.5" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent
                                                        side="right"
                                                        sideOffset={5}
                                                    >
                                                        <p>
                                                            {t(
                                                                "bookmarkAddNew",
                                                                { count: 1 },
                                                            )}
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    {!errorBookmarks && user &&
                        bookmarks.length === 0 && (
                        <p className="text-muted-foreground text-center italic text-xs py-6">
                            {t("bookmarkAddNew", { count: 1 })}
                        </p>
                    )}
                    {!errorBookmarks && !user && (
                        <p className="text-muted-foreground text-center italic text-xs py-6">
                            {t("bookmarksSignInPrompt", { count: 1 })}
                        </p>
                    )}
                </div>

                {/* --- Pending Todos Section --- */}
                {user && (
                    <div className="p-4 pt-0 space-y-2">
                        <Separator className="mb-4" />
                        <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2 px-1">
                            {t("todo_status_todo", { count: 1 })}{" "}
                            ({pendingTodos.length})
                        </h3>
                        {isLoadingTodos && (
                            <div className="flex justify-center items-center py-4">
                                <Loader2 className="size-4 animate-spin text-muted-foreground" />
                            </div>
                        )}
                        {errorTodos && !isLoadingTodos && (
                            <div className="text-center text-destructive text-xs py-2">
                                <p>Todo Error: {errorTodos}</p>
                            </div>
                        )}
                        {!isLoadingTodos && !errorTodos && (
                            pendingTodos.length > 0
                                ? (
                                    <ul className="space-y-1">
                                        {pendingTodos.map((task) => (
                                            <li
                                                key={task.id}
                                                className="flex items-center gap-2 text-sm group"
                                            >
                                                <Checkbox
                                                    id={`sidebar-task-${task.id}`}
                                                    checked={task.completed}
                                                    onCheckedChange={() =>
                                                        handleToggleTodo(task)}
                                                    className="size-4"
                                                />
                                                <label
                                                    htmlFor={`sidebar-task-${task.id}`}
                                                    className="flex-grow truncate cursor-pointer hover:text-primary"
                                                    title={task.task}
                                                >
                                                    {task.task}
                                                </label>
                                            </li>
                                        ))}
                                    </ul>
                                )
                                : (
                                    <p className="text-muted-foreground text-center italic text-xs py-3">
                                        {t("todo_no_tasks", { count: 1 })}
                                    </p>
                                )
                        )}
                    </div>
                )}
            </ScrollArea>

            <div className="p-4 border-t border-border mt-auto flex-shrink-0">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 px-1">
                    {t("bookmarkAddNew", { count: 1 })}
                </h4>
                <Button
                    variant="link"
                    size="sm"
                    className="justify-start p-0 h-auto text-muted-foreground hover:text-primary"
                    onClick={() => {/* Open App Store */}}
                >
                    Discover more apps in the App Store
                </Button>
            </div>
        </aside>
    );
};
