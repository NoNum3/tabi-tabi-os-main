import { atom } from "jotai";

// Atom to hold the state (true = open, false = closed)
export const sidebarOpenAtom = atom<boolean>(false); // Default to closed

// Optional: Write-only atom for toggling the state
export const toggleSidebarAtom = atom(
    null, // Read function is null for write-only
    (get, set) => {
        set(sidebarOpenAtom, !get(sidebarOpenAtom));
    },
);

// Optional: Write-only atom to explicitly close the sidebar
export const closeSidebarAtom = atom(
    null, // Read function is null for write-only
    (get, set) => {
        set(sidebarOpenAtom, false);
    },
);
