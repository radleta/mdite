// Cache for memoizing slug results
const slugCache = new Map<string, string>();

export function slugify(text: string): string {
  // Check cache first
  const cached = slugCache.get(text);
  if (cached !== undefined) {
    return cached;
  }

  // Compute slug
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Cache result
  slugCache.set(text, slug);

  return slug;
}

/**
 * Clear the slug cache.
 * Useful for testing or when you need to free memory.
 */
export function clearSlugCache(): void {
  slugCache.clear();
}

/**
 * Get statistics about the slug cache.
 * Useful for debugging and performance analysis.
 */
export function getSlugCacheStats() {
  return {
    size: slugCache.size,
    entries: Array.from(slugCache.entries()),
  };
}
