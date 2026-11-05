/** Small formatting helpers shared by the blog list, post page and the Writing section. */

/** The API returns readTime as a number of minutes; older content used strings like "5 min read". */
export function formatReadTime(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return `${value} min read`;
  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? `${trimmed} min read` : trimmed;
}

export function formatPostDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
