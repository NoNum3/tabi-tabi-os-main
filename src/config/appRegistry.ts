import { Size } from "../types";
// import PodomoroTimer from "../components/apps/podomoro"; // Removed unused import
import TodoList from "../components/(todoList)/TodoList";
// import BackgroundChanger from "../components/apps/background"; // Removed unused import
import React from "react";
// import TextEditor from "../components/apps/textEditor"; // Unused import
import MusicPlayer from "../components/(music)/MusicPlayer";
import AmbiencePlayer from "@/components/(ambiencePlayer)/ambiencePlayer";
import Calculator from "../components/(calculator)/Calculator";
import ClockApp from "../components/(clock)/ClockApp";
import MiniGames from "@/components/(miniGames)/MiniGames"; // Import the new component
import ConverterApp from "@/components/(converter)/ConverterApp";
// Import the QRCodeReader app
import QRCodeReader from "@/components/(qrCodeReader)/QRCodeReader";
// Import the DrawingPadApp
import DrawingPadApp from "../components/(drawingPad)/DrawingPadApp";
// Import new apps
import PasswordGeneratorApp from "../components/(passwordGenerator)/PasswordGeneratorApp";
import HashGeneratorApp from "../components/(hashGenerator)/HashGeneratorApp";
import CheckersApp from "../components/(checkers)/CheckersApp";
// --- Import the AppStoreWindow component --- //
import { AppStoreWindow } from "../components/appstore/AppStoreWindow";
// --- Import the new SettingsApp component --- //
import SettingsApp from "../components/(settings)/SettingsApp";
// import Chat from "../components/apps/Chat/Chat"; // Removed unused import
// import { AppConfig } from "@/types/app"; // Removed unused import
import Notepad from "../components/(notepad)/Notepad"; // Corrected import for Notepad
import WeatherWidget from "@/components/(weather)/WeatherWidget";
import SimpleCalendar from "@/components/(calendar)/SimpleCalendar";
import QuotesWidget from "@/components/(quotes)/QuotesWidget";
// import { LayoutDashboard } from "lucide-react";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
}

// App names are now defined in locale files (e.g., locales/en.ts)
// The keys here MUST match the keys in the locale files.
export const appRegistry: Record<string, AppRegistryEntry> = {
  // --- Add Settings entry --- //
  settings: {
    src: "/icons/settings.png", // Reuse icon or create new one
    defaultSize: { width: 650, height: 500 },
    minSize: { width: 450, height: 400 }, // Adjusted min size
    category: "System",
    component: SettingsApp,
  },
  // --- Add the App Store entry --- //
  appStore: {
    src: "/icons/settings.png", // Make sure this icon exists in public/icons/
    defaultSize: { width: 700, height: 550 },
    minSize: { width: 500, height: 400 },
    category: "System", // Assign category
    component: AppStoreWindow, // Reference the imported component
  },
  clock: {
    // name: "Clock", // Removed
    src: "/icons/clock.png",
    defaultSize: { width: 400, height: 650 },
    minSize: { width: 300, height: 300 },
    category: "Utilities", // Assign category
    component: ClockApp,
  },
  youtubePlayer: {
    src: "/icons/youtobe-player.png", // Updated icon for YouTube Player
    defaultSize: { width: 900, height: 700 },
    minSize: { width: 480, height: 320 },
    category: "Entertainment",
    component: MusicPlayer, // Still uses the same component
  },
  todoList: {
    // name: "To-do list", // Removed
    src: "/icons/to-do.png",
    defaultSize: { width: 400, height: 400 },
    minSize: { width: 300, height: 340 },
    category: "Productivity", // Assign category
    component: TodoList,
  },
  notepad: { // New entry for Notepad
    src: "/icons/notepad.png", // Reusing icon from old textEditor
    defaultSize: { width: 750, height: 500 },
    minSize: { width: 300, height: 320 },
    category: "Productivity",
    requiresAuth: true, // Notepad now requires authentication
    component: Notepad,
  },
  ambience: {
    // name: "Ambience", // Removed
    src: "/icons/ambience.png",
    defaultSize: { width: 375, height: 190 },
    minSize: { width: 375, height: 190 },
    category: "Entertainment", // Assign category
    component: AmbiencePlayer,
  },
  calculator: {
    // name: "Calculator", // Removed
    src: "/icons/calculator.png",
    defaultSize: { width: 320, height: 860 },
    minSize: { width: 280, height: 680 },
    category: "Utilities", // Assign category
    component: Calculator,
  },
  miniGames: {
    // name: "Mini Games", // Removed
    src: "/icons/mini-games.png",
    defaultSize: { width: 450, height: 400 },
    minSize: { width: 350, height: 300 },
    category: "Games", // Assign category
    component: MiniGames,
  },
  converter: {
    // name: "Converter", // Removed
    src: "/icons/converter.png",
    defaultSize: { width: 500, height: 550 },
    minSize: { width: 380, height: 400 },
    category: "Utilities", // Assign category
    component: ConverterApp,
  },
  qrReader: {
    // name: "QR Reader", // Removed
    src: "/icons/qr-reader.png",
    defaultSize: { width: 450, height: 550 },
    minSize: { width: 300, height: 400 },
    category: "Utilities", // Assign category
    component: QRCodeReader,
  },
  drawingPad: {
    // name: "Drawing Pad", // Removed
    src: "/icons/notepad.png",
    defaultSize: { width: 600, height: 500 },
    minSize: { width: 400, height: 300 },
    category: "Entertainment", // Assign category
    component: DrawingPadApp,
  },
  passwordGenerator: {
    // name: "Password Gen", // Removed
    src: "/icons/password-gen.png",
    defaultSize: { width: 400, height: 480 },
    minSize: { width: 350, height: 420 },
    category: "Utilities", // Assign category
    component: PasswordGeneratorApp,
  },
  hashGenerator: {
    // name: "Hash Gen", // Removed
    src: "/icons/hash-gen.png",
    defaultSize: { width: 450, height: 500 },
    minSize: { width: 380, height: 400 },
    category: "Utilities", // Assign category
    component: HashGeneratorApp,
  },
  checkers: {
    // name: "Checkers", // Removed
    src: "/icons/checkers-game.png",
    defaultSize: { width: 520, height: 620 },
    minSize: { width: 400, height: 500 },
    category: "Games", // Assign category
    component: CheckersApp,
  },
  // Add new Chat app entry
  // chat: {
  //   src: "/icons/checkers-game.png", // Assuming you have or will create a chat icon
  //   defaultSize: { width: 450, height: 600 },
  //   minSize: { width: 350, height: 400 },
  //   component: Chat,
  // },
  weather: {
    src: "/icons/weather.png",
    defaultSize: { width: 320, height: 220 },
    minSize: { width: 220, height: 180 },
    category: "Utilities",
    component: WeatherWidget,
  },
  calendar: {
    src: "/icons/calendar.png",
    defaultSize: { width: 500, height: 420 },
    minSize: { width: 320, height: 320 },
    category: "Productivity",
    component: SimpleCalendar,
  },
  quotes: {
    src: "/icons/quotes.png",
    defaultSize: { width: 350, height: 220 },
    minSize: { width: 220, height: 180 },
    category: "Entertainment",
    component: QuotesWidget,
  },
  // Add other apps here using a unique key (appId)
};
