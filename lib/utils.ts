import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { CATEGORY_STYLES } from "@/lib/config"

/** Merge Tailwind classes safely. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Return category badge style, falling back to neutral grey. */
export function getCatStyle(cat: string): { bg: string; color: string } {
  return CATEGORY_STYLES[cat] ?? { bg: '#f3f4f6', color: '#4b5563' }
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
