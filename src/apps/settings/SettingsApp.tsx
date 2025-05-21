"use client";

import React, { useState, useEffect } from "react";
import { WallpaperSettings } from "./WallpaperSettings";
import { SettingsList } from "./SettingsList";
import { Check } from "lucide-react";
import { saveFeatureState, loadFeatureState } from "@/utils/storage";
import { useI18n } from '@/locales/client';

interface SettingsAppProps {
    windowId?: string;
}

// Define the possible views within the Settings app
type SettingsView = string;

const ACCENT_DEFAULT = "#6366f1";
const ACCENT_COLORS = [
    { color: "#6366f1", name: "Indigo" },
    { color: "#10b981", name: "Emerald" },
    { color: "#f59e42", name: "Orange" },
    { color: "#ef4444", name: "Red" },
    { color: "#f472b6", name: "Pink" },
    { color: "#0ea5e9", name: "Sky" },
];

const TASKBAR_BG_COLORS: { color: string; name: string }[] = [
    { color: "rgba(0,0,0,0.4)", name: "Default" },
    { color: "#222", name: "Dark" },
    { color: "#fff", name: "Light" },
    { color: "#6366f1", name: "Indigo" },
    { color: "#10b981", name: "Emerald" },
    { color: "#f59e42", name: "Orange" },
    { color: "#ef4444", name: "Red" },
    { color: "#f472b6", name: "Pink" },
    { color: "#0ea5e9", name: "Sky" },
];

// Define the shape of all user settings
const DEFAULT_SETTINGS = {
    accentColor: "#6366f1",
    accentIntensity: 100,
    taskbarColor: "rgba(0,0,0,0.4)",
    taskbarPosition: "bottom",
    taskbarIconSize: 24,
    taskbarTransparency: 80,
    taskbarShowLabels: true,
    taskbarCornerStyle: "rounded",
    taskbarAutoHide: false,
    taskbarShadow: true,
    taskbarNotificationBadges: true,
    taskbarAnimation: true,
    taskbarFontSize: 14,
    darkMode: false,
};

const SETTINGS_KEY = "userSettings";

// Utility to apply userSettings to DOM (CSS variables and attributes)
function applyUserSettingsToDOM(settings: typeof DEFAULT_SETTINGS) {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    // Accent
    root.style.setProperty('--accent', settings.accentColor);
    root.style.setProperty('--accent-intensity', `${settings.accentIntensity}%`);
    // Taskbar
    root.style.setProperty('--taskbar-bg', settings.taskbarColor);
    root.style.setProperty('--taskbar-icon-size', `${settings.taskbarIconSize}px`);
    root.style.setProperty('--taskbar-transparency', `${settings.taskbarTransparency}%`);
    root.style.setProperty('--taskbar-font-size', `${settings.taskbarFontSize}px`);
    root.setAttribute('data-taskbar-pos', settings.taskbarPosition);
    // Add more as needed (e.g., showLabels, cornerStyle, etc.)
    // For boolean settings, you may want to add/remove classes or data-attributes if needed
}

// Accent Color Settings
const AccentColorSettings: React.FC<{ navigateBack: () => void, setUserSettings: React.Dispatch<React.SetStateAction<typeof DEFAULT_SETTINGS>> }> = ({ navigateBack, setUserSettings }) => {
    const t = useI18n();
    const getCurrentAccent = () => typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--accent')?.trim() || ACCENT_DEFAULT : ACCENT_DEFAULT;
    const getCurrentIntensity = () => {
        if (typeof window !== 'undefined') {
            const cssIntensity = getComputedStyle(document.documentElement).getPropertyValue('--accent-intensity');
            return cssIntensity ? Number(cssIntensity.replace('%', '')) || 100 : 100;
        }
        return 100;
    };
    const [selected, setSelected] = useState<string>(getCurrentAccent());
    const [intensity, setIntensity] = useState<number>(getCurrentIntensity());
    const [initial, setInitial] = useState<{ color: string; intensity: number }>({ color: getCurrentAccent(), intensity: getCurrentIntensity() });

    useEffect(() => {
        setSelected(getCurrentAccent());
        setIntensity(getCurrentIntensity());
        setInitial({ color: getCurrentAccent(), intensity: getCurrentIntensity() });
    }, []);

    const handleSelect = (color: string) => {
        setSelected(color);
        document.documentElement.style.setProperty('--accent', color);
        document.documentElement.style.setProperty('--accent-intensity', `${intensity}%`);
    };
    const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIntensity(Number(e.target.value));
        document.documentElement.style.setProperty('--accent', selected);
        document.documentElement.style.setProperty('--accent-intensity', `${Number(e.target.value)}%`);
    };
    const handleReset = () => {
        setSelected(ACCENT_DEFAULT);
        setIntensity(100);
        document.documentElement.style.setProperty('--accent', ACCENT_DEFAULT);
        document.documentElement.style.setProperty('--accent-intensity', `100%`);
    };
    const handleApply = () => {
        setUserSettings(prev => ({ ...prev, accentColor: selected, accentIntensity: intensity }));
        setInitial({ color: selected, intensity });
    };
    const handleCancel = () => {
        setSelected(initial.color);
        setIntensity(initial.intensity);
        document.documentElement.style.setProperty('--accent', initial.color);
        document.documentElement.style.setProperty('--accent-intensity', `${initial.intensity}%`);
    };
    const previewStyle = {
        backgroundColor: `color-mix(in srgb, ${selected} ${intensity}%, white)`
    };
    const isChanged = selected !== initial.color || intensity !== initial.intensity;
    return (
        <section className="flex flex-col h-full p-4" aria-labelledby="accent-color-heading">
            <button onClick={navigateBack} className="mb-4 text-sm text-muted-foreground" aria-label={t('back', { count: 1 })}>← {t('back', { count: 1 })}</button>
            <h2 id="accent-color-heading" className="text-lg font-semibold mb-2">{t('accentColorSettingsTitle', { count: 1 })}</h2>
            <div className="mb-4">
                <div className="h-3 w-full rounded transition-colors" style={previewStyle} aria-label={t('accentColorSettingsTitle', { count: 1 })} />
            </div>
            <div className="flex gap-6 flex-wrap mb-6" role="radiogroup" aria-label={t('accentColorSettingsTitle', { count: 1 })}>
                {ACCENT_COLORS.map(({ color, name }) => (
                    <button
                        key={color}
                        role="radio"
                        aria-checked={selected === color}
                        tabIndex={0}
                        className={`relative flex flex-col items-center w-16 focus:outline-none group`}
                        onClick={() => handleSelect(color)}
                        style={{ outline: selected === color ? `2px solid ${color}` : undefined }}
                        aria-label={t('accentColorSettingsTitle', { count: 1 }) + ' ' + name}
                    >
                        <span
                            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${selected === color ? 'border-accent ring-2 ring-accent' : 'border-muted'} group-focus-visible:ring-4 group-focus-visible:ring-accent/40`}
                            style={{ backgroundColor: color }}
                        >
                            {selected === color && <Check className="w-5 h-5 text-white drop-shadow" aria-label={t('selected', { count: 1 })} />}
                        </span>
                        <span className="mt-2 text-xs text-center text-muted-foreground select-none">{name}</span>
                    </button>
                ))}
            </div>
            <label htmlFor="accent-intensity-slider" className="text-xs font-medium mb-1 text-muted-foreground">{t('accentIntensitySettingsTitle', { count: 1 })}</label>
            <input
                id="accent-intensity-slider"
                type="range"
                min={70}
                max={130}
                step={1}
                value={intensity}
                onChange={handleSlider}
                className="w-full mb-4 accent-[var(--accent)]"
                aria-valuenow={intensity}
                aria-valuemin={70}
                aria-valuemax={130}
                aria-label={t('accentIntensitySettingsTitle', { count: 1 })}
            />
            <div className="flex justify-between text-xs text-muted-foreground mb-6">
                <span>{t('accentIntensityLighter', { count: 1 })}</span>
                <span>{t('accentIntensityNormal', { count: 1 })}</span>
                <span>{t('accentIntensityDarker', { count: 1 })}</span>
            </div>
            <div className="flex gap-2 mt-auto">
                <button
                    type="button"
                    onClick={handleApply}
                    className="px-4 py-1.5 rounded bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/80 transition-colors border border-border disabled:opacity-60"
                    aria-label={t('apply', { count: 1 })}
                    disabled={!isChanged}
                >
                    {t('apply', { count: 1 })}
                </button>
                <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-1.5 rounded bg-muted text-xs font-medium hover:bg-accent/20 transition-colors border border-border"
                    aria-label={t('cancel', { count: 1 })}
                >
                    {t('cancel', { count: 1 })}
                </button>
                <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 rounded bg-muted text-xs font-medium hover:bg-accent/20 transition-colors border border-border"
                    aria-label={t('reset', { count: 1 })}
                    disabled={selected === ACCENT_DEFAULT && intensity === 100}
                >
                    {t('reset', { count: 1 })}
                </button>
            </div>
        </section>
    );
};

// Taskbar Icon Size
const ICON_SIZE_MIN = 16, ICON_SIZE_MAX = 48;
const TaskbarIconSizeSettings: React.FC<{ navigateBack: () => void, userSettings: typeof DEFAULT_SETTINGS, setUserSettings: React.Dispatch<React.SetStateAction<typeof DEFAULT_SETTINGS>> }> = ({ navigateBack, userSettings, setUserSettings }) => {
    const t = useI18n();
    const [size, setSize] = useState(userSettings.taskbarIconSize);
    const [initial, setInitial] = useState(userSettings.taskbarIconSize);
    useEffect(() => {
        setSize(userSettings.taskbarIconSize);
        setInitial(userSettings.taskbarIconSize);
    }, [userSettings.taskbarIconSize]);
    const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        setSize(val);
        document.documentElement.style.setProperty('--taskbar-icon-size', `${val}px`);
    };
    const handleApply = () => {
        setUserSettings(prev => ({ ...prev, taskbarIconSize: size }));
        setInitial(size);
    };
    const handleCancel = () => {
        setSize(initial);
        document.documentElement.style.setProperty('--taskbar-icon-size', `${initial}px`);
    };
    const handleReset = () => {
        setSize(24);
        document.documentElement.style.setProperty('--taskbar-icon-size', `24px`);
    };
    const isChanged = size !== initial;
    return (
        <section className="flex flex-col h-full p-4" aria-labelledby="taskbar-icon-size-heading">
            <button onClick={navigateBack} className="mb-4 text-sm text-muted-foreground" aria-label={t('back', { count: 1 })}>{`← ${t('back', { count: 1 })}`}</button>
            <h2 id="taskbar-icon-size-heading" className="text-lg font-semibold mb-2">{t('taskbarIconSizeTitle', { count: 1 })}</h2>
            <input type="range" min={ICON_SIZE_MIN} max={ICON_SIZE_MAX} value={size} onChange={handleSlider} className="w-full mb-4" aria-label={t('taskbarIconSizeTitle', { count: 1 })} />
            <div className="text-xs text-muted-foreground mb-6">{t('taskbarIconSizeValue', { size, count: 1 })}</div>
            <div className="flex gap-2 mt-auto">
                <button type="button" onClick={handleApply} className="px-4 py-1.5 rounded bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/80 transition-colors border border-border disabled:opacity-60" aria-label={t('apply', { count: 1 })} disabled={!isChanged}>{t('apply', { count: 1 })}</button>
                <button type="button" onClick={handleCancel} className="px-4 py-1.5 rounded bg-muted text-xs font-medium hover:bg-accent/20 transition-colors border border-border" aria-label={t('cancel', { count: 1 })}>{t('cancel', { count: 1 })}</button>
                <button type="button" onClick={handleReset} className="px-3 py-1.5 rounded bg-muted text-xs font-medium hover:bg-accent/20 transition-colors border border-border" aria-label={t('resetToDefault', { count: 1 })} disabled={size === 24}>{t('resetToDefault', { count: 1 })}</button>
            </div>
        </section>
    );
};

// Add TaskbarColorSettings definition (reuse pattern from other settings)
const TaskbarColorSettings: React.FC<{ navigateBack: () => void, setUserSettings: React.Dispatch<React.SetStateAction<typeof DEFAULT_SETTINGS>> }> = ({ navigateBack, setUserSettings }) => {
    const t = useI18n();
    const [selected, setSelected] = useState(DEFAULT_SETTINGS.taskbarColor);
    const [custom, setCustom] = useState("");
    const [initial, setInitial] = useState(DEFAULT_SETTINGS.taskbarColor);
    useEffect(() => {
        setSelected(DEFAULT_SETTINGS.taskbarColor);
        setInitial(DEFAULT_SETTINGS.taskbarColor);
    }, []);
    const handleSelect = (color: string) => {
        setSelected(color);
        document.documentElement.style.setProperty('--taskbar-bg', color);
    };
    const handleCustom = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustom(e.target.value);
        setSelected(e.target.value);
        document.documentElement.style.setProperty('--taskbar-bg', e.target.value);
    };
    const handleApply = () => {
        setUserSettings(prev => ({ ...prev, taskbarColor: selected }));
        setInitial(selected);
    };
    const handleCancel = () => {
        setSelected(initial);
        setCustom("");
        document.documentElement.style.setProperty('--taskbar-bg', initial);
    };
    const handleReset = () => {
        setSelected("rgba(0,0,0,0.4)");
        setCustom("");
        document.documentElement.style.setProperty('--taskbar-bg', "rgba(0,0,0,0.4)");
    };
    const isChanged = selected !== initial;
    return (
        <section className="flex flex-col h-full p-4" aria-labelledby="taskbar-color-heading">
            <button onClick={navigateBack} className="mb-4 text-sm text-muted-foreground" aria-label={t('back', { count: 1 })}>{`← ${t('back', { count: 1 })}`}</button>
            <h2 id="taskbar-color-heading" className="text-lg font-semibold mb-2">{t('taskbarColorSettingsTitle', { count: 1 })}</h2>
            <div className="flex gap-6 flex-wrap mb-6" role="radiogroup" aria-label={t('taskbarColorSettingsTitle', { count: 1 }) + ' choices'}>
                {TASKBAR_BG_COLORS.map(({ color, name }) => (
                    <button
                        key={color}
                        role="radio"
                        aria-checked={selected === color}
                        tabIndex={0}
                        className={`relative flex flex-col items-center w-16 focus:outline-none group`}
                        onClick={() => handleSelect(color)}
                        style={{ outline: selected === color ? `2px solid ${color}` : undefined }}
                        aria-label={t('taskbarColorSettingsTitle', { count: 1 }) + ': ' + name}
                    >
                        <span
                            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${selected === color ? 'border-accent ring-2 ring-accent' : 'border-muted'} group-focus-visible:ring-4 group-focus-visible:ring-accent/40`}
                            style={{ backgroundColor: color }}
                        />
                        <span className="mt-2 text-xs text-center text-muted-foreground select-none">{name}</span>
                    </button>
                ))}
            </div>
            <label htmlFor="taskbar-custom-color" className="text-xs font-medium mb-1 text-muted-foreground">{t('customColor', { count: 1 })}</label>
            <input
                id="taskbar-custom-color"
                type="text"
                placeholder={t('colorInputPlaceholder', { count: 1 })}
                value={custom}
                onChange={handleCustom}
                className="w-full mb-4 px-2 py-1 border rounded text-sm"
                aria-label={t('customColor', { count: 1 })}
            />
            <div className="flex gap-2 mt-auto">
                <button
                    type="button"
                    onClick={handleApply}
                    className="px-4 py-1.5 rounded bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/80 transition-colors border border-border disabled:opacity-60"
                    aria-label={t('apply', { count: 1 }) + ' ' + t('taskbarColorSettingsTitle', { count: 1 })}
                    disabled={!isChanged}
                >
                    {t('apply', { count: 1 })}
                </button>
                <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-1.5 rounded bg-muted text-xs font-medium hover:bg-accent/20 transition-colors border border-border"
                    aria-label={t('cancel', { count: 1 }) + ' ' + t('taskbarColorSettingsTitle', { count: 1 }) + ' changes'}
                >
                    {t('cancel', { count: 1 })}
                </button>
                <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 rounded bg-muted text-xs font-medium hover:bg-accent/20 transition-colors border border-border"
                    aria-label={t('resetToDefault', { count: 1 }) + ' ' + t('taskbarColorSettingsTitle', { count: 1 })}
                    disabled={selected === "rgba(0,0,0,0.4)"}
                >
                    {t('resetToDefault', { count: 1 })}
                </button>
            </div>
        </section>
    );
};

export const SettingsApp: React.FC<SettingsAppProps> = () => {
    // Load settings from localStorage or use default
    const [userSettings, setUserSettings] = useState(() => {
        return loadFeatureState<typeof DEFAULT_SETTINGS>(SETTINGS_KEY) || DEFAULT_SETTINGS;
    });
    // Save to localStorage whenever userSettings changes
    useEffect(() => {
        saveFeatureState(SETTINGS_KEY, userSettings);
        applyUserSettingsToDOM(userSettings); // <-- Apply to DOM on every change
    }, [userSettings]);
    // const t = useI18n(); // Removed unused variable
    // --- Add Navigation State --- //
    const [currentView, setCurrentView] = useState<SettingsView>("main");

    // --- Navigation Handlers --- //
    const navigateTo = (section: string) => {
        setCurrentView(section);
    };

    const navigateBack = () => {
        setCurrentView("main");
    };

    // --- Render based on currentView --- //
    const renderContent = () => {
        switch (currentView) {
            case "wallpaper":
                return (
                    <WallpaperSettings
                        navigateBack={navigateBack}
                    />
                );
            case "accentColor":
                return <AccentColorSettings navigateBack={navigateBack} setUserSettings={setUserSettings} />;
            case "taskbarColor":
                return <TaskbarColorSettings navigateBack={navigateBack} setUserSettings={setUserSettings} />;
            case "taskbarIconSize":
                return <TaskbarIconSizeSettings navigateBack={navigateBack} userSettings={userSettings} setUserSettings={setUserSettings} />;
            case "main":
            default:
                return <SettingsList navigateTo={navigateTo} />;
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-background text-foreground">
            {/* Remove Tabs structure, render content directly */}
            {renderContent()}
        </div>
    );
};

export default SettingsApp;
