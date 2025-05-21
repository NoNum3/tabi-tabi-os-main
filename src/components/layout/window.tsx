import { useEffect, useState } from "react";
import { useAtom } from "jotai"; // Import useAtom
import { windowRegistryAtom } from "@/application/atoms/windowAtoms"; // Import base registry
import { useAtomValue } from "jotai"; // Use useAtomValue for read-only
import {
  ResizeDirection,
  useWindowManagement,
} from "@/application/hooks/useWindowManagement";
import { Position, Size } from "@/types"; // Updated path, added Position
import { cn } from "@/infrastructure/lib/utils";
import {
  focusWindowAtom,
  minimizeWindowAtom,
  updateWindowPositionSizeAtom,
} from "@/application/atoms/windowAtoms"; // Import Jotai atoms
import { WindowControls } from "./WindowControls";

interface WindowProps {
  windowId: string; // Unique identifier for this window instance
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  // State now comes from the global atom, passed down from AppsIcons
  initialSize: Size;
  initialPosition: Position;
  minSize?: Size;
  aspectRatio?: number;
  zIndex: number; // Pass zIndex for styling
  // Added isMobileOrTablet prop
  isMobileOrTablet: boolean;
  // Removed defaultSize as initialSize/Position are now required
}

const Window: React.FC<WindowProps> = ({
  windowId,
  title,
  children,
  isOpen,
  onClose,
  initialSize,
  initialPosition,
  minSize,
  aspectRatio,
  zIndex,
  isMobileOrTablet,
}) => {
  // Get the whole registry state
  const registry = useAtomValue(windowRegistryAtom);
  // Find the specific state for this windowId
  const currentWindowState = registry[windowId];
  // Get isMinimized state, default to false if window not found (shouldn't happen if isOpen)
  const isMinimized = currentWindowState?.isMinimized ?? false;

  // Add mounted state to handle hydration issues
  const [isMounted, setIsMounted] = useState(false);

  // State to store window dimensions
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  // Get Jotai setters for focus and update actions
  const focusWindow = useAtom(focusWindowAtom)[1];
  const updateWindowPositionSize = useAtom(updateWindowPositionSizeAtom)[1];
  const minimizeWindow = useAtom(minimizeWindowAtom)[1];

  // Maximize/Restore state
  const [isMaximized, setIsMaximized] = useState(false);
  const [prevSize, setPrevSize] = useState<Size | null>(null);
  const [prevPosition, setPrevPosition] = useState<Position | null>(null);

  // Maximize handler
  const handleMaximize = () => {
    setPrevSize(size);
    setPrevPosition(position);
    setIsMaximized(true);
    // Set window to fill the entire screen (no margin)
    updateWindowPositionSize({
      id: windowId,
      position: { x: 0, y: 0 },
      size: {
        width: windowDimensions.width,
        height: windowDimensions.height,
      },
    });
  };

  // Restore handler
  const handleRestore = () => {
    if (prevSize && prevPosition) {
      updateWindowPositionSize({
        id: windowId,
        position: prevPosition,
        size: prevSize,
      });
    }
    setIsMaximized(false);
  };

  // If window is resized/moved while maximized, update prevSize/prevPosition
  useEffect(() => {
    if (isMaximized) {
      setPrevSize(prev => prev || size);
      setPrevPosition(prev => prev || position);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMaximized]);

  // Effect to update dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial dimensions
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Effect to handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Adjust initial position and size for mobile/tablet
  const adjustedInitialPosition = isMobileOrTablet
    ? {
      // Position the window to match the menubar's position (respecting parent container padding)
      x: 0, // The menubar starts at x:0 relative to its container
      y: 36 + 4, // Menubar height (36px) + 4px gap
    }
    : initialPosition;

  const adjustedInitialSize = isMobileOrTablet
    ? {
      // Match the width of the menubar (full width)
      width: windowDimensions.width - 2 * 16, // Full width minus padding on both sides (p-4 = 16px)
      height: Math.min(
        windowDimensions.height * 0.8,
        windowDimensions.height - (36 + 4 + 16), // Account for menubar + gap + bottom padding
      ),
    }
    : initialSize;

  // Always use the latest position/size from the atom for rendering
  const position = currentWindowState?.position ?? adjustedInitialPosition;
  const size = currentWindowState?.size ?? adjustedInitialSize;

  // Callback for the hook to update global state
  const handleInteractionEnd = (
    id: string,
    newPosition: Position,
    newSize: Size,
  ) => {
    updateWindowPositionSize({ id, position: newPosition, size: newSize });
  };

  // Callback for the hook to focus the window
  const handleFocus = (id: string) => {
    focusWindow(id);
  };

  // Use the hook only for drag/resize, not for canonical state
  const { handleDragStart, handleResizeStart, isDragging, isResizing, position: dragPosition, size: dragSize } =
    useWindowManagement({
      windowId,
      initialSize: adjustedInitialSize,
      initialPosition: adjustedInitialPosition,
      minSize,
      aspectRatio,
      onInteractionEnd: handleInteractionEnd,
      onFocus: handleFocus,
    });

  // Use drag/resize position/size during interaction, otherwise atom state
  // This ensures real-time, smooth dragging and resizing
  let renderPosition: Position;
  let renderSize: Size;
  let windowTransitionClass = "transition-all duration-150";
  if (isDragging || isResizing) {
    renderPosition = dragPosition;
    renderSize = dragSize;
    windowTransitionClass = ""; // Remove transition during drag for instant feedback
  } else {
    renderPosition = position;
    renderSize = size;
    windowTransitionClass = "transition-all duration-150";
  }

  // Don't render if not mounted (to prevent hydration mismatch) or not open
  if (!isMounted || !isOpen) {
    return null;
  }

  // --- Resize Handles --- (Keep existing handle definitions)
  const handleBaseClass = "absolute z-[1001] select-none"; // zIndex might need adjustment relative to window zIndex
  const cornerHandleClass = `${handleBaseClass} w-5 h-5`;
  const edgeHandleClass = handleBaseClass;

  const handles: {
    className: string;
    direction: ResizeDirection;
    style?: React.CSSProperties;
  }[] = [
    // Corners
    {
      className: cn(cornerHandleClass, "bottom-[-3px] right-[-3px]"),
      direction: "bottom-right",
      style: {
        cursor: "nwse-resize",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRight: "1px solid rgba(255, 255, 255, 0.1)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      },
    },
    {
      className: cn(cornerHandleClass, "bottom-[-3px] left-[-3px]"),
      direction: "bottom-left",
      style: {
        cursor: "nesw-resize",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      },
    },
    {
      className: cn(cornerHandleClass, "top-[-3px] right-[-3px]"),
      direction: "top-right",
      style: {
        cursor: "nesw-resize",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRight: "1px solid rgba(255, 255, 255, 0.1)",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
      },
    },
    {
      className: cn(cornerHandleClass, "top-[-3px] left-[-3px]"),
      direction: "top-left",
      style: {
        cursor: "nwse-resize",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
      },
    },
    // Edges
    {
      className: cn(edgeHandleClass, "top-5 bottom-5 right-[-3px] w-[6px]"),
      direction: "right",
      style: { cursor: "ew-resize" },
    },
    {
      className: cn(edgeHandleClass, "top-5 bottom-5 left-[-3px] w-[6px]"),
      direction: "left",
      style: { cursor: "ew-resize" },
    },
    {
      className: cn(edgeHandleClass, "left-5 right-5 bottom-[-3px] h-[6px]"),
      direction: "bottom",
      style: { cursor: "ns-resize" },
    },
    {
      className: cn(edgeHandleClass, "left-5 right-5 top-[-3px] h-[6px]"),
      direction: "top",
      style: { cursor: "ns-resize" },
    },
  ];

  // Bring window to front when clicked anywhere on it
  const handleWindowFocus = () => {
    handleFocus(windowId);
  };

  // Hide resize handles when maximized or on mobile/tablet
  const shouldShowResizeHandles = !isMobileOrTablet && !isMaximized;

  // Mobile-specific styling
  const mobileWindowStyles: React.CSSProperties = isMobileOrTablet
    ? {
        position: 'fixed',
        left: 0,
        top: 48, // below the mobile menubar (h-12 = 48px)
        width: '100vw',
        height: 'calc(100dvh - 48px)',
        minWidth: '100vw',
        minHeight: 'calc(100dvh - 48px)',
        maxWidth: '100vw',
        maxHeight: 'calc(100dvh - 48px)',
        borderRadius: 0,
        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
        border: 'none',
        zIndex: 9999,
      }
    : {};

  return (
    <div
      className={`bg-background border border-border rounded-lg shadow-xl flex flex-col overflow-hidden ${windowTransitionClass} ${
        isMobileOrTablet ? "mobile-window" : isMaximized ? '' : 'absolute'
      }`}
      style={
        isMobileOrTablet
          ? mobileWindowStyles
          : ({
              position: isMaximized ? 'fixed' : 'absolute',
              left: isMaximized ? 0 : `${renderPosition.x}px`,
              top: isMaximized ? 0 : `${renderPosition.y}px`,
              width: isMaximized ? '100vw' : `${renderSize.width}px`,
              height: isMaximized ? '100vh' : `${renderSize.height}px`,
              zIndex: isMaximized ? 9999 : zIndex,
              ...(isMinimized
                ? {
                    position: "fixed" as React.CSSProperties['position'],
                    display: "flex",
                    opacity: 1,
                    pointerEvents: "none",
                  }
                : { display: "flex" }),
            } as React.CSSProperties)
      }
      onMouseDown={handleWindowFocus} // Bring window to front on click
    >
      {/* Title Bar */}
      <div
        className={`bg-primary px-3 py-2 border-b border-border flex justify-between items-center select-none h-10 ${
          isMobileOrTablet
            ? "mobile-title-bar px-4 bg-primary rounded-none"
            : !isMaximized ? "cursor-move rounded-t-md" : ""
        }`}
        onMouseDown={(!isMobileOrTablet && !isMaximized) ? handleDragStart : undefined} // Only allow dragging on desktop and not maximized
      >
        <h2 className="text-sm font-semibold text-primary-foreground truncate">
          {title}
        </h2>
        <WindowControls
          onMinimize={() => minimizeWindow(windowId)}
          onMaximize={handleMaximize}
          onRestore={handleRestore}
          onClose={onClose}
          isMaximized={isMaximized}
        />
      </div>

      {/* Content Area */}
      <div
        className={`flex-grow p-1 overflow-auto bg-background text-foreground transition-all duration-200`}
        style={isMinimized
          ? {
            opacity: 0,
            pointerEvents: "none",
            height: "1px",
            minHeight: 0,
            padding: 0,
            position: "absolute",
            width: "1px",
            overflow: "hidden",
            zIndex: -1,
            // ARIA: hide from screen readers when minimized
            visibility: "hidden",
          }
          : {}}
        aria-hidden={isMinimized ? "true" : undefined}
        tabIndex={isMinimized ? -1 : undefined}
      >
        {children}
      </div>

      {/* Render Resize Handles only on desktop and not maximized */}
      {shouldShowResizeHandles &&
        handles.map((handle) => (
          <div
            key={handle.direction}
            className={handle.className}
            style={handle.style}
            data-resize-handle="true"
            // Attach resize handler to the handle itself
            onMouseDown={(e) => {
              e.stopPropagation(); // Prevent window focus handler
              handleResizeStart(e, handle.direction);
            }}
          />
        ))}
    </div>
  );
};

export default Window;
