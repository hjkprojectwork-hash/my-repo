import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getActiveCanteens, getAllItemsForMenu } from '@/services/items.service';
import { useCart } from '@/contexts/CartContext';
import { getItemImage, getItemImageFallback, getItemEmoji } from '@/services/imageMap';
import type { Canteen, Item } from '@/types';
import { ROUTES } from '@/constants';
import BackgroundLayer from '@/components/common/BackgroundLayer';
import { Link } from 'react-router-dom';

/* ─── Category chip config ─── */
const CATEGORY_META: Record<string, { emoji: string; color: string }> = {
  'All':       { emoji: '🍽️', color: 'var(--accent)' },
  'Tiffins':   { emoji: '🥞', color: '#F59E0B' },
  'Curries':   { emoji: '🍛', color: '#F97316' },
  'Meals':     { emoji: '🍚', color: '#22C55E' },
  'Beverages': { emoji: '☕', color: '#8B5CF6' },
  'Snacks':    { emoji: '🥟', color: '#EC4899' },
  'Breakfast': { emoji: '🌅', color: '#F59E0B' },
  'Lunch':     { emoji: '🍱', color: '#22C55E' },
  'Books':     { emoji: '📚', color: '#38BDF8' },
  'Stationery':{ emoji: '✏️', color: '#94A3B8' },
};

export default function Items() {
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const shopQuery = searchParams.get('shop');
  const categoryQuery = searchParams.get('category');
  const qQuery = searchParams.get('q');

  const [search, setSearch] = useState(qQuery || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryQuery || 'All');
  const [selectedCanteen, setSelectedCanteen] = useState<string>('All');

  // Canteen-first: auto-select canteen if shop=canteen
  useEffect(() => {
    if (shopQuery && canteens.length > 0) {
      const match = canteens.find(c => c.type === shopQuery || c.name.toLowerCase().includes(shopQuery.toLowerCase()));
      if (match) setTimeout(() => setSelectedCanteen(match.id), 0);
    } else if (!shopQuery) {
      setTimeout(() => setSelectedCanteen('All'), 0);
    }
  }, [shopQuery, canteens]);

  // Sync category from URL param
  useEffect(() => {
    if (categoryQuery) setSelectedCategory(categoryQuery);
  }, [categoryQuery]);

  // Sync search from URL param
  useEffect(() => {
    if (qQuery) setSearch(qQuery);
  }, [qQuery]);

  const { addToCart } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [canteensData, itemsData] = await Promise.all([
          getActiveCanteens(),
          getAllItemsForMenu()
        ]);
        setCanteens(canteensData);
        setItems(itemsData);
      } catch (err) {
        setError('Unable to load items. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categories = ['All', ...Array.from(new Set(items.map((i) => i.category).filter(Boolean)))].sort();

  const filteredItems = items.filter((item) => {
    const matchesSearch = search === '' || item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesCanteen = selectedCanteen === 'All' || item.canteen_id === selectedCanteen;
    return matchesSearch && matchesCategory && matchesCanteen;
  });

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    const newParams = new URLSearchParams(searchParams);
    if (cat === 'All') newParams.delete('category');
    else newParams.set('category', cat);
    setSearchParams(newParams, { replace: true });
  };

  if (loading) {
    return (
      <div className="page-container">
        {/* Canteen header skeleton */}
        <div className="skeleton" style={{ height: 100, borderRadius: 'var(--r-xl)', marginBottom: '1.5rem' }} />
        <div className="skeleton" style={{ height: 56, borderRadius: 'var(--r-xl)', marginBottom: '1rem' }} />
        <div className="skeleton" style={{ height: 48, borderRadius: 'var(--r-full)', marginBottom: '2rem' }} />
        <div className="grid-products">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 320, borderRadius: 'var(--r-xl)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) return (
    <div className="empty-state">
      <span className="empty-state-icon">⚠️</span>
      <h3>Error</h3>
      <p>{error}</p>
    </div>
  );

  const isBookstore = shopQuery === 'bookstore';

  return (
    <div style={{ paddingBottom: '4rem', animation: 'fadeIn 0.4s ease' }}>
      <BackgroundLayer type={isBookstore ? 'bookstore' : 'canteen'} overlayOpacity={0.82} />

      {/* ── Page Header ── */}
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '2rem clamp(1rem, 3vw, 2rem) 1.5rem',
        }}
      >
        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(0,208,132,0.10)',
              border: '1px solid rgba(0,208,132,0.25)',
              borderRadius: '9999px',
              padding: '0.25rem 0.875rem',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00D084', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#00D084', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {isBookstore ? 'Bookstore' : 'Live Menu'}
            </span>
          </div>
        </div>

        <h1
          style={{
            fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
            fontWeight: 900,
            color: '#fff',
            letterSpacing: '-0.03em',
            margin: '0 0 0.375rem',
          }}
        >
          {isBookstore ? 'Campus Bookstore' : 'Campus Canteen'}
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.50)', margin: 0 }}>
          {isBookstore
            ? 'Textbooks, lab manuals & stationery'
            : 'Reserve your meal. Skip the queue. Pick up fresh.'}
        </p>
      </div>

      {/* ── Search Bar ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(1rem, 3vw, 2rem)', marginBottom: '1rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '16px',
            overflow: 'hidden',
            backdropFilter: 'blur(12px)',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'rgba(0,208,132,0.45)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,208,132,0.10)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span style={{ padding: '0 0.875rem', color: 'rgba(255,255,255,0.35)', fontSize: '1.1rem' }}>🔍</span>
          <input
            type="text"
            placeholder={isBookstore ? 'Search textbooks, manuals…' : 'Search dosa, idli, vada, meals…'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#fff',
              fontSize: '0.95rem',
              padding: '1rem 0',
              fontFamily: 'inherit',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.40)',
                fontSize: '1.1rem',
                cursor: 'pointer',
                padding: '0 0.875rem',
                fontFamily: 'inherit',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Category Chips ── */}
      {categories.length > 1 && (
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 clamp(1rem, 3vw, 2rem)',
            marginBottom: '1.75rem',
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          {categories.slice(0, 12).map(cat => {
            const meta = CATEGORY_META[cat] || { emoji: '🍽️', color: 'var(--accent)' };
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '9999px',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 700 : 500,
                  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.12)',
                  background: isActive ? meta.color : 'rgba(255,255,255,0.05)',
                  color: isActive ? '#000' : 'rgba(255,255,255,0.70)',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                  minHeight: 40,
                  boxShadow: isActive ? `0 4px 16px ${meta.color}44` : 'none',
                }}
              >
                <span>{meta.emoji}</span>
                {cat === 'All' ? 'All Items' : cat}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Items Grid ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(1rem, 3vw, 2rem)' }}>
        {filteredItems.length === 0 ? (
          <div className="empty-state glass" style={{ borderRadius: 'var(--r-xl)' }}>
            <div className="empty-state-icon">🍽️</div>
            <h3>No items found</h3>
            <p>Try adjusting your search or category filter.</p>
            <button
              className="btn-secondary"
              onClick={() => { setSearch(''); setSelectedCategory('All'); }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.40)', marginBottom: '1rem', fontWeight: 500 }}>
              {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} available
            </p>
            <div className="grid-products">
              {filteredItems.map(item => {
                const isAvailable = item.is_available && item.available_quantity > 0;
                const stockStatus = !isAvailable ? 'out' : item.available_quantity <= 10 ? 'low' : 'good';
                const imgSrc = getItemImage(item.image_url, item.category);
                const meta = CATEGORY_META[item.category] || { emoji: getItemEmoji(item.category), color: 'var(--accent)' };

                return (
                  <div
                    key={item.id}
                    style={{
                      borderRadius: '20px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.03)',
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = 'translateY(-4px)';
                      el.style.boxShadow = '0 16px 40px rgba(0,0,0,0.45)';
                      el.style.borderColor = 'rgba(0,208,132,0.20)';
                      const img = el.querySelector('.food-img') as HTMLElement | null;
                      if (img) img.style.transform = 'scale(1.07)';
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = 'translateY(0)';
                      el.style.boxShadow = 'none';
                      el.style.borderColor = 'rgba(255,255,255,0.08)';
                      const img = el.querySelector('.food-img') as HTMLElement | null;
                      if (img) img.style.transform = 'scale(1)';
                    }}
                  >
                    {/* Image area */}
                    <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                      <Link to={ROUTES.ITEM_DETAIL.replace(':id', item.id)} style={{ display: 'block', height: '100%' }}>
                        <img
                          src={imgSrc}
                          alt={item.name}
                          className="food-img"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                          onError={(e) => {
                            const target = e.currentTarget;
                            const cdnSrc = getItemImageFallback(item.category);
                            if (target.src !== cdnSrc) {
                              target.src = cdnSrc;
                              return;
                            }
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement | null;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        {/* Emoji fallback */}
                        <div
                          style={{
                            display: 'none',
                            width: '100%',
                            height: '100%',
                            background: 'var(--bg-elevated)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '3.5rem',
                            position: 'absolute',
                            inset: 0,
                          }}
                        >
                          {meta.emoji}
                        </div>
                        {/* Gradient overlay */}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, background: 'linear-gradient(to top, rgba(6,8,10,0.70) 0%, transparent 100%)' }} />
                      </Link>

                      {/* Stock badge */}
                      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '9999px',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            background: stockStatus === 'out'
                              ? 'rgba(239,68,68,0.80)'
                              : stockStatus === 'low'
                              ? 'rgba(245,158,11,0.80)'
                              : 'rgba(0,208,132,0.80)',
                            color: '#fff',
                            backdropFilter: 'blur(8px)',
                          }}
                        >
                          {stockStatus === 'out' ? 'Sold Out' : stockStatus === 'low' ? `${item.available_quantity} left` : `${item.available_quantity} left`}
                        </span>
                      </div>

                      {/* Category chip (bottom-left) */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 10,
                          left: 10,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          background: 'rgba(0,0,0,0.60)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255,255,255,0.12)',
                          color: 'rgba(255,255,255,0.80)',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          letterSpacing: '0.04em',
                          zIndex: 5,
                        }}
                      >
                        {meta.emoji} {item.category}
                      </div>
                    </div>

                    {/* Card body */}
                    <div style={{ padding: 'clamp(0.875rem, 2vw, 1.25rem)', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <Link to={ROUTES.ITEM_DETAIL.replace(':id', item.id)} style={{ textDecoration: 'none', color: 'inherit', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: 'clamp(0.95rem, 2vw, 1.1rem)', fontWeight: 700, color: '#fff', lineHeight: 1.3, margin: 0 }}>
                          {item.name}
                        </h3>
                      </Link>

                      {item.description && (
                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5, marginBottom: '0.75rem', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.description}
                        </p>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 900, fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)', color: '#00D084' }}>₹{item.price}</span>
                        <button
                          onClick={() => isAvailable && addToCart(item, 1)}
                          disabled={!isAvailable}
                          style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: isAvailable ? 'pointer' : 'not-allowed',
                            border: isAvailable ? 'none' : '1px solid rgba(255,255,255,0.15)',
                            background: isAvailable ? '#00D084' : 'rgba(255,255,255,0.05)',
                            color: isAvailable ? '#000' : 'rgba(255,255,255,0.40)',
                            transition: 'all 0.18s ease',
                            fontFamily: 'inherit',
                            minHeight: 36,
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={e => { if (isAvailable) (e.currentTarget as HTMLElement).style.background = '#00bb75'; }}
                          onMouseLeave={e => { if (isAvailable) (e.currentTarget as HTMLElement).style.background = '#00D084'; }}
                        >
                          {isAvailable ? '+ Add' : 'Sold Out'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
