import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getActiveCanteens, getAvailableItems } from '@/services/items.service';
import { useCart } from '@/contexts/CartContext';
import { getItemImage, getItemEmoji } from '@/services/imageMap';
import type { Canteen, Item } from '@/types';
import { ROUTES } from '@/constants';
import BackgroundLayer from '@/components/common/BackgroundLayer';

export default function Items() {
  const [canteens, setCanteens] = useState<Canteen[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const shopQuery = searchParams.get('shop');

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCanteen, setSelectedCanteen] = useState<string>('All');

  // Match the shop query to a canteen ID if possible
  useEffect(() => {
    if (shopQuery && canteens.length > 0) {
      const match = canteens.find(c => c.type === shopQuery || c.name.toLowerCase().includes(shopQuery.toLowerCase()));
      if (match) setSelectedCanteen(match.id);
    } else {
      setSelectedCanteen('All');
    }
  }, [shopQuery, canteens]);

  const { addToCart } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [canteensData, itemsData] = await Promise.all([
          getActiveCanteens(),
          getAvailableItems()
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

  const categories = ['All', ...Array.from(new Set(items.map((i) => i.category)))].sort();

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesCanteen = selectedCanteen === 'All' || item.canteen_id === selectedCanteen;
    return matchesSearch && matchesCategory && matchesCanteen;
  });

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem', padding: '2rem 0' }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 320, borderRadius: 'var(--r-xl)' }} />
        ))}
      </div>
    );
  }

  if (error) return <div className="empty-state"><span className="empty-state-icon">⚠️</span><h3>Error</h3><p>{error}</p></div>;

  return (
    <div style={{ padding: '1rem', maxWidth: 1200, margin: '0 auto', minHeight: 'calc(100vh - 60px)', animation: 'fadeIn 0.4s ease' }}>
      <BackgroundLayer type={shopQuery === 'canteen' ? 'canteen' : 'bookstore'} />
      
      <div className="page-header">
        <h1>{shopQuery === 'canteen' ? 'Campus Canteen' : shopQuery === 'bookstore' ? 'Campus Bookstore' : 'Explore Campus'}</h1>
        <p>{shopQuery === 'canteen' ? 'Warm food & cafeteria' : shopQuery === 'bookstore' ? 'Books & essentials' : 'Find what you need and pick it up instantly.'}</p>
      </div>

      {/* Filters */}
      <div className="glass-strong" style={{ padding: '1rem', borderRadius: 'var(--r-xl)', display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
        
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-glass focus-ring"
            style={{ paddingLeft: '2.5rem', width: '100%', borderRadius: 'var(--r-full)', border: 'none', background: 'rgba(255,255,255,0.08)' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            value={selectedCanteen}
            onChange={(e) => setSelectedCanteen(e.target.value)}
            className="input-glass focus-ring"
            style={{ width: 'auto', borderRadius: 'var(--r-full)', paddingRight: '2rem', border: 'none', background: 'rgba(255,255,255,0.08)' }}
          >
            <option value="All" style={{ background: 'var(--bg-elevated)' }}>All Shops</option>
            {canteens.map(c => <option key={c.id} value={c.id} style={{ background: 'var(--bg-elevated)' }}>{c.name}</option>)}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-glass focus-ring"
            style={{ width: 'auto', borderRadius: 'var(--r-full)', paddingRight: '2rem', border: 'none', background: 'rgba(255,255,255,0.08)' }}
          >
            {categories.map(c => <option key={c} value={c} style={{ background: 'var(--bg-elevated)' }}>{c === 'All' ? 'All Categories' : c}</option>)}
          </select>
        </div>
      </div>

      {/* Chips shortcut for categories */}
      {categories.length > 2 && (
        <div className="chips-row" style={{ marginBottom: '2rem' }}>
          {categories.slice(0, 10).map(cat => (
            <button
              key={cat}
              className={`chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'All' ? 'Everything' : `${getItemEmoji(cat)} ${cat}`}
            </button>
          ))}
        </div>
      )}

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="empty-state glass">
          <div className="empty-state-icon">🍽️</div>
          <h3>No items found</h3>
          <p>Try adjusting your filters or search term.</p>
          <button className="btn-secondary" onClick={() => { setSearch(''); setSelectedCategory('All'); setSelectedCanteen('All'); }}>Clear Filters</button>
        </div>
      ) : (
        <div className="grid-products">
          {filteredItems.map(item => {
            const isAvailable = item.is_available && item.available_quantity > 0;
            const stockStatus = !isAvailable ? 'out' : item.available_quantity <= 10 ? 'low' : 'good';
            const imgSrc = getItemImage(item.image_url, item.category);

            return (
              <div key={item.id} className="product-card">
                <div style={{ position: 'relative' }}>
                  <Link to={ROUTES.ITEM_DETAIL.replace(':id', item.id)} style={{ display: 'block' }}>
                    <img
                      src={imgSrc}
                      alt={item.name}
                      className="product-card-img"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement | null;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    {/* Emoji fallback shown only when image fails */}
                    <div
                      style={{
                        display: 'none',
                        width: '100%',
                        aspectRatio: '3/2',
                        background: 'var(--bg-elevated)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3.5rem',
                      }}
                    >
                      {getItemEmoji(item.category)}
                    </div>
                  </Link>
                  <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
                    <span className={`badge ${stockStatus === 'good' ? 'badge-ready' : stockStatus === 'low' ? 'badge-pending' : 'badge-cancelled'}`}>
                      {stockStatus === 'out' ? 'Sold Out' : stockStatus === 'low' ? `Only ${item.available_quantity} left` : `${item.available_quantity} left`}
                    </span>
                  </div>
                </div>
                
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>{getItemEmoji(item.category)}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {item.category}
                    </span>
                  </div>
                  
                  <Link to={ROUTES.ITEM_DETAIL.replace(':id', item.id)} style={{ textDecoration: 'none', color: 'inherit', marginBottom: '0.25rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {item.name}
                    </h3>
                  </Link>
                  
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                    {item.canteen?.name}
                  </p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--accent)' }}>₹{item.price}</span>
                    <button 
                      onClick={() => addToCart(item, 1)}
                      disabled={!isAvailable}
                      className={isAvailable ? 'btn-primary' : 'btn-secondary'}
                      style={{ padding: '0.5rem 1rem', minHeight: 36, fontSize: '0.85rem' }}
                    >
                      {isAvailable ? 'Add +' : 'Out of stock'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
