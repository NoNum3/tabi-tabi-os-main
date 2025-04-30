import React from "react"; // Added React import for ComponentType

export type Size = {
  width: number;
  height: number;
};

export type Position = {
  x: number;
  y: number;
};

// Define categories (moved here or import if defined elsewhere)
export type AppCategory =
  | "Utilities"
  | "Productivity"
  | "Entertainment"
  | "Games"
  | "System";

// Define and export AppRegistration type (aligned with appRegistry structure)
export interface AppRegistration {
  id: string; // Keep app ID
  nameKey: string; // Keep locale key for name
  src: string; // Changed from iconPath
  defaultSize: Size; // Changed from initialSize
  minSize?: Size; // Keep minSize
  category: AppCategory; // Added category
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>; // Keep component type
}

// Potential future use for app metadata
// export interface AppMetadata { ... } // Can keep or remove if unused
