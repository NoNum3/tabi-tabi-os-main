"use client";

import React, { useEffect, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Loader2, Trash2 } from "lucide-react";
import { useI18n } from "@/locales/client";
import {
  addTodoAtom,
  fetchTodosAtom,
  removeTodoAtom,
  TodoItem as TodoItemType,
  todosAtom,
  todosErrorAtom,
  todosLoadingAtom,
  toggleTodoAtom,
} from "@/atoms/todoListAtoms";
import { userAtom } from "@/atoms/authAtoms";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDistanceToNow } from "date-fns";

const TaskItem = ({
  task,
  onToggleTask,
  onDeleteTask,
}: {
  task: TodoItemType;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}) => {
  const t = useI18n();

  let createdAtFormatted = "";
  try {
    createdAtFormatted = formatDistanceToNow(new Date(task.created_at), {
      addSuffix: true,
    });
  } catch (e) {
    console.error("Error formatting date:", task.created_at, e);
    createdAtFormatted = "Invalid date";
  }

  return (
    <li className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded group border-b border-border/50 last:border-b-0">
      <Checkbox
        id={`task-${task.id}`}
        checked={task.completed}
        onCheckedChange={() => onToggleTask(task.id)}
        className="size-4"
      />
      <div className="flex-grow flex flex-col">
        <span
          className={`text-sm break-words ${
            task.completed
              ? "line-through text-muted-foreground"
              : "text-card-foreground"
          }`}
        >
          {task.task}
        </span>
        <span className="text-xs text-muted-foreground flex items-center gap-1 pt-0.5">
          <Clock className="size-3" /> {createdAtFormatted}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive/80 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity duration-150 ml-auto flex-shrink-0"
        onClick={() => onDeleteTask(task.id)}
        title={t("todo_delete_tooltip", { count: 1 })}
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
};

const TodoList: React.FC = () => {
  const t = useI18n();
  const user = useAtomValue(userAtom);
  const todos = useAtomValue(todosAtom);
  const isLoading = useAtomValue(todosLoadingAtom);
  const error = useAtomValue(todosErrorAtom);
  const fetchTodos = useSetAtom(fetchTodosAtom);
  const addTodo = useSetAtom(addTodoAtom);
  const toggleTodo = useSetAtom(toggleTodoAtom);
  const removeTodo = useSetAtom(removeTodoAtom);

  const [newTaskText, setNewTaskText] = useState("");

  useEffect(() => {
    console.log("TodoList: useEffect triggered, user:", user);
    if (user) {
      fetchTodos();
    }
  }, [user, fetchTodos]);

  const handleAddTask = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (newTaskText.trim() !== "" && user) {
      addTodo(newTaskText);
      setNewTaskText("");
    }
  };

  const pendingTodos = todos.filter((todo) => !todo.completed);
  const completedTodos = todos.filter((todo) => todo.completed);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
        <p>{t("bookmarksSignInPrompt", { count: 1 })}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card text-card-foreground">
      <div className="p-3 border-b border-border bg-muted/30 sticky top-0 z-10">
        <h2 className="text-base font-semibold">
          {t("todoList", { count: 1 })}
        </h2>
      </div>

      <form
        onSubmit={handleAddTask}
        className="p-3 flex gap-2 border-b border-border"
      >
        <Input
          type="text"
          placeholder={t("todo_add_placeholder", {
            count: 1,
          }) as keyof ReturnType<
            typeof t
          >}
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          className="flex-grow h-8"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="sm"
          className="h-8"
          disabled={isLoading || !newTaskText.trim()}
        >
          {t("todo_add_button", { count: 1 })}
        </Button>
      </form>

      <ScrollArea className="flex-grow">
        <div className="p-3 space-y-4">
          {isLoading && (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && !isLoading && (
            <div className="text-center text-destructive py-4">
              <p>Error: {error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchTodos()}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !error && (
            <section>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2 px-1">
                {t("todo_status_todo", { count: 1 })} ({pendingTodos.length})
              </h3>
              {pendingTodos.length > 0
                ? (
                  <ul className="space-y-1">
                    {pendingTodos.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggleTask={toggleTodo}
                        onDeleteTask={removeTodo}
                      />
                    ))}
                  </ul>
                )
                : (
                  <p className="text-muted-foreground text-center italic text-xs py-3">
                    {t("todo_no_tasks", { count: 1 }) as string}
                  </p>
                )}
            </section>
          )}

          {!isLoading && !error && completedTodos.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2 mt-4 px-1">
                {t("todo_status_done", { count: 1 })} ({completedTodos.length})
              </h3>
              <ul className="space-y-1">
                {completedTodos.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggleTask={toggleTodo}
                    onDeleteTask={removeTodo}
                  />
                ))}
              </ul>
            </section>
          )}

          {!isLoading && !error && todos.length === 0 && (
            <p className="text-muted-foreground text-center italic text-xs py-6">
              {t("todo_no_tasks", { count: 1 }) as string}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TodoList;
