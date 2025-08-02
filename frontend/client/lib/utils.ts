import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  // Fallback se clsx ou twMerge não estiverem disponíveis
  if (typeof twMerge !== "function" || typeof clsx !== "function") {
    return inputs.filter(Boolean).join(" ");
  }
  return twMerge(clsx(inputs));
}

export type { ClassValue };
