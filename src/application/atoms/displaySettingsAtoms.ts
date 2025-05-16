import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

// Use v2 key again
const DISPLAY_SETTINGS_KEY = "displaySettings_v2";

// Define the levels and their corresponding pixel sizes
const SIZE_LEVELS: { [level: number]: number } = {
    1: 64, // Small
    2: 80,
    3: 96, // Medium (Default)
    4: 112,
    5: 128, // Large
};
const MIN_LEVEL = 1;
const MAX_LEVEL = 5;
const DEFAULT_LEVEL = 3;

// Update interface
export interface DisplaySettings {
    gridSizeLevel: number; // Abstract size level (e.g., 1-5)
    snapToGrid: boolean;
    showGridLines: boolean;
}

const storage = createJSONStorage<DisplaySettings>(() => localStorage);

// Update initial state
const initialDisplaySettings: DisplaySettings = {
    gridSizeLevel: DEFAULT_LEVEL, // Use default level
    snapToGrid: true,
    showGridLines: false,
};

// Main atom
export const displaySettingsAtom = atomWithStorage<DisplaySettings>(
    DISPLAY_SETTINGS_KEY,
    initialDisplaySettings,
    storage,
);

// Derived atom for the grid size LEVEL
export const gridSizeLevelAtom = atom(
    (get) => get(displaySettingsAtom).gridSizeLevel,
    (get, set, newLevel: number) => {
        const currentSettings = get(displaySettingsAtom);
        const validatedLevel = Math.max(
            MIN_LEVEL,
            Math.min(MAX_LEVEL, Math.round(newLevel)),
        );
        if (validatedLevel !== currentSettings.gridSizeLevel) {
            set(displaySettingsAtom, {
                ...currentSettings,
                gridSizeLevel: validatedLevel,
            });
        }
    },
);

// Read-only derived atom for the calculated PIXEL size based on level
export const currentGridCellPixelSizeAtom = atom<number>(
    (get) => {
        const level = get(gridSizeLevelAtom);
        return SIZE_LEVELS[level] || SIZE_LEVELS[DEFAULT_LEVEL];
    },
);

// Snap and GridLines atoms remain the same
export const snapToGridAtom = atom(
    (get) => get(displaySettingsAtom).snapToGrid,
    (get, set, newSnapValue: boolean) => {
        const currentSettings = get(displaySettingsAtom);
        set(displaySettingsAtom, {
            ...currentSettings,
            snapToGrid: newSnapValue,
        });
    },
);

export const showGridLinesAtom = atom(
    (get) => get(displaySettingsAtom).showGridLines,
    (get, set, newValue: boolean) => {
        const currentSettings = get(displaySettingsAtom);
        set(displaySettingsAtom, {
            ...currentSettings,
            showGridLines: newValue,
        });
    },
);

export const soundEffectsMutedAtom = atomWithStorage<boolean>(
    "soundEffectsMuted",
    false,
);
