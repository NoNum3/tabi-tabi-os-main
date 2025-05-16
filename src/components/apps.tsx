"use client";

// --- External Libraries ---
import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
// import { DndProvider, DropTargetMonitor, useDrag, useDrop } from "react-dnd"; // DropTargetMonitor is unused
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// --- State Management (Jotai) ---
import { useAtom, useAtomValue, useSetAtom } from "jotai";

// --- Absolute Imports (aliases) ---
import { appRegistry } from '@/config/appRegistry';
import { useI18n } from '@/locales/client';
import { AppRegistration } from '@/types';
import { cn, playSound } from '@/infrastructure/lib/utils';
import {
  closeWindowAtom,
  openWindowAtom,
  windowRegistryAtom,
} from '@/application/atoms/windowAtoms';
import {
  addedAppIdsAtom,
  iconPositionsAtom,
  updateIconPositionAtom,
} from '@/application/atoms/dashboardAtoms';
import {
  currentGridCellPixelSizeAtom,
  showGridLinesAtom,
} from '@/application/atoms/displaySettingsAtoms';

// --- Relative Imports ---
import Taskbar from './layout/taskbar';
import Window from './layout/window';
// --- Import the main Window component for rendering ---
// import { AppStoreWindow } from "./appstore/AppStoreWindow"; // Comment out if not used directly
// --- Import dashboard atoms ---
// import { v4 as uuidv4 } from "uuid"; // Import uuid for generating unique window IDs
// --- Define GridPosition type --- //
interface GridPosition {
  row: number;
  col: number;
}

// --- Define DragItem type --- //
interface DragItem {
  appId: string;
}

// Reusable AppIcon component (modified slightly for flexibility if needed)
interface AppIconProps {
  appId: string;
  appNameKey: string; // Use string as key
  src: string;
  isSelected: boolean;
  // Removed onDoubleClick, handled by Draggable wrapper
  // Removed onClick, handled by Draggable wrapper
  cellSizeClass?: string; // Optional class based on grid size
}

const AppIconDisplay: React.FC<AppIconProps> = React.memo(
  ({ appId, appNameKey, src, isSelected, cellSizeClass }) => {
    const t = useI18n();
    const iconSize = appId === "clock" ? 60 : 48;

    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center w-full h-full group p-1 rounded transition-colors duration-150 ease-in-out text-center",
          isSelected
            ? "bg-primary/20"
            : "hover:bg-black/10 dark:hover:bg-white/10",
          cellSizeClass,
        )}
        title={t(appNameKey as keyof ReturnType<typeof t>, {})}
      >
        <Image
          src={src}
          alt={t(appNameKey as keyof ReturnType<typeof t>, {})}
          width={iconSize}
          height={iconSize}
          className={`drop-shadow-lg object-contain ${
            isSelected ? "" : "group-hover:scale-105 transition-transform"
          }`}
          priority={appId === "clock"}
        />
        <span
          className={cn(
            "mt-1 font-medium truncate w-full text-white dark:text-gray-200 drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]",
            cellSizeClass === "text-xs" ? "text-xs" : "text-[11px]", // Adjust text size based on cell size
          )}
        >
          {t(appNameKey as keyof ReturnType<typeof t>, {})}
        </span>
      </div>
    );
  },
);
AppIconDisplay.displayName = "AppIconDisplay";

// --- Draggable App Icon Component ---
interface DraggableAppIconProps {
  app: AppRegistration; // Use AppRegistration type
  position: GridPosition;
  cellSize: number;
  isSelected: boolean;
  onSelect: (appId: string) => void; // Explicit string type
  onDoubleClick: (appId: string) => void; // Explicit string type
}

const DraggableAppIcon: React.FC<DraggableAppIconProps> = React.memo(
  ({
    app,
    position,
    cellSize,
    isSelected,
    onSelect,
    onDoubleClick,
  }) => {
    const divRef = useRef<HTMLDivElement>(null); // Create a ref for the div
    const [{ isDragging }, drag] = useDrag(() => ({
      type: "ICON",
      item: { appId: app.id, position },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }));

    drag(divRef);

    const cellSizeClass = cellSize < 64
      ? "text-xs"
      : cellSize < 80
      ? "text-[11px]"
      : "text-xs";

    return (
      <div
        ref={divRef}
        style={{
          gridRowStart: position.row + 1,
          gridColumnStart: position.col + 1,
          opacity: isDragging ? 0.5 : 1,
          cursor: "grab",
          zIndex: isDragging ? 100 : 1,
          touchAction: "none",
        }}
        className="transition-opacity duration-150"
        onClick={() => onSelect(app.id)}
        onDoubleClick={() => onDoubleClick(app.id)}
      >
        <AppIconDisplay
          appId={app.id}
          appNameKey={app.nameKey}
          src={app.src}
          isSelected={isSelected}
          cellSizeClass={cellSizeClass}
        />
      </div>
    );
  },
);
DraggableAppIcon.displayName = "DraggableAppIcon";

// --- Desktop Grid Component ---
interface DesktopGridProps {
  dashboardApps: AppRegistration[]; // Use AppRegistration type
  selectedAppId: string | null;
  handleSelectIcon: (appId: string) => void; // Explicit string type
  handleDoubleClick: (appId: string) => void; // Explicit string type
}

const DesktopGrid: React.FC<DesktopGridProps> = React.memo(
  ({
    dashboardApps,
    selectedAppId,
    handleSelectIcon,
    handleDoubleClick,
  }) => {
    const [iconPositions] = useAtom(iconPositionsAtom);
    // const addedAppIds = useAtomValue(addedAppIdsAtom); // Removed as it's unused
    const updatePosition = useSetAtom(updateIconPositionAtom);
    const cellSize = useAtomValue(currentGridCellPixelSizeAtom); // <-- Read pixel size
    // const [snapGrid] = useAtom(snapToGridAtom); // snapGrid variable is unused
    const [showGridLines] = useAtom(showGridLinesAtom);
    // State for the drop preview indicator
    const [previewTarget, setPreviewTarget] = useState<GridPosition | null>(
      null,
    );

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    // Removed iconHolderRef - drop target is the scroll container now

    // Removed maxOccupiedRow/Col calculation and totalGridWidth/Height - CSS grid handles sizing

    const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>(
      () => ({
        accept: "ICON",
        canDrop: () => true,
        hover: (item, monitor) => {
          const delta = monitor.getClientOffset();
          if (!delta || !scrollContainerRef.current) {
            setPreviewTarget(null);
            return;
          }

          const scrollContainerRect = scrollContainerRef.current
            .getBoundingClientRect();
          const scrollTop = scrollContainerRef.current.scrollTop;
          const scrollLeft = scrollContainerRef.current.scrollLeft;

          const dropX = delta.x - scrollContainerRect.left + scrollLeft;
          const dropY = delta.y - scrollContainerRect.top + scrollTop;

          // Calculate effective size including gap for coordinate division
          const gapSize = 4; // Defined in the grid CSS
          const effectiveCellSize = cellSize + gapSize;

          // Calculate target grid cell using effective size
          const targetCol = Math.max(0, Math.floor(dropX / effectiveCellSize));
          const targetRow = Math.max(0, Math.floor(dropY / effectiveCellSize));
          const newTarget = { row: targetRow, col: targetCol };

          if (
            previewTarget?.row !== newTarget.row ||
            previewTarget?.col !== newTarget.col
          ) {
            const isOccupied = Object.entries(iconPositions).some(
              ([id, pos]) =>
                id !== item.appId && pos.row === targetRow &&
                pos.col === targetCol,
            );
            // Only show preview for valid (non-occupied) target cells
            setPreviewTarget(isOccupied ? null : newTarget);
            // console.log(`[DesktopGrid] Hover preview target: ${isOccupied ? 'null (occupied)' : JSON.stringify(newTarget)}`);
          }
        },
        drop: (item, monitor) => {
          setPreviewTarget(null); // Clear preview on actual drop
          console.log(
            `[DesktopGrid] Drop function *EXECUTED* for ${item.appId}`,
          );
          const currentIconPositions = iconPositions;

          // Log the positions being checked
          console.log(
            "[DesktopGrid Drop] Checking against positions:",
            JSON.stringify(currentIconPositions, null, 2),
          );

          const effectiveCellSize = cellSize + 4; // Cell size including gap

          let targetCol = Math.max(
            0,
            Math.floor(
              (monitor.getClientOffset()!.x -
                scrollContainerRef.current!.getBoundingClientRect().left +
                scrollContainerRef.current!.scrollLeft) / effectiveCellSize,
            ),
          );
          let targetRow = Math.max(
            0,
            Math.floor(
              (monitor.getClientOffset()!.y -
                scrollContainerRef.current!.getBoundingClientRect().top +
                scrollContainerRef.current!.scrollTop) / effectiveCellSize,
            ),
          );

          console.log(
            `[DesktopGrid Drop] Initial target for ${item.appId}: R${targetRow}, C${targetCol}`,
          );

          // Ensure target is not negative
          targetRow = Math.max(0, targetRow);
          targetCol = Math.max(0, targetCol);

          // Check if the target cell is occupied by another icon
          const isOccupied = Object.entries(currentIconPositions).some(
            ([id, pos]) =>
              id !== item.appId && pos.row === targetRow &&
              pos.col === targetCol,
          );

          if (!isOccupied) {
            console.log(
              `[DesktopGrid Drop] Target R${targetRow}, C${targetCol} is NOT occupied for ${item.appId}. Updating position.`,
            );
            updatePosition({
              appId: item.appId,
              position: {
                row: targetRow,
                col: targetCol,
              },
            });
          } else {
            console.log(
              `[DesktopGrid Drop] Target R${targetRow}, C${targetCol} IS OCCUPIED for ${item.appId}. No position update.`,
            );
            // Handle collision: maybe find nearest empty spot, or revert to original, or nothing.
            // For now, we do nothing if it's occupied, meaning the icon effectively can't be dropped there.
          }
        },
      }),
      [cellSize, iconPositions, updatePosition], // Added iconPositions to deps
    );

    // Attach drop to the scroll container
    drop(scrollContainerRef);

    return (
      <div
        ref={scrollContainerRef} // Ref for the main scrollable area
        className={cn(
          "relative flex-grow p-2 overflow-auto w-full h-full",
          showGridLines ? "debug-grid-lines" : "", // Conditional class for grid lines
        )}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fill, minmax(${cellSize}px, 1fr))`,
          gridAutoRows: `${cellSize}px`,
          gap: "4px", // Consistent gap
          alignContent: "start", // Align items to the start of the grid
        }}
        // onClick={() => handleSelectIcon(null)} // Deselect on empty space click handled elsewhere
      >
        {dashboardApps.map((app) => {
          const currentPosition = iconPositions[app.id] || { row: 0, col: 0 }; // Default if not set
          return (
            <DraggableAppIcon
              key={app.id}
              app={app}
              position={currentPosition}
              cellSize={cellSize}
              isSelected={selectedAppId === app.id}
              onSelect={handleSelectIcon}
              onDoubleClick={handleDoubleClick}
            />
          );
        })}
        {/* Drop Preview Indicator */}
        {previewTarget && isOver && (() => {
          // Find the app being dragged
          const draggingAppId = dashboardApps.find((app) =>
            app.id === selectedAppId
          )?.id || Object.keys(iconPositions)[0];
          const draggingApp = dashboardApps.find((app) =>
            app.id === draggingAppId
          );
          if (!draggingApp) return null;
          return (
            <div
              style={{
                gridRowStart: previewTarget.row + 1,
                gridColumnStart: previewTarget.col + 1,
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                zIndex: 2,
                position: "relative",
              }}
            >
              <div
                style={{
                  opacity: 0.85,
                  filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.6))",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2.5px dashed #3b82f6", // Tailwind blue-500
                  borderRadius: 12,
                  background: "rgba(59,130,246,0.08)", // blue-500/10
                  transition: "box-shadow 0.2s, border 0.2s, background 0.2s",
                  animation: "fadeInScale 0.18s cubic-bezier(.4,0,.2,1)",
                }}
              >
                <AppIconDisplay
                  appId={draggingApp.id}
                  appNameKey={draggingApp.nameKey}
                  src={draggingApp.src}
                  isSelected={false}
                  cellSizeClass={cellSize < 64
                    ? "text-xs"
                    : cellSize < 80
                    ? "text-[11px]"
                    : "text-xs"}
                />
              </div>
            </div>
          );
        })()}
      </div>
    );
  },
);
DesktopGrid.displayName = "DesktopGrid";

// Main component to display all app icons and windows
export const AppsIcons = () => {
  const windows = useAtomValue(windowRegistryAtom);
  const openWindow = useSetAtom(openWindowAtom);
  const closeWindow = useSetAtom(closeWindowAtom);
  // const focusWindow = useSetAtom(focusWindowAtom); // focusWindow variable is unused
  const t = useI18n();

  const addedAppIds = useAtomValue(addedAppIdsAtom);

  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  // Calculate windows to render (visible or minimized)
  const windowsToRender = Object.values(windows).filter(
    (win) => win.isOpen || win.isMinimized,
  );

  // Check for mobile/tablet on mount
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /iphone|ipad|ipod|android|blackberry|windows phone/g
      .test(userAgent);
    const isTablet = /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/g
      .test(userAgent);
    const isMobileOrTabletDevice = isMobile || isTablet;
    setIsMobileOrTablet(isMobileOrTabletDevice);

    const checkDevice = () => {
      const newIsMobileOrTablet =
        /iphone|ipad|ipod|android|blackberry|windows phone/g.test(
          navigator.userAgent.toLowerCase(),
        ) ||
        /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/g.test(
          navigator.userAgent.toLowerCase(),
        );
      setIsMobileOrTablet(newIsMobileOrTablet);
    };
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // --- Filter apps based on addedAppIds and ensure they have config ---
  const dashboardApps = React.useMemo(() => {
    return addedAppIds
      .map((appId): AppRegistration | null => {
        const config = appRegistry[appId];
        if (!config) return null; // Skip if config missing in registry
        // Construct the AppRegistration object
        return {
          id: appId,
          nameKey: appId, // Use the key as the nameKey
          src: config.src,
          defaultSize: config.defaultSize,
          minSize: config.minSize,
          category: config.category,
          component: config.component,
        };
      })
      .filter((app): app is AppRegistration => app !== null); // Simple filter for non-null
  }, [addedAppIds]);

  // Log dashboardApps only when it changes
  useEffect(() => {
    console.log(
      "[AppsIcons] Rendering DesktopGrid with dashboardApps:",
      JSON.stringify(dashboardApps.map((app) => app.id), null, 2),
    );
  }, [dashboardApps]);

  // Define handleCloseWindow first
  const handleCloseWindow = useCallback(
    (windowId: string) => {
      playSound("/sounds/close.mp3");
      closeWindow(windowId);
    },
    [closeWindow],
  );

  // Now define openAppWindow, which depends on handleCloseWindow
  const openAppWindow = useCallback(
    (appId: string) => {
      console.log("[AppsIcons] Attempting to open app:", appId); // <-- Log entry
      const appConfig = dashboardApps.find((app) => app.id === appId);

      if (!appConfig) {
        console.error(`[AppsIcons] App config not found for ${appId}`); // <-- Log error
        return;
      }

      console.log("[AppsIcons] Found app config:", appConfig); // <-- Log config

      playSound("/sounds/open.mp3");
      const windowInstanceId = `${appId}-instance-${Date.now()}`;

      const windowPayload = {
        id: windowInstanceId,
        appId: appId,
        title: t(appConfig.nameKey as keyof ReturnType<typeof t>, {}),
        minSize: appConfig.minSize,
        initialSize: appConfig.defaultSize,
        children: React.createElement(appConfig.component, {
          windowId: windowInstanceId,
          onClose: () => handleCloseWindow(windowInstanceId), // Pass handleCloseWindow
        }),
      };

      console.log(
        "[AppsIcons] Calling openWindow with payload:",
        windowPayload,
      ); // <-- Log payload

      openWindow(windowPayload);
      setSelectedIcon(appId);
    },
    [dashboardApps, openWindow, t, handleCloseWindow], // Added handleCloseWindow dependency
  );

  const handleDoubleClick = useCallback(
    (appId: string) => {
      openAppWindow(appId);
    },
    [openAppWindow],
  );

  const handleSelectIcon = useCallback(
    (appId: string) => {
      setSelectedIcon(appId);
      playSound("/sounds/click.mp3");
      // Mobile/Tablet: Single click opens the app
      if (isMobileOrTablet) {
        openAppWindow(appId);
      }
    },
    [isMobileOrTablet, openAppWindow], // Removed playSound
  );

  // --- Effect to close windows with app IDs not found in the main appRegistry --- // MODIFIED LOGIC
  useEffect(() => {
    const windowsToCloseNow: string[] = [];
    windowsToRender.forEach((windowState) => {
      // Check if the appId exists in the main appRegistry
      const appConfigExistsInRegistry = windowState.appId in appRegistry; // <<< MODIFIED CHECK
      if (
        !appConfigExistsInRegistry &&
        (windowState.isOpen || windowState.isMinimized)
      ) {
        windowsToCloseNow.push(windowState.id);
      }
    });

    if (windowsToCloseNow.length > 0) {
      console.warn(
        "Closing windows with app IDs not found in appRegistry:", // Modified log message
        windowsToCloseNow,
      );
      windowsToCloseNow.forEach((id) => closeWindow(id));
    }
    // Keep dependencies, appRegistry is static so doesn't need to be listed
  }, [windows, closeWindow, windowsToRender]); // Removed dashboardApps from dependencies

  return (
    <DndProvider backend={HTML5Backend}>
      {/* Wrap with DndProvider */}

      {/* --- Temporarily Comment Out Background Click Div --- */}
      {
        /* <div
        className="fixed inset-0 -z-10"
        onClick={() => setSelectedIcon(null)}
      >
      </div> */
      }

      {/* --- Render Desktop Grid --- */}
      <DesktopGrid
        dashboardApps={dashboardApps}
        selectedAppId={selectedIcon}
        handleSelectIcon={handleSelectIcon}
        handleDoubleClick={handleDoubleClick}
      />

      {/* --- Render Windows --- */}
      {windowsToRender.map((windowState) => {
        // Find the app config from the *filtered* dashboardApps list
        const appConfig = dashboardApps.find((app) =>
          app.id === windowState.appId
        );

        // *** ADD THIS LOG ***
        if (windowState.appId === "appStore") {
          console.log(
            "[AppsIcons] Rendering App Store window with state:",
            JSON.stringify(windowState, null, 2),
          );
        }
        // *** END OF ADDED LOG ***

        // If config is missing, window closing is handled by the useEffect above
        if (!appConfig || !appConfig.component) {
          return null;
        }

        const AppComponent = appConfig.component;

        // Define styles for minimized windows (keeps them in DOM for sound etc.)
        const style: React.CSSProperties = windowState.isMinimized
          ? {
            position: "fixed",
            left: "-9999px",
            opacity: 0,
            pointerEvents: "none",
            zIndex: -1,
            visibility: "hidden",
          }
          : {};

        return (
          <div key={windowState.id} style={style}>
            {/* Use default imported Window */}
            <Window
              windowId={windowState.id}
              title={windowState.title ||
                t(appConfig.nameKey as keyof ReturnType<typeof t>, {})}
              isOpen={windowState.isOpen && !windowState.isMinimized}
              onClose={() => handleCloseWindow(windowState.id)}
              initialPosition={windowState.position}
              initialSize={windowState.size}
              minSize={windowState.minSize ?? appConfig.minSize}
              zIndex={windowState.zIndex}
              isMobileOrTablet={isMobileOrTablet} // Pass down mobile status
            >
              {/* Render the actual app component */}
              <AppComponent
                windowId={windowState.id}
                onClose={() => handleCloseWindow(windowState.id)}
              />
            </Window>
          </div>
        );
      })}

      {/* Render the Taskbar */}
      <Taskbar />
    </DndProvider>
  );
};
