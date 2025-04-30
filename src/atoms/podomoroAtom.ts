import { atom } from "jotai";
import { loadFeatureState, saveFeatureState } from "../utils/storage";

export type DurationSetting = "work25" | "short5" | "long15" | "custom";

export interface PodomoroState {
    mode: "work" | "shortBreak" | "longBreak";
    timeRemaining: number;
    isRunning: boolean;
    workSessionsCompleted: number;
    durationSetting: DurationSetting;
    customDurationMinutes: number;
}

const FEATURE_KEY = "podomoro";

const defaultDurations = {
    work25: 25 * 60,
    short5: 5 * 60,
    long15: 15 * 60,
    custom: 10 * 60,
};

const initialPodomoroState: PodomoroState = (() => {
    const saved = loadFeatureState<PodomoroState>(FEATURE_KEY);
    const defaults: PodomoroState = {
        mode: "work",
        timeRemaining: defaultDurations.work25,
        isRunning: false,
        workSessionsCompleted: 0,
        durationSetting: "work25",
        customDurationMinutes: 10,
    };
    return {
        ...defaults,
        ...saved,
        isRunning: false, // Always reset running state
    };
})();

const basePodomoroAtom = atom<PodomoroState>(initialPodomoroState);

export const podomoroAtom = atom(
    (get) => get(basePodomoroAtom),
    (
        get,
        set,
        newState: PodomoroState | ((prev: PodomoroState) => PodomoroState),
    ) => {
        const current = get(basePodomoroAtom);
        const updated = typeof newState === "function"
            ? newState(current)
            : newState;
        if (JSON.stringify(current) !== JSON.stringify(updated)) {
            set(basePodomoroAtom, updated);
            saveFeatureState(FEATURE_KEY, updated);
        }
    },
);

export const startPausePodomoroAtom = atom(
    null,
    (get, set) => {
        set(podomoroAtom, (prev) => ({
            ...prev,
            isRunning: !prev.isRunning,
        }));
    },
);

export const resetPodomoroAtom = atom(
    null,
    (get, set) => {
        set(podomoroAtom, (prev) => {
            let time = defaultDurations[prev.durationSetting];
            if (prev.durationSetting === "custom") {
                time = prev.customDurationMinutes * 60;
            }
            return {
                ...prev,
                isRunning: false,
                timeRemaining: time,
            };
        });
    },
);

export const setDurationSettingAtom = atom(
    null,
    (get, set, newSetting: DurationSetting) => {
        set(podomoroAtom, (prev) => {
            let time = defaultDurations[newSetting];
            if (newSetting === "custom") {
                time = prev.customDurationMinutes * 60;
            }
            return {
                ...prev,
                durationSetting: newSetting,
                timeRemaining: time,
            };
        });
    },
);

export const setCustomDurationAtom = atom(
    null,
    (get, set, newMinutes: number) => {
        set(podomoroAtom, (prev) => ({
            ...prev,
            customDurationMinutes: newMinutes,
            timeRemaining: newMinutes * 60,
        }));
    },
);

export const switchToModeAtom = atom(
    null,
    (get, set, mode: "work" | "shortBreak" | "longBreak") => {
        set(podomoroAtom, (prev) => {
            let time = defaultDurations[prev.durationSetting];
            if (prev.durationSetting === "custom") {
                time = prev.customDurationMinutes * 60;
            }
            return {
                ...prev,
                mode,
                timeRemaining: time,
                isRunning: false,
            };
        });
    },
);

export const decrementPodomoroTimeAtom = atom(
    null,
    (get, set) => {
        set(podomoroAtom, (prev) => {
            if (!prev.isRunning || prev.timeRemaining <= 0) return prev;
            return {
                ...prev,
                timeRemaining: prev.timeRemaining - 1,
            };
        });
    },
);

export const handlePodomoroTickCompletionAtom = atom(
    null,
    (get, set) => {
        set(podomoroAtom, (prev) => {
            if (prev.timeRemaining > 0) return prev;
            let nextMode = prev.mode;
            let workSessionsCompleted = prev.workSessionsCompleted;
            if (prev.mode === "work") {
                workSessionsCompleted++;
                nextMode = workSessionsCompleted % 4 === 0
                    ? "longBreak"
                    : "shortBreak";
            } else {
                nextMode = "work";
            }
            let time = defaultDurations[prev.durationSetting];
            if (prev.durationSetting === "custom") {
                time = prev.customDurationMinutes * 60;
            }
            return {
                ...prev,
                mode: nextMode,
                timeRemaining: time,
                isRunning: false,
                workSessionsCompleted,
            };
        });
    },
);
