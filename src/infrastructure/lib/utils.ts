import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Function to play a sound and return the Audio object
export const playSound = (soundPath: string): HTMLAudioElement | null => {
  try {
    // Check mute state from localStorage (atomWithStorage uses this key)
    if (typeof window !== "undefined") {
      const muted = window.localStorage.getItem("soundEffectsMuted");
      if (muted === "true") return null;
    }
    const audio = new Audio(soundPath);
    audio.play();
    return audio; // Return the audio object
  } catch (error) {
    console.error(`Error playing sound: ${soundPath}`, error);
    return null; // Return null on error
  }
};
