import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { getPendingReservationCount } from '@/services/staff.service';
import BackgroundLayer from '@/components/common/BackgroundLayer';

export default function CanteenDashboard() {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const count = await getPendingReservationCount();
        setPendingCount(count);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', animation: 'fadeIn 0.4s ease', padding: '1rem' }}>
      <BackgroundLayer type="staff" />
      
      <div className="page-header">
        <h1>Canteen Dashboard</h1>
        <p>Overview of your canteen's operations.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <div className="glass-hover group" style={{ padding: '3rem 2rem', borderRadius: 'var(--r-2xl)', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 1.5rem', border: '1px solid rgba(245,158,11,0.2)', boxShadow: '0 8px 16px rgba(245,158,11,0.1)' }}>
            🔔
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Orders</h3>
          <p style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--status-pending)', lineHeight: 1, textShadow: '0 0 20px rgba(245,158,11,0.4)' }}>
            {loading ? '-' : pendingCount}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link to={ROUTES.STAFF_RESERVATIONS} style={{ textDecoration: 'none' }}>
          <button className="btn-primary" style={{ padding: '1.25rem 2.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>📋</span> Manage Reservations
          </button>
        </Link>
      </div>
    </div>
  );
}
