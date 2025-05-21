"use client";

// --- External Libraries ---
import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { userAtom } from '@/application/atoms/authAtoms';
import { toast } from 'sonner';

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
        data-app-icon-cell
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
    const updatePosition = useSetAtom(updateIconPositionAtom);
    const cellSize = useAtomValue(currentGridCellPixelSizeAtom); // <-- Read pixel size

    const [previewTarget, setPreviewTarget] = useState<GridPosition | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Helper to get grid gap and cell size from computed style
    const getGridMetrics = () => {
      const grid = scrollContainerRef.current;
      if (!grid) return null;
      const style = window.getComputedStyle(grid);
      const gap = parseFloat(style.gap || style.rowGap || '0');
      // Find the first icon cell
      const firstCell = grid.querySelector('[data-app-icon-cell]');
      let cellWidth = cellSize, cellHeight = cellSize;
      if (firstCell) {
        const rect = (firstCell as HTMLElement).getBoundingClientRect();
        cellWidth = rect.width;
        cellHeight = rect.height;
      }
      // Calculate columns
      const gridRect = grid.getBoundingClientRect();
      const columns = Math.max(1, Math.round((gridRect.width + gap) / (cellWidth + gap)));
      return { cellWidth, cellHeight, gap, columns, gridRect };
    };

    // Helper to find the closest cell to a given mouse position
    const getClosestCell = (clientX: number, clientY: number) => {
      const metrics = getGridMetrics();
      if (!metrics) return { row: 0, col: 0 };
      const { cellWidth, cellHeight, gap, columns, gridRect } = metrics;
      // Calculate mouse position relative to grid
      const x = clientX - gridRect.left + scrollContainerRef.current!.scrollLeft;
      const y = clientY - gridRect.top + scrollContainerRef.current!.scrollTop;
      // Find the closest col/row by minimizing distance to cell center
      let minDist = Infinity, bestRow = 0, bestCol = 0;
      // Estimate max rows (enough to cover the grid)
      const maxRows = 30;
      for (let row = 0; row < maxRows; row++) {
        for (let col = 0; col < columns; col++) {
          const cellLeft = col * (cellWidth + gap);
          const cellTop = row * (cellHeight + gap);
          const centerX = cellLeft + cellWidth / 2;
          const centerY = cellTop + cellHeight / 2;
          const dist = Math.hypot(centerX - x, centerY - y);
          if (dist < minDist) {
            minDist = dist;
            bestRow = row;
            bestCol = col;
          }
        }
      }
      return { row: bestRow, col: bestCol };
    };

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
          const { row: targetRow, col: targetCol } = getClosestCell(delta.x, delta.y);
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
            setPreviewTarget(isOccupied ? null : newTarget);
          }
        },
        drop: (item, monitor) => {
          let targetRow = previewTarget?.row;
          let targetCol = previewTarget?.col;
          if (targetRow === undefined || targetCol === undefined) {
            const clientOffset = monitor.getClientOffset();
            if (clientOffset) {
              const { row, col } = getClosestCell(clientOffset.x, clientOffset.y);
              targetRow = row;
              targetCol = col;
            } else {
              targetRow = 0;
              targetCol = 0;
            }
          }
          setPreviewTarget(null); // Clear preview on actual drop
          const currentIconPositions = iconPositions;
          const isOccupied = Object.entries(currentIconPositions).some(
            ([id, pos]) =>
              id !== item.appId && pos.row === targetRow &&
              pos.col === targetCol,
          );
          if (!isOccupied && targetRow !== undefined && targetCol !== undefined) {
            updatePosition({
              appId: item.appId,
              position: {
                row: targetRow,
                col: targetCol,
              },
            });
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
          "grid",
          "gap-2 sm:gap-3 md:gap-4",
          "touch-pan-y touch-manipulation",
          "min-h-[60vh] max-h-[100dvh]",
        )}
        style={{
          gridTemplateColumns:
            typeof window !== 'undefined' && window.innerWidth < 640
              ? `repeat(2, minmax(0, 1fr))`
              : `repeat(auto-fill, minmax(${cellSize}px, 1fr))`,
          gridAutoRows: `${cellSize}px`,
          alignContent: "start",
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
              data-app-icon-cell
            />
          );
        })}
        {/* Drop Target Cell Placeholder (behind the dragged icon) */}
        {previewTarget && isOver && (() => {
          // Debug logging
          // --- TEMP: Render placeholder regardless of occupation for debugging ---
          // if (isOccupied) return null;
          // Find the app being dragged (for faded icon)
          const draggingAppId = dashboardApps.find((app) =>
            app.id === selectedAppId
          )?.id || Object.keys(iconPositions)[0];
          const draggingApp = dashboardApps.find((app) =>
            app.id === draggingAppId
          );
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
                zIndex: 5, // Lower than the floating preview
                position: "relative",
              }}
              aria-label="Drop target"
              role="presentation"
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  border: "2.5px dashed #2563eb", // Tailwind blue-600
                  borderRadius: 16,
                  background: "rgba(59,130,246,0.10)", // blue-500/10
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.7,
                  transition: "box-shadow 0.2s, border 0.2s, background 0.2s, transform 0.18s cubic-bezier(.4,0,.2,1)",
                  boxShadow: "0 0 0 2px #2563eb44",
                }}
                aria-hidden="true"
              >
                {draggingApp && (
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
                )}
              </div>
            </div>
          );
        })()}
        {/* Drop Preview Indicator (floating, above the drop cell) */}
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
                zIndex: 20,
                position: "relative",
              }}
              aria-label="Drop target preview"
              role="presentation"
            >
              <div
                style={{
                  opacity: 0.7,
                  filter: "drop-shadow(0 8px 32px rgba(37,99,235,0.7)) drop-shadow(0 0px 0px #000)",
                  width: "110%",
                  height: "110%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "3.5px solid #2563eb", // Tailwind blue-600
                  borderRadius: 18,
                  background: "rgba(59,130,246,0.18)", // blue-500/15
                  transition: "box-shadow 0.2s, border 0.2s, background 0.2s, transform 0.18s cubic-bezier(.4,0,.2,1)",
                  transform: "scale(1.08)",
                  animation: "fadeInScale 0.18s cubic-bezier(.4,0,.2,1)",
                }}
                aria-hidden="true"
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

// Helper to get the localized app name
export function getAppName(app: AppRegistration, t: ReturnType<typeof useI18n>): string {
  const key = app.nameKey || app.id;
  let label = t(key, { count: 1 });
  if (label === key) {
    label = app.id.charAt(0).toUpperCase() + app.id.slice(1);
  }
  return label;
}

// Main component to display all app icons and windows
export const AppsIcons = () => {
  const user = useAtomValue(userAtom);
  const windows = useAtomValue(windowRegistryAtom);
  const openWindow = useSetAtom(openWindowAtom);
  const closeWindow = useSetAtom(closeWindowAtom);
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
          nameKey: config.nameKey || appId, // Use the correct nameKey from appRegistry, fallback to appId
          src: config.src,
          defaultSize: config.defaultSize,
          minSize: config.minSize,
          category: config.category,
          component: config.component,
        };
      })
      .filter((app): app is AppRegistration => app !== null); // Simple filter for non-null
  }, [addedAppIds]);

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
      // Sign-in and availability checks (same as Sidebar)
      const signInRequiredApps = [
        "notepad",
        "music", // assuming this is the id for YouTube Music
        "bookmarks",
        "calculator",
        "calendar"
      ];
      if (signInRequiredApps.includes(appId) && !user) {
        toast(t('signInRequiredToast', { count: 1 }));
        return;
      }
      const isAvailable = appId in appRegistry && addedAppIds.includes(appId);
      if (!isAvailable) {
        toast(t('appUnavailableToast', { count: 1 }));
        return;
      }
      const appConfig = dashboardApps.find((app) => app.id === appId);

      if (!appConfig) {
        return;
      }

      playSound("/sounds/open.mp3");
      const windowInstanceId = `${appId}-instance-${Date.now()}`;

      const windowPayload = {
        id: windowInstanceId,
        appId: appId,
        title: getAppName(appConfig, t),
        minSize: appConfig.minSize,
        initialSize: appConfig.defaultSize,
        children: React.createElement(appConfig.component, {
          windowId: windowInstanceId,
          onClose: () => handleCloseWindow(windowInstanceId),
        }),
      };

      openWindow(windowPayload);
      setSelectedIcon(appId);
    },
    [dashboardApps, openWindow, t, handleCloseWindow, user, addedAppIds], // Added handleCloseWindow and user dependencies
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
      windowsToCloseNow.forEach((id) => closeWindow(id));
    }
    // Keep dependencies, appRegistry is static so doesn't need to be listed
  }, [windows, closeWindow, windowsToRender]); // Removed dashboardApps from dependencies

  // Add event listener for 'open-app' to open apps from sidebar
  useEffect(() => {
    const handler = (event: CustomEvent) => {
      if (event.detail && event.detail.appId) {
        openAppWindow(event.detail.appId);
      }
    };
    window.addEventListener('open-app', handler as EventListener);
    return () => window.removeEventListener('open-app', handler as EventListener);
  }, [openAppWindow]);

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
              title={getAppName(appConfig, t)}
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

export default AppsIcons;
