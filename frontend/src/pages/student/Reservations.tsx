import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { getMyReservations } from '@/services/reservation.service';
import type { Reservation } from '@/types';
import BackgroundLayer from '@/components/common/BackgroundLayer';

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
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 'var(--r-lg)' }} />)}
        </div>
      </div>
    );
  }
  
  if (error) return <div className="empty-state"><span className="empty-state-icon">⚠️</span><h3>Error</h3><p>{error}</p></div>;

  const activeStatuses = ['pending', 'confirmed', 'ready'];
  const activeReservations = reservations.filter(r => activeStatuses.includes(r.status));
  const pastReservations = reservations.filter(r => !activeStatuses.includes(r.status));

  const ReservationCard = ({ res }: { res: Reservation }) => (
    <div className="glass-hover group" style={{ borderRadius: 'var(--r-xl)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: res.status === 'ready' ? 'var(--status-ready)' : res.status === 'confirmed' ? 'var(--status-confirmed)' : res.status === 'pending' ? 'var(--status-pending)' : 'transparent', width: '4px' }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{res.reservation_code}</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(res.created_at).toLocaleString()}</p>
        </div>
        <span className={`badge badge-${res.status}`}>
          {res.status}
        </span>
      </div>

      <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 'var(--r-md)', border: '1px solid var(--glass-border)' }}>
        <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{res.canteen?.name}</p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {res.items?.map(i => `${i.quantity}x ${i.item_name}`).join(', ')}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px dashed var(--glass-border)' }}>
        <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--accent)' }}>₹{res.total_amount}</span>
        <Link to={ROUTES.RESERVATION_DETAIL.replace(':id', res.id)} style={{ textDecoration: 'none' }}>
          <button className="btn-secondary" style={{ padding: '0.5rem 1rem', minHeight: 36, fontSize: '0.85rem' }}>
            View Details
          </button>
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', minHeight: 'calc(100vh - 60px)', animation: 'fadeIn 0.4s ease' }}>
      <BackgroundLayer type="dashboard" />
      <div className="page-header">
        <h1>My Orders</h1>
        <p>Track and manage your campus reservations.</p>
      </div>

      {reservations.length === 0 ? (
        <div className="empty-state glass">
          <div className="empty-state-icon">📦</div>
          <h3>No reservations yet</h3>
          <p>You haven't ordered anything yet.</p>
          <Link to={ROUTES.ITEMS} style={{ textDecoration: 'none', marginTop: '1rem' }}>
            <button className="btn-primary">Browse Items</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
          
          <section>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)' }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', boxShadow: 'var(--shadow-glow)' }} />
              Active Orders
            </h2>
            {activeReservations.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>No active orders.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {activeReservations.map(r => <ReservationCard key={r.id} res={r} />)}
              </div>
            )}
          </section>

          <section>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              Past Orders
            </h2>
            {pastReservations.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>No past orders.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', opacity: 0.8 }}>
                {pastReservations.map(r => <ReservationCard key={r.id} res={r} />)}
              </div>
            )}
          </section>

        </div>
      )}
    </div>
  );
}
