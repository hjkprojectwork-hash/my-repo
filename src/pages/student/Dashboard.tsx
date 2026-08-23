import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants';

export default function StudentDashboard() {
  const { user } = useAuth();

  const actionCards = [
    { to: ROUTES.ITEMS, icon: '🍔', title: 'Browse Canteen', desc: 'Reserve campus food instantly', color: 'var(--accent)' },
    { to: ROUTES.ITEMS, icon: '📚', title: 'Campus Bookstore', desc: 'Pre-order books and stationery', color: '#3B82F6' },
    { to: ROUTES.RESERVATIONS, icon: '📦', title: 'My Orders', desc: 'Track your pending pickups', color: '#F59E0B' },
    { to: '#', icon: '🔔', title: 'Notifications', desc: 'Recent updates on your orders', color: '#8B5CF6' },
  ];

  return (
    <div style={{ padding: '1rem 0', animation: 'fadeIn 0.4s ease' }}>
      
      {/* Welcome header */}
      <div
        className="glass-strong"
        style={{
          padding: '3rem 2rem',
          borderRadius: 'var(--r-xl)',
          marginBottom: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, background: 'var(--accent-glow)', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '1rem', color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Welcome back
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, lineHeight: 1.2 }}>
            Good to see you, <br className="hide-desktop" />
            {(user as any)?.user_metadata?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'Student'} 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '1rem', maxWidth: 500 }}>
            Ready to skip the queue? Reserve your campus essentials instantly.
          </p>
        </div>
      </div>
      
      {/* Action cards */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Quick Actions</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
        {actionCards.map((card, idx) => (
          <Link key={idx} to={card.to} style={{ textDecoration: 'none' }}>
            <div
              className="glass-hover"
              style={{
                padding: '2rem',
                borderRadius: 'var(--r-xl)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                animation: `staggerIn 0.3s ease ${idx * 0.1}s both`
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = card.color; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
            >
              <div style={{ position: 'absolute', top: '-10px', right: '-15px', fontSize: '8rem', opacity: 0.04, transform: 'rotate(15deg)', pointerEvents: 'none' }}>
                {card.icon}
              </div>
              <div style={{ width: 60, height: 60, borderRadius: 'var(--r-md)', background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginBottom: '0.5rem' }}>
                {card.icon}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{card.title}</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>{card.desc}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
