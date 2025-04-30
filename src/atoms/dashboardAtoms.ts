import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { appRegistry } from "@/config/appRegistry"; // Used for validation in actions

const DASHBOARD_STORAGE_KEY = "userDashboardPreferences_v1";

// --- Define Position type --- //
interface GridPosition {
    row: number;
    col: number;
}

// --- Update DashboardState --- //
interface DashboardState {
    addedAppIds: string[];
    iconPositions: { [appId: string]: GridPosition }; // Store row/col for each appId
}

// Use JSON storage with localStorage
const storage = createJSONStorage<DashboardState>(() => localStorage);

// --- Define initial state with empty positions --- //
const initialDashboardState: DashboardState = {
    addedAppIds: ["settings", "appStore", "calculator", "clock"],
    iconPositions: {}, // Initialize empty, will be populated on first load or add
};

// --- Helper to find the next available grid slot --- //
// Note: This needs maxCols/maxRows from the UI, which isn't ideal here.
// Simpler approach for now: Find next slot based purely on existing positions.
const findNextAvailableSlot = (
    positions: { [appId: string]: GridPosition },
): GridPosition => {
    const occupied = new Set<string>();
    Object.values(positions).forEach((pos) =>
        occupied.add(`${pos.row}-${pos.col}`)
    );

    let row = 0;
    let col = 0;
    // Keep searching row by row, then column by column
    // This is a basic implementation and doesn't account for screen size limits here.
    // A more robust version might need screen dimensions.
    while (occupied.has(`${row}-${col}`)) {
        col++;
        // Arbitrary wrap after a certain number of columns if needed, e.g., 10
        if (col >= 10) {
            col = 0;
            row++;
        }
    }
    return { row, col };
};

// --- Helper to assign initial positions if needed --- //
// Run this once when the atom is first loaded or reset
const assignInitialPositions = (
    currentState: DashboardState,
): DashboardState => {
    const newState = {
        ...currentState,
        iconPositions: { ...currentState.iconPositions },
    };
    let needsUpdate = false;
    const currentPositions = newState.iconPositions;

    newState.addedAppIds.forEach((appId) => {
        if (!currentPositions[appId]) { // Assign position only if missing
            currentPositions[appId] = findNextAvailableSlot(currentPositions);
            needsUpdate = true;
        }
    });

    // Clean up positions for apps no longer added
    Object.keys(currentPositions).forEach((appId) => {
        if (!newState.addedAppIds.includes(appId)) {
            delete currentPositions[appId];
            needsUpdate = true;
        }
    });

    return needsUpdate ? newState : currentState;
};

// Create the main atom with local storage persistence
const baseDashboardStateAtom = atomWithStorage<DashboardState>(
    DASHBOARD_STORAGE_KEY,
    initialDashboardState, // Start with potentially empty positions
    storage,
);

// Atom that ensures initial positions are assigned on first read
export const dashboardStateAtom = atom(
    (get) => {
        const state = get(baseDashboardStateAtom);
        // Check and assign initial positions *on read* if necessary
        // This is a bit of a workaround because atomWithStorage loads async
        // A cleaner approach might involve initializing in a Provider/useEffect
        // But this works for now.
        // This check runs every time, but assignInitialPositions avoids work if not needed.
        return assignInitialPositions(state);
    },
    (
        get,
        set,
        update: DashboardState | ((prev: DashboardState) => DashboardState),
    ) => {
        // When writing, ensure we write to the base atom
        set(baseDashboardStateAtom, update);
    },
);

// Atom to get just the list of added app IDs (reads from the derived atom)
export const addedAppIdsAtom = atom(
    (get) => get(dashboardStateAtom).addedAppIds,
);

// --- Atom to get icon positions --- //
export const iconPositionsAtom = atom(
    (get) => get(dashboardStateAtom).iconPositions,
);

// --- Update Action Atoms --- //

// Atom to add an app to the dashboard
export const addAppToDashboardAtom = atom(
    null,
    (get, set, appIdToAdd: string) => {
        if (!(appIdToAdd in appRegistry)) {
            console.warn(`Attempted to add non-existent app: ${appIdToAdd}`);
            return;
        }
        const currentState = get(dashboardStateAtom);
        if (!currentState.addedAppIds.includes(appIdToAdd)) {
            const nextSlot = findNextAvailableSlot(currentState.iconPositions);
            const newState: DashboardState = {
                ...currentState,
                addedAppIds: [...currentState.addedAppIds, appIdToAdd],
                iconPositions: {
                    ...currentState.iconPositions,
                    [appIdToAdd]: nextSlot, // Assign position
                },
            };
            set(dashboardStateAtom, newState);
        }
    },
);

// Atom to remove an app from the dashboard
export const removeAppFromDashboardAtom = atom(
    null,
    (get, set, appIdToRemove: string) => {
        const currentState = get(dashboardStateAtom);
        if (currentState.addedAppIds.includes(appIdToRemove)) {
            const newPositions = { ...currentState.iconPositions };
            delete newPositions[appIdToRemove]; // Remove position

            const newState: DashboardState = {
                ...currentState,
                addedAppIds: currentState.addedAppIds.filter((id) =>
                    id !== appIdToRemove
                ),
                iconPositions: newPositions,
            };
            set(dashboardStateAtom, newState);
        }
    },
);

// --- Atom to update a single icon's position --- //
export const updateIconPositionAtom = atom(
    null,
    (
        get,
        set,
        { appId, position }: { appId: string; position: GridPosition },
    ) => {
        const currentState = get(dashboardStateAtom);
        if (currentState.iconPositions[appId]) { // Only update if app exists
            set(dashboardStateAtom, {
                ...currentState,
                iconPositions: {
                    ...currentState.iconPositions,
                    [appId]: position,
                },
            });
        }
    },
);

// --- Atom to Reset Icon Positions --- //
export const resetIconPositionsAtom = atom(
    null,
    (get, set) => {
        const currentState = get(dashboardStateAtom);
        const currentPositions: { [appId: string]: GridPosition } = {};
        // Re-calculate positions for all added apps from scratch
        currentState.addedAppIds.forEach((appId) => {
            currentPositions[appId] = findNextAvailableSlot(currentPositions);
        });

        set(dashboardStateAtom, {
            ...currentState,
            iconPositions: currentPositions,
        });
    },
);

// Example: Atom to check if a specific app is added (remains the same)
export const isAppAddedAtom = (appId: string) =>
    atom(
        (get) => get(addedAppIdsAtom).includes(appId),
    );

// Atom to reset dashboard to defaults (now also resets positions)
export const resetDashboardAtom = atom(
    null,
    (get, set) => {
        // Create the default state object
        let defaultState: DashboardState = {
            addedAppIds: ["settings", "appStore", "calculator", "clock"],
            iconPositions: {},
        };
        // Assign initial positions to the default apps
        defaultState = assignInitialPositions(defaultState);
        set(dashboardStateAtom, defaultState);
    },
);
