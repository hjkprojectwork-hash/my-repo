import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { getMyReservations } from '@/services/reservation.service';
import type { Reservation } from '@/types';
import BackgroundLayer from '@/components/common/BackgroundLayer';

const statusConfig: Record<string, { label: string; icon: string; className: string }> = {
  pending:   { label: 'Pending',   icon: '●', className: 'badge-pending' },
  confirmed: { label: 'Preparing', icon: '●', className: 'badge-confirmed' },
  ready:     { label: 'Ready',     icon: '✓', className: 'badge-ready' },
  collected: { label: 'Completed', icon: '✓', className: 'badge-collected' },
  cancelled: { label: 'Cancelled', icon: '×', className: 'badge-cancelled' },
  expired:   { label: 'Expired',   icon: '×', className: 'badge-expired' },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const time = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (isToday) return `Today • ${time}`;
  if (isYesterday) return `Yesterday • ${time}`;
  return `${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • ${time}`;
}

function OrderCard({ res, index }: { res: Reservation; index: number }) {
  const status = statusConfig[res.status] || { label: res.status, icon: '●', className: '' };
  const itemCount = res.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
  const itemNames = res.items?.slice(0, 2).map(i => i.item_name) ?? [];
  const remainingItems = (res.items?.length ?? 0) - 2;

  return (
    <div
      className="order-card glass-hover"
      style={{ animation: `staggerIn 0.3s ease ${index * 0.06}s both` }}
    >
      {/* Status accent bar */}
      <div className="order-card-accent" style={{
        background: res.status === 'ready' ? 'var(--status-ready)' :
                    res.status === 'confirmed' ? 'var(--status-confirmed)' :
                    res.status === 'pending' ? 'var(--status-pending)' :
                    res.status === 'cancelled' ? 'var(--status-cancelled)' :
                    'transparent'
      }} />

      {/* Header row */}
      <div className="order-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <div className="order-card-emoji">🥡</div>
          <div style={{ minWidth: 0 }}>
            <h3 className="order-card-code">{res.reservation_code}</h3>
            <p className="order-card-canteen">{res.canteen?.name || 'Campus Canteen'}</p>
          </div>
        </div>
        <span className={`badge ${status.className}`}>
          {status.label}
        </span>
      </div>

      {/* Items preview */}
      <div className="order-card-items">
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {itemNames.join(', ')}
          {remainingItems > 0 && <span style={{ color: 'var(--text-muted)' }}> +{remainingItems} more</span>}
        </p>
      </div>

      {/* Footer */}
      <div className="order-card-footer">
        <div>
          <span className="order-card-amount">₹{res.total_amount}</span>
          <span className="order-card-meta">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} • {formatDate(res.created_at)}
          </span>
        </div>
        <Link to={ROUTES.RESERVATION_DETAIL.replace(':id', res.id)} style={{ textDecoration: 'none' }}>
          <button className="btn-secondary" style={{ padding: '0.5rem 1.25rem', minHeight: 38, fontSize: '0.85rem' }}>
            View Ticket
          </button>
        </Link>
      </div>
    </div>
  );
}

export default function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const data = await getMyReservations();
        setReservations(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load reservations.');
      } finally {
        setLoading(false);
      }
    };
    fetchReservations();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <BackgroundLayer type="dashboard" />
        <div className="page-header">
          <h1>My Orders</h1>
          <p>Your campus reservations</p>
        </div>
        <div className="orders-list">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 160, borderRadius: 'var(--r-xl)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <BackgroundLayer type="dashboard" />
        <div className="empty-state glass" style={{ borderRadius: 'var(--r-2xl)', maxWidth: 480, margin: '4rem auto' }}>
          <span className="empty-state-icon">⚠️</span>
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">Try Again</button>
        </div>
      </div>
    );
  }

  const activeStatuses = ['pending', 'confirmed', 'ready'];
  const activeReservations = reservations.filter(r => activeStatuses.includes(r.status));
  const pastReservations = reservations.filter(r => !activeStatuses.includes(r.status));

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.4s ease' }}>
      <BackgroundLayer type="dashboard" />

      <div className="page-header">
        <h1>My Orders</h1>
        <p>Your campus reservations</p>
      </div>

      {reservations.length === 0 ? (
        <div className="cart-empty-container">
          <div className="empty-state glass" style={{ maxWidth: 480, borderRadius: 'var(--r-2xl)', padding: '3rem 2rem' }}>
            <div className="empty-state-icon" style={{ fontSize: '2.5rem', width: 80, height: 80 }}>📦</div>
            <h3 style={{ fontSize: '1.3rem' }}>No reservations yet</h3>
            <p>Your reserved canteen items will appear here.</p>
            <Link to={`${ROUTES.ITEMS}?shop=canteen`} style={{ textDecoration: 'none', marginTop: '0.5rem' }}>
              <button className="btn-primary">Browse Canteen</button>
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

          {/* Active Orders */}
          {activeReservations.length > 0 && (
            <section>
              <h2 className="orders-section-title">
                <span className="orders-section-dot" style={{ background: 'var(--accent)', boxShadow: 'var(--shadow-glow)' }} />
                Active Orders
                <span className="orders-section-count">{activeReservations.length}</span>
              </h2>
              <div className="orders-list">
                {activeReservations.map((r, i) => (
                  <OrderCard key={r.id} res={r} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* Past Orders */}
          {pastReservations.length > 0 && (
            <section>
              <h2 className="orders-section-title" style={{ color: 'var(--text-secondary)' }}>
                Past Orders
                <span className="orders-section-count">{pastReservations.length}</span>
              </h2>
              <div className="orders-list" style={{ opacity: 0.75 }}>
                {pastReservations.map((r, i) => (
                  <OrderCard key={r.id} res={r} index={i} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
