import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, locale: string = "en") {
  const d = new Date(date);
  return d.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date, locale: string = "en") {
  const d = new Date(date);
  return d.toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatScore(score: number, decimals: number = 2): string {
  return score.toFixed(decimals);
}

export function getLocalizedText(
  obj: { [key: string]: any },
  field: string,
  locale: string
): string {
  const localeField = `${field}_${locale}`;
  return obj[localeField] || obj[`${field}_en`] || obj[field] || "";
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    archived: "bg-gray-100 text-gray-500",
  };
  return colors[status] || colors.draft;
}

export function getLevelColor(level: number): string {
  const colors: Record<number, string> = {
    0: "bg-gray-200 text-gray-700",
    1: "bg-red-100 text-red-700",
    2: "bg-orange-100 text-orange-700",
    3: "bg-yellow-100 text-yellow-700",
    4: "bg-green-100 text-green-700",
    5: "bg-emerald-100 text-emerald-700",
  };
  return colors[level] || colors[0];
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    high: "bg-red-100 text-red-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-green-100 text-green-700",
  };
  return colors[priority] || colors.medium;
}
