import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/contexts/CartContext';
import { createReservation } from '@/services/reservation.service';
import { supabase } from '@/lib/supabase';
import { ROUTES } from '@/constants';

import type { StudentProfile } from '@/types';

export default function Checkout() {
  const { user } = useAuth();
  const { cart, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cart.length === 0) {
      navigate(ROUTES.CART);
      return;
    }

    const fetchProfile = async () => {
      if (!user) return;
      try {
        const { data, error: profileError } = await (supabase as any)
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) throw profileError;
        
        setProfile({
          id: data.id,
          userId: data.id,
          name: data.name,
          rollNumber: data.roll_number,
          mobileNumber: data.mobile,
          classSection: data.class_section,
          year: data.year,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        });
      } catch (err) {
        console.error(err);
        setError('Failed to load student profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, cart, navigate]);

  const handleConfirm = async () => {
    if (!profile || cart.length === 0) return;
    setError(null);
    setSubmitting(true);

    try {
      const canteenId = cart[0].item.canteen_id;
      const reservationId = await createReservation(canteenId, cart);
      
      clearCart();
      navigate(ROUTES.RESERVATION_DETAIL.replace(':id', reservationId));
    } catch (err: any) {
      setError(err.message || 'We couldn\'t create your reservation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem' }}>
        <div className="skeleton" style={{ height: 400, borderRadius: 'var(--r-xl)' }} />
        <div className="skeleton" style={{ height: 500, borderRadius: 'var(--r-xl)' }} />
      </div>
    );
  }

  const total = getCartTotal();

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
      
      <button 
        onClick={() => navigate(ROUTES.CART)} 
        className="btn-ghost"
        style={{ marginBottom: '1.5rem', padding: 0 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        Back to Cart
      </button>

      <div className="page-header">
        <h1>Secure Checkout</h1>
        <p>Review your details and confirm your reservation.</p>
      </div>

      {error && (
        <div role="alert" style={{ padding: '1rem 1.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', borderRadius: 'var(--r-md)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>⚠️</span> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        
        {/* Profile Info */}
        <div className="glass" style={{ borderRadius: 'var(--r-xl)', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(16,217,138,0.15)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', border: '1px solid rgba(16,217,138,0.3)' }}>
              👤
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Student Details</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'var(--bg-elevated)', padding: '1.5rem', borderRadius: 'var(--r-lg)', border: '1px solid var(--glass-border)' }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Name</span>
              <span style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{profile?.name}</span>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Roll Number</span>
              <span style={{ fontWeight: 500, color: 'var(--text-primary)', background: 'var(--glass-bg)', padding: '0.25rem 0.5rem', borderRadius: 'var(--r-sm)', display: 'inline-block', border: '1px solid var(--glass-border)' }}>{profile?.rollNumber}</span>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Mobile</span>
              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{profile?.mobileNumber}</span>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Class & Year</span>
              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{profile?.classSection} • {profile?.year} Year</span>
            </div>
          </div>
          
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            These details will be shared with the shop for verification during pickup.
          </p>
        </div>

        {/* Order Summary */}
        <div className="glass-strong" style={{ borderRadius: 'var(--r-xl)', padding: '2.5rem', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
             <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(59,130,246,0.15)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', border: '1px solid rgba(59,130,246,0.3)' }}>
              📦
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Order Summary</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                {cart[0]?.item.canteen?.name}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', flex: 1, maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {cart.map(ci => (
              <div key={ci.item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px dashed var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ width: 28, height: 28, background: 'var(--glass-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}>{ci.quantity}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{ci.item.name}</span>
                </div>
                <span style={{ fontWeight: 600, color: 'var(--accent)' }}>₹{ci.item.price * ci.quantity}</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--bg-elevated)', padding: '1.5rem', borderRadius: 'var(--r-lg)', marginBottom: '2rem', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Total Amount</span>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>₹{total}</span>
            </div>
          </div>

          <button 
            onClick={handleConfirm} 
            disabled={submitting} 
            className="btn-primary"
            style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', height: 'auto' }}
          >
            {submitting ? (
              <>
                <span className="animate-spin" style={{ display: 'inline-block', width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }}></span>
                Confirming...
              </>
            ) : (
              'Confirm Reservation'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
