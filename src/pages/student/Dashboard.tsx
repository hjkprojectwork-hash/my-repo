import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants';
import BackgroundLayer from '@/components/common/BackgroundLayer';
import { supabase } from '@/lib/supabase';

/* ─── Static featured "booking" tiles (like the reference image) ─── */
const FEATURED_TILES = [
  {
    id: 'canteen',
    to: `${ROUTES.ITEMS}?shop=canteen`,
    label: 'Canteen',
    category: 'Food & Drinks',
    emoji: '🍔',
    // Warm food photography
    img: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?q=80&w=800&auto=format&fit=crop',
    color: '#F59E0B',
    colorBg: 'rgba(245,158,11,0.18)',
    desc: 'Hot meals, snacks & beverages',
    badge: 'Live Menu',
  },
  {
    id: 'bookstore',
    to: `${ROUTES.ITEMS}?shop=bookstore`,
    label: 'Bookstore',
    category: 'Books & Stationery',
    emoji: '📚',
    // Library shelves
    img: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=800&auto=format&fit=crop',
    color: '#38BDF8',
    colorBg: 'rgba(56,189,248,0.18)',
    desc: 'Textbooks, lab manuals & stationery',
    badge: 'Pre-Order',
  },
];

/* ─── Quick stats / action cards ─── */
const QUICK_ACTIONS = [
  {
    to: ROUTES.RESERVATIONS,
    icon: '📦',
    label: 'My Orders',
    desc: 'Track pending pickups',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.10)',
    border: 'rgba(167,139,250,0.22)',
  },
  {
    to: ROUTES.CART,
    icon: '🛒',
    label: 'My Cart',
    desc: 'Review & checkout',
    color: '#34D399',
    bg: 'rgba(52,211,153,0.10)',
    border: 'rgba(52,211,153,0.22)',
  },
  {
    to: ROUTES.PROFILE,
    icon: '👤',
    label: 'My Profile',
    desc: 'View & edit details',
    color: '#F87171',
    bg: 'rgba(248,113,113,0.10)',
    border: 'rgba(248,113,113,0.22)',
  },
];

/* ─── Random item preview images (shown as a discovery row) ─── */
const DISCOVERY_ITEMS = [
  {
    img: 'https://images.unsplash.com/photo-1630383249896-424e482df921?q=80&w=400&auto=format&fit=crop',
    name: 'Breakfast Plate',
    price: '₹65',
    to: `${ROUTES.ITEMS}?shop=canteen`,
  },
  {
    img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=400&auto=format&fit=crop',
    name: 'Cold Beverages',
    price: '₹40',
    to: `${ROUTES.ITEMS}?shop=canteen`,
  },
  {
    img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=400&auto=format&fit=crop',
    name: 'South Indian Thali',
    price: '₹90',
    to: `${ROUTES.ITEMS}?shop=canteen`,
  },
  {
    img: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=400&auto=format&fit=crop',
    name: 'Textbooks',
    price: 'from ₹120',
    to: `${ROUTES.ITEMS}?shop=bookstore`,
  },
  {
    img: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?q=80&w=400&auto=format&fit=crop',
    name: 'Stationery',
    price: 'from ₹20',
    to: `${ROUTES.ITEMS}?shop=bookstore`,
  },
  {
    img: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=400&auto=format&fit=crop',
    name: 'Snack Pack',
    price: '₹35',
    to: `${ROUTES.ITEMS}?shop=canteen`,
  },
];

function ArrowButton({ to, color = 'var(--accent)' }: { to: string; color?: string }) {
  return (
    <Link
      to={to}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: color,
        color: '#fff',
        flexShrink: 0,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        boxShadow: `0 4px 16px ${color}55`,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1.12) rotate(12deg)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1) rotate(0deg)';
      }}
      aria-label="Go"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [studentName, setStudentName] = useState<string>('');
  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        const d = data as { name?: string } | null;
        if (d?.name) setStudentName(d.name.split(' ')[0]);
      });
  }, [user]);

  const displayName = studentName || user?.email?.split('@')[0] || 'Student';

  return (
    <div style={{ padding: '1.25rem', maxWidth: 1200, margin: '0 auto', minHeight: 'calc(100vh - 60px)' }}>
      <BackgroundLayer type="dashboard" overlayOpacity={0.78} />

      {/* ── Hero Greeting ── */}
      <section
        style={{
          position: 'relative',
          borderRadius: '28px',
          overflow: 'hidden',
          marginBottom: '2rem',
          minHeight: 260,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '2.5rem',
          background: 'linear-gradient(135deg, rgba(16,217,138,0.12) 0%, rgba(56,189,248,0.08) 100%)',
          border: '1px solid rgba(255,255,255,0.09)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      >
        {/* Campus building illustration as decorative right image */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url("https://images.unsplash.com/photo-1562774053-701939374585?q=75&w=1200&auto=format&fit=crop")',
            backgroundSize: 'cover',
            backgroundPosition: 'center right',
            opacity: 0.18,
            zIndex: 0,
          }}
        />
        {/* Gradient mask over the image */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(8,9,14,0.95) 40%, rgba(8,9,14,0.35) 100%)',
            zIndex: 1,
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, animation: 'slideInUp 0.5s ease forwards' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(16,217,138,0.12)',
              border: '1px solid rgba(16,217,138,0.28)',
              borderRadius: '9999px',
              padding: '0.3rem 0.875rem',
              marginBottom: '1rem',
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              CampusOne Portal
            </span>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1rem', fontWeight: 500, marginBottom: '0.3rem' }}>
            {greeting},
          </p>
          <h1
            style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginBottom: '1rem',
            }}
          >
            {displayName} 👋
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.60)', fontSize: '1.05rem', marginBottom: '1.75rem', maxWidth: 420 }}>
            Reserve your campus food &amp; books before heading out — skip the queue every time.
          </p>

          <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
            <Link
              to={`${ROUTES.ITEMS}?shop=canteen`}
              id="dashboard-browse-canteen"
              className="btn-primary"
              style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}
            >
              🍔 Browse Canteen
            </Link>
            <Link
              to={`${ROUTES.ITEMS}?shop=bookstore`}
              id="dashboard-browse-bookstore"
              className="btn-secondary"
              style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}
            >
              📚 Bookstore
            </Link>
          </div>
        </div>
      </section>

      {/* ── Featured Booking Tiles (reference image style) ── */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>Browse Shops</h2>
          <Link to={ROUTES.ITEMS} style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            See all →
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {FEATURED_TILES.map((tile, i) => (
            <div
              key={tile.id}
              style={{
                position: 'relative',
                borderRadius: '24px',
                overflow: 'hidden',
                minHeight: 220,
                border: '1px solid rgba(255,255,255,0.08)',
                animation: `fadeIn 0.5s ease ${i * 0.12}s both`,
                cursor: 'pointer',
              }}
            >
              {/* Background image */}
              <img
                src={tile.img}
                alt={tile.label}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.4s ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              />
              {/* Dark gradient overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(5,7,12,0.95) 0%, rgba(5,7,12,0.50) 55%, transparent 100%)',
                }}
              />

              {/* Content overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '1.25rem 1.5rem',
                  zIndex: 2,
                }}
              >
                {/* Top badge */}
                <div>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: tile.colorBg,
                      border: `1px solid ${tile.color}44`,
                      color: tile.color,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.3rem 0.75rem',
                      borderRadius: '9999px',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: tile.color, display: 'inline-block' }} />
                    {tile.badge}
                  </span>
                </div>

                {/* Bottom: name + arrow button */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>
                      {tile.category}
                    </p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{tile.label}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.60)', marginTop: '0.25rem' }}>{tile.desc}</p>
                  </div>
                  <ArrowButton to={tile.to} color={tile.color} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Discovery Row: Random item previews ── */}
      <section style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>Discover Items</h2>
          <Link to={ROUTES.ITEMS} id="dashboard-explore-all" style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
            Explore all →
          </Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '0.875rem',
          }}
        >
          {DISCOVERY_ITEMS.map((item, i) => (
            <Link
              key={item.name}
              to={item.to}
              style={{
                textDecoration: 'none',
                borderRadius: '18px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(10px)',
                transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
                animation: `fadeIn 0.5s ease ${0.1 + i * 0.07}s both`,
                display: 'block',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(-4px)';
                el.style.boxShadow = '0 12px 32px rgba(0,0,0,0.40)';
                el.style.borderColor = 'rgba(16,217,138,0.20)';
                const img = el.querySelector('img') as HTMLElement | null;
                if (img) img.style.transform = 'scale(1.08)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = 'none';
                el.style.borderColor = 'rgba(255,255,255,0.07)';
                const img = el.querySelector('img') as HTMLElement | null;
                if (img) img.style.transform = 'scale(1)';
              }}
            >
              <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden' }}>
                <img
                  src={item.img}
                  alt={item.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                />
              </div>
              <div style={{ padding: '0.75rem' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: '0.2rem' }}>{item.name}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 700 }}>{item.price}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Quick Actions ── */}
      <section>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '1.25rem' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {QUICK_ACTIONS.map((action, i) => (
            <Link
              key={action.to}
              to={action.to}
              id={`dashboard-action-${action.label.toLowerCase().replace(/\s/g, '-')}`}
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1.25rem 1.5rem',
                borderRadius: '18px',
                background: action.bg,
                border: `1px solid ${action.border}`,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                animation: `fadeIn 0.5s ease ${0.15 + i * 0.1}s both`,
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(-3px)';
                el.style.boxShadow = `0 12px 30px ${action.color}22`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = 'none';
              }}
            >
              <span
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '14px',
                  background: `${action.color}18`,
                  border: `1px solid ${action.color}33`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  flexShrink: 0,
                }}
              >
                {action.icon}
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', marginBottom: '0.15rem' }}>{action.label}</p>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.50)' }}>{action.desc}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={action.color} strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
