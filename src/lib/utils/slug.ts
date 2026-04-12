export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildEventTypeSlug(title: string): string {
  const base = slugify(title) || "meeting";
  const suffix = Math.random().toString(36).slice(2, 8);

  return `${base}-${suffix}`;
}
