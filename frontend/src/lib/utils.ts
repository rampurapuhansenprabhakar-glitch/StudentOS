import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return "N/A";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function formatTime(timeStr: string | undefined): string {
  if (!timeStr) return "";
  return timeStr;
}

export function formatPercentage(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return "0.0%";
  return `${Number(num).toFixed(1)}%`;
}

export function formatNumber(num: number | undefined | null, decimals = 1): string {
  if (num === undefined || num === null || isNaN(num)) return "0.0";
  return Number(num).toFixed(decimals);
}
