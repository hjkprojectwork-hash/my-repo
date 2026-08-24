import React from 'react';

type BackgroundType = 'dashboard' | 'canteen' | 'bookstore' | 'product' | 'neutral' | 'staff';

interface BackgroundLayerProps {
  type?: BackgroundType;
}

export default function BackgroundLayer({ type = 'neutral' }: BackgroundLayerProps) {
  const images = {
    dashboard: 'url("https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1600&auto=format&fit=crop")',
    canteen: 'url("https://images.unsplash.com/photo-1551221761-46abcc7c9803?q=80&w=1600&auto=format&fit=crop")',
    bookstore: 'url("https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1600&auto=format&fit=crop")',
    product: 'url("https://images.unsplash.com/photo-1606787619248-f301830a5a57?q=80&w=1600&auto=format&fit=crop")',
    staff: 'url("https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=1600&auto=format&fit=crop")',
    neutral: 'none',
  };

  return (
    <>
      <div 
        style={{ 
          position: 'fixed', 
          inset: 0, 
          zIndex: -2,
          backgroundImage: images[type], 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          transition: 'background-image 0.3s ease-in-out'
        }} 
        aria-hidden="true"
      />
      {/* Heavy dark overlay ensures text legibility and premium dark mode feel */}
      <div 
        style={{ 
          position: 'fixed', 
          inset: 0, 
          zIndex: -1, 
          background: type === 'neutral' 
            ? 'linear-gradient(to bottom, #0A0F16, #05070A)' 
            : 'rgba(5, 7, 10, 0.85)',
          transition: 'background 0.3s ease-in-out'
        }} 
        aria-hidden="true"
      />
    </>
  );
}
