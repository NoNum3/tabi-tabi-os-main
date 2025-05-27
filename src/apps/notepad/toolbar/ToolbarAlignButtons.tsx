import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/infrastructure/lib/utils";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight } from "lucide-react";
import { ElementFormatType } from "lexical";
import { useI18n } from '@/locales/client';

interface ToolbarAlignButtonsProps {
  formatElement: (align: ElementFormatType) => void;
  textAlign: ElementFormatType;
}

export const ToolbarAlignButtons: React.FC<ToolbarAlignButtonsProps> = ({
  formatElement,
  textAlign,
}) => {
  const t = useI18n();

  return (
    <div className="flex items-center mr-2 pr-2 border-r border-gray-200 dark:border-gray-700">
      <Button
        variant="ghost"
        size="sm"
        title={t('notepad.alignLeft', { count: 1 })}
        onClick={() => formatElement("left")}
        className={cn(
          "p-1 h-8 w-8",
          textAlign === "left" ? "bg-gray-200 dark:bg-gray-600" : "",
        )}
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        title={t('notepad.alignCenter', { count: 1 })}
        onClick={() => formatElement("center")}
        className={cn(
          "p-1 h-8 w-8",
          textAlign === "center" ? "bg-gray-200 dark:bg-gray-600" : "",
        )}
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        title={t('notepad.alignRight', { count: 1 })}
        onClick={() => formatElement("right")}
        className={cn(
          "p-1 h-8 w-8",
          textAlign === "right" ? "bg-gray-200 dark:bg-gray-600" : "",
        )}
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        title={t('notepad.alignJustify', { count: 1 })}
        onClick={() => formatElement("justify")}
        className={cn(
          "p-1 h-8 w-8",
          textAlign === "justify" ? "bg-gray-200 dark:bg-gray-600" : "",
        )}
      >
        <AlignJustify className="h-4 w-4" />
      </Button>
    </div>
  );
};
