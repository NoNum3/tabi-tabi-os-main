"use client";

import React from "react";
import { useToast } from "@/application/hooks/useToast";

interface ResetSystemProps {
  onComplete?: () => void;
}

const ResetSystem: React.FC<ResetSystemProps> = ({ onComplete }) => {
  const { toast } = useToast();

  const resetSystem = () => {
    try {
      // TEMP: Remove all localStorage for demo. Replace with selective removal in production.
      localStorage.clear();

      toast({
        title: "System reset complete",
        description: "All settings have been reset to default",
        variant: "success",
      });

      if (onComplete) onComplete();
      window.location.reload();
    } catch (error) {
      console.error("Failed to reset system:", error);
      toast({
        title: "Reset failed",
        description: "There was a problem resetting the system",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full flex justify-center">
        <button
          onClick={resetSystem}
          className="bg-destructive text-white px-4 py-2 rounded hover:bg-destructive/90"
        >
          Reset All Settings
        </button>
    </div>
  );
};

export default ResetSystem;
