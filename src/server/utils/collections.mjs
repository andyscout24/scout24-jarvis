export function newestFirst(items, field = "createdAt") {
  return [...items].sort((a, b) => new Date(b[field] || 0) - new Date(a[field] || 0));
}

export function parseLimit(value, fallback = 50) {
  const parsed = Number(value || fallback);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
