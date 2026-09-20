/**
 * Formats a plain calendar date (e.g. trip dates: "2026-06-01") as "Jun 1, 2026".
 * Parses the Y/M/D components directly into a local Date instead of via the ISO
 * string parser, so the displayed day never shifts because of the viewer's timezone.
 */
export function formatDate(value: string): string {
  const [year, month, day] = value.split(" ")[0].split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Formats a UTC timestamp (SQLite's "YYYY-MM-DD HH:MM:SS", no timezone marker)
 * as e.g. "Jun 1, 2026, 3:45 PM" in the viewer's own locale and timezone.
 */
export function formatDateTime(value: string): string {
  const isoLike = value.includes(" ") ? `${value.replace(" ", "T")}Z` : value;
  return new Date(isoLike).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
