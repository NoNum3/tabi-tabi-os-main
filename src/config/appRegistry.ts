import { Size } from "../types";
import React from "react";
import MusicPlayer from "@/apps/music/MusicPlayer";
import AmbiencePlayer from "@/apps/ambiencePlayer/ambiencePlayer";
import Calculator from "@/apps/calculator/Calculator";
import ClockApp from "@/apps/clock/ClockApp";
import MiniGames from "@/apps/miniGames/MiniGames"; // Import the new component
import ConverterApp from "@/apps/converter/ConverterApp";
import QRCodeReader from "@/apps/qrCodeReader/QRCodeReader";
import DrawingPadApp from "@/apps/drawingPad/DrawingPadApp";
// Import new apps
import PasswordGeneratorApp from "@/apps/passwordGenerator/PasswordGeneratorApp";
import HashGeneratorApp from "@/apps/hashGenerator/HashGeneratorApp";
import CheckersApp from "@/apps/checkers/CheckersApp";
import SettingsApp from "@/apps/settings/SettingsApp";
import Notepad from "@/apps/notepad/Notepad"; 
import WeatherWidget from "@/apps/weather/WeatherWidget";
import SimpleCalendar from "@/apps/calendar/SimpleCalendar";
import QuotesWidget from "@/apps/quotes/QuotesWidget";
import { BookmarksApp } from "@/apps/bookmarks/BookmarksApp";

// Define categories
export type AppCategory =
  | "Utilities"
  | "Productivity"
  | "Entertainment"
  | "Games"
  | "System";

// Updated interface to include category
export interface AppRegistryEntry {
  // name: string; // Removed - use locale key instead
  src: string;
  defaultSize: Size;
  minSize?: Size;
  category: AppCategory; // Added category field
  requiresAuth?: boolean; // Added for authentication requirement
  nameKey?: string; // Added for translation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
}

// App names are now defined in locale files (e.g., locales/en.ts)
// The keys here MUST match the keys in the locale files.

// Helper to get responsive size (clamped to min/max)
function getResponsiveSize(widthRatio: number, heightRatio: number, min: Size, max: Size): Size {
  if (typeof window !== "undefined") {
    const w = Math.round(window.innerWidth * widthRatio);
    const h = Math.round(window.innerHeight * heightRatio);
    return {
      width: Math.max(min.width, Math.min(w, max.width)),
      height: Math.max(min.height, Math.min(h, max.height)),
    };
  }
  // Fallback for SSR
  return {
    width: Math.max(min.width, Math.min(900 * widthRatio, max.width)),
    height: Math.max(min.height, Math.min(700 * heightRatio, max.height)),
  };
}

export const appRegistry: Record<string, AppRegistryEntry> = {
  // --- Add Settings entry --- //
  settings: {
    src: "/icons/settings.png",
    defaultSize: getResponsiveSize(0.5, 0.6, { width: 350, height: 350 }, { width: 900, height: 700 }),
    minSize: { width: 350, height: 350 },
    category: "System",
    nameKey: "settingsAppName",
    component: SettingsApp,
  },
  // --- Add the App Store entry --- //
  appStore: {
    src: "/icons/app-store.png",
    defaultSize: getResponsiveSize(0.6, 0.7, { width: 400, height: 400 }, { width: 1100, height: 800 }),
    minSize: { width: 400, height: 400 },
    category: "System",
    nameKey: "appStoreTitle",
    // Use React.lazy to break circular dependency
    component: React.lazy(() => import("@/components/appstore/AppStoreWindow").then(m => ({ default: m.AppStoreWindow }))),
  },
  clock: {
    // name: "Clock", // Removed
    src: "/icons/clock.png",
    defaultSize: getResponsiveSize(0.35, 0.6, { width: 220, height: 300 }, { width: 600, height: 900 }),
    minSize: { width: 220, height: 300 },
    category: "Utilities", // Assign category
    nameKey: "clockAppName",
    component: ClockApp,
  },
  youtubePlayer: {
    src: "/icons/youtobe-player.png", // Updated icon for YouTube Player
    defaultSize: getResponsiveSize(0.7, 0.7, { width: 400, height: 320 }, { width: 1200, height: 900 }),
    minSize: { width: 400, height: 320 },
    category: "Entertainment",
    nameKey: "musicAppName",
    component: MusicPlayer, // Still uses the same component
  },
  notepad: { // New entry for Notepad
    src: "/icons/notepad.png", // Reusing icon from old textEditor
    defaultSize: getResponsiveSize(0.6, 0.5, { width: 300, height: 320 }, { width: 900, height: 700 }),
    minSize: { width: 300, height: 320 },
    category: "Productivity",
    requiresAuth: true, // Notepad now requires authentication
    nameKey: "notepadAppName",
    component: Notepad,
  },
  bookmarks: {
    src: "/icons/bookmark.png",
    defaultSize: getResponsiveSize(0.5, 0.6, { width: 320, height: 400 }, { width: 900, height: 700 }),
    minSize: { width: 320, height: 400 },
    category: "Productivity",
    requiresAuth: true,
    nameKey: "bookmarkAppName",
    component: BookmarksApp,
  },
  ambience: {
    // name: "Ambience", // Removed
    src: "/icons/ambience.png",
    defaultSize: getResponsiveSize(0.4, 0.2, { width: 220, height: 120 }, { width: 600, height: 300 }),
    minSize: { width: 220, height: 120 },
    category: "Entertainment", // Assign category
    nameKey: "ambienceAppName",
    component: AmbiencePlayer,
  },
  calculator: {
    // name: "Calculator", // Removed
    src: "/icons/calculator.png",
    defaultSize: getResponsiveSize(0.3, 0.7, { width: 220, height: 320 }, { width: 600, height: 900 }),
    minSize: { width: 220, height: 320 },
    category: "Utilities", // Assign category
    nameKey: "calculatorAppName",
    component: Calculator,
  },
  miniGames: {
    // name: "Mini Games", // Removed
    src: "/icons/mini-games.png",
    defaultSize: getResponsiveSize(0.5, 0.5, { width: 300, height: 300 }, { width: 900, height: 700 }),
    minSize: { width: 300, height: 300 },
    category: "Games", // Assign category
    nameKey: "miniGamesAppName",
    component: MiniGames,
  },
  converter: {
    // name: "Converter", // Removed
    src: "/icons/converter.png",
    defaultSize: getResponsiveSize(0.45, 0.5, { width: 280, height: 320 }, { width: 800, height: 700 }),
    minSize: { width: 280, height: 320 },
    category: "Utilities", // Assign category
    nameKey: "converterAppName",
    component: ConverterApp,
  },
  qrReader: {
    // name: "QR Reader", // Removed
    src: "/icons/qr-reader.png",
    defaultSize: getResponsiveSize(0.4, 0.5, { width: 220, height: 300 }, { width: 700, height: 700 }),
    minSize: { width: 220, height: 300 },
    category: "Utilities", // Assign category
    nameKey: "qrReaderAppName",
    component: QRCodeReader,
  },
  drawingPad: {
    // name: "Drawing Pad", // Removed
    src: "/icons/notepad.png",
    defaultSize: getResponsiveSize(0.5, 0.5, { width: 300, height: 300 }, { width: 900, height: 700 }),
    minSize: { width: 300, height: 300 },
    category: "Entertainment", // Assign category
    nameKey: "drawingPadAppName",
    component: DrawingPadApp,
  },
  passwordGenerator: {
    // name: "Password Gen", // Removed
    src: "/icons/password-gen.png",
    defaultSize: getResponsiveSize(0.4, 0.5, { width: 220, height: 300 }, { width: 700, height: 700 }),
    minSize: { width: 220, height: 300 },
    category: "Utilities", // Assign category
    nameKey: "passwordGeneratorAppName",
    component: PasswordGeneratorApp,
  },
  hashGenerator: {
    // name: "Hash Gen", // Removed
    src: "/icons/hash-gen.png",
    defaultSize: getResponsiveSize(0.4, 0.5, { width: 220, height: 300 }, { width: 700, height: 700 }),
    minSize: { width: 220, height: 300 },
    category: "Utilities", // Assign category
    nameKey: "hashGeneratorAppName",
    component: HashGeneratorApp,
  },
  checkers: {
    // name: "Checkers", // Removed
    src: "/icons/checkers-game.png",
    defaultSize: getResponsiveSize(0.5, 0.6, { width: 320, height: 400 }, { width: 900, height: 700 }),
    minSize: { width: 320, height: 400 },
    category: "Games", // Assign category
    nameKey: "checkersAppName",
    component: CheckersApp,
  },
  weather: {
    src: "/icons/weather.png",
    defaultSize: getResponsiveSize(0.35, 0.55, { width: 180, height: 220 }, { width: 500, height: 700 }),
    minSize: { width: 150, height: 180 },
    category: "Utilities",
    nameKey: "weatherAppName",
    component: WeatherWidget,
  },
  calendar: {
    src: "/icons/calendar.png",
    defaultSize: getResponsiveSize(0.45, 0.4, { width: 220, height: 220 }, { width: 800, height: 700 }),
    minSize: { width: 220, height: 220 },
    category: "Productivity",
    nameKey: "calendarAppName",
    component: SimpleCalendar,
  },
  quotes: {
    src: "/icons/quotes.png",
    defaultSize: getResponsiveSize(0.3, 0.5, { width: 150, height: 200 }, { width: 400, height: 600 }),
    minSize: { width: 120, height: 180 },
    category: "Entertainment",
    nameKey: "quotesAppName",
    component: QuotesWidget,
  },
  // Add other apps here using a unique key (appId)
};
