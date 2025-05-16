"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Position, Size } from "@/types";
import { playSound } from "@/infrastructure/lib/utils";

// Define possible resize directions
export type ResizeDirection =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left"
  | "right"
  | "left"
  | "top"
  | "bottom";

interface UseWindowManagementProps {
  windowId: string;
  initialPosition: Position;
  initialSize: Size;
  minSize?: Size;
  aspectRatio?: number;
  containerRef?: React.RefObject<HTMLElement>;
  onInteractionEnd: (id: string, newPosition: Position, newSize: Size) => void;
  onFocus: (id: string) => void;
}

export const useWindowManagement = ({
  windowId,
  initialPosition,
  initialSize,
  minSize,
  aspectRatio,
  containerRef,
  onInteractionEnd,
  onFocus,
}: UseWindowManagementProps) => {
  // Initialize state directly from props
  const [position, setPosition] = useState<Position>(initialPosition);
  const [size, setSize] = useState<Size>(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<
    ResizeDirection | null
  >(null);

  // Refs to store starting values during interactions
  const startPositionRef = useRef<Position>({ x: 0, y: 0 });
  const startSizeRef = useRef<Size>({ width: 0, height: 0 });
  const startMousePositionRef = useRef<Position>({ x: 0, y: 0 });

  // Ref to store the currently playing sound instance
  const activeSoundRef = useRef<HTMLAudioElement | null>(null);

  // Sync local state with props when not dragging/resizing
  useEffect(() => {
    if (!isDragging && !isResizing) {
      setPosition(initialPosition);
      setSize(initialSize);
    }
  }, [initialPosition, initialSize, isDragging, isResizing]);

  // --- Drag Logic ---
  const handleDragStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).dataset.resizeHandle) return;
      onFocus(windowId);
      activeSoundRef.current?.pause();
      activeSoundRef.current = playSound("/sounds/loading.mp3");
      setIsDragging(true);
      setIsResizing(false);
      // Sync local state with latest props on drag start
      setPosition(initialPosition);
      setSize(initialSize);
      startPositionRef.current = { ...initialPosition };
      startMousePositionRef.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    },
    [initialPosition, initialSize, windowId, onFocus],
  );

  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - startMousePositionRef.current.x;
      const deltaY = e.clientY - startMousePositionRef.current.y;
      let newX = startPositionRef.current.x + deltaX;
      let newY = startPositionRef.current.y + deltaY;
      const currentSize = size;
      if (containerRef?.current) {
        const parentRect = containerRef.current.getBoundingClientRect();
        newX = Math.max(
          0,
          Math.min(newX, parentRect.width - currentSize.width),
        );
        newY = Math.max(
          0,
          Math.min(newY, parentRect.height - currentSize.height),
        );
      } else {
        newX = Math.max(
          0,
          Math.min(newX, window.innerWidth - currentSize.width),
        );
        newY = Math.max(
          0,
          Math.min(newY, window.innerHeight - currentSize.height),
        );
      }
      setPosition({ x: newX, y: newY });
      // Do NOT call onInteractionEnd here for smooth drag
    },
    [isDragging, size, containerRef],
  );

  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      if (activeSoundRef.current) {
        activeSoundRef.current.pause();
        activeSoundRef.current.currentTime = 0;
        activeSoundRef.current = null;
      }
      // Update atom/global state ONCE at drag end
      onInteractionEnd(windowId, position, size);
    }
  }, [isDragging, windowId, position, size, onInteractionEnd]);

  // --- Resize Logic ---
  const handleResizeStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, direction: ResizeDirection) => {
      onFocus(windowId);
      activeSoundRef.current?.pause();
      activeSoundRef.current = playSound("/sounds/loading.mp3");
      setIsResizing(true);
      setIsDragging(false);
      setResizeDirection(direction);
      startPositionRef.current = { ...position };
      startSizeRef.current = { ...size };
      startMousePositionRef.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
      e.stopPropagation();
    },
    [position, size, windowId, onFocus],
  );

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !resizeDirection) return;

      const currentMousePos = { x: e.clientX, y: e.clientY };
      const startMousePos = startMousePositionRef.current;
      const startSize = startSizeRef.current;
      const startPos = startPositionRef.current;

      const deltaX = currentMousePos.x - startMousePos.x;
      const deltaY = currentMousePos.y - startMousePos.y;

      let newWidth = startSize.width;
      let newHeight = startSize.height;
      let newX = startPos.x;
      let newY = startPos.y;

      const effectiveMinSize = {
        width: minSize?.width ?? 150,
        height: minSize?.height ?? 100,
      };

      // Calculate preliminary new dimensions based on direction
      if (resizeDirection.includes("right")) {
        newWidth = startSize.width + deltaX;
      }
      if (resizeDirection.includes("bottom")) {
        newHeight = startSize.height + deltaY;
      }
      if (resizeDirection.includes("left")) {
        const widthChange = deltaX; // Use raw delta for calculation
        newWidth = startSize.width - widthChange;
        newX = startPos.x + widthChange;
      }
      if (resizeDirection.includes("top")) {
        const heightChange = deltaY; // Use raw delta for calculation
        newHeight = startSize.height - heightChange;
        newY = startPos.y + heightChange;
      }

      // --- Aspect Ratio Enforcement ---
      if (aspectRatio) {
        // Determine primary resize axis based on direction
        const isHorizontalResize = resizeDirection.includes("left") ||
          resizeDirection.includes("right");
        const isVerticalResize = resizeDirection.includes("top") ||
          resizeDirection.includes("bottom");

        if (isHorizontalResize && !isVerticalResize) { // Only width changed
          newHeight = newWidth / aspectRatio;
        } else if (isVerticalResize && !isHorizontalResize) { // Only height changed
          newWidth = newHeight * aspectRatio;
        } else { // Corner resize - prioritize the larger change relative to aspect ratio
          const widthBasedHeight = newWidth / aspectRatio;
          const heightBasedWidth = newHeight * aspectRatio;

          // Check which axis respects the aspect ratio better given the drag
          if (
            Math.abs(newHeight - widthBasedHeight) <
              Math.abs(newWidth - heightBasedWidth)
          ) {
            // Height change was closer to aspect ratio, adjust width
            newWidth = heightBasedWidth;
          } else {
            // Width change was closer, adjust height
            newHeight = widthBasedHeight;
          }
        }

        // Adjust position if needed after aspect ratio enforcement (for left/top drags)
        if (resizeDirection.includes("left")) {
          newX = startPos.x + (startSize.width - newWidth);
        }
        if (resizeDirection.includes("top")) {
          newY = startPos.y + (startSize.height - newHeight);
        }
      }
      // --- End Aspect Ratio Enforcement ---

      // Apply minimum size constraints AFTER aspect ratio calculation
      newWidth = Math.max(effectiveMinSize.width, newWidth);
      newHeight = Math.max(effectiveMinSize.height, newHeight);

      // Re-enforce aspect ratio AFTER min size constraint, might slightly violate minSize on one axis
      if (aspectRatio) {
        if (newWidth / aspectRatio < effectiveMinSize.height) {
          newWidth = effectiveMinSize.height * aspectRatio;
        }
        if (newHeight * aspectRatio < effectiveMinSize.width) {
          newHeight = effectiveMinSize.width / aspectRatio;
        }
        // Decide which dimension dictates the final size based on which min-size was hit first
        if (newWidth / aspectRatio > newHeight) {
          newHeight = newWidth / aspectRatio; // Width dictates
        } else {
          newWidth = newHeight * aspectRatio; // Height dictates
        }
      }

      // Final boundary checks (container/window)
      if (containerRef?.current) {
        const parentRect = containerRef.current.getBoundingClientRect();
        newWidth = Math.min(newWidth, parentRect.width - newX);
        newHeight = Math.min(newHeight, parentRect.height - newY);
        newX = Math.max(0, Math.min(newX, parentRect.width - newWidth));
        newY = Math.max(0, Math.min(newY, parentRect.height - newHeight));
      } else {
        newWidth = Math.min(newWidth, window.innerWidth - newX);
        newHeight = Math.min(newHeight, window.innerHeight - newY);
        newX = Math.max(0, Math.min(newX, window.innerWidth - newWidth));
        newY = Math.max(0, Math.min(newY, window.innerHeight - newHeight));
      }

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    },
    [isResizing, resizeDirection, minSize, aspectRatio, containerRef],
  );

  const handleResizeEnd = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      setResizeDirection(null);
      if (activeSoundRef.current) {
        activeSoundRef.current.pause();
        activeSoundRef.current.currentTime = 0;
        activeSoundRef.current = null;
      }
      onInteractionEnd(windowId, position, size);
    }
  }, [isResizing, windowId, position, size, onInteractionEnd]);

  // --- Global Event Listeners ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) handleDragMove(e);
      if (isResizing) handleResizeMove(e);
    };
    const handleMouseUp = () => {
      if (isDragging) handleDragEnd();
      if (isResizing) handleResizeEnd();
    };
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isDragging,
    isResizing,
    handleDragMove,
    handleDragEnd,
    handleResizeMove,
    handleResizeEnd,
  ]);

  return {
    position,
    size,
    isDragging,
    isResizing,
    handleDragStart,
    handleResizeStart,
  };
};
