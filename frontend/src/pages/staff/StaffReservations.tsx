// @ts-nocheck
import { useEffect, useState, useCallback } from 'react';
import { getShopReservations, updateReservationStatus, getCurrentStaffProfile } from '@/services/staff.service';
import type { Reservation, StaffProfile } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import BackgroundLayer from '@/components/common/BackgroundLayer';
import QRScanner from '@/components/staff/QRScanner';

export default function StaffReservations() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const fetchReservations = useCallback(async () => {
    try {
      const data = await getShopReservations();
      setReservations(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load reservations.');
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const prof = await getCurrentStaffProfile();
        setProfile(prof);
        if (prof?.shopId) {
          await fetchReservations();
        } else {
          setError('You do not have a shop assigned. Please contact administrator.');
        }
      } catch (err: any) {
        setError(err.message || 'Unable to initialize staff dashboard.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchReservations]);

  // Realtime: auto-refresh when any reservation in this shop changes
  useEffect(() => {
    if (!profile?.shopId) return;
    
    const channel = supabase.channel('staff_reservations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          filter: `canteen_id=eq.${profile.shopId}`
        },
        () => {
          fetchReservations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.shopId, fetchReservations]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await updateReservationStatus(id, newStatus);
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (err: any) {
      alert(err.message || 'Could not update status');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ padding: '2rem 0' }}>
         <div className="skeleton" style={{ height: 100, borderRadius: 'var(--r-lg)', marginBottom: '3rem' }} />
         <div style={{ display: 'grid', gap: '1.5rem' }}>
           {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 150, borderRadius: 'var(--r-xl)' }} />)}
         </div>
      </div>
    );
  }

  if (error) return <div className="empty-state"><span className="empty-state-icon">⚠️</span><h3>Error</h3><p>{error}</p></div>;

  const counts = {
    pending: reservations.filter(r => r.status === 'pending').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    ready: reservations.filter(r => r.status === 'ready').length,
    collected: reservations.filter(r => r.status === 'collected').length,
  };

  const filtered = filter === 'all' ? reservations : reservations.filter(r => r.status === filter);

  const isCanteenStaff = user?.role === 'canteen_staff';

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.4s ease', padding: '1rem' }}>
      <BackgroundLayer type="staff" />

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onClose={() => setShowScanner(false)}
          onStatusUpdated={() => {
            fetchReservations();
            setShowScanner(false);
          }}
        />
      )}

      {/* Header with QR Scan Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Manage Orders
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.25rem' }}>
            {reservations.length} total orders
          </p>
        </div>

        {/* QR Scan Button — Canteen Staff Only */}
        {isCanteenStaff && (
          <button
            onClick={() => setShowScanner(true)}
            className="btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1.75rem',
              fontSize: '1rem',
              fontWeight: 700,
              borderRadius: 'var(--r-lg)',
              animation: 'pulse 3s ease-in-out infinite',
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>📷</span>
            Scan Student QR
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" style={{ marginBottom: '3rem' }}>
        {[
          { label: 'Pending',   count: counts.pending,   color: 'var(--status-pending)',   bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)' },
          { label: 'Preparing', count: counts.confirmed,  color: 'var(--status-confirmed)', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.2)' },
          { label: 'Ready',     count: counts.ready,      color: 'var(--status-ready)',     bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)' },
          { label: 'Collected', count: counts.collected,  color: '#A5B4FC',                 bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)' },
        ].map(stat => (
          <div key={stat.label} className="glass" style={{ background: stat.bg, border: `1px solid ${stat.border}`, borderRadius: 'var(--r-xl)', padding: '1.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.85rem', color: stat.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{stat.label}</p>
            <p style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="chips-row" style={{ marginBottom: '2.5rem' }}>
        {['all', 'pending', 'confirmed', 'ready', 'collected'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`chip ${filter === f ? 'active' : ''}`}
            style={{ textTransform: 'capitalize' }}
          >
            {f === 'confirmed' ? 'preparing' : f}
          </button>
        ))}
      </div>

      {/* Reservation List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {filtered.length === 0 ? (
          <div className="empty-state glass" style={{ padding: '4rem 2rem' }}>
            <span className="empty-state-icon">📭</span>
            <p>No reservations found for this filter.</p>
          </div>
        ) : (
          filtered.map(res => (
            <div key={res.id} className="glass" style={{ borderRadius: 'var(--r-xl)', padding: 'clamp(1.25rem, 4vw, 2rem)', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
              
              <div style={{ flex: '1 1 250px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{res.reservation_code}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{new Date(res.created_at).toLocaleString()}</p>
                <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 'var(--r-lg)', border: '1px solid var(--glass-border)' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {res.student?.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({res.student?.roll_number})</span>
                  </p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '0.25rem' }}>📞 {res.student?.mobile}</p>
                </div>
              </div>

              <div style={{ flex: '2 1 350px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--glass-bg)', padding: '1.25rem', borderRadius: 'var(--r-lg)', border: '1px dashed var(--glass-border)' }}>
                  {res.items?.map((item: any) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-primary)' }}>{item.quantity}× {item.item_name}</span>
                      <span style={{ fontWeight: 600, color: 'var(--accent)' }}>₹{item.subtotal}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>Total Amount</span>
                    <span style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '1.25rem' }}>₹{res.total_amount}</span>
                  </div>
                </div>
              </div>

              <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-end', justifyContent: 'center' }}>
                <span className={`badge badge-${res.status}`} style={{ padding: '0.5rem 1rem' }}>
                  {res.status === 'confirmed' ? 'preparing' : res.status}
                </span>

                {res.status === 'pending' && (
                  <button className="btn-primary" style={{ background: '#3B82F6', width: '100%', opacity: updatingId === res.id ? 0.7 : 1 }} onClick={() => handleUpdateStatus(res.id, 'confirmed')} disabled={updatingId === res.id}>
                    Confirm Order
                  </button>
                )}
                {res.status === 'confirmed' && (
                  <button className="btn-primary" style={{ width: '100%', opacity: updatingId === res.id ? 0.7 : 1 }} onClick={() => handleUpdateStatus(res.id, 'ready')} disabled={updatingId === res.id}>
                    Mark Ready
                  </button>
                )}
                {res.status === 'ready' && (
                  <button className="btn-primary" style={{ background: '#8B5CF6', width: '100%', opacity: updatingId === res.id ? 0.7 : 1 }} onClick={() => handleUpdateStatus(res.id, 'collected')} disabled={updatingId === res.id}>
                    Mark Collected
                  </button>
                )}
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}
