import { useEffect, useState, useRef } from "react";
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
import { ReportIcon } from "@/components/shared/ReportIcon";
import { FeedbackIcon } from "@/components/shared/FeedbackIcon";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { submitAppReport } from '@/infrastructure/utils/report';
import { useI18n } from '@/locales/client';
import { supabase } from '@/infrastructure/lib/supabaseClient';
import { appRegistry } from '@/config/appRegistry';

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

const REPORT_COOLDOWN_KEY = (appId: string) => `tabi-report-cooldown-${appId}`;
const FEEDBACK_COOLDOWN_KEY = (appId: string) => `tabi-feedback-cooldown-${appId}`;
const COOLDOWN_SECONDS = 1800; // 30 minutes

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

  // Add modal state for report/feedback
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  // Add state for form values, errors, char count, loading, and cooldown
  const [reportDesc, setReportDesc] = useState("");
  const [reportEmail, setReportEmail] = useState("");
  const [reportError, setReportError] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportCooldown, setReportCooldown] = useState<number>(0);
  const [feedbackDesc, setFeedbackDesc] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackCooldown, setFeedbackCooldown] = useState<number>(0);
  const [toastMsg, setToastMsg] = useState("");
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  const reportMin = 10, reportMax = 300, feedbackMin = 5, feedbackMax = 200;

  const t = useI18n();

  // Helper to format seconds as mm:ss
  const formatCooldown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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

  // Cooldown timer effect
  useEffect(() => {
    if (reportCooldown > 0) {
      const t = setTimeout(() => setReportCooldown(reportCooldown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [reportCooldown]);
  useEffect(() => {
    if (feedbackCooldown > 0) {
      const t = setTimeout(() => setFeedbackCooldown(feedbackCooldown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [feedbackCooldown]);
  // Toast auto-hide
  useEffect(() => {
    if (toastMsg) {
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setToastMsg(""), 4000);
    }
  }, [toastMsg]);

  // Add to Window component
  useEffect(() => {
    // On mount, check localStorage for report/feedback cooldowns
    const appId = windowId.split('-')[0];
    const reportExpiry = localStorage.getItem(REPORT_COOLDOWN_KEY(appId));
    if (reportExpiry) {
      const secondsLeft = Math.floor((parseInt(reportExpiry, 10) - Date.now()) / 1000);
      if (secondsLeft > 0) setReportCooldown(secondsLeft);
    }
    const feedbackExpiry = localStorage.getItem(FEEDBACK_COOLDOWN_KEY(appId));
    if (feedbackExpiry) {
      const secondsLeft = Math.floor((parseInt(feedbackExpiry, 10) - Date.now()) / 1000);
      if (secondsLeft > 0) setFeedbackCooldown(secondsLeft);
    }
    // eslint-disable-next-line
  }, []);

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

  const appConfig = appRegistry[currentWindowState?.appId];

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
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-primary-foreground truncate" id="window-title">
            {title}
          </h2>
          {/* Version info tooltip */}
          {typeof window !== 'undefined' && appConfig?.version && (
            <span
              tabIndex={0}
              aria-label={`Version: ${appConfig.version}${appConfig.lastUpdated ? `, Last updated: ${appConfig.lastUpdated}` : ''}`}
              className="ml-2 text-xs text-primary-foreground/70 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring rounded"
              title={`Version: ${appConfig.version}${appConfig.lastUpdated ? `\nLast updated: ${appConfig.lastUpdated}` : ''}`}
            >
              v{appConfig.version}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Report Bug Icon Button */}
          <button
            aria-label="Report a bug"
            className="icon-btn text-destructive hover:bg-destructive/10 focus:bg-destructive/20 active:scale-95 transition-transform rounded p-1 focus:outline-none focus:ring-2 focus:ring-ring"
            onClick={() => setShowReportModal(true)}
            tabIndex={0}
            type="button"
          >
            <ReportIcon className="w-5 h-5" />
          </button>
          {/* Feedback Icon Button */}
          <button
            aria-label="Send feedback"
            className="icon-btn text-accent hover:bg-accent/10 focus:bg-accent/20 active:scale-95 transition-transform rounded p-1 focus:outline-none focus:ring-2 focus:ring-ring"
            onClick={() => setShowFeedbackModal(true)}
            tabIndex={0}
            type="button"
          >
            <FeedbackIcon className="w-5 h-5" />
          </button>
          <WindowControls
            onMinimize={() => minimizeWindow(windowId)}
            onMaximize={handleMaximize}
            onRestore={handleRestore}
            onClose={onClose}
            isMaximized={isMaximized}
          />
        </div>
      </div>

      {/* Report Modal (UI only) */}
      {showReportModal && (
        <div role="dialog" aria-modal="true" aria-labelledby="report-modal-title" className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <h3 id="report-modal-title" className="text-lg font-semibold mb-2">{t('reportBug', { count: 1, default: 'Report a Bug' })}</h3>
            <form
              onSubmit={async e => {
                e.preventDefault();
                setReportError("");
                if (reportDesc.trim().length < reportMin) {
                  setReportError(`${t('reportDescriptionError', { count: 1, min: reportMin })}`);
                  return;
                }
                if (reportCooldown > 0) {
                  setReportError(`${t('waitSeconds', { count: reportCooldown, seconds: formatCooldown(reportCooldown) })}`);
                  return;
                }
                setReportLoading(true);
                const appId = windowId.split('-')[0];
                const appVersion = appConfig?.version || 'unknown';
                const website = '';
                const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
                let userId: string | undefined = undefined;
                try {
                  const { data: userData } = await supabase.auth.getUser();
                  userId = userData?.user?.id;
                } catch {}
                const error = await submitAppReport({
                  app_id: appId,
                  app_version: appVersion,
                  type: 'bug',
                  description: reportDesc,
                  email: reportEmail || null,
                  website,
                  user_agent: userAgent,
                  status: 'new',
                  user_id: userId || null,
                });
                setReportLoading(false);
                if (error) {
                  setReportError(`${t('reportError', { count: 1, default: 'Failed to submit. Please try again later.' })}`);
                  return;
                }
                setShowReportModal(false);
                setReportDesc("");
                setReportEmail("");
                const expiry = Date.now() + COOLDOWN_SECONDS * 1000;
                localStorage.setItem(REPORT_COOLDOWN_KEY(appId), expiry.toString());
                setReportCooldown(COOLDOWN_SECONDS);
                setToastMsg(`${t('reportThankYou', { count: 1, default: 'Thank you for your report!' })}`);
              }}
              aria-describedby="report-error report-char"
            >
              {/* Honeypot field for bots */}
              <input type="text" name="website" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
              <label htmlFor="report-description" className="block text-sm font-medium mb-1">{t('reportDescriptionLabel', { count: 1, default: 'Description' })} <span className="text-destructive">*</span></label>
              <textarea
                id="report-description"
                className="w-full border rounded p-2 mb-1"
                rows={3}
                required
                aria-required="true"
                minLength={reportMin}
                maxLength={reportMax}
                placeholder={t('reportDescriptionPlaceholder', { count: 1, min: reportMin })}
                value={reportDesc}
                onChange={e => {
                  setReportDesc(e.target.value);
                  setReportError("");
                }}
                aria-invalid={!!reportError}
                aria-describedby="report-error report-char"
              />
              <div className="flex justify-between text-xs mb-2" id="report-char">
                <span className={reportDesc.length < reportMin ? "text-destructive" : "text-muted-foreground"}>
                  {reportDesc.length}/{reportMax} {t('chars', { count: 1, default: 'chars' })}
                </span>
                {reportCooldown > 0 && (
                  <span className="text-warning">
                    {t('waitSeconds', { count: reportCooldown, seconds: formatCooldown(reportCooldown) })}
                  </span>
                )}
              </div>
              <label htmlFor="report-email" className="block text-sm font-medium mb-1">{t('reportEmailLabel', { count: 1, default: 'Email (optional)' })}</label>
              <input
                id="report-email"
                type="email"
                className="w-full border rounded p-2 mb-3"
                placeholder="you@email.com"
                value={reportEmail}
                onChange={e => setReportEmail(e.target.value)}
                autoComplete="email"
              />
              <div className="flex gap-2 justify-end">
                <button type="button" className="px-3 py-1 rounded bg-muted text-muted-foreground" onClick={() => { setShowReportModal(false); setReportDesc(""); setReportEmail(""); setReportError(""); }}>{t('cancel', { count: 1, default: 'Cancel' })}</button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-destructive text-destructive-foreground disabled:opacity-50 flex items-center gap-2"
                  disabled={reportLoading || reportDesc.trim().length < reportMin || reportDesc.length > reportMax || reportCooldown > 0}
                  aria-disabled={reportLoading || reportDesc.trim().length < reportMin || reportDesc.length > reportMax || reportCooldown > 0}
                >
                  {reportLoading && <LoadingSpinner className="w-4 h-4" />} {t('submit', { count: 1, default: 'Submit' })}
                </button>
              </div>
              <div id="report-error" className="text-destructive text-xs mt-1 min-h-[1em]" aria-live="polite">{reportError && t('reportError', { count: 1, default: reportError })}</div>
            </form>
          </div>
        </div>
      )}
      {/* Feedback Modal (UI only) */}
      {showFeedbackModal && (
        <div role="dialog" aria-modal="true" aria-labelledby="feedback-modal-title" className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <h3 id="feedback-modal-title" className="text-lg font-semibold mb-2">{t('sendFeedback', { count: 1, default: 'Send Feedback' })}</h3>
            <form
              onSubmit={async e => {
                e.preventDefault();
                setFeedbackError("");
                if (feedbackDesc.trim().length < feedbackMin) {
                  setFeedbackError(`${t('feedbackDescriptionError', { count: 1, min: feedbackMin })}`);
                  return;
                }
                if (feedbackCooldown > 0) {
                  setFeedbackError(`${t('waitSeconds', { count: feedbackCooldown, seconds: formatCooldown(feedbackCooldown) })}`);
                  return;
                }
                setFeedbackLoading(true);
                const appId = windowId.split('-')[0];
                const appVersion = appConfig?.version || 'unknown';
                const website = '';
                const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
                let userId: string | undefined = undefined;
                try {
                  const { data: userData } = await supabase.auth.getUser();
                  userId = userData?.user?.id;
                } catch {}
                const error = await submitAppReport({
                  app_id: appId,
                  app_version: appVersion,
                  type: 'feedback',
                  description: feedbackDesc,
                  email: feedbackEmail || null,
                  website,
                  user_agent: userAgent,
                  status: 'new',
                  user_id: userId || null,
                });
                setFeedbackLoading(false);
                if (error) {
                  setFeedbackError(`${t('feedbackError', { count: 1, default: 'Failed to submit. Please try again later.' })}`);
                  return;
                }
                setShowFeedbackModal(false);
                setFeedbackDesc("");
                setFeedbackEmail("");
                const feedbackExpiry = Date.now() + COOLDOWN_SECONDS * 1000;
                localStorage.setItem(FEEDBACK_COOLDOWN_KEY(appId), feedbackExpiry.toString());
                setFeedbackCooldown(COOLDOWN_SECONDS);
                setToastMsg(`${t('feedbackThankYou', { count: 1, default: 'Thank you for your feedback!' })}`);
              }}
              aria-describedby="feedback-error feedback-char"
            >
              {/* Honeypot field for bots */}
              <input type="text" name="website" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
              <label htmlFor="feedback-description" className="block text-sm font-medium mb-1">{t('feedbackDescriptionLabel', { count: 1, default: 'Feedback' })} <span className="text-destructive">*</span></label>
              <textarea
                id="feedback-description"
                className="w-full border rounded p-2 mb-1"
                rows={3}
                required
                aria-required="true"
                minLength={feedbackMin}
                maxLength={feedbackMax}
                placeholder={t('feedbackDescriptionPlaceholder', { count: 1, min: feedbackMin })}
                value={feedbackDesc}
                onChange={e => {
                  setFeedbackDesc(e.target.value);
                  setFeedbackError("");
                }}
                aria-invalid={!!feedbackError}
                aria-describedby="feedback-error feedback-char"
              />
              <div className="flex justify-between text-xs mb-2" id="feedback-char">
                <span className={feedbackDesc.length < feedbackMin ? "text-destructive" : "text-muted-foreground"}>
                  {feedbackDesc.length}/{feedbackMax} {t('chars', { count: 1, default: 'chars' })}
                </span>
                {feedbackCooldown > 0 && (
                  <span className="text-warning">
                    {t('waitSeconds', { count: feedbackCooldown, seconds: formatCooldown(feedbackCooldown) })}
                  </span>
                )}
              </div>
              <label htmlFor="feedback-email" className="block text-sm font-medium mb-1">{t('feedbackEmailLabel', { count: 1, default: 'Email (optional)' })}</label>
              <input
                id="feedback-email"
                type="email"
                className="w-full border rounded p-2 mb-3"
                placeholder="you@email.com"
                value={feedbackEmail}
                onChange={e => setFeedbackEmail(e.target.value)}
                autoComplete="email"
              />
              <div className="flex gap-2 justify-end">
                <button type="button" className="px-3 py-1 rounded bg-muted text-muted-foreground" onClick={() => { setShowFeedbackModal(false); setFeedbackDesc(""); setFeedbackEmail(""); setFeedbackError(""); }}>{t('cancel', { count: 1, default: 'Cancel' })}</button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded bg-accent text-accent-foreground disabled:opacity-50 flex items-center gap-2"
                  disabled={feedbackLoading || feedbackDesc.trim().length < feedbackMin || feedbackDesc.length > feedbackMax || feedbackCooldown > 0}
                  aria-disabled={feedbackLoading || feedbackDesc.trim().length < feedbackMin || feedbackDesc.length > feedbackMax || feedbackCooldown > 0}
                >
                  {feedbackLoading && <LoadingSpinner className="w-4 h-4" />} {t('submit', { count: 1, default: 'Submit' })}
                </button>
              </div>
              <div id="feedback-error" className="text-destructive text-xs mt-1 min-h-[1em]" aria-live="polite">{feedbackError && t('feedbackError', { count: 1, default: feedbackError })}</div>
            </form>
          </div>
        </div>
      )}
      {/* Toast/Snackbar for feedback */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded shadow-lg z-[10001] text-sm" role="status" aria-live="polite">{toastMsg && t(toastMsg.includes('report') ? 'reportThankYou' : 'feedbackThankYou', { count: 1, default: toastMsg })}</div>
      )}

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
