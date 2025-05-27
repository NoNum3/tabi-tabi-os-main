import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/infrastructure/lib/utils";
import { List, ListOrdered } from "lucide-react";
import type { BlockTypeDropdownValue } from "@/apps/notepad/types/richTextTypes";
import { useI18n } from '@/locales/client';

interface ToolbarListButtonsProps {
  formatBulletList: () => void;
  formatNumberedList: () => void;
  blockType: BlockTypeDropdownValue;
}

export const ToolbarListButtons: React.FC<ToolbarListButtonsProps> = ({
  formatBulletList,
  formatNumberedList,
  blockType,
}) => {
  const t = useI18n();

  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        size="sm"
        title={t('notepad.bulletList', { count: 1, defaultValue: 'Bullet List' })}
        onClick={formatBulletList}
        className={cn(
          "p-1 h-8 w-8",
          blockType === "bullet" ? "bg-gray-200 dark:bg-gray-600" : "",
        )}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        title={t('notepad.numberedList', { count: 1, defaultValue: 'Numbered List' })}
        onClick={formatNumberedList}
        className={cn(
          "p-1 h-8 w-8",
          blockType === "number" ? "bg-gray-200 dark:bg-gray-600" : "",
        )}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
    </div>
  );
};
