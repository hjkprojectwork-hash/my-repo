import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { getItemImage, getItemEmoji } from '@/services/imageMap';
import { ROUTES } from '@/constants';
import BackgroundLayer from '@/components/common/BackgroundLayer';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="empty-state glass" style={{ maxWidth: 600, margin: '4rem auto', borderRadius: 'var(--r-xl)' }}>
        <div className="empty-state-icon" style={{ fontSize: '2.5rem' }}>🛒</div>
        <h3>Your cart is empty</h3>
        <p>Browse the canteen or bookstore to add some items.</p>
        <Link to={ROUTES.ITEMS} style={{ textDecoration: 'none', marginTop: '1rem' }}>
          <button className="btn-primary">Browse Items</button>
        </Link>
      </div>
    );
  }

  const canteenName = cart[0].item.canteen?.name || 'Unknown Shop';
  const total = getCartTotal();

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
      <BackgroundLayer type="product" />
      
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1>Your Cart</h1>
          <p>
            {getCartCount()} items from <strong style={{ color: 'var(--text-primary)' }}>{canteenName}</strong>
          </p>
        </div>
        <button onClick={clearCart} className="btn-ghost" style={{ color: 'var(--danger)', padding: '0.5rem' }}>
          Clear All
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {cart.map((ci, idx) => {
          const imgSrc = getItemImage(ci.item.image_url, ci.item.category);
          
          return (
            <div key={ci.item.id} className="glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: 'var(--r-lg)', animation: `staggerIn 0.3s ease ${idx * 0.05}s both`, flexWrap: 'wrap' }}>
              
              <div style={{ width: 64, height: 64, background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                <img 
                  src={imgSrc} 
                  alt={ci.item.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement | null;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div
                  style={{
                    display: 'none',
                    width: '100%',
                    height: '100%',
                    background: 'var(--bg-elevated)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.75rem',
                    position: 'absolute',
                    inset: 0
                  }}
                >
                  {getItemEmoji(ci.item.category)}
                </div>
              </div>
              
              {/* Name + category — grows to fill */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ci.item.name}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {getItemEmoji(ci.item.category)} {ci.item.category} &bull; ₹{ci.item.price} each
                </p>
              </div>

              {/* Qty + subtotal row — always visible */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                <div className="qty-selector">
                  <button className="qty-btn" onClick={() => updateQuantity(ci.item.id, ci.quantity - 1)}>-</button>
                  <span className="qty-value">{ci.quantity}</span>
                  <button className="qty-btn" disabled={ci.quantity >= ci.item.available_quantity} onClick={() => updateQuantity(ci.item.id, ci.quantity + 1)}>+</button>
                </div>

                <div style={{ fontWeight: 800, minWidth: 60, textAlign: 'right', color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                  ₹{ci.item.price * ci.quantity}
                </div>

                <button 
                  onClick={() => removeFromCart(ci.item.id)}
                  className="btn-icon"
                  style={{ width: 32, height: 32, color: 'var(--danger)', flexShrink: 0 }}
                  aria-label="Remove item"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="glass-strong" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-lg)' }}>
        <div>
          <button onClick={() => navigate(ROUTES.ITEMS)} className="btn-ghost" style={{ padding: '0.5rem' }}>
            ← Continue Shopping
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.125rem' }}>Subtotal</p>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>₹{total}</p>
          </div>
          <button onClick={() => navigate(ROUTES.CHECKOUT)} className="btn-primary">
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
