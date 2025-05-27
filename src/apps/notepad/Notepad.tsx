"use client";

import React, {
  Component,
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { EditorState } from "lexical";
import { playSound } from "@/infrastructure/lib/utils";
import { useI18n } from '@/locales/client';
// import { useTheme } from "next-themes";

import {
  activeNoteContentAtom,
  activeNoteIdAtom,
  fetchNotesAtom,
  notesAtom,
  notesErrorAtom,
  notesLoadingAtom,
  updateNoteAtom,
  userAtom, // Use this for user state as per notepadAtom.ts
} from "@/apps/notepad/atoms/notepadAtom";
import { NoteListSidebar } from "./components/NoteListSidebar";
import { RichTextToolbar } from "./components/RichTextToolbar";
// import { useDebouncedCallback } from "use-debounce"; // Debounced save will be removed for now
import { PanelLeftClose, PanelLeftOpen, SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button"; // For the save button

// Define a more detailed Note type aligned with DB
export interface DbNote {
  id: string; // Kept as string for client-side consistency, maps to UUID
  user_id: string;
  title: string | null;
  content: string | null; // Serialized Lexical state
  created_at: string;
  updated_at: string;
}

const baseEditorTheme = {
  ltr: "ltr",
  rtl: "rtl",
  placeholder: "editor-placeholder",
  paragraph: "editor-paragraph",
  quote: "editor-quote",
  heading: {
    h1: "editor-heading-h1",
    h2: "editor-heading-h2",
    h3: "editor-heading-h3",
  },
  list: {
    nested: {
      listitem: "editor-nested-listitem",
    },
    ol: "editor-list-ol",
    ul: "editor-list-ul",
    listitem: "editor-listitem",
  },
  image: "editor-image",
  link: "editor-link",
  text: {
    bold: "editor-text-bold",
    italic: "editor-text-italic",
    underline: "editor-text-underline",
    strikethrough: "editor-text-strikethrough",
    underlineStrikethrough: "editor-text-underlineStrikethrough",
    code: "editor-text-code",
  },
  code: "editor-code",
};

const editorNodes = [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  CodeNode,
  CodeHighlightNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  AutoLinkNode,
  LinkNode,
];

function onError(error: Error) {
  console.error("Lexical Error:", error);
}

class EditorErrorBoundary extends Component<
  { children: ReactElement; onError: (error: Error) => void },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error): { error: Error | null } {
    return { error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.props.onError(error);
    console.error("Uncaught error in Lexical editor:", error, errorInfo);
  }
  render(): React.ReactNode {
    if (this.state.error) {
      return <div>Editor Error! Please check the console.</div>;
    }
    return this.props.children;
  }
}

const Notepad: React.FC = () => {
  const t = useI18n();
  const currentUser = useAtomValue(userAtom);
  const notes = useAtomValue(notesAtom);
  const [activeNoteId] = useAtom(activeNoteIdAtom); // setActiveNoteId removed
  const activeNoteContent = useAtomValue(activeNoteContentAtom);

  const setFetchNotes = useSetAtom(fetchNotesAtom);
  const setUpdateNote = useSetAtom(updateNoteAtom);

  const isLoading = useAtomValue(notesLoadingAtom);
  const error = useAtomValue(notesErrorAtom);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const editorStateRef = useRef<EditorState | null>(null);
  const [isSaving, setIsSaving] = useState(false); // Local saving UI state
  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (currentUser) {
      // If there's a user and we haven't marked the initial fetch for THIS user session as done
      if (!initialFetchDone.current) {
        console.log("[Notepad.tsx] User detected, triggering fetchNotesAtom.");
        setFetchNotes();
        initialFetchDone.current = true; // Mark that fetch has been initiated for this user session
      }
    } else {
      // User logged out or became null, reset the flag so fetch can happen if they log back in
      console.log("[Notepad.tsx] No user, resetting initialFetchDone flag.");
      initialFetchDone.current = false;
      // Note: notepadAtom.ts should be handling the clearing of actual notes data
      // when userAtom becomes null.
    }
  }, [currentUser, setFetchNotes]);

  const handleOnChange = useCallback((newEditorState: EditorState) => {
    editorStateRef.current = newEditorState;
  }, []);

  const handleSaveNote = async () => {
    if (!currentUser || !activeNoteId || !editorStateRef.current) {
      console.warn("Cannot save: User, activeNoteId, or editorState missing.");
      // Optionally show a toast/alert to the user
      return;
    }

    const noteToSave = notes.find((n) => n.id === activeNoteId);
    if (!noteToSave) {
      console.warn("Cannot save: Active note not found in local state.");
      return;
    }

    setIsSaving(true);
    const currentContentJSON = JSON.stringify(editorStateRef.current.toJSON());

    try {
      await setUpdateNote({
        noteId: activeNoteId,
        content: currentContentJSON,
      });
      // notepadAtom's updateNoteAtom should handle optimistic updates and error states.
      // We can show a success toast here if needed.
      console.log("Note save triggered for ID:", activeNoteId);
    } catch (e) {
      console.error("Failed to trigger note save:", e);
      // Show error toast
    } finally {
      setIsSaving(false);
    }
  };

  const initialConfig = {
    namespace: `Notepad-${activeNoteId || "new"}`,
    theme: baseEditorTheme,
    onError,
    nodes: editorNodes,
    editorState: activeNoteId ? activeNoteContent : null,
  };

  const composerKey = activeNoteId || "__EMPTY__";

  const toggleSidebar = useCallback(() => {
    playSound("/sounds/click.mp3");
    setIsSidebarOpen((prev) => !prev);
  }, []);

  if (!currentUser) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white dark:bg-black text-black dark:text-white p-4 text-center">
        Please log in to use the Notepad.<br />
        {error && <span className="text-red-500 text-sm">{error}</span>}
      </div>
    );
  }

  if (isLoading && !notes.length && !initialFetchDone.current) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white dark:bg-black text-black dark:text-white p-4">
        Loading notes...
      </div>
    );
  }

  if (error && !notes.length) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white dark:bg-black text-black dark:text-white p-4 text-center">
        Error loading notes: {error}
        <br />
        Please try refreshing or ensure you are connected.
      </div>
    );
  }

  const mainContainerClasses = `
    w-full h-full flex relative rounded shadow overflow-hidden 
    bg-white dark:bg-black 
    border border-gray-300 dark:border-gray-700
  `;

  const editorContainerClasses = `
    flex-grow relative overflow-y-auto 
    bg-white dark:bg-black 
    text-black dark:text-white
  `;

  const sidebarToggleClasses = `
    group flex flex-col items-center justify-center h-full w-5 
    border-l border-r border-gray-200 dark:border-gray-700 
    bg-gray-50 dark:bg-gray-800 
    hover:bg-gray-100 dark:hover:bg-gray-700 
    cursor-pointer transition-colors duration-200 select-none
  `;

  const sidebarToggleIconClasses =
    "h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200";

  const activeNoteExists = activeNoteId &&
    notes.some((note) => note.id === activeNoteId);

  return (
    <div className={mainContainerClasses}>
      {isSidebarOpen && <NoteListSidebar />}
      <div
        onClick={toggleSidebar}
        className={sidebarToggleClasses}
        title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
      >
        <div className="flex flex-col h-16 justify-center items-center">
          {isSidebarOpen
            ? <PanelLeftClose className={sidebarToggleIconClasses} />
            : <PanelLeftOpen className={sidebarToggleIconClasses} />}
        </div>
      </div>

      <div className="flex-grow flex flex-col h-full">
        {activeNoteExists || (!activeNoteId && notes.length === 0)
          ? (
            <LexicalComposer initialConfig={initialConfig} key={composerKey}>
              <div className="flex items-center border-b border-gray-200 dark:border-gray-700 p-1">
                <RichTextToolbar />
                <Button
                  onClick={handleSaveNote}
                  disabled={isSaving || !activeNoteId ||
                    !editorStateRef.current}
                  size="sm"
                  variant="outline"
                  className="ml-auto mr-1" // Use ml-auto to push to the right, mr-1 for spacing
                  title={!activeNoteId
                    ? "Select a note to save"
                    : !editorStateRef.current
                    ? "Editor not ready"
                    : "Save current note"}
                >
                  <SaveIcon className="h-4 w-4 mr-1" />
                  {isSaving ? t('notepad.saving', { count: 1 }) : t('notepad.save', { count: 1 })}
                </Button>
              </div>
              <div className={editorContainerClasses}>
                <RichTextPlugin
                  contentEditable={
                    <ContentEditable className="w-full h-full min-h-[200px] p-4 outline-none resize-none editor-content-editable block bg-white dark:bg-black" />
                  }
                  placeholder={
                    <div className="editor-placeholder absolute top-4 left-4 pointer-events-none select-none">
                      {notes.length === 0 && !activeNoteId
                        ? t('notepad.placeholder', { count: 1 })
                        : t('notepad.placeholder', { count: 1 })}
                    </div>
                  }
                  ErrorBoundary={EditorErrorBoundary}
                />
                <OnChangePlugin
                  onChange={handleOnChange}
                  ignoreHistoryMergeTagChange={true}
                />
                <HistoryPlugin />
                <ListPlugin />
              </div>
            </LexicalComposer>
          )
          : (
            <div className="w-full h-full flex items-center justify-center text-center text-gray-500 dark:text-gray-400 p-4">
              {(notes.length > 0 && !activeNoteId)
                ? "Select a note from the sidebar to view or edit."
                : "Create a new note using the button in the sidebar to get started."}
              {error && (
                <div className="text-red-500 text-sm mt-2">Error: {error}</div>
              )}
            </div>
          )}

        <style jsx global>
          {`
        .editor-content-editable {
          caret-color: black;
          color: black;
        }
        .dark .editor-content-editable {
          caret-color: white;
          color: white;
        }
        .editor-placeholder {
          color: #aaa;
        }
        .dark .editor-placeholder {
          color: #666;
        }
        /* Add other editor specific styles here */
        .editor-heading-h1 {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 12px;
        }
        .editor-heading-h2 {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .editor-heading-h3 {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .editor-paragraph {
          margin-bottom: 8px;
          line-height: 1.5;
        }
        .editor-list-ol {
          list-style-type: decimal;
          margin-left: 20px;
          margin-bottom: 8px;
        }
        .editor-list-ul {
          list-style-type: disc;
          margin-left: 20px;
          margin-bottom: 8px;
        }
        .editor-listitem {
          margin-bottom: 4px;
        }
        .editor-quote {
          border-left: 4px solid #ccc;
          padding-left: 10px;
          margin-left: 0;
          color: #555;
          font-style: italic;
        }
        .dark .editor-quote {
          border-left-color: #555;
          color: #aaa;
        }
        .editor-link {
          color: blue;
          text-decoration: underline;
        }
        .dark .editor-link {
          color: skyblue;
        }
        .editor-text-bold {
          font-weight: bold;
        }
        .editor-text-italic {
          font-style: italic;
        }
        .editor-text-underline {
          text-decoration: underline;
        }
        .editor-text-strikethrough {
          text-decoration: line-through;
        }
        .editor-text-underlineStrikethrough {
          text-decoration: underline line-through;
        }
        .editor-text-code {
          font-family: monospace;
          background-color: #f0f0f0;
          padding: 2px 4px;
          border-radius: 4px;
        }
        .dark .editor-text-code {
          background-color: #333;
        }
        .editor-code {
          font-family: monospace;
          background-color: #f0f0f0;
          padding: 10px;
          border-radius: 4px;
          display: block;
          white-space: pre-wrap;
        }
        .dark .editor-code {
          background-color: #333;
        }
        `}
        </style>
      </div>
    </div>
  );
};

export default Notepad;
