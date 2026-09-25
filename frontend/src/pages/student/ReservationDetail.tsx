import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReservationById, cancelReservation } from '@/services/reservation.service';
import type { Reservation, StudentProfile } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants';
import ReservationQRCode from '@/components/student/ReservationQRCode';

const statusConfig: Record<string, { label: string; icon: string; color: string }> = {
  pending:   { label: 'Pending',   icon: '●', color: 'var(--status-pending)' },
  confirmed: { label: 'Preparing', icon: '●', color: 'var(--status-confirmed)' },
  ready:     { label: 'Ready',     icon: '✓', color: 'var(--status-ready)' },
  collected: { label: 'Completed', icon: '✓', color: 'var(--status-collected)' },
  cancelled: { label: 'Cancelled', icon: '×', color: 'var(--status-cancelled)' },
  expired:   { label: 'Expired',   icon: '×', color: 'var(--status-expired)' },
};

export default function ReservationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllItems, setShowAllItems] = useState(false);

  const fetchReservation = useCallback(async () => {
    if (!id) return;
    try {
      const resData = await getReservationById(id);
      setReservation(resData);
    } catch {
      setError('Unable to load reservation details.');
    }
  }, [id]);

  useEffect(() => {
    if (!id || !user) return;
    const init = async () => {
      try {
        const resData = await getReservationById(id);
        setReservation(resData);

        const { data: rawProfData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        const profData = rawProfData as any;
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
    init();
  }, [id, user]);

  // Realtime: update status when staff changes it
  useEffect(() => {
    if (!id) return;

    const channel = supabase.channel(`reservation_detail_${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reservations',
          filter: `id=eq.${id}`,
        },
        () => {
          fetchReservation();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, fetchReservation]);

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

  /* ── Loading State ── */
  if (loading) {
    return (
      <div className="ticket-page">
        <div className="ticket-container">
          <div className="skeleton" style={{ height: 600, borderRadius: 'var(--r-2xl)' }} />
        </div>
      </div>
    );
  }

  /* ── Error / Not Found ── */
  if (error || !reservation) {
    return (
      <div className="ticket-page">
        <div className="ticket-container">
          <div className="empty-state glass" style={{ borderRadius: 'var(--r-2xl)' }}>
            <span className="empty-state-icon">⚠️</span>
            <h3>Not Found</h3>
            <p>{error || 'Reservation not found.'}</p>
            <button onClick={() => navigate(ROUTES.RESERVATIONS)} className="btn-primary">Back to Orders</button>
          </div>
        </div>
      </div>
    );
  }

  const status = reservation.status;
  const statusInfo = statusConfig[status] || { label: status, icon: '●', color: 'var(--text-muted)' };
  const showQR = (status === 'pending' || status === 'confirmed' || status === 'ready')
    && reservation.qr_token
    && reservation.order_type === 'canteen';
  const canCancel = status === 'pending';
  const items = reservation.items ?? [];
  const visibleItems = showAllItems ? items : items.slice(0, 4);
  const hiddenCount = items.length - 4;

  const createdDate = new Date(reservation.created_at);
  const dateStr = createdDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = createdDate.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <div className="ticket-page" style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Back button */}
      <div className="ticket-back-nav">
        <button
          onClick={() => navigate(ROUTES.RESERVATIONS)}
          className="btn-ghost"
          style={{ padding: '0.25rem 0' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Orders
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════
         DIGITAL TICKET
         ═══════════════════════════════════════════════════ */}
      <div className="ticket-container">
        <div className="ticket" style={{ animation: 'slideInUp 0.5s ease' }}>

          {/* ── Ticket Header ── */}
          <div className="ticket-header">
            <div className="ticket-brand">
              <span className="ticket-brand-text">CAMPUSONE</span>
              <span className="ticket-brand-sub">{reservation.canteen?.name?.toUpperCase() || 'CAMPUS CANTEEN'}</span>
            </div>
            <div className="ticket-status-badge" style={{ '--status-color': statusInfo.color } as React.CSSProperties}>
              <span className="ticket-status-dot" />
              {statusInfo.label}
            </div>
          </div>

          {/* ── Ticket Perforation ── */}
          <div className="ticket-perforation">
            <div className="ticket-perf-circle ticket-perf-left" />
            <div className="ticket-perf-line" />
            <div className="ticket-perf-circle ticket-perf-right" />
          </div>

          {/* ── QR Section ── */}
          {showQR && (
            <div className="ticket-qr-section">
              <p className="ticket-section-label">RESERVATION</p>
              <div className="ticket-qr-wrapper">
                <ReservationQRCode
                  qrToken={reservation.qr_token!}
                  reservationCode={reservation.reservation_code}
                />
              </div>
            </div>
          )}

          {/* ── Reservation Code (when no QR) ── */}
          {!showQR && (
            <div className="ticket-code-section">
              <p className="ticket-section-label">RESERVATION CODE</p>
              <p className="ticket-code-display">{reservation.reservation_code}</p>
            </div>
          )}

          {/* ── Ticket Perforation 2 ── */}
          <div className="ticket-perforation">
            <div className="ticket-perf-circle ticket-perf-left" />
            <div className="ticket-perf-line" />
            <div className="ticket-perf-circle ticket-perf-right" />
          </div>

          {/* ── Student Info ── */}
          <div className="ticket-student-section">
            <div className="ticket-student-grid">
              <div>
                <span className="ticket-field-label">STUDENT</span>
                <span className="ticket-field-value">{profile?.name || '—'}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="ticket-field-label">ROLL NO</span>
                <span className="ticket-field-value ticket-mono">{profile?.rollNumber || '—'}</span>
              </div>
            </div>
            {(profile?.classSection || profile?.year) && (
              <div className="ticket-student-meta">
                {profile?.classSection}{profile?.classSection && profile?.year ? ' • ' : ''}{profile?.year}
              </div>
            )}
          </div>

          {/* ── Date / Time ── */}
          <div className="ticket-datetime">
            <div>
              <span className="ticket-field-label">DATE</span>
              <span className="ticket-field-value">{dateStr}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="ticket-field-label">TIME</span>
              <span className="ticket-field-value">{timeStr}</span>
            </div>
          </div>

          {/* ── Ticket Perforation 3 ── */}
          <div className="ticket-perforation">
            <div className="ticket-perf-circle ticket-perf-left" />
            <div className="ticket-perf-line" />
            <div className="ticket-perf-circle ticket-perf-right" />
          </div>

          {/* ── Items ── */}
          <div className="ticket-items-section">
            <p className="ticket-section-label">ITEMS</p>
            <div className="ticket-items-list">
              {visibleItems.map((item: any) => (
                <div key={item.id} className="ticket-item-row">
                  <span className="ticket-item-qty">{item.quantity} ×</span>
                  <span className="ticket-item-name">{item.item_name}</span>
                  <span className="ticket-item-price">₹{item.subtotal}</span>
                </div>
              ))}
              {!showAllItems && hiddenCount > 0 && (
                <button
                  onClick={() => setShowAllItems(true)}
                  className="ticket-items-more"
                >
                  + {hiddenCount} more {hiddenCount === 1 ? 'item' : 'items'}
                </button>
              )}
            </div>

            {/* Total */}
            <div className="ticket-total-row">
              <span className="ticket-total-label">TOTAL</span>
              <span className="ticket-total-amount">₹{reservation.total_amount}</span>
            </div>
          </div>

          {/* ── Footer Instruction ── */}
          <div className="ticket-footer">
            {showQR ? (
              <p className="ticket-instruction">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                Show this QR at the counter
              </p>
            ) : status === 'collected' || status === 'cancelled' || status === 'expired' ? (
              <p className="ticket-instruction">
                {status === 'collected' ? 'Order completed — Enjoy your meal!' :
                 status === 'cancelled' ? 'This reservation has been cancelled.' :
                 'This reservation has expired.'}
              </p>
            ) : (
              <p className="ticket-instruction">
                Visit the counter with your reservation code
              </p>
            )}
          </div>

          {/* ── Cancel Button ── */}
          {canCancel && (
            <div className="ticket-cancel-section">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="btn-danger"
                style={{ width: '100%', fontSize: '0.875rem', padding: '0.75rem' }}
              >
                {cancelling ? 'Cancelling…' : 'Cancel Reservation'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
