import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getItemById } from '@/services/items.service';
import { useCart } from '@/contexts/CartContext';
import { getItemImage, getItemEmoji } from '@/services/imageMap';
import type { Item } from '@/types';

export default function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchItem = async () => {
      try {
        const data = await getItemById(id);
        setItem(data);
      } catch {
        setError('Item not found or unavailable.');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  if (loading) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 0' }}>
        <div className="skeleton" style={{ height: 500, borderRadius: 'var(--r-xl)' }} />
      </div>
    );
  }

  if (error || !item) {
    return <div className="empty-state"><span className="empty-state-icon">⚠️</span><h3>Not Found</h3><p>{error || 'Item not found.'}</p></div>;
  }

  const handleAdd = () => {
    addToCart(item, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const isAvailable = item.is_available && item.available_quantity > 0;
  const imgSrc = getItemImage(item.image_url, item.category);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
      
      <button 
        onClick={() => navigate(-1)} 
        style={{ marginBottom: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', transition: 'color 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        Back to Explore
      </button>

      <div className="glass-strong" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0', borderRadius: 'var(--r-2xl)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
        
        {/* Left: Image */}
        <div style={{ background: 'var(--bg-elevated)', minHeight: '400px', position: 'relative' }}>
          <img src={imgSrc} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', top: 20, right: 20 }}>
             <span className={`badge ${isAvailable ? 'badge-ready' : 'badge-cancelled'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', backdropFilter: 'blur(10px)' }}>
               {isAvailable ? `${item.available_quantity} in stock` : 'Sold Out'}
             </span>
          </div>
        </div>

        {/* Right: Details */}
        <div style={{ display: 'flex', flexDirection: 'column', padding: '3rem' }}>
          
          <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>{getItemEmoji(item.category)}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)' }}>
              {item.category}
            </span>
          </div>
          
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>{item.name}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>{item.canteen?.name}</p>
          
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2rem' }}>
            ₹{item.price}
          </div>

          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2.5rem', fontSize: '1.05rem' }}>
            {item.description || 'No description available for this item.'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem', padding: '1.5rem', background: 'var(--glass-bg)', borderRadius: 'var(--r-xl)', border: '1px solid var(--glass-border)' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Quantity</span>
              <div className="qty-selector">
                <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <span className="qty-value">{quantity}</span>
                <button className="qty-btn" disabled={quantity >= item.available_quantity} onClick={() => setQuantity(Math.min(item.available_quantity, quantity + 1))}>+</button>
              </div>
            </div>
            
            <div style={{ width: 1, height: 40, background: 'var(--glass-border)' }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--accent)' }}>
                ₹{item.price * quantity}
              </span>
            </div>
          </div>

          <button 
            onClick={handleAdd} 
            disabled={!isAvailable}
            className={added ? 'btn-secondary' : isAvailable ? 'btn-primary' : 'btn-secondary'}
            style={{ 
              width: '100%', 
              padding: '1.1rem',
              fontSize: '1.05rem',
              marginTop: 'auto',
              background: added ? 'var(--accent)' : '',
              color: added ? '#fff' : '',
              borderColor: added ? 'var(--accent)' : ''
            }}
          >
            {added ? '✓ Added to Cart' : isAvailable ? `Add ${quantity} to Cart` : 'Currently Unavailable'}
          </button>
        </div>
      </div>
    </div>
  );
}
