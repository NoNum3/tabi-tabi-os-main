import { Size } from "../types";
// import PodomoroTimer from "../components/apps/podomoro"; // Removed unused import
import TodoList from "../components/apps/todoList";
import BackgroundChanger from "../components/apps/background";
import React from "react";
import TextEditor from "../components/apps/textEditor";
import MusicPlayer from "../components/apps/musicPlayer";
import AmbiencePlayer from "../components/apps/ambiencePlayer";
import Calculator from "../components/apps/Calculator/Calculator";
import ClockApp from "../components/apps/podomoro";
import MiniGames from "../components/apps/miniGames"; // Import the new component
import ConverterApp from "../components/apps/converter";
// Import the QRCodeReader app
import QRCodeReader from "../components/apps/QRCodeReader";
// Import the DrawingPadApp
import DrawingPadApp from "../components/apps/drawingPad";
// Import new apps
import PasswordGeneratorApp from "../components/apps/passwordGenerator";
import HashGeneratorApp from "../components/apps/hashGenerator";
import CheckersApp from "../components/apps/checkers";
// import { AppConfig } from "@/types/app"; // Removed unused import

// Updated interface to include missing fields
interface AppRegistryEntry {
  name: string; // The display name of the app
  src: string; // Path to the app icon
  defaultSize: Size;
  minSize?: Size; // Optional minimum size for the window
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>;
  // Add other app-specific metadata here if needed in the future
}

// Define default sizes and components for different applications
// Added name, src, and optional minSize
export const appRegistry: Record<string, AppRegistryEntry> = {
  // Renamed entry: pomodoro -> clock
  clock: {
    name: "Clock",
    src: "/icons/clock.png",
    defaultSize: { width: 400, height: 650 },
    minSize: { width: 300, height: 300 },
    component: ClockApp,
  },
  music: {
    name: "Music",
    src: "/icons/music.png",
    defaultSize: { width: 400, height: 650 },
    minSize: { width: 350, height: 250 },
    component: MusicPlayer,
  },
  todoList: {
    name: "To-do list",
    src: "/icons/to-do.png",
    defaultSize: { width: 400, height: 400 },
    minSize: { width: 300, height: 340 },
    component: TodoList,
  },

  textEditor: {
    name: "Notepad",
    src: "/icons/notepad.png",
    defaultSize: { width: 750, height: 500 },
    minSize: { width: 300, height: 320 },
    component: TextEditor,
  },
  ambience: {
    name: "Ambience",
    src: "/icons/ambience.png",
    defaultSize: { width: 375, height: 190 },
    minSize: { width: 375, height: 190 },
    component: AmbiencePlayer,
  },
  background: {
    name: "Settings",
    src: "/icons/settings.png",
    defaultSize: { width: 600, height: 450 },
    minSize: { width: 470, height: 340 },
    component: BackgroundChanger,
  },
  calculator: {
    name: "Calculator",
    src: "/icons/calculator.png",
    defaultSize: { width: 400, height: 600 },
    minSize: { width: 260, height: 400 },
    component: Calculator,
  },
  miniGames: {
    name: "Mini Games",
    src: "/icons/mini-games.png",
    defaultSize: { width: 450, height: 400 },
    minSize: { width: 350, height: 300 },
    component: MiniGames,
  },
  converter: {
    name: "Converter",
    src: "/icons/converter.png",
    defaultSize: { width: 500, height: 550 },
    minSize: { width: 380, height: 400 },
    component: ConverterApp,
  },
  // Add the new QR Code Reader app
  qrReader: {
    name: "QR Reader",
    src: "/icons/qr-reader.png", // Using camera icon as placeholder
    defaultSize: { width: 450, height: 550 },
    minSize: { width: 300, height: 400 },
    component: QRCodeReader,
  },
  // Add the new Drawing Pad app
  drawingPad: {
    name: "Drawing Pad",
    src: "/icons/notepad.png", // Placeholder icon
    defaultSize: { width: 600, height: 500 },
    minSize: { width: 400, height: 300 },
    component: DrawingPadApp,
  },
  // Add the Password Generator app
  passwordGenerator: {
    name: "Password Gen",
    src: "/icons/password-gen.png", // Placeholder icon
    defaultSize: { width: 400, height: 480 },
    minSize: { width: 350, height: 420 },
    component: PasswordGeneratorApp,
  },
  // Add the Hash Generator app
  hashGenerator: {
    name: "Hash Gen",
    src: "/icons/hash-gen.png", // Placeholder icon
    defaultSize: { width: 450, height: 500 },
    minSize: { width: 380, height: 400 },
    component: HashGeneratorApp,
  },
  checkers: {
    name: "Checkers",
    src: "/icons/checkers-game.png",
    defaultSize: { width: 520, height: 620 },
    minSize: { width: 400, height: 500 },
    component: CheckersApp,
  },
  // Add other apps here using a unique key (appId)
};
