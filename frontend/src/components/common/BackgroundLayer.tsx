type BackgroundType = 'dashboard' | 'canteen' | 'bookstore' | 'product' | 'neutral' | 'staff' | 'login';

interface BackgroundLayerProps {
  type?: BackgroundType;
  /** Override overlay opacity (0–1). Default varies by type. */
  overlayOpacity?: number;
}

// High-quality campus & contextual background images from Unsplash CDN
const BG_IMAGES: Record<BackgroundType, string> = {
  // Campus building — used on login/auth pages
  login:     'url("https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?q=85&w=1920&auto=format&fit=crop")',
  // Campus overview — hero image for student dashboard
  dashboard: 'url("https://images.unsplash.com/photo-1562774053-701939374585?q=85&w=1920&auto=format&fit=crop")',
  // Campus canteen / food-court setting
  canteen:   'url("https://images.unsplash.com/photo-1567521464027-f127ff144326?q=85&w=1920&auto=format&fit=crop")',
  // Campus library / bookstore
  bookstore: 'url("https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=85&w=1920&auto=format&fit=crop")',
  // Product / detail view
  product:   'url("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=85&w=1920&auto=format&fit=crop")',
  // Staff / management
  staff:     'url("https://images.unsplash.com/photo-1514190051997-0f6f39ca5cde?q=85&w=1920&auto=format&fit=crop")',
  // Plain dark base
  neutral:   'none',
};

export default function BackgroundLayer({ type = 'neutral', overlayOpacity }: BackgroundLayerProps) {
  const bgImage = BG_IMAGES[type];
  const defaultOpacity = type === 'neutral' ? 1 : 0.82;
  const opacity = overlayOpacity ?? defaultOpacity;

  return (
    <>
      {/* Background image layer */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -2,
          backgroundImage: bgImage,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          transition: 'background-image 0.4s ease-in-out',
          willChange: 'transform',
        }}
        aria-hidden="true"
      />
      {/* Dark overlay for text legibility */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          background: type === 'neutral'
            ? 'linear-gradient(160deg, #090C15 0%, #050709 100%)'
            : `linear-gradient(to bottom, rgba(5,7,12,${opacity}) 0%, rgba(5,7,12,${Math.min(opacity + 0.08, 1)}) 100%)`,
          transition: 'background 0.4s ease-in-out',
        }}
        aria-hidden="true"
      />
    </>
  );
}
