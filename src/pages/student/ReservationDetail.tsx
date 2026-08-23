// @ts-nocheck
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReservationById, cancelReservation } from '@/services/reservation.service';
import type { Reservation, StudentProfile } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants';

export default function ReservationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user) return;
    const fetchData = async () => {
      try {
        const resData = await getReservationById(id);
        setReservation(resData);
        
        const { data: profData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (profData) {
          setProfile({
            id: profData.id,
            userId: profData.id,
            name: profData.name,
            rollNumber: profData.roll_number,
            mobileNumber: profData.mobile,
            classSection: profData.class_section,
            year: profData.year,
            createdAt: profData.created_at,
            updatedAt: profData.updated_at
          });
        }
      } catch {
        setError('Unable to load reservation details.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const handleCancel = async () => {
    if (!id || !window.confirm('Are you sure you want to cancel this reservation?')) return;
    setCancelling(true);
    try {
      await cancelReservation(id);
      setReservation(prev => prev ? { ...prev, status: 'cancelled' } : null);
    } catch (err: any) {
      alert(err.message || 'Could not cancel reservation.');
    } finally {
      setCancelling(false);
    }
  };

  const generateWhatsAppUrl = () => {
    if (!reservation || !profile) return null;
    
    const staffPhone = reservation.canteen?.staff_mobile;
    if (!staffPhone) return null;

    const normalizedPhone = staffPhone.length === 10 ? `91${staffPhone}` : staffPhone;
    const itemList = reservation.items?.map((item: any) => `• ${item.item_name} × ${item.quantity}`).join('\n') || '';
    const message = `Hello CampusOne Staff 👋\n\nI have placed a reservation.\n\nReservation ID: ${reservation.reservation_code}\n\nStudent Name: ${profile.name}\nRoll Number: ${profile.rollNumber}\n\nItems:\n${itemList}\n\nTotal: ₹${reservation.total_amount}\n\nPlease prepare my order.\n\nThank you.`;
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
         <div className="skeleton" style={{ height: 600, borderRadius: 'var(--r-2xl)' }} />
      </div>
    );
  }
  
  if (error || !reservation) return <div className="empty-state"><span className="empty-state-icon">⚠️</span><h3>Not Found</h3><p>{error || 'Reservation not found.'}</p></div>;

  const waUrl = generateWhatsAppUrl();
  const status = reservation.status;
  
  const steps = [
    { key: 'pending', label: 'Created' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'ready', label: 'Ready' },
    { key: 'collected', label: 'Collected' }
  ];

  const getStepIndex = (st: string) => steps.findIndex(s => s.key === st);
  const currentIndex = getStepIndex(status);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
      
      <button 
        onClick={() => navigate(ROUTES.RESERVATIONS)} 
        className="btn-ghost"
        style={{ marginBottom: '1.5rem', padding: 0 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        Back to Orders
      </button>

      <div className="glass-strong" style={{ borderRadius: 'var(--r-2xl)', padding: '3rem', display: 'flex', flexDirection: 'column', gap: '3rem', boxShadow: 'var(--shadow-lg)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Reservation ID</p>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{reservation.reservation_code}</h1>
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              {new Date(reservation.created_at).toLocaleString()}
            </p>
          </div>
          <div className={`badge badge-${status}`} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
            {status}
          </div>
        </div>

        {/* Visual Timeline Stepper */}
        {status !== 'cancelled' && status !== 'expired' && (
          <div style={{ padding: '1rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
              {/* Connecting Line */}
              <div style={{ position: 'absolute', top: '16px', left: '10%', right: '10%', height: '4px', background: 'var(--glass-bg)', borderRadius: 'var(--r-full)' }} />
              <div style={{ position: 'absolute', top: '16px', left: '10%', right: '10%', height: '4px', background: 'var(--accent)', borderRadius: 'var(--r-full)', width: currentIndex > 0 ? `${(currentIndex / 3) * 80}%` : '0%', transition: 'width 0.5s ease-out' }} />

              {steps.map((step, idx) => {
                const isCompleted = currentIndex >= idx;
                const isCurrent = currentIndex === idx;
                return (
                  <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, width: '25%' }}>
                    <div style={{ 
                      width: '36px', height: '36px', borderRadius: '50%', 
                      background: isCompleted ? 'var(--accent)' : 'var(--bg-elevated)', 
                      border: isCompleted ? 'none' : '2px solid var(--glass-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isCompleted ? '#fff' : 'var(--text-muted)', fontSize: '1rem', fontWeight: 800,
                      boxShadow: isCurrent ? '0 0 0 6px var(--accent-glow)' : 'none',
                      transition: 'all 0.3s ease'
                    }}>
                      {isCompleted ? '✓' : idx + 1}
                    </div>
                    <span style={{ marginTop: '1rem', fontSize: '0.9rem', fontWeight: isCurrent ? 700 : 500, color: isCompleted ? 'var(--text-primary)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div style={{ background: 'var(--bg-elevated)', padding: '1.5rem', borderRadius: 'var(--r-xl)', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              👤 Student Info
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Name</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{profile?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Roll No</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{profile?.rollNumber}</span>
              </div>
            </div>
          </div>
          <div style={{ background: 'var(--bg-elevated)', padding: '1.5rem', borderRadius: 'var(--r-xl)', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🏪 Shop Details
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Name</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{reservation.canteen?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Contact</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{reservation.canteen?.staff_mobile || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📦 Order Items
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {reservation.items?.map((item: any) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', background: 'var(--glass-bg)', borderRadius: 'var(--r-lg)', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ width: 32, height: 32, background: 'var(--bg-elevated)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}>
                    {item.quantity}
                  </span>
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.1rem' }}>{item.item_name}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>₹{item.unit_price} each</p>
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                  ₹{item.subtotal}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'var(--bg-elevated)', borderRadius: 'var(--r-xl)', border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Amount</span>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent)' }}>₹{reservation.total_amount}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column', marginTop: '1rem' }}>
          {(status === 'pending' || status === 'confirmed') && (
            <div>
              {waUrl ? (
                <a 
                  href={waUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ display: 'block', textDecoration: 'none' }}
                >
                  <button className="btn-primary" style={{ width: '100%', background: '#25D366', boxShadow: '0 8px 20px rgba(37,211,102,0.3)', color: '#fff', border: 'none', padding: '1.25rem', borderRadius: 'var(--r-lg)', fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>💬</span> Notify Stall on WhatsApp
                  </button>
                </a>
              ) : (
                <div style={{ padding: '1.25rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--r-lg)', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--danger)' }}>
                    WhatsApp notification is currently unavailable because this stall has not configured a contact number.
                  </p>
                </div>
              )}
            </div>
          )}

          {(status === 'pending' || status === 'confirmed') && (
            <button 
              onClick={handleCancel} 
              disabled={cancelling} 
              className="btn-ghost"
              style={{ width: '100%', color: 'var(--danger)', padding: '1.25rem', borderRadius: 'var(--r-lg)', fontWeight: 600, fontSize: '1rem', marginTop: '0.5rem' }}
            >
              {cancelling ? 'Cancelling...' : 'Cancel Reservation'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
