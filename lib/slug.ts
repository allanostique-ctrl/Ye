export function slugify(...parts: (string | number | boolean)[]): string {
  return parts
    .map((p) => String(p).trim().toLowerCase())
    .join('-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
