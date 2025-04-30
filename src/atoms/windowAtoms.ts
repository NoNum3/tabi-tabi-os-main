import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils"; // Import utils
import type { Position, Size } from "@/types"; // Assuming types are defined here - updated path
// import { appRegistry } from "@/config/appRegistry"; // Removed unused import
import { isPlayingAtom as ambienceIsPlayingAtom } from "./ambiencePlayerAtom";
// Import the safe pause function from AmbiencePlayer
// NOTE: This creates a slight coupling, but necessary for direct control
import { safeAudioPause } from "@/components/(ambiencePlayer)/ambiencePlayer";

const FEATURE_KEY = "windows";

// Define the shape of a single window's state
export interface WindowState {
  id: string; // Unique ID for each window instance
  appId: string; // Identifier for the type of app (e.g., 'podomoro', 'todoList')
  title: string;
  position: Position;
  size: Size;
  minSize?: Size;
  isOpen: boolean; // To track if the window should be rendered (visible)
  isMinimized: boolean; // NEW: To track minimized state for the taskbar
  zIndex: number; // To manage stacking order
}

// Define the shape of the overall window management state
export type WindowRegistryState = {
  [id: string]: WindowState; // Store windows in an object for easier access by ID
};

// --- Helper Functions ---

// Function to get the next highest zIndex
const getNextZIndex = (registry: WindowRegistryState): number => {
  const zIndexes = Object.values(registry).map((win) => win.zIndex);
  return zIndexes.length > 0 ? Math.max(...zIndexes) + 1 : 1000; // Start z-index from 1000
};

// --- Atoms ---

const getDefaultWindowState = (): WindowRegistryState => ({});

// Create storage utility using createJSONStorage
const windowStorage = createJSONStorage<WindowRegistryState>(() => {
  // Return localStorage only if it's available (client-side)
  if (typeof window !== "undefined" && window.localStorage) {
    return localStorage;
  }
  // Return dummy storage for SSR
  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getItem: (_key) => null,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setItem: (_key, _value) => {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    removeItem: (_key) => {},
  };
});

// Use atomWithStorage with the simplified storage
export const windowRegistryAtom = atomWithStorage<WindowRegistryState>(
  FEATURE_KEY,
  getDefaultWindowState(), // Default state
  windowStorage,
);
windowRegistryAtom.debugLabel = "windowRegistryAtom (synced)";

// Atom to get an array of currently VISIBLE windows, sorted by zIndex
export const openWindowsAtom = atom(
  (get) =>
    Object.values(get(windowRegistryAtom))
      .filter((win) => win.isOpen && !win.isMinimized) // Only show open AND not minimized windows
      .sort((a, b) => a.zIndex - b.zIndex),
);

// NEW: Atom to get info for ALL registered windows (for taskbar)
// Includes minimized windows, excludes closed ones (removed from registry)
export const taskbarAppsAtom = atom((get) => {
  const registry = get(windowRegistryAtom);
  // Calculate highestZIndex only once
  const highestZIndex = Math.max(
    0,
    ...Object.values(registry).map((win) => win.zIndex),
  );

  return (
    Object.values(registry)
      // Filter for open or minimized windows
      .filter((win) => win.isOpen || win.isMinimized)
      // Map to include only necessary info + isActive flag
      .map((win) => ({
        ...win, // Spread the original WindowState
        // isActive is true only if the window is the top-most AND not minimized
        isActive: win.zIndex === highestZIndex && win.isOpen &&
          !win.isMinimized,
        // Remove iconSrc - Taskbar will get the icon component directly
        // iconSrc: appRegistry[win.appId]?.icon, // No longer using src or storing icon here
      }))
      // Optional: Sort if needed, e.g., by zIndex or initial open order
      .sort((a, b) => a.zIndex - b.zIndex)
  );
});

// --- Window Management Action Atoms (Write-only) ---

// Atom to open/create a new window or bring an existing one to front
export const openWindowAtom = atom(
  null,
  (
    get,
    set,
    windowConfig:
      & Omit<
        WindowState,
        "isOpen" | "zIndex" | "position" | "size" | "isMinimized"
      >
      & {
        initialPosition?: Position;
        initialSize: Size;
        children: React.ReactNode; // Add children property
      },
  ) => {
    const currentRegistry = get(windowRegistryAtom);
    // Find if any window with the same appId exists
    const existingWindow = Object.values(currentRegistry).find(
      (win) => win.appId === windowConfig.appId,
    );

    if (existingWindow) {
      // If window exists, bring it to front and ensure it's open and not minimized
      set(windowRegistryAtom, (prev) => ({
        ...prev,
        [existingWindow.id]: {
          ...existingWindow,
          isOpen: true,
          isMinimized: false, // Ensure not minimized when opened/focused
          zIndex: getNextZIndex(prev),
        },
      }));
    } else {
      // If window doesn't exist, create it
      const nextZIndex = getNextZIndex(currentRegistry);

      // --- Calculate centered position --- //
      const calculateCenteredPosition = (size: Size): Position => {
        if (typeof window === "undefined") {
          // Fallback for SSR or environments without window
          return { x: 100, y: 100 };
        }
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight; // Consider available height (e.g., excluding taskbar if fixed)
        // TODO: Adjust screenHeight if taskbar takes up fixed space at bottom
        // const taskbarHeight = 48; // Example taskbar height
        // const availableHeight = screenHeight - taskbarHeight;
        const availableHeight = screenHeight; // Use full height for now

        const x = Math.max(0, (screenWidth - size.width) / 2);
        const y = Math.max(0, (availableHeight - size.height) / 3); // Changed from / 2 to / 3
        return { x, y };
      };

      // Use provided initialPosition or calculate centered position
      const defaultPosition = windowConfig.initialPosition ??
        calculateCenteredPosition(windowConfig.initialSize);

      const newWindow: WindowState = {
        ...windowConfig,
        position: defaultPosition,
        size: windowConfig.initialSize,
        isOpen: true,
        isMinimized: false, // Ensure not minimized initially
        zIndex: nextZIndex,
      };
      set(windowRegistryAtom, (prev) => ({
        ...prev,
        [newWindow.id]: newWindow,
      }));
    }
  },
);

// Atom to close a window (removes it from state)
export const closeWindowAtom = atom(null, (get, set, windowId: string) => {
  const registry = get(windowRegistryAtom);
  const windowToClose = registry[windowId];

  // Check if the closing window is the Ambience Player
  if (windowToClose && windowToClose.appId === "ambiencePlayer") {
    // Set the Ambience Player's isPlaying state to false
    set(ambienceIsPlayingAtom, false);
    // Also directly queue a pause command for the global audio element
    try {
      safeAudioPause();
      console.log(
        "Ambience Player window closed, set atom and queued safeAudioPause.",
      );
    } catch (e) {
      console.error("Error calling safeAudioPause on close:", e);
    }
  }

  // Proceed with removing the window from the registry
  set(windowRegistryAtom, (prev) => {
    const newState = { ...prev };
    delete newState[windowId]; // Remove completely
    return newState;
  });
});

// Atom to bring a window to the front
export const focusWindowAtom = atom(null, (get, set, windowId: string) => {
  set(windowRegistryAtom, (prev) => {
    const windowToFocus = prev[windowId];
    if (!windowToFocus) return prev; // Window doesn't exist

    const maxZIndex = getNextZIndex(prev) - 1;

    // Bring to front and ensure it's visible and not minimized
    if (
      windowToFocus.zIndex < maxZIndex || !windowToFocus.isOpen ||
      windowToFocus.isMinimized
    ) {
      return {
        ...prev,
        [windowId]: {
          ...windowToFocus,
          isOpen: true, // Ensure open
          isMinimized: false, // Ensure not minimized
          zIndex: maxZIndex + 1, // Assign new highest zIndex
        },
      };
    }
    return prev; // No change needed if already top, open, and not minimized
  });
});

// NEW: Atom to minimize a window
export const minimizeWindowAtom = atom(null, (get, set, windowId: string) => {
  set(windowRegistryAtom, (prev) => {
    const windowToMinimize = prev[windowId];
    if (!windowToMinimize || windowToMinimize.isMinimized) return prev; // Already minimized or doesn't exist

    return {
      ...prev,
      [windowId]: {
        ...windowToMinimize,
        isMinimized: true,
        // Keep zIndex, position, size
      },
    };
  });
});

// NEW: Atom to handle taskbar icon clicks (toggle minimize/focus)
export const toggleTaskbarAtom = atom(null, (get, set, windowId: string) => {
  const registry = get(windowRegistryAtom);
  const windowState = registry[windowId];
  if (!windowState) return; // Should not happen

  const maxZIndex = getNextZIndex(registry) - 1;
  const isTopWindow = windowState.zIndex === maxZIndex && windowState.isOpen &&
    !windowState.isMinimized;

  if (isTopWindow) {
    // If it's the top, visible window -> minimize it
    set(minimizeWindowAtom, windowId);
  } else {
    // If it's minimized OR just not the top window -> focus it (which also unminimizes)
    set(focusWindowAtom, windowId);
  }
});

// Atom to update a window's position and size (e.g., after drag/resize)
export const updateWindowPositionSizeAtom = atom(
  null,
  (
    get,
    set,
    { id, position, size }: { id: string; position: Position; size: Size },
  ) => {
    set(windowRegistryAtom, (prev) => {
      const windowToUpdate = prev[id];
      if (!windowToUpdate) return prev;
      // Ensure it's not minimized when moved/resized?
      // No, let minimized windows keep their state.
      return {
        ...prev,
        [id]: { ...windowToUpdate, position, size },
      };
    });
  },
);
