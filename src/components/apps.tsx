"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Window from "./layout/window";
import { appRegistry } from "../config/appRegistry";
import { playSound } from "../lib/utils"; // Import the sound utility
import { useAtom } from "jotai";
import {
  closeWindowAtom, // Write atom to close a window
  openWindowAtom, // Write atom to open/focus a window
  windowRegistryAtom,
  // focusWindowAtom, // Write atom to bring window to front (used by Window component later)
  // WindowState, // Import type if needed
} from "../atoms/windowAtoms"; // Adjust path as necessary
// import { v4 as uuidv4 } from "uuid"; // Import uuid for generating unique window IDs
import Taskbar from "./layout/taskbar"; // Import the Taskbar

// Define the props for the reusable AppIcon component
interface AppIconProps {
  src: string;
  name: string;
  appId: string; // Use appId from registry
  // isOpen: boolean; // Determined by checking openWindowsAtom now
  // isSelected: boolean; // Selection might be handled differently (e.g., based on z-index or a separate atom)
  onDoubleClick: (appId: string) => void; // Pass appId on double click
  // Consider adding onSelect if needed for single-click behavior
}

// Reusable AppIcon component
const AppIcon: React.FC<AppIconProps> = ({
  src,
  name,
  appId,
  onDoubleClick,
}) => {
  // Removed hardcoded bgStyle
  // const bgStyle = "bg-white text-primary";

  return (
    <div
      className={`flex flex-col items-center justify-center cursor-pointer group p-1 rounded transition-opacity duration-150 ease-in-out min-w-24`}
      //   onClick={onSelect} // Single click might focus desktop or select icon differently
      onDoubleClick={() => onDoubleClick(appId)} // Trigger open/focus action
    >
      <Image
        src={src}
        alt={name}
        width={60}
        height={60}
        className={`drop-shadow-lg`}
        priority={appId === "clock"}
      />
      {/* Apply theme-aware classes directly */}
      <p
        className={`px-1.5 py-0.5 font-tight shadow-md mt-1 rounded text-sm bg-background/80 backdrop-blur-sm text-foreground`}
      >
        {name}
      </p>
    </div>
  );
};

// Main component to display all app icons and windows
export const AppsIcons = () => {
  // CHANGE: Use the full window registry
  const [windowRegistry] = useAtom(windowRegistryAtom);
  // Derive the list of windows to render (all open or minimized)
  const windowsToRender = Object.values(windowRegistry).filter(
    (win) => win.isOpen || win.isMinimized,
  );

  // Get the setter functions for window actions
  const openWindow = useAtom(openWindowAtom)[1];
  const closeWindow = useAtom(closeWindowAtom)[1];
  // const focusWindow = useAtom(focusWindowAtom)[1]; // focusWindow will be used inside the Window component

  // Local state for selection might still be needed if we want desktop icon selection independent of window focus
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // Mobile/tablet detection
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  // Check for mobile/tablet on component mount
  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /iphone|ipad|ipod|android|blackberry|windows phone/g
        .test(userAgent);
      const isTablet = /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/g
        .test(userAgent);
      setIsMobileOrTablet(isMobile || isTablet);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
    };
  }, []);

  // Convert appRegistry to an array for mapping (if it's an object)
  const apps = Object.entries(appRegistry).map(([id, config]) => ({
    id, // This is the appId
    ...config,
  }));

  const openAppWindow = (appId: string) => {
    const appConfig = appRegistry[appId];
    if (!appConfig) return;

    playSound("/sounds/open.mp3"); // Play open sound

    // We need a unique ID for each window instance, even of the same app type.
    // If an instance already exists, openWindowAtom should focus it.
    // If not, it creates a new one.
    // Let's generate a predictable ID based on appId for simplicity for now,
    // or handle multiple instances if needed. Assuming single instance per appId for now.
    // A better approach for multi-instance would use uuidv4() always.
    const windowInstanceId = `${appId}-instance`; // Simple instance ID

    openWindow({
      id: windowInstanceId, // Unique ID for this instance
      appId: appId,
      title: appConfig.name, // Use name from registry
      minSize: appConfig.minSize,
      initialSize: appConfig.defaultSize, // Pass initial size
      // initialPosition will be handled by openWindowAtom (loads saved or calculates default)
    });
    setSelectedAppId(appId); // Optionally select the icon on double click
  };

  const handleDoubleClick = (appId: string) => {
    openAppWindow(appId);
  };

  const handleCloseWindow = (windowId: string) => {
    playSound("/sounds/close.mp3"); // Play close sound
    closeWindow(windowId); // Use the Jotai action atom
    // No need to manage selectedAppId here unless closing should deselect icon
  };

  const handleSelectIcon = (appId: string) => {
    setSelectedAppId(appId);
    // Maybe play a click sound?
    playSound("/sounds/click.mp3");

    // For mobile/tablet, open the window on a single click
    if (isMobileOrTablet) {
      openAppWindow(appId);
    }
  };

  return (
    <>
      {/* Background click to clear selection */}
      <div
        className="fixed inset-0 -z-10" // Ensure background covers everything
        onClick={() => setSelectedAppId(null)}
      >
      </div>

      {/* Desktop Icons */}
      {/* Apply CSS multi-column layout */}
      <div
        className="absolute top-4 left-4 z-10 max-h-[calc(100vh-80px)] pb-14 overflow-y-hidden"
        style={{
          columnWidth: "6rem", // Adjust based on desired icon width + padding
          columnGap: "0.5rem", // Adjust gap between columns
        }}
      >
        {apps.map((app) => (
          // Add break-inside-avoid to prevent icons splitting across columns
          <div
            key={app.id}
            onClick={() => handleSelectIcon(app.id)}
            className={`p-1 rounded inline-block w-full break-inside-avoid mb-2 ${
              // Use inline-block, w-full, break-inside, mb-2 for column layout
              selectedAppId === app.id ? "brightness-50" : ""}`}
          >
            <AppIcon
              src={app.src}
              name={app.name}
              appId={app.id}
              onDoubleClick={handleDoubleClick}
            />
          </div>
        ))}
      </div>

      {/* CHANGE: Render ALL open or minimized windows, hide minimized ones with style */}
      {windowsToRender.map((windowState) => {
        const appConfig = appRegistry[windowState.appId];
        if (!appConfig) {
          console.error(
            `App configuration not found for: ${windowState.appId}. Closing window ID: ${windowState.id}`,
          );
          closeWindow(windowState.id);
          return null;
        }

        const AppComponent = appConfig.component;

        // Conditionally apply display: none if minimized
        const style = windowState.isMinimized ? { display: "none" } : {};

        return (
          <div key={windowState.id} style={style}>
            <Window
              windowId={windowState.id}
              title={windowState.title}
              isOpen={windowState.isOpen} // Pass the actual isOpen state
              onClose={() => handleCloseWindow(windowState.id)}
              initialPosition={windowState.position}
              initialSize={windowState.size}
              minSize={windowState.minSize}
              zIndex={windowState.zIndex}
              isMobileOrTablet={isMobileOrTablet}
            >
              <AppComponent onClose={() => handleCloseWindow(windowState.id)} />
            </Window>
          </div>
        );
      })}

      {/* Render the Taskbar */}
      <Taskbar />
    </>
  );
};
