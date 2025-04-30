import { atom } from "jotai";

export interface StopwatchState {
    time: number;
    isRunning: boolean;
    laps: number[];
}

const initialStopwatchState: StopwatchState = {
    time: 0,
    isRunning: false,
    laps: [],
};

export const stopwatchStateAtom = atom<StopwatchState>(initialStopwatchState);
