import { Minus, Maximize2, Square, X } from 'lucide-react';
import React from 'react';

interface WindowControlsProps {
  onMinimize: () => void;
  onMaximize: () => void;
  onRestore: () => void;
  onClose: () => void;
  isMaximized: boolean;
}

export const WindowControls: React.FC<WindowControlsProps> = ({
  onMinimize,
  onMaximize,
  onRestore,
  onClose,
  isMaximized,
}) => (
  <div className="flex items-center gap-1 ml-2 select-none">
    <button
      aria-label="Minimize"
      title="Minimize"
      onClick={onMinimize}
      className="w-8 h-8 flex items-center justify-center rounded transition-all duration-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        bg-transparent text-primary-foreground
        hover:bg-accent/70 hover:text-primary-foreground
        dark:hover:bg-accent/60 dark:hover:text-primary-foreground
        active:scale-95"
      tabIndex={0}
    >
      <Minus size={18} />
    </button>
    {isMaximized ? (
      <button
        aria-label="Restore"
        title="Restore"
        onClick={onRestore}
        className="w-8 h-8 flex items-center justify-center rounded transition-all duration-100 focus:outline-none
          bg-transparent text-primary-foreground
          hover:bg-accent/70 hover:text-primary-foreground
          dark:hover:bg-accent/60 dark:hover:text-primary-foreground
          active:scale-95"
        tabIndex={0}
      >
        <Square size={18} />
      </button>
    ) : (
      <button
        aria-label="Maximize"
        title="Maximize"
        onClick={onMaximize}
        className="w-8 h-8 flex items-center justify-center rounded transition-all duration-100 focus:outline-none
          bg-transparent text-primary-foreground
          hover:bg-accent/70 hover:text-primary-foreground
          dark:hover:bg-accent/60 dark:hover:text-primary-foreground
          active:scale-95"
        tabIndex={0}
      >
        <Maximize2 size={18} />
      </button>
    )}
    <button
      aria-label="Close"
      title="Close"
      onClick={onClose}
      className="w-8 h-8 flex items-center justify-center rounded transition-all duration-100 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2
        bg-transparent text-primary-foreground
        hover:bg-destructive/80 hover:text-white
        dark:hover:bg-destructive dark:hover:text-white
        active:scale-95"
      tabIndex={0}
    >
      <X size={18} />
    </button>
  </div>
); 