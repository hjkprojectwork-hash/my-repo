/**
 * imageMap.ts — client-side image fallback for items without image_url.
 *
 * Priority order in components:
 *   1. item.image_url (from Supabase DB, if present and non-empty)
 *   2. /images/items/<category>.webp  (local asset — most reliable)
 *   3. Unsplash CDN fallback (if local asset also fails)
 *   4. Emoji fallback (last resort, handled in components via onError)
 *
 * Do NOT use Google search-result image URLs. They are not stable.
 * Unsplash direct CDN URLs (images.unsplash.com/photo-...) ARE stable.
 */

/** Map category names to local /public/images/items/ files */
export const categoryLocalImageMap: Record<string, string> = {
  'Breakfast':   '/images/items/breakfast.webp',
  'Snacks':      '/images/items/snacks.webp',
  'Beverages':   '/images/items/beverages.webp',
  'Lunch':       '/images/items/lunch.webp',
  'Meals':       '/images/items/meals.webp',
  'Chips':       '/images/items/chips.webp',
  'Biscuits':    '/images/items/biscuits.webp',
  'Chocolates':  '/images/items/chocolates.webp',
  'Ice Creams':  '/images/items/icecream.webp',
  'Curries':     '/images/items/curries.webp',
  'Rice':        '/images/items/meals.webp',
  'Drinks':      '/images/items/beverages.webp',
  'Books':       '/images/items/books.webp',
  'Stationery':  '/images/items/stationery.webp',
  'Textbooks':   '/images/items/books.webp',
  'Lab Manuals': '/images/items/books.webp',
  '_default':    '/images/items/default.webp',
};

/**
 * Stable Unsplash CDN fallbacks (used only if local file is missing/broken).
 * These are direct image CDN endpoints, NOT Google search result URLs.
 */
export const categoryImageMap: Record<string, string> = {
  'Breakfast':   'https://images.unsplash.com/photo-1630383249896-424e482df921?w=500&q=75&auto=format',
  'Snacks':      'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500&q=75&auto=format',
  'Beverages':   'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&q=75&auto=format',
  'Lunch':       'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=75&auto=format',
  'Meals':       'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&q=75&auto=format',
  'Chips':       'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=500&q=75&auto=format',
  'Biscuits':    'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&q=75&auto=format',
  'Chocolates':  'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=500&q=75&auto=format',
  'Ice Creams':  'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=500&q=75&auto=format',
  'Curries':     'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&q=75&auto=format',
  'Rice':        'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=75&auto=format',
  'Drinks':      'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&q=75&auto=format',
  'Books':       'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&q=75&auto=format',
  'Stationery':  'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=500&q=75&auto=format',
  'Textbooks':   'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&q=75&auto=format',
  'Lab Manuals': 'https://images.unsplash.com/photo-1587118983978-0b23c4b4a2e3?w=500&q=75&auto=format',
  '_default':    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=75&auto=format',
};

/** Emoji fallbacks — final safety net when all images fail */
export const categoryEmojiMap: Record<string, string> = {
  'Breakfast':   '🥞',
  'Snacks':      '🥨',
  'Beverages':   '☕',
  'Lunch':       '🍱',
  'Meals':       '🍛',
  'Chips':       '🥔',
  'Biscuits':    '🍪',
  'Chocolates':  '🍫',
  'Ice Creams':  '🍦',
  'Curries':     '🍲',
  'Rice':        '🍚',
  'Drinks':      '🥤',
  'Books':       '📚',
  'Stationery':  '✏️',
  'Textbooks':   '📖',
  'Lab Manuals': '🔬',
  '_default':    '🍽️',
};

/**
 * Get the primary image URL for an item.
 * Priority: DB url → local /images/items/ → Unsplash CDN
 *
 * Components MUST also add an onError handler that shows the emoji fallback.
 */
export function getItemImage(
  imageUrl: string | null | undefined,
  category: string
): string {
  // 1. Use DB image if present
  if (imageUrl && imageUrl.trim() !== '') return imageUrl;
  // 2. Try local image first
  return categoryLocalImageMap[category] ?? categoryLocalImageMap['_default'];
}

/**
 * Get the Unsplash CDN fallback for when local image fails.
 * Used in onError handlers: local fails → CDN.
 */
export function getItemImageFallback(category: string): string {
  return categoryImageMap[category] ?? categoryImageMap['_default'];
}

/** Get emoji for a category (used as final visual fallback) */
export function getItemEmoji(category: string): string {
  return categoryEmojiMap[category] ?? categoryEmojiMap['_default'];
}
