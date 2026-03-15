import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/*
=====================================
Tailwind Class Merge Utility
=====================================
*/

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}