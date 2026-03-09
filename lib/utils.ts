import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { CATEGORY_COLORS } from "@/lib/config"

/** Merge Tailwind classes safely. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Stable hash: maps any string to an index in a palette. */
function hashIndex(str: string, len: number): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % len;
}

/**
 * Return category badge style derived from the name — no hardcoded lookup.
 * Any category from the DB gets a stable, consistent color automatically.
 * Returns valid CSS properties: `background` and `color`.
 */
export function getCatStyle(cat: string): { background: string; color: string } {
  if (!cat) return { background: '#f3f4f6', color: '#4b5563' };
  const hex = CATEGORY_COLORS[hashIndex(cat, CATEGORY_COLORS.length)];
  return { background: hex + '22', color: hex };
}

/**
 * Human-readable relative time  ("just now", "5m ago", "2h ago", "3d ago").
 * Pass a Date or ISO timestamp string.
 */
export function timeAgo(date: Date | string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 60_000)
  if (diff < 1)    return 'just now'
  if (diff < 60)   return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return `${Math.floor(diff / 1440)}d ago`
}

/** Build an initials fallback from a full name ("John Doe" → "JD"). */
export function nameFallback(fullName: string): string {
  const words = fullName.trim().split(/\s+/)
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || '?'
}
