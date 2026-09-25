import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants';
import BackgroundLayer from '@/components/common/BackgroundLayer';
import { supabase } from '@/lib/supabase';

/* ─── Canteen categories ─── */
const CATEGORIES = [
  {
    id: 'Tiffins',
    label: 'Tiffins',
    emoji: '🥞',
    desc: 'Dosa, Idli, Vada & more',
    img: '/images/items/tiffins.jpg',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.22)',
  },
  {
    id: 'Curries',
    label: 'Curries',
    emoji: '🍛',
    desc: 'Paneer, Dal, Veg curries',
    img: '/images/items/curries.jpg',
    color: '#F97316',
    bg: 'rgba(249,115,22,0.12)',
    border: 'rgba(249,115,22,0.22)',
  },
  {
    id: 'Meals',
    label: 'Meals',
    emoji: '🍚',
    desc: 'Full meals & rice plates',
    img: '/images/items/meals.jpg',
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.22)',
  },
  {
    id: 'Beverages',
    label: 'Beverages',
    emoji: '☕',
    desc: 'Coffee, Tea, Buttermilk',
    img: '/images/items/beverages.jpg',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.12)',
    border: 'rgba(139,92,246,0.22)',
  },
  {
    id: 'Snacks',
    label: 'Snacks',
    emoji: '🥟',
    desc: 'Samosa, Bajji, Punugulu',
    img: '/images/items/snacks.jpg',
    color: '#EC4899',
    bg: 'rgba(236,72,153,0.12)',
    border: 'rgba(236,72,153,0.22)',
  },
];

/* ─── Today's favorites ─── */
const POPULAR_ITEMS = [
  {
    name: 'Masala Dosa',
    price: '₹45',
    category: 'Tiffins',
    desc: 'Crispy dosa with potato masala & chutneys',
    img: '/images/items/hero_dosa.jpg',
    to: `${ROUTES.ITEMS}?shop=canteen&category=Tiffins`,
  },
  {
    name: 'Idli (2 pcs)',
    price: '₹25',
    category: 'Tiffins',
    desc: 'Soft steamed idli with sambar & coconut chutney',
    img: '/images/items/tiffins.jpg',
    to: `${ROUTES.ITEMS}?shop=canteen&category=Tiffins`,
  },
  {
    name: 'South Indian Meals',
    price: '₹80',
    category: 'Meals',
    desc: 'Rice, dal, sambar, rasam, two curries & papad',
    img: '/images/items/meals.jpg',
    to: `${ROUTES.ITEMS}?shop=canteen&category=Meals`,
  },
  {
    name: 'Paneer Butter Masala',
    price: '₹70',
    category: 'Curries',
    desc: 'Rich creamy paneer curry with butter & spices',
    img: '/images/items/curries.jpg',
    to: `${ROUTES.ITEMS}?shop=canteen&category=Curries`,
  },
  {
    name: 'Filter Coffee',
    price: '₹20',
    category: 'Beverages',
    desc: 'Strong South Indian filter coffee with foam',
    img: '/images/items/beverages.jpg',
    to: `${ROUTES.ITEMS}?shop=canteen&category=Beverages`,
  },
  {
    name: 'Punugulu',
    price: '₹30',
    category: 'Snacks',
    desc: 'Crispy urad dal fritters with mint & sambar',
    img: '/images/items/snacks.jpg',
    to: `${ROUTES.ITEMS}?shop=canteen&category=Snacks`,
  },
];

/* ─── Quick Actions ─── */
const QUICK_ACTIONS = [
  {
    to: ROUTES.RESERVATIONS,
    icon: '📦',
    label: 'My Orders',
    desc: 'Track & pick up your reservations',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.10)',
    border: 'rgba(167,139,250,0.22)',
  },
  {
    to: ROUTES.CART,
    icon: '🛒',
    label: 'My Cart',
    desc: 'Review items & reserve',
    color: '#00D084',
    bg: 'rgba(0,208,132,0.10)',
    border: 'rgba(0,208,132,0.22)',
  },
  {
    to: ROUTES.PROFILE,
    icon: '👤',
    label: 'My Profile',
    desc: 'View & edit your details',
    color: '#F87171',
    bg: 'rgba(248,113,113,0.10)',
    border: 'rgba(248,113,113,0.22)',
  },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`${ROUTES.ITEMS}?shop=canteen&q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(`${ROUTES.ITEMS}?shop=canteen`);
    }
  };

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <BackgroundLayer type="dashboard" overlayOpacity={0.82} />

      {/* ── HERO ── */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '0 0 32px 32px',
          marginBottom: '2.5rem',
          minHeight: 'clamp(380px, 55vw, 560px)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Background food image */}
        <img
          src="/images/items/hero_dosa.jpg"
          alt="Masala Dosa"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center right',
          }}
        />
        {/* Dark gradient overlay — strong on left, soft on right */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(105deg, rgba(6,8,10,0.97) 0%, rgba(6,8,10,0.88) 45%, rgba(6,8,10,0.40) 75%, rgba(6,8,10,0.15) 100%)',
          }}
        />
        {/* Bottom fade */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 120,
            background: 'linear-gradient(to top, rgba(6,8,10,0.95) 0%, transparent 100%)',
          }}
        />

        {/* Hero content */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            maxWidth: 1200,
            margin: '0 auto',
            padding: 'clamp(2rem, 5vw, 3.5rem) clamp(1.25rem, 5vw, 2.5rem)',
          }}
        >
          {/* Eyebrow badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(0,208,132,0.12)',
              border: '1px solid rgba(0,208,132,0.30)',
              borderRadius: '9999px',
              padding: '0.3rem 1rem',
              marginBottom: '1.25rem',
              animation: 'fadeIn 0.5s ease',
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00D084', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#00D084', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Live Menu · Campus Central Canteen
            </span>
          </div>

          {/* Greeting */}
          <p style={{ color: 'rgba(255,255,255,0.60)', fontSize: 'clamp(0.9rem, 2vw, 1.05rem)', fontWeight: 500, marginBottom: '0.25rem', animation: 'slideInUp 0.4s ease' }}>
            {greeting}, {displayName} 👋
          </p>

          {/* Main headline */}
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 5.5vw, 3.25rem)',
              fontWeight: 900,
              color: '#fff',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginBottom: '0.5rem',
              animation: 'slideInUp 0.45s ease',
            }}
          >
            Fresh food.
          </h1>
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 5.5vw, 3.25rem)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginBottom: '1.25rem',
              background: 'linear-gradient(135deg, #00D084 0%, #F59E0B 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'slideInUp 0.5s ease',
            }}
          >
            Zero queue.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 'clamp(0.875rem, 2vw, 1rem)', marginBottom: '2rem', maxWidth: 400, lineHeight: 1.6, animation: 'slideInUp 0.55s ease' }}>
            Reserve your meal before you reach the counter. Pick up instantly, skip the line.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ animation: 'slideInUp 0.6s ease', marginBottom: '1.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.09)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '16px',
                overflow: 'hidden',
                maxWidth: 480,
                backdropFilter: 'blur(12px)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,208,132,0.5)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,208,132,0.12)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ padding: '0 0.875rem', color: 'rgba(255,255,255,0.40)', fontSize: '1.1rem' }}>🔍</span>
              <input
                type="text"
                placeholder="Search dosa, idli, vada, meals…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontSize: '0.95rem',
                  padding: '0.9rem 0',
                  fontFamily: 'inherit',
                }}
              />
              <button
                type="submit"
                style={{
                  background: '#00D084',
                  border: 'none',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  padding: '0.9rem 1.25rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#00bb75')}
                onMouseLeave={e => (e.currentTarget.style.background = '#00D084')}
              >
                Search
              </button>
            </div>
          </form>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', animation: 'slideInUp 0.65s ease' }}>
            <Link
              to={`${ROUTES.ITEMS}?shop=canteen`}
              id="dashboard-browse-menu"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.8rem 1.75rem',
                borderRadius: '14px',
                background: '#00D084',
                color: '#000',
                fontWeight: 800,
                fontSize: '0.95rem',
                textDecoration: 'none',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 4px 20px rgba(0,208,132,0.35)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,208,132,0.45)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,208,132,0.35)';
              }}
            >
              🍽️ Browse Today's Menu
            </Link>
            <Link
              to={ROUTES.RESERVATIONS}
              id="dashboard-my-orders"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.8rem 1.5rem',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.95rem',
                textDecoration: 'none',
                backdropFilter: 'blur(8px)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.13)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'}
            >
              📦 View My Orders
            </Link>
          </div>
        </div>
      </section>

      {/* ── WHAT ARE YOU CRAVING? (Category Cards) ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(1rem, 3vw, 2rem)', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.35rem)', fontWeight: 800, color: '#fff', margin: 0 }}>
            What are you craving? 🤔
          </h2>
          <Link to={`${ROUTES.ITEMS}?shop=canteen`} style={{ fontSize: '0.85rem', color: '#00D084', fontWeight: 600, textDecoration: 'none' }}>
            View all →
          </Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(140px, 18vw, 180px), 1fr))',
            gap: 'clamp(0.75rem, 2vw, 1.25rem)',
          }}
        >
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat.id}
              to={`${ROUTES.ITEMS}?shop=canteen&category=${cat.id}`}
              style={{
                textDecoration: 'none',
                borderRadius: '20px',
                overflow: 'hidden',
                border: `1px solid ${cat.border}`,
                background: cat.bg,
                backdropFilter: 'blur(12px)',
                position: 'relative',
                minHeight: 'clamp(130px, 18vw, 170px)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                transition: 'transform 0.22s ease, box-shadow 0.22s ease',
                animation: `fadeIn 0.5s ease ${i * 0.08}s both`,
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(-4px)';
                el.style.boxShadow = `0 12px 32px ${cat.color}33`;
                const img = el.querySelector('img') as HTMLElement | null;
                if (img) img.style.transform = 'scale(1.07)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = 'none';
                const img = el.querySelector('img') as HTMLElement | null;
                if (img) img.style.transform = 'scale(1)';
              }}
            >
              {/* Category image */}
              <img
                src={cat.img}
                alt={cat.label}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.4s ease',
                  opacity: 0.55,
                }}
              />
              {/* Gradient overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(to top, rgba(6,8,10,0.92) 0%, rgba(6,8,10,0.40) 60%, transparent 100%)`,
                }}
              />
              {/* Text */}
              <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(0.75rem, 2vw, 1rem)' }}>
                <span style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', display: 'block', marginBottom: '0.25rem' }}>{cat.emoji}</span>
                <p style={{ fontWeight: 800, color: '#fff', fontSize: 'clamp(0.875rem, 1.8vw, 1rem)', lineHeight: 1.2, margin: 0 }}>{cat.label}</p>
                <p style={{ fontSize: 'clamp(0.7rem, 1.3vw, 0.75rem)', color: 'rgba(255,255,255,0.55)', marginTop: '0.15rem', margin: 0 }}>{cat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── TODAY'S SPECIAL ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(1rem, 3vw, 2rem)', marginBottom: '2.5rem' }}>
        <Link
          to={`${ROUTES.ITEMS}?shop=canteen&category=Tiffins`}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 'clamp(1rem, 3vw, 2rem)',
            alignItems: 'center',
            background: 'linear-gradient(135deg, rgba(245,158,11,0.14) 0%, rgba(0,208,132,0.10) 100%)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: '24px',
            overflow: 'hidden',
            padding: 'clamp(1.25rem, 3vw, 2rem)',
            textDecoration: 'none',
            position: 'relative',
            transition: 'transform 0.22s ease, box-shadow 0.22s ease',
            animation: 'fadeIn 0.6s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(245,158,11,0.20)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLElement).style.boxShadow = 'none';
          }}
        >
          {/* Content */}
          <div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(245,158,11,0.18)',
                border: '1px solid rgba(245,158,11,0.35)',
                color: '#F59E0B',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                marginBottom: '0.875rem',
              }}
            >
              ⭐ Today's Special
            </span>
            <h3 style={{ fontSize: 'clamp(1.25rem, 3.5vw, 1.75rem)', fontWeight: 900, color: '#fff', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
              Masala Dosa
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.60)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem', maxWidth: 380 }}>
              Crispy golden dosa stuffed with spiced potato masala. Served with coconut chutney, peanut chutney & hot sambar.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 900, color: '#00D084' }}>₹45</span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: '#00D084',
                  color: '#000',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                }}
              >
                Order Now →
              </span>
            </div>
          </div>

          {/* Image */}
          <div
            style={{
              width: 'clamp(100px, 18vw, 180px)',
              height: 'clamp(100px, 18vw, 180px)',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid rgba(245,158,11,0.35)',
              flexShrink: 0,
              boxShadow: '0 8px 32px rgba(245,158,11,0.25)',
            }}
          >
            <img
              src="/images/items/hero_dosa.jpg"
              alt="Masala Dosa"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </Link>
      </section>

      {/* ── POPULAR ON CAMPUS ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(1rem, 3vw, 2rem)', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.35rem)', fontWeight: 800, color: '#fff', margin: 0 }}>
            🔥 Popular on Campus
          </h2>
          <Link to={`${ROUTES.ITEMS}?shop=canteen`} id="dashboard-explore-all" style={{ fontSize: '0.85rem', color: '#00D084', fontWeight: 600, textDecoration: 'none' }}>
            See all items →
          </Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(160px, 25vw, 220px), 1fr))',
            gap: 'clamp(0.75rem, 2vw, 1.25rem)',
          }}
        >
          {POPULAR_ITEMS.map((item, i) => (
            <Link
              key={item.name}
              to={item.to}
              style={{
                textDecoration: 'none',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
                animation: `fadeIn 0.5s ease ${0.1 + i * 0.07}s both`,
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(-4px)';
                el.style.boxShadow = '0 16px 40px rgba(0,0,0,0.40)';
                el.style.borderColor = 'rgba(0,208,132,0.22)';
                const img = el.querySelector('img') as HTMLElement | null;
                if (img) img.style.transform = 'scale(1.07)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(0)';
                el.style.boxShadow = 'none';
                el.style.borderColor = 'rgba(255,255,255,0.08)';
                const img = el.querySelector('img') as HTMLElement | null;
                if (img) img.style.transform = 'scale(1)';
              }}
            >
              {/* Image */}
              <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                <img
                  src={item.img}
                  alt={item.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(to top, rgba(6,8,10,0.70) 0%, transparent 100%)' }} />
                <span
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    background: 'rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(8px)',
                    color: 'rgba(255,255,255,0.80)',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  {item.category}
                </span>
              </div>
              {/* Info */}
              <div style={{ padding: 'clamp(0.75rem, 2vw, 1rem)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: 'clamp(0.875rem, 1.8vw, 1rem)', fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: '0.35rem' }}>
                  {item.name}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.50)', lineHeight: 1.4, marginBottom: '0.875rem', flex: 1 }}>
                  {item.desc}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: 'clamp(1rem, 2vw, 1.15rem)', color: '#00D084' }}>{item.price}</span>
                  <span
                    style={{
                      background: 'rgba(0,208,132,0.12)',
                      border: '1px solid rgba(0,208,132,0.25)',
                      color: '#00D084',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      padding: '0.3rem 0.75rem',
                      borderRadius: '10px',
                    }}
                  >
                    + Add
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── QUICK ACTIONS ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(1rem, 3vw, 2rem)' }}>
        <h2 style={{ fontSize: 'clamp(1.1rem, 3vw, 1.35rem)', fontWeight: 800, color: '#fff', marginBottom: '1.25rem' }}>
          Quick Actions
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(200px, 28vw, 320px), 1fr))',
            gap: 'clamp(0.75rem, 2vw, 1.25rem)',
          }}
        >
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
                padding: 'clamp(1rem, 2.5vw, 1.25rem) clamp(1rem, 2.5vw, 1.5rem)',
                borderRadius: '18px',
                background: action.bg,
                border: `1px solid ${action.border}`,
                backdropFilter: 'blur(12px)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                animation: `fadeIn 0.5s ease ${0.15 + i * 0.1}s both`,
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(-3px)';
                el.style.boxShadow = `0 12px 30px ${action.color}22`;
              }}
              onMouseLeave={e => {
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
