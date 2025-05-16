"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import {
    decrementPodomoroTimeAtom,
    DurationSetting,
    handlePodomoroTickCompletionAtom,
    podomoroAtom,
    resetPodomoroAtom,
    setCustomDurationAtom,
    setDurationSettingAtom,
    startPausePodomoroAtom,
    switchToModeAtom,
} from "@/apps/clock/atoms/podomoroAtom";
import { playSound } from "@/infrastructure/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { formatInTimeZone } from "date-fns-tz";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { stopwatchStateAtom } from "@/apps/clock/atoms/stopwatchAtom";
import { useCurrentLocale, useI18n } from "@/locales/client";

// Global Timer Runner Component
export const GlobalPodomoroTimer = (): null => {
    const { isRunning, timeRemaining } = useAtomValue(podomoroAtom);
    const decrementTime = useAtom(decrementPodomoroTimeAtom)[1];
    const handleCompletion = useAtom(handlePodomoroTickCompletionAtom)[1];
    const completionHandledRef = useRef(false);
    useEffect(() => {
        if (!isRunning) return;
        const intervalId = setInterval(() => {
            decrementTime();
        }, 1000);
        return () => clearInterval(intervalId);
    }, [isRunning, decrementTime]);
    useEffect(() => {
        if (isRunning && timeRemaining <= 0) {
            if (!completionHandledRef.current) {
                completionHandledRef.current = true;
                playSound("/sounds/timeup.mp3");
                handleCompletion();
            }
        } else if (isRunning && timeRemaining > 0) {
            completionHandledRef.current = false;
        }
    }, [isRunning, timeRemaining, handleCompletion]);
    return null;
};

const commonTimezones = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Asia/Dubai",
    "Australia/Sydney",
];
const timezoneDisplayNames: Record<string, { en: string; "zh-TW": string }> = {
    "Asia/Taipei": { en: "Taipei Time", "zh-TW": "台北時間" },
    "America/Los_Angeles": { en: "Los Angeles", "zh-TW": "洛杉磯" },
    "America/New_York": { en: "New York", "zh-TW": "紐約" },
    "Europe/London": { en: "London", "zh-TW": "倫敦" },
    "Europe/Paris": { en: "Paris", "zh-TW": "巴黎" },
    "Europe/Berlin": { en: "Berlin", "zh-TW": "柏林" },
    "Asia/Shanghai": { en: "China Standard Time", "zh-TW": "中國標準時間" },
    "Asia/Tokyo": { en: "Tokyo", "zh-TW": "東京" },
    "Asia/Dubai": { en: "Dubai", "zh-TW": "杜拜" },
    "Australia/Sydney": { en: "Sydney", "zh-TW": "雪梨" },
    "America/Chicago": { en: "Chicago", "zh-TW": "芝加哥" },
    "America/Denver": { en: "Denver", "zh-TW": "丹佛" },
    "UTC": { en: "UTC", "zh-TW": "世界標準時間" },
};

const ClockApp: React.FC = () => {
    // Pomodoro State and Logic
    const [podomoroState] = useAtom(podomoroAtom);
    const {
        mode,
        timeRemaining,
        isRunning,
        workSessionsCompleted,
        durationSetting,
        customDurationMinutes,
    } = podomoroState;
    const startPause = useAtom(startPausePodomoroAtom)[1];
    const reset = useAtom(resetPodomoroAtom)[1];
    const setSetting = useAtom(setDurationSettingAtom)[1];
    const setCustomTime = useAtom(setCustomDurationAtom)[1];
    const switchMode = useAtom(switchToModeAtom)[1];
    const [localCustomMinutes, setLocalCustomMinutes] = useState<string>(
        customDurationMinutes.toString(),
    );
    const [customTitle, setCustomTitle] = useState<string>("Custom");
    useEffect(() => {
        setLocalCustomMinutes(customDurationMinutes.toString());
    }, [customDurationMinutes]);
    const handleStartPause = () => {
        playSound("/sounds/click.mp3");
        startPause();
    };
    const handleReset = () => {
        playSound("/sounds/click.mp3");
        reset();
    };
    const handleSettingChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const newSetting = event.target.value as DurationSetting;
        setSetting(newSetting);
        if (newSetting === "work25") switchMode("work");
        else if (newSetting === "short5") switchMode("shortBreak");
        else if (newSetting === "long15") switchMode("longBreak");
        playSound("/sounds/click.mp3");
    };
    const handleCustomTimeChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        setLocalCustomMinutes(event.target.value);
    };
    const handleCustomTitleChange = (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        setCustomTitle(event.target.value);
    };
    const updateGlobalCustomTime = () => {
        const newMinutes = parseInt(localCustomMinutes, 10);
        if (!isNaN(newMinutes) && newMinutes !== customDurationMinutes) {
            setCustomTime(newMinutes);
            playSound("/sounds/click.mp3");
        } else if (isNaN(newMinutes)) {
            setLocalCustomMinutes(customDurationMinutes.toString());
        }
    };
    const handleCustomTimeKeyDown = (
        event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
        if (event.key === "Enter") {
            updateGlobalCustomTime();
            (event.target as HTMLInputElement).blur();
        }
    };
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${
            secs.toString().padStart(2, "0")
        }`;
    };
    const getDisplayTitle = (): string => {
        if (durationSetting === "custom") return customTitle;
        switch (mode) {
            case "work":
                return t("timerWorkTitle", { count: 1 });
            case "shortBreak":
                return t("timerShortBreakTitle", { count: 1 });
            case "longBreak":
                return t("timerLongBreakTitle", { count: 1 });
            default:
                return t("timerTitle", { count: 1 });
        }
    };
    const t = useI18n();
    const currentLocale = useCurrentLocale();
    const durationOptions = [
        {
            value: "work25",
            label: t("timerWorkLabel", { count: 1 }),
            description: t("timerWorkDesc", { count: 1 }),
        },
        {
            value: "short5",
            label: t("timerShortBreakLabel", { count: 1 }),
            description: t("timerShortBreakDesc", { count: 1 }),
        },
        {
            value: "long15",
            label: t("timerLongBreakLabel", { count: 1 }),
            description: t("timerLongBreakDesc", { count: 1 }),
        },
        {
            value: "custom",
            label: t("timerCustomLabel", { count: 1 }),
            description: t("timerCustomDesc", { count: 1 }),
        },
    ];
    // Stopwatch State & Logic
    const [stopwatchState, setStopwatchState] = useAtom(stopwatchStateAtom);
    const { time: stopwatchTime, isRunning: stopwatchRunning, laps } =
        stopwatchState;
    const stopwatchIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastStopwatchTimeRef = useRef<number>(0);
    useEffect(() => {
        if (stopwatchRunning) {
            lastStopwatchTimeRef.current = Date.now() - stopwatchTime;
            stopwatchIntervalRef.current = setInterval(() => {
                setStopwatchState((prev) => ({
                    ...prev,
                    time: Date.now() - lastStopwatchTimeRef.current,
                }));
            }, 10);
        } else {
            if (stopwatchIntervalRef.current) {
                clearInterval(stopwatchIntervalRef.current);
            }
        }
        return () => {
            if (stopwatchIntervalRef.current) {
                clearInterval(stopwatchIntervalRef.current);
            }
        };
    }, [stopwatchRunning, setStopwatchState, stopwatchTime]);
    const handleStopwatchStartPause = () => {
        setStopwatchState((prev) => ({ ...prev, isRunning: !prev.isRunning }));
    };
    const handleStopwatchReset = () => {
        setStopwatchState({ time: 0, isRunning: false, laps: [] });
    };
    const handleStopwatchLap = () => {
        if (stopwatchRunning) {
            const lastLapTime = laps.length > 0
                ? laps.reduce((a, b) => a + b, 0)
                : 0;
            const currentLapTime = stopwatchTime - lastLapTime;
            if (currentLapTime > 0) {
                setStopwatchState((prev) => ({
                    ...prev,
                    laps: [currentLapTime, ...prev.laps],
                }));
            }
        }
    };
    const formatStopwatchTime = (timeMs: number): string => {
        const totalSeconds = Math.floor(timeMs / 1000);
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(
            2,
            "0",
        );
        const seconds = (totalSeconds % 60).toString().padStart(2, "0");
        const milliseconds = Math.floor((timeMs % 1000) / 10).toString()
            .padStart(2, "0");
        return `${minutes}:${seconds}.${milliseconds}`;
    };
    // Timer State & Logic
    const [timerDuration, setTimerDuration] = useState<number>(300);
    const [timerRemaining, setTimerRemaining] = useState<number>(timerDuration);
    const [timerRunning, setTimerRunning] = useState<boolean>(false);
    const [inputMinutes, setInputMinutes] = useState<string>("5");
    const [inputSeconds, setInputSeconds] = useState<string>("00");
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const timerAudioRef = useRef<HTMLAudioElement | null>(null);
    useEffect(() => {
        if (typeof Audio !== "undefined") {
            timerAudioRef.current = new Audio("/sounds/timeup.mp3");
        }
        return () => {
            timerAudioRef.current = null;
        };
    }, []);
    useEffect(() => {
        if (!timerRunning) setTimerRemaining(timerDuration);
    }, [timerDuration, timerRunning]);
    useEffect(() => {
        if (timerRunning && timerRemaining > 0) {
            timerIntervalRef.current = setInterval(() => {
                setTimerRemaining((prev) => {
                    const nextTime = prev - 1;
                    if (nextTime <= 0) {
                        clearInterval(timerIntervalRef.current!);
                        setTimerRunning(false);
                        timerAudioRef.current?.play().catch((e) =>
                            console.error("Error playing timer sound:", e)
                        );
                        return 0;
                    }
                    return nextTime;
                });
            }, 1000);
        } else if (!timerRunning && timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
        }
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [timerRunning, timerRemaining]);
    const handleTimerStartPause = () => {
        if (timerRemaining > 0) setTimerRunning(!timerRunning);
    };
    const handleTimerReset = () => {
        setTimerRunning(false);
        setTimerRemaining(timerDuration);
    };
    const handleDurationChange = () => {
        const minutes = parseInt(inputMinutes, 10) || 0;
        const seconds = parseInt(inputSeconds, 10) || 0;
        const newDuration = Math.max(0, minutes * 60 + seconds);
        setTimerDuration(newDuration);
        if (!timerRunning) setTimerRemaining(newDuration);
    };
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: React.Dispatch<React.SetStateAction<string>>,
        maxLength: number,
    ) => {
        const value = e.target.value.replace(/\D/g, "");
        if (value.length <= maxLength) setter(value);
    };
    const formatTimerTime = (timeSeconds: number): string => {
        const minutes = Math.floor(timeSeconds / 60).toString().padStart(
            2,
            "0",
        );
        const seconds = (timeSeconds % 60).toString().padStart(2, "0");
        return `${minutes}:${seconds}`;
    };
    // Clock State & Logic
    const [currentTimeDate, setCurrentTimeDate] = useState(new Date());
    const [selectedTimezone, setSelectedTimezone] = useState<string>(() =>
        typeof Intl !== "undefined"
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : "UTC"
    );
    const [localTimezone, setLocalTimezone] = useState<string>(() =>
        typeof Intl !== "undefined"
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : "UTC"
    );
    useEffect(() => {
        const currentLocal = typeof Intl !== "undefined"
            ? Intl.DateTimeFormat().resolvedOptions().timeZone
            : "UTC";
        setLocalTimezone(currentLocal);
    }, []);
    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentTimeDate(new Date());
        }, 1000);
        return () => clearInterval(intervalId);
    }, []);
    const formatClockTimeLocal = (date: Date): string => {
        return date.toLocaleTimeString(currentLocale, {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };
    const formatClockDateLocal = (date: Date): string => {
        return date.toLocaleDateString(currentLocale, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };
    const formatInSelectedTimezone = (
        date: Date,
        formatString: string,
    ): string => {
        try {
            return formatInTimeZone(date, selectedTimezone, formatString);
        } catch {
            return "Invalid Timezone";
        }
    };
    const formatDateInSelectedTimezone = (date: Date): string => {
        try {
            const iso = formatInTimeZone(
                date,
                selectedTimezone,
                "yyyy-MM-dd'T'HH:mm:ssXXX",
            );
            const d = new Date(iso);
            return d.toLocaleDateString(currentLocale, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch {
            return "Invalid Date";
        }
    };
    const getDisplayTimezone = (tz: string): string => {
        return timezoneDisplayNames[tz]?.[currentLocale] ||
            tz.replace(/_/g, " ");
    };
    return (
        <Tabs defaultValue="clock" className="w-full h-full flex flex-col p-1">
            <TabsList className="grid w-full grid-cols-4 mb-1">
                <TabsTrigger value="clock">{t("clockTab", { count: 1 })}</TabsTrigger>
                <TabsTrigger value="pomodoro">{t("pomodoroTab", { count: 1 })}</TabsTrigger>
                <TabsTrigger value="stopwatch">{t("stopwatchTab", { count: 1 })}</TabsTrigger>
                <TabsTrigger value="timer">{t("timerTab", { count: 1 })}</TabsTrigger>
            </TabsList>
            <TabsContent
                value="clock"
                className="flex-grow p-4 bg-muted/30 rounded flex flex-col items-center justify-start gap-6"
            >
                <div className="text-center mt-8">
                    <div className="text-7xl font-bold text-foreground tabular-nums mb-1">
                        {formatClockTimeLocal(currentTimeDate)}
                    </div>
                    <div className="text-lg text-muted-foreground">
                        {formatClockDateLocal(currentTimeDate)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        ({getDisplayTimezone(selectedTimezone)})
                    </div>
                </div>
                <div className="w-full max-w-xs">
                    <Select
                        value={selectedTimezone}
                        onValueChange={setSelectedTimezone}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue
                                placeholder={t("timerSelectTimezone", { count: 1 })}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>
                                    {t("timerCommonTimezones", { count: 1 })}
                                </SelectLabel>
                                {commonTimezones.map((tz) => (
                                    <SelectItem key={tz} value={tz}>
                                        {getDisplayTimezone(tz)}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                            {!commonTimezones.includes(localTimezone) && (
                                <SelectGroup>
                                    <SelectLabel>{t("timerLocal", { count: 1 })}</SelectLabel>
                                    <SelectItem value={localTimezone}>
                                        {getDisplayTimezone(localTimezone)}
                                    </SelectItem>
                                </SelectGroup>
                            )}
                        </SelectContent>
                    </Select>
                </div>
                {selectedTimezone !== localTimezone && (
                    <div className="text-center mt-4 p-4 border border-border rounded-lg bg-background/50 w-full max-w-xs">
                        <div className="text-3xl font-semibold text-foreground tabular-nums mb-1">
                            {formatInSelectedTimezone(currentTimeDate, "p")}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {formatDateInSelectedTimezone(currentTimeDate)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            ({getDisplayTimezone(selectedTimezone)})
                        </div>
                    </div>
                )}
            </TabsContent>
            <TabsContent value="pomodoro" className="flex-grow overflow-y-auto">
                <div className="flex flex-col items-center justify-between text-foreground h-full p-4">
                    <div className="flex flex-col items-center mb-6">
                        <h2 className="text-xl font-semibold mb-2 text-foreground">
                            {getDisplayTitle()}
                        </h2>
                        <div className="text-6xl font-mono mb-4 tabular-nums text-foreground">
                            {formatTime(timeRemaining)}
                        </div>
                        <div className="flex space-x-4">
                            <Button
                                onClick={handleStartPause}
                                className={`px-4 py-2 rounded transition w-20 ${
                                    isRunning
                                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                                }`}
                            >
                                {isRunning ? t("timerPause", { count: 1 }) : t("timerStart", { count: 1 })}
                            </Button>
                            <Button
                                onClick={handleReset}
                                className="px-4 py-2 bg-muted text-muted-foreground rounded hover:bg-muted/80 transition w-20"
                            >
                                {t("timerReset", { count: 1 })}
                            </Button>
                        </div>
                    </div>
                    <div className="w-full border-t border-border pt-4">
                        <h3 className="text-sm font-medium mb-2 text-center text-foreground">
                            {t("timerSettings", { count: 1 })}
                        </h3>
                        <div className="flex flex-col gap-2">
                            {durationOptions.map((option) => (
                                <label
                                    key={option.value}
                                    className="flex items-start p-2 cursor-pointer rounded hover:bg-muted/50"
                                >
                                    <input
                                        type="radio"
                                        name="durationSetting"
                                        value={option.value}
                                        checked={durationSetting ===
                                            option.value}
                                        onChange={handleSettingChange}
                                        className="mt-1 cursor-pointer accent-primary"
                                    />
                                    <div className="ml-2 w-full">
                                        <div className="font-medium text-sm text-foreground">
                                            {option.label}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {option.description}
                                        </div>
                                        {option.value === "custom" &&
                                            durationSetting === "custom" && (
                                            <div className="flex flex-col mt-2 space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <label
                                                        htmlFor="customTitle"
                                                        className="text-xs text-muted-foreground"
                                                    >
                                                        {t("timerCustomTitle", { count: 1 })}
                                                    </label>
                                                    <input
                                                        id="customTitle"
                                                        type="text"
                                                        value={customTitle}
                                                        onChange={handleCustomTitleChange}
                                                        className="flex-1 px-2 py-0.5 border border-border rounded text-foreground bg-input text-xs"
                                                        placeholder={t("timerCustomPlaceholder", { count: 1 })}
                                                    />
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <label
                                                        htmlFor="customTime"
                                                        className="text-xs text-muted-foreground"
                                                    >
                                                        {t("timerCustomMinutes", { count: 1 })}
                                                    </label>
                                                    <input
                                                        id="customTime"
                                                        type="number"
                                                        min="1"
                                                        value={localCustomMinutes}
                                                        onChange={handleCustomTimeChange}
                                                        onBlur={updateGlobalCustomTime}
                                                        onKeyDown={handleCustomTimeKeyDown}
                                                        className="w-16 px-1 py-0.5 border border-border rounded text-foreground bg-input text-center text-xs"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="w-full text-center mt-4 text-sm text-muted-foreground">
                        <div>
                            {t("pomodoroCompletedSessions", {
                                count: workSessionsCompleted,
                            })}
                        </div>
                        <div className="mt-3 text-xs text-muted-foreground border-t border-border pt-2">
                            <p className="font-medium mb-1">
                                {t("pomodoroMethod", { count: 1 })}
                            </p>
                            <p>{t("pomodoroDescription", { count: 1 })}</p>
                        </div>
                    </div>
                </div>
            </TabsContent>
            <TabsContent
                value="stopwatch"
                className="flex-grow p-4 bg-muted/30 rounded flex flex-col items-center justify-between"
            >
                <div className="text-6xl font-mono mb-6 text-center text-foreground tabular-nums">
                    {formatStopwatchTime(stopwatchTime)}
                </div>
                <div className="flex w-full justify-around mb-4">
                    <Button
                        variant="outline"
                        className="w-20 h-20 rounded-full text-lg"
                        onClick={stopwatchRunning
                            ? handleStopwatchLap
                            : handleStopwatchReset}
                        disabled={!stopwatchRunning && stopwatchTime === 0}
                    >
                        {stopwatchRunning ? t("timerLap", { count: 1 }) : t("timerReset", { count: 1 })}
                    </Button>
                    <Button
                        variant="outline"
                        className={`w-20 h-20 rounded-full text-lg ${
                            stopwatchRunning
                                ? "text-red-500 border-red-500 hover:bg-red-500/10"
                                : "text-green-500 border-green-500 hover:bg-green-500/10"
                        }`}
                        onClick={handleStopwatchStartPause}
                    >
                        {stopwatchRunning ? t("timerPause", { count: 1 }) : t("timerStart", { count: 1 })}
                    </Button>
                </div>
                <ScrollArea className="w-full h-32 border border-border rounded bg-background/50 p-2">
                    {laps.length === 0
                        ? (
                            <p className="text-sm text-muted-foreground text-center italic">
                                {t("timerNoLaps", { count: 1 })}
                            </p>
                        )
                        : (
                            <ul className="space-y-1 text-sm text-foreground">
                                {laps.map((lapTime, index) => (
                                    <li
                                        key={index}
                                        className="flex justify-between px-1 border-b border-border/50 py-0.5 tabular-nums"
                                    >
                                        <span>
                                            {t("timerLap", { count: 1 })}{" "}
                                            {laps.length - index}
                                        </span>
                                        <span>
                                            {formatStopwatchTime(lapTime)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                </ScrollArea>
            </TabsContent>
            <TabsContent
                value="timer"
                className="flex-grow p-4 bg-muted/30 rounded flex flex-col items-center justify-between"
            >
                <div className="text-6xl font-mono mb-6 text-center text-foreground tabular-nums">
                    {formatTimerTime(timerRemaining)}
                </div>
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Input
                        type="text"
                        value={inputMinutes}
                        onChange={(e) =>
                            handleInputChange(e, setInputMinutes, 2)}
                        onBlur={handleDurationChange}
                        onKeyDown={(e) =>
                            e.key === "Enter" && handleDurationChange()}
                        className="w-16 h-10 text-center text-lg bg-input border-border"
                        maxLength={2}
                        placeholder={t("timerCustomMinutes", { count: 1 })}
                    />
                    <span className="text-xl font-semibold text-muted-foreground">
                        :
                    </span>
                    <Input
                        type="text"
                        value={inputSeconds}
                        onChange={(e) =>
                            handleInputChange(e, setInputSeconds, 2)}
                        onBlur={handleDurationChange}
                        onKeyDown={(e) =>
                            e.key === "Enter" && handleDurationChange()}
                        className="w-16 h-10 text-center text-lg bg-input border-border"
                        maxLength={2}
                        placeholder={t("timerCustomSeconds", { count: 1 })}
                    />
                </div>
                <div className="flex w-full justify-around mb-4">
                    <Button
                        variant="outline"
                        className="w-20 h-20 rounded-full text-lg"
                        onClick={handleTimerReset}
                        disabled={timerRunning &&
                            timerRemaining === timerDuration}
                    >
                        {t("timerReset", { count: 1 })}
                    </Button>
                    <Button
                        variant="outline"
                        className={`w-20 h-20 rounded-full text-lg ${
                            timerRunning
                                ? "text-red-500 border-red-500 hover:bg-red-500/10"
                                : "text-green-500 border-green-500 hover:bg-green-500/10"
                        }`}
                        onClick={handleTimerStartPause}
                        disabled={timerRemaining === 0}
                    >
                        {timerRunning ? t("timerPause", { count: 1 }) : t("timerStart", { count: 1 })}
                    </Button>
                </div>
                <div className="h-10"></div>
            </TabsContent>
        </Tabs>
    );
};

export default ClockApp;
