import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { createReservation } from '@/services/reservation.service';
import { getItemImage, getItemEmoji } from '@/services/imageMap';
import { ROUTES } from '@/constants';
import BackgroundLayer from '@/components/common/BackgroundLayer';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reserving, setReserving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ reservationId: string; reservationCode: string } | null>(null);

  /* ── Reserve Items Handler ── */
  const handleReserve = async () => {
    if (!user || cart.length === 0) return;
    setError(null);
    setReserving(true);

    try {
      const canteenId = cart[0].item.canteen_id;
      const reservationId = await createReservation(canteenId, cart);

      // Generate a display code — the real code comes from the backend
      // We'll show the ID for now and navigate to the ticket for full details
      setSuccess({ reservationId, reservationCode: reservationId.slice(0, 8).toUpperCase() });
      clearCart();
    } catch (err: any) {
      setError(err.message || "Reservation couldn't be created. Your items are still in your cart.");
    } finally {
      setReserving(false);
    }
  };

  /* ── Success State ── */
  if (success) {
    return (
      <div className="page-container" style={{ animation: 'fadeIn 0.4s ease' }}>
        <BackgroundLayer type="product" />
        <div className="cart-success-container">
          <div className="cart-success-card glass-strong">
            {/* Success animation */}
            <div className="cart-success-check">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="23" stroke="var(--accent)" strokeWidth="2" opacity="0.3" />
                <circle cx="24" cy="24" r="23" stroke="var(--accent)" strokeWidth="2.5"
                  strokeDasharray="144.5"
                  strokeDashoffset="0"
                  style={{ animation: 'drawCircle 0.6s ease forwards' }}
                />
                <path d="M15 24.5L21.5 31L33 18" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                  style={{ animation: 'drawCheck 0.4s ease 0.4s forwards', strokeDasharray: 30, strokeDashoffset: 30 }}
                />
              </svg>
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Reservation Confirmed
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Your canteen order has been reserved successfully.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: 320 }}>
              <button
                onClick={() => navigate(ROUTES.RESERVATION_DETAIL.replace(':id', success.reservationId))}
                className="btn-primary"
                style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                View Ticket
              </button>

              <button
                onClick={() => navigate(ROUTES.RESERVATIONS)}
                className="btn-secondary"
                style={{ width: '100%', padding: '0.875rem' }}
              >
                My Orders
              </button>

              <Link to={ROUTES.ITEMS} style={{ textDecoration: 'none', width: '100%' }}>
                <button className="btn-ghost" style={{ width: '100%', padding: '0.75rem' }}>
                  ← Back to Canteen
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Empty Cart State ── */
  if (cart.length === 0) {
    return (
      <div className="page-container" style={{ animation: 'fadeIn 0.4s ease' }}>
        <BackgroundLayer type="product" />
        <div className="cart-empty-container">
          <div className="empty-state glass" style={{ maxWidth: 480, borderRadius: 'var(--r-2xl)', padding: '3rem 2rem' }}>
            <div className="empty-state-icon" style={{ fontSize: '2.5rem', width: 80, height: 80 }}>🛒</div>
            <h3 style={{ fontSize: '1.3rem' }}>Your cart is empty</h3>
            <p>Browse the canteen menu and add something tasty.</p>
            <Link to={`${ROUTES.ITEMS}?shop=canteen`} style={{ textDecoration: 'none', marginTop: '0.5rem' }}>
              <button className="btn-primary">Browse Canteen</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const canteenName = cart[0].item.canteen?.name || 'Campus Canteen';
  const total = getCartTotal();

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.4s ease' }}>
      <BackgroundLayer type="product" />

      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1>Your Cart</h1>
          <p>
            {getCartCount()} {getCartCount() === 1 ? 'item' : 'items'} from <strong style={{ color: 'var(--text-primary)' }}>{canteenName}</strong>
          </p>
        </div>
        <button onClick={clearCart} className="btn-ghost" style={{ color: 'var(--danger)', padding: '0.5rem' }} aria-label="Clear cart">
          Clear All
        </button>
      </div>

      {/* Error */}
      {error && (
        <div role="alert" className="cart-error">
          <span style={{ fontSize: '1.1rem' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{error}</p>
            <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>Your items are still in your cart.</p>
          </div>
          <button onClick={() => setError(null)} className="btn-icon" style={{ width: 28, height: 28, flexShrink: 0 }} aria-label="Dismiss error">✕</button>
        </div>
      )}

      {/* Cart Items */}
      <div className="cart-items-list">
        {cart.map((ci, idx) => {
          const imgSrc = getItemImage(ci.item.image_url, ci.item.category);

          return (
            <div key={ci.item.id} className="cart-item glass" style={{ animation: `staggerIn 0.3s ease ${idx * 0.05}s both` }}>
              {/* Item image */}
              <div className="cart-item-image">
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
                <div className="cart-item-image-fallback">
                  {getItemEmoji(ci.item.category)}
                </div>
              </div>

              {/* Item info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ci.item.name}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {getItemEmoji(ci.item.category)} {ci.item.category} &bull; ₹{ci.item.price} each
                </p>
              </div>

              {/* Qty + subtotal */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div className="qty-selector">
                  <button className="qty-btn" onClick={() => updateQuantity(ci.item.id, ci.quantity - 1)} aria-label="Decrease quantity">−</button>
                  <span className="qty-value">{ci.quantity}</span>
                  <button className="qty-btn" disabled={ci.quantity >= ci.item.available_quantity} onClick={() => updateQuantity(ci.item.id, ci.quantity + 1)} aria-label="Increase quantity">+</button>
                </div>

                <div style={{ fontWeight: 800, minWidth: 60, textAlign: 'right', color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                  ₹{ci.item.price * ci.quantity}
                </div>

                <button
                  onClick={() => removeFromCart(ci.item.id)}
                  className="btn-icon"
                  style={{ width: 32, height: 32, color: 'var(--danger)', flexShrink: 0 }}
                  aria-label={`Remove ${ci.item.name}`}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Footer / Reserve */}
      <div className="cart-footer glass-strong">
        <div>
          <button onClick={() => navigate(`${ROUTES.ITEMS}?shop=canteen`)} className="btn-ghost" style={{ padding: '0.5rem' }}>
            ← Continue Shopping
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div className="cart-total-section">
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.125rem' }}>Total</p>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>₹{total}</p>
          </div>
          <button
            onClick={handleReserve}
            disabled={reserving}
            className="btn-primary"
            style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}
          >
            {reserving ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg
                  style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}
                  width="18" height="18" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Reserving…
              </span>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Reserve Items
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
