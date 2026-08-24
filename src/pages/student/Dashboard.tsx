import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants';
import BackgroundLayer from '@/components/common/BackgroundLayer';
import { supabase } from '@/lib/supabase';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [studentName, setStudentName] = useState<string>('');

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

  const actionCards = [
    { to: `${ROUTES.ITEMS}?shop=canteen`, icon: '🍔', title: 'Browse Canteen', desc: 'Reserve campus food instantly' },
    { to: `${ROUTES.ITEMS}?shop=bookstore`, icon: '📚', title: 'Campus Bookstore', desc: 'Pre-order books and stationery' },
    { to: ROUTES.RESERVATIONS, icon: '📦', title: 'My Orders', desc: 'Track your pending pickups' },
    { to: ROUTES.PROFILE, icon: '👤', title: 'My Profile', desc: 'View and edit your details' },
  ];

  return (
    <div style={{ padding: '1rem', maxWidth: 1200, margin: '0 auto', minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>
      <BackgroundLayer type="dashboard" />
      
      {/* ── Greeting ── */}
      <div
        className="glass-strong"
        style={{
          padding: '2.5rem 2rem',
          borderRadius: '24px',
          marginBottom: '2.5rem',
          background: 'rgba(11, 12, 16, 0.75)',
          border: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Welcome Back
        </p>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.75rem)', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em', color: '#fff' }}>
          Good to see you, {displayName} 👋
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>
          What are you looking for today?
        </p>
      </div>

      {/* ── Quick Actions Grid ── */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
          gap: '1.25rem',
          marginBottom: '2.5rem'
        }}
      >
        {actionCards.map((card, i) => (
          <Link
            key={card.to}
            to={card.to}
            className="glass-hover"
            style={{
              padding: '1.5rem',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              animationDelay: `${i * 0.1}s`,
              textDecoration: 'none'
            }}
          >
            <div 
              style={{ 
                width: 48, 
                height: 48, 
                borderRadius: '12px', 
                background: 'rgba(255,255,255,0.05)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '1.5rem',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              {card.icon}
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>{card.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>{card.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
