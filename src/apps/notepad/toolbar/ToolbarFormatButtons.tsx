import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/infrastructure/lib/utils";
import { Bold, Italic, Underline } from "lucide-react";
import { TextFormatType } from "lexical";
import { useI18n } from '@/locales/client';

interface ToolbarFormatButtonsProps {
  formatText: (format: TextFormatType) => void;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
}

export const ToolbarFormatButtons: React.FC<ToolbarFormatButtonsProps> = ({
  formatText,
  isBold,
  isItalic,
  isUnderline,
}) => {
  const t = useI18n();

  return (
    <div className="flex items-center mr-2 pr-2 border-r border-gray-200 dark:border-gray-700">
      <Button
        variant="ghost"
        size="sm"
        title={t('notepad.bold', { count: 1 })}
        onClick={() => formatText("bold")}
        className={cn(
          "p-1 h-8 w-8",
          isBold ? "bg-gray-200 dark:bg-gray-600" : "",
        )}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        title={t('notepad.italic', { count: 1 })}
        onClick={() => formatText("italic")}
        className={cn(
          "p-1 h-8 w-8",
          isItalic ? "bg-gray-200 dark:bg-gray-600" : "",
        )}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        title={t('notepad.underline', { count: 1 })}
        onClick={() => formatText("underline")}
        className={cn(
          "p-1 h-8 w-8",
          isUnderline ? "bg-gray-200 dark:bg-gray-600" : "",
        )}
      >
        <Underline className="h-4 w-4" />
      </Button>
    </div>
  );
};
