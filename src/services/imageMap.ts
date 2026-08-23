/**
 * imageMap.ts — client-side image fallback for items without image_url.
 *
 * Uses reliable Unsplash photo URLs (direct image endpoints, not search pages).
 * This map is a UI-only fallback; it does NOT modify the database.
 *
 * Priority order in components:
 *   1. item.image_url (from Supabase DB)
 *   2. categoryImageMap[item.category]
 *   3. emoji fallback
 */

export const categoryImageMap: Record<string, string> = {
  // Canteen food categories
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

  // Bookstore categories
  'Books':       'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&q=75&auto=format',
  'Stationery':  'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=500&q=75&auto=format',
  'Textbooks':   'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&q=75&auto=format',
  'Lab Manuals': 'https://images.unsplash.com/photo-1587118983978-0b23c4b4a2e3?w=500&q=75&auto=format',

  // Default fallback for unknown categories
  '_default':    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=75&auto=format',
};

/** Emoji fallbacks when images fail completely */
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
 * Get the best image URL for an item.
 * Returns the DB image_url if valid, otherwise the category fallback.
 */
export function getItemImage(
  imageUrl: string | null | undefined,
  category: string
): string {
  if (imageUrl && imageUrl.trim() !== '') return imageUrl;
  return categoryImageMap[category] ?? categoryImageMap['_default'];
}

/**
 * Get the emoji fallback for a category.
 */
export function getItemEmoji(category: string): string {
  return categoryEmojiMap[category] ?? categoryEmojiMap['_default'];
}
