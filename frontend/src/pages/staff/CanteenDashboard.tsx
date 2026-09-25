// @ts-nocheck
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  getShopReservations,
  updateReservationStatus,
  getCurrentStaffProfile,
  getShopItems,
  toggleItemAvailability,
} from '@/services/staff.service';
import type { Reservation, StaffProfile, Item } from '@/types';
import { supabase } from '@/lib/supabase';
import BackgroundLayer from '@/components/common/BackgroundLayer';
import QRScanner from '@/components/staff/QRScanner';

/* ─────────────────────────────────────────────
   STATUS CONFIGURATION
   ───────────────────────────────────────────── */
const STATUS = {
  pending:   { label: 'Pending',   short: 'Pending',   color: '#F59E0B', glow: 'rgba(245,158,11,0.20)',  bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.22)',  dot: true  },
  confirmed: { label: 'Preparing', short: 'Prep',      color: '#38BDF8', glow: 'rgba(56,189,248,0.20)',   bg: 'rgba(56,189,248,0.10)',   border: 'rgba(56,189,248,0.22)',   dot: true  },
  ready:     { label: 'Ready',     short: 'Ready',     color: '#10D98A', glow: 'rgba(16,217,138,0.20)',  bg: 'rgba(16,217,138,0.10)',  border: 'rgba(16,217,138,0.22)',  dot: false },
  collected: { label: 'Collected', short: 'Done',      color: '#8B5CF6', glow: 'rgba(139,92,246,0.15)',  bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.18)',  dot: false },
  cancelled: { label: 'Cancelled', short: 'Cancel',    color: '#EF4444', glow: 'rgba(239,68,68,0.15)',   bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.18)',   dot: false },
};

const NEXT_ACTIONS = {
  pending:   { label: 'Accept Order',   icon: '✓', next: 'confirmed', color: '#38BDF8', solidBg: 'linear-gradient(135deg,#38BDF8,#0EA5E9)' },
  confirmed: { label: 'Mark Ready',     icon: '🔔', next: 'ready',     color: '#10D98A', solidBg: 'linear-gradient(135deg,#10D98A,#0BBF78)' },
  ready:     { label: 'Collected',      icon: '✓', next: 'collected', color: '#8B5CF6', solidBg: 'linear-gradient(135deg,#8B5CF6,#7C3AED)' },
};

const CATEGORY_ICONS: Record<string, string> = {
  Tiffins: '🥞', Curries: '🍛', Meals: '🍚', Beverages: '☕', Snacks: '🥟',
  Breakfast: '🌅', Lunch: '🍱', Default: '🍽️',
};

/* ─────────────────────────────────────────────
   STATUS PILL — reusable
   ───────────────────────────────────────────── */
function StatusPill({ status, size = 'sm' }: { status: string; size?: 'sm' | 'md' }) {
  const s = STATUS[status] || { label: status, color: '#94A3B8', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.20)', dot: false };
  const pad = size === 'md' ? '0.45rem 1.1rem' : '0.28rem 0.7rem';
  const fs  = size === 'md' ? '0.82rem' : '0.7rem';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
      padding: pad, borderRadius: 9999, fontSize: fs, fontWeight: 700,
      letterSpacing: '0.04em', textTransform: 'uppercase',
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      {s.dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0, animation: 'pulse 2s infinite' }} />}
      {s.label}
    </span>
  );
}

/* ─────────────────────────────────────────────
   ORDER DETAIL DRAWER
   ───────────────────────────────────────────── */
function OrderDrawer({ res, onClose, onUpdate, updatingId }) {
  const s = STATUS[res.status] || STATUS.cancelled;
  const isUpdating = updatingId === res.id;
  const action = NEXT_ACTIONS[res.status];
  const items = res.items || [];
  const totalQty = items.reduce((a, i) => a + i.quantity, 0);
  const timeStr = new Date(res.created_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateStr = new Date(res.created_at).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(4,5,10,0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <aside style={{
        width: 'min(420px, 100vw)',
        height: '100dvh',
        background: '#0E1019',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.28s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '-32px 0 80px rgba(0,0,0,0.6)',
      }}>

        {/* ── Drawer header ── */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
          background: `linear-gradient(180deg, ${s.bg} 0%, transparent 100%)`,
        }}>
          <div>
            <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, margin: 0 }}>
              Order Details
            </p>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: '0.2rem 0 0.5rem', letterSpacing: '0.04em', fontFamily: 'monospace' }}>
              {res.reservation_code}
            </h2>
            <StatusPill status={res.status} size="md" />
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.50)', fontSize: '1rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.50)'; }}
          >✕</button>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Student card */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '1rem 1.1rem' }}>
            <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, margin: '0 0 0.6rem' }}>Student</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg, ${s.color}30, ${s.color}10)`, border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.95rem', color: s.color, flexShrink: 0 }}>
                {(res.student?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: 700, color: '#fff', margin: 0, fontSize: '0.95rem' }}>{res.student?.name || '—'}</p>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.40)', margin: '0.15rem 0 0', fontFamily: 'monospace' }}>
                  {res.student?.roll_number || '—'}
                  {res.student?.mobile && ` · ${res.student.mobile}`}
                </p>
              </div>
            </div>
          </div>

          {/* Date & time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {[{ label: 'Date', value: dateStr }, { label: 'Time', value: timeStr }].map(({ label, value }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '0.65rem 0.875rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, margin: '0 0 0.25rem' }}>{label}</p>
                <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'rgba(255,255,255,0.80)', margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Items list */}
          <div>
            <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, margin: '0 0 0.625rem' }}>
              {totalQty} Item{totalQty !== 1 ? 's' : ''}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {items.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.7rem 0.875rem',
                  background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: s.color, background: `${s.color}15`, border: `1px solid ${s.color}30`, borderRadius: 6, padding: '0.1rem 0.4rem', minWidth: 24, textAlign: 'center' }}>
                      {item.quantity}×
                    </span>
                    <span style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.80)' }}>{item.item_name}</span>
                  </div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>₹{item.subtotal}</span>
                </div>
              ))}
            </div>
            {/* Total row */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: '0.5rem', padding: '0.875rem 1rem',
              background: 'rgba(16,217,138,0.05)', border: '1px solid rgba(16,217,138,0.15)', borderRadius: 12,
            }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'rgba(255,255,255,0.60)' }}>Total Amount</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10D98A' }}>₹{res.total_amount}</span>
            </div>
          </div>
        </div>

        {/* ── Sticky action footer ── */}
        <div style={{ flexShrink: 0, padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0E1019', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {action && (
            <button
              onClick={() => onUpdate(res.id, action.next)}
              disabled={isUpdating}
              style={{
                width: '100%', padding: '0.9rem',
                border: 'none', borderRadius: 12,
                background: action.solidBg,
                color: '#fff', fontWeight: 800, fontSize: '0.95rem',
                cursor: isUpdating ? 'not-allowed' : 'pointer',
                opacity: isUpdating ? 0.65 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                transition: 'opacity 0.18s, transform 0.18s',
                fontFamily: 'inherit',
                boxShadow: `0 8px 24px ${action.color}35`,
                letterSpacing: '0.01em',
              }}
              onMouseEnter={e => { if (!isUpdating) e.currentTarget.style.opacity = '0.88'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = isUpdating ? '0.65' : '1'; }}
            >
              <span>{action.icon}</span>
              {isUpdating ? 'Updating…' : action.label}
            </button>
          )}

          {(res.status === 'collected' || res.status === 'cancelled') && (
            <div style={{ textAlign: 'center', padding: '0.75rem', borderRadius: 10, background: s.bg, border: `1px solid ${s.border}` }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: s.color }}>
                {res.status === 'collected' ? '✓ Order Complete' : '✗ Order Cancelled'}
              </span>
            </div>
          )}

          <button onClick={onClose} style={{ width: '100%', padding: '0.75rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: 'rgba(255,255,255,0.40)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.70)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.40)'; }}
          >
            Close
          </button>
        </div>
      </aside>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ORDER CARD
   ───────────────────────────────────────────── */
function OrderCard({ res, idx, onView, onUpdate, updatingId }) {
  const s = STATUS[res.status] || STATUS.cancelled;
  const action = NEXT_ACTIONS[res.status];
  const isUpdating = updatingId === res.id;
  const totalQty = res.items?.reduce((a, i) => a + i.quantity, 0) ?? 0;
  const timeStr = new Date(res.created_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  const nameInitial = (res.student?.name || 'U').charAt(0).toUpperCase();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr auto',
        gap: '0.875rem',
        alignItems: 'center',
        padding: '1rem 1.1rem',
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderLeft: `3px solid ${s.color}`,
        borderRadius: 14,
        animation: `staggerIn 0.3s ease ${idx * 0.05}s both`,
        transition: 'background 0.2s, border-color 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
    >
      {/* Avatar */}
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
        background: `linear-gradient(135deg, ${s.color}25, ${s.color}10)`,
        border: `1px solid ${s.color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: '0.9rem', color: s.color,
      }}>
        {nameInitial}
      </div>

      {/* Info */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
          <code style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff', letterSpacing: '0.03em' }}>{res.reservation_code}</code>
          <StatusPill status={res.status} />
        </div>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {res.student?.name || '—'}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.30)', margin: '0.1rem 0 0' }}>
          {totalQty} item{totalQty !== 1 ? 's' : ''} · <span style={{ color: '#10D98A', fontWeight: 700 }}>₹{res.total_amount}</span> · {timeStr}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
        <button
          onClick={onView}
          style={{
            padding: '0.5rem 0.875rem',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 9, color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
        >
          View
        </button>
        {action && (
          <button
            onClick={() => onUpdate(res.id, action.next)}
            disabled={isUpdating}
            style={{
              padding: '0.5rem 0.875rem',
              background: action.solidBg, border: 'none',
              borderRadius: 9, color: '#fff', fontSize: '0.8rem', fontWeight: 700,
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              opacity: isUpdating ? 0.65 : 1,
              fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'opacity 0.15s',
              boxShadow: `0 4px 12px ${action.color}30`,
            }}
          >
            {isUpdating ? '…' : action.label}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ITEM TOGGLE ROW
   ───────────────────────────────────────────── */
function ItemRow({ item, onToggle, isToggling }) {
  const icon = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.Default;
  const isOn = item.is_available;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.75rem 0.875rem',
      background: isOn ? 'rgba(255,255,255,0.025)' : 'rgba(239,68,68,0.04)',
      border: `1px solid ${isOn ? 'rgba(255,255,255,0.07)' : 'rgba(239,68,68,0.15)'}`,
      borderRadius: 12,
      opacity: isToggling ? 0.6 : 1,
      transition: 'all 0.25s',
    }}>
      <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '0.875rem', fontWeight: 600, color: isOn ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.40)',
          margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          textDecoration: isOn ? 'none' : 'line-through',
          transition: 'color 0.25s',
        }}>{item.name}</p>
        <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.30)', margin: '0.1rem 0 0' }}>
          ₹{item.price}
          {!isOn && <span style={{ color: '#EF4444', marginLeft: '0.4rem', fontWeight: 700, textDecoration: 'none' }}>SOLD OUT</span>}
        </p>
      </div>
      {/* Toggle switch */}
      <button
        onClick={() => onToggle(item.id, isOn)}
        disabled={isToggling}
        title={isOn ? 'Mark as unavailable' : 'Mark as available'}
        style={{
          flexShrink: 0,
          width: 44, height: 24, borderRadius: 12,
          border: 'none', cursor: isToggling ? 'not-allowed' : 'pointer',
          background: isOn ? 'linear-gradient(135deg,#10D98A,#0BBF78)' : 'rgba(255,255,255,0.08)',
          position: 'relative', transition: 'background 0.25s ease', outline: 'none',
          boxShadow: isOn ? '0 2px 8px rgba(16,217,138,0.30)' : 'none',
        }}
      >
        <span style={{
          position: 'absolute', top: 3,
          left: isOn ? 'calc(100% - 21px)' : 3,
          width: 18, height: 18, borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        }} />
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */
export default function CanteenDashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [items, setItems]               = useState<Item[]>([]);
  const [profile, setProfile]           = useState<StaffProfile | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('active');
  const [updatingId, setUpdatingId]     = useState<string | null>(null);
  const [togglingId, setTogglingId]     = useState<string | null>(null);
  const [itemError, setItemError]       = useState<string | null>(null);
  const [showScanner, setShowScanner]   = useState(false);
  const [selectedRes, setSelectedRes]   = useState<Reservation | null>(null);
  const [activeTab, setActiveTab]       = useState<'orders' | 'menu'>('orders');
  const [itemSearch, setItemSearch]     = useState('');
  const [now, setNow]                   = useState(new Date());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  /* ── Data fetching ── */
  const fetchReservations = useCallback(async () => {
    try {
      const data = await getShopReservations();
      setReservations(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load orders.');
    }
  }, []);

  const fetchItems = useCallback(async () => {
    try {
      setItems(await getShopItems());
    } catch (err: any) {
      console.error('Items error:', err.message);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const prof = await getCurrentStaffProfile();
        setProfile(prof);
        if (prof?.shopId) await Promise.all([fetchReservations(), fetchItems()]);
        else setError('No shop assigned to this account. Please contact your administrator.');
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchReservations, fetchItems]);

  /* ── Realtime ── */
  useEffect(() => {
    if (!profile?.shopId) return;
    const ch1 = supabase.channel('dash_res')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations', filter: `canteen_id=eq.${profile.shopId}` }, fetchReservations)
      .subscribe();
    const ch2 = supabase.channel('dash_items')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'items', filter: `canteen_id=eq.${profile.shopId}` }, fetchItems)
      .subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, [profile?.shopId, fetchReservations, fetchItems]);

  /* ── Handlers ── */
  const handleUpdate = async (id: string, next: string) => {
    setUpdatingId(id);
    try {
      await updateReservationStatus(id, next);
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: next } : r));
      setSelectedRes(prev => prev?.id === id ? { ...prev, status: next } : prev);
    } catch (err: any) {
      alert(err.message || 'Could not update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggle = async (itemId: string, wasAvailable: boolean) => {
    setTogglingId(itemId);
    setItemError(null);
    try {
      await toggleItemAvailability(itemId, !wasAvailable);
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, is_available: !wasAvailable } : i));
    } catch (err: any) {
      setItemError(err.message || 'Could not update item.');
    } finally {
      setTogglingId(null);
    }
  };

  /* ── Computed values ── */
  const counts = {
    pending:   reservations.filter(r => r.status === 'pending').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    ready:     reservations.filter(r => r.status === 'ready').length,
    collected: reservations.filter(r => r.status === 'collected').length,
    total:     reservations.length,
  };

  const activeOrders = reservations.filter(r => !['cancelled','expired'].includes(r.status));

  const filteredRes = (() => {
    if (activeFilter === 'active')    return activeOrders;
    if (activeFilter === 'pending')   return reservations.filter(r => r.status === 'pending');
    if (activeFilter === 'confirmed') return reservations.filter(r => r.status === 'confirmed');
    if (activeFilter === 'ready')     return reservations.filter(r => r.status === 'ready');
    if (activeFilter === 'collected') return reservations.filter(r => r.status === 'collected');
    return activeOrders;
  })();

  const filteredItems = items.filter(i =>
    !itemSearch || i.name.toLowerCase().includes(itemSearch.toLowerCase()) || i.category.toLowerCase().includes(itemSearch.toLowerCase())
  );

  const categories = Array.from(new Set(items.map(i => i.category))).sort();

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem 1.25rem' }}>
        <BackgroundLayer type="staff" />
        <div className="skeleton" style={{ height: 72, borderRadius: 16, marginBottom: '1.25rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {[0,1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 76, borderRadius: 12 }} />)}
        </div>
        {[0,1,2].map(i => <div key={i} className="skeleton" style={{ height: 76, borderRadius: 14, marginBottom: '0.625rem' }} />)}
      </div>
    );
  }

  if (error) return (
    <div style={{ maxWidth: 480, margin: '5rem auto', padding: '2.5rem', textAlign: 'center' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
      <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: '0.5rem' }}>Setup Required</h3>
      <p style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, fontSize: '0.9rem' }}>{error}</p>
    </div>
  );

  const FILTERS = [
    { key: 'active',    label: 'All Active' },
    { key: 'pending',   label: 'Pending',   count: counts.pending },
    { key: 'confirmed', label: 'Preparing', count: counts.confirmed },
    { key: 'ready',     label: 'Ready',     count: counts.ready },
    { key: 'collected', label: 'Completed' },
  ];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '0.5rem 1.25rem 5rem', animation: 'fadeIn 0.35s ease' }}>
      <BackgroundLayer type="staff" />

      {/* ── Modals ── */}
      {showScanner && (
        <QRScanner
          onClose={() => setShowScanner(false)}
          onStatusUpdated={() => { fetchReservations(); setShowScanner(false); }}
        />
      )}
      {selectedRes && (
        <OrderDrawer
          res={selectedRes}
          onClose={() => setSelectedRes(null)}
          onUpdate={handleUpdate}
          updatingId={updatingId}
        />
      )}

      {/* ═══════════════════════════════
          PAGE HEADER
          ═══════════════════════════════ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 0 1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🍽️</span>
            <h1 style={{ fontSize: 'clamp(1.1rem,3vw,1.35rem)', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
              Canteen Control Panel
            </h1>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.30)', margin: 0 }}>
            {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            &nbsp;·&nbsp;{counts.total} orders total
          </p>
        </div>
        <button
          onClick={() => setShowScanner(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            background: 'linear-gradient(135deg,#10D98A,#0BBF78)',
            border: 'none', borderRadius: 12,
            color: '#fff', fontWeight: 800, fontSize: '0.88rem',
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 6px 20px rgba(16,217,138,0.35)',
            transition: 'opacity 0.18s, transform 0.18s',
            letterSpacing: '0.01em',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
            <rect x="7" y="7" width="10" height="10" rx="1"/>
          </svg>
          Scan QR
        </button>
      </div>

      {/* ═══════════════════════════════
          STATUS SUMMARY CARDS
          ═══════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.625rem', marginBottom: '1.5rem' }}>
        {[
          { key: 'pending',   count: counts.pending,   cfg: STATUS.pending },
          { key: 'confirmed', count: counts.confirmed, cfg: STATUS.confirmed },
          { key: 'ready',     count: counts.ready,     cfg: STATUS.ready },
          { key: 'collected', count: counts.collected, cfg: STATUS.collected },
        ].map(({ key, count, cfg }) => {
          const isActive = activeFilter === key;
          return (
            <button
              key={key}
              onClick={() => { setActiveFilter(key); setActiveTab('orders'); }}
              style={{
                background: isActive ? cfg.bg : 'rgba(255,255,255,0.025)',
                border: `1px solid ${isActive ? cfg.border : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 12, padding: '0.875rem 0.75rem',
                textAlign: 'center', cursor: 'pointer',
                transition: 'all 0.2s', fontFamily: 'inherit',
                boxShadow: isActive ? `0 4px 16px ${cfg.glow}` : 'none',
                outline: 'none',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
            >
              <p style={{ fontSize: 'clamp(1.5rem,4vw,2rem)', fontWeight: 900, color: isActive ? cfg.color : 'rgba(255,255,255,0.80)', margin: 0, lineHeight: 1.1 }}>{count}</p>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, color: isActive ? cfg.color : 'rgba(255,255,255,0.30)', margin: '0.3rem 0 0', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {cfg.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════
          TAB SWITCHER (Orders / Menu)
          ═══════════════════════════════ */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '0.25rem' }}>
        {[{ key: 'orders', label: 'Live Orders', count: counts.pending + counts.confirmed + counts.ready }, { key: 'menu', label: 'Menu Availability' }].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              flex: 1, padding: '0.55rem 1rem',
              background: activeTab === tab.key ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: activeTab === tab.key ? '1px solid rgba(255,255,255,0.10)' : '1px solid transparent',
              borderRadius: 9, color: activeTab === tab.key ? '#fff' : 'rgba(255,255,255,0.40)',
              fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.18s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            }}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span style={{ background: '#10D98A', color: '#000', borderRadius: 9999, padding: '0 0.45rem', fontSize: '0.72rem', fontWeight: 800 }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════
          ORDERS TAB
          ═══════════════════════════════ */}
      {activeTab === 'orders' && (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          {/* Filter chips */}
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                style={{
                  padding: '0.35rem 0.875rem',
                  background: activeFilter === f.key ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${activeFilter === f.key ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 8, color: activeFilter === f.key ? '#fff' : 'rgba(255,255,255,0.40)',
                  fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                }}
              >
                {f.label}
                {f.count != null && f.count > 0 && (
                  <span style={{ background: activeFilter === f.key ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.08)', borderRadius: 9999, padding: '0 0.35rem', fontSize: '0.7rem' }}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Order list */}
          {filteredRes.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '3.5rem 1.5rem',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
            }}>
              <p style={{ fontSize: '2rem', margin: '0 0 0.75rem' }}>📭</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem' }}>
                {activeFilter === 'active' ? 'No active orders right now' : `No ${FILTERS.find(f=>f.key===activeFilter)?.label.toLowerCase()} orders`}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filteredRes.map((res, idx) => (
                <OrderCard
                  key={res.id}
                  res={res}
                  idx={idx}
                  onView={() => setSelectedRes(res)}
                  onUpdate={handleUpdate}
                  updatingId={updatingId}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════
          MENU TAB
          ═══════════════════════════════ */}
      {activeTab === 'menu' && (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.30)', margin: 0 }}>
              Toggle items. Changes reflect instantly for students.
              &nbsp;<span style={{ color: '#10D98A', fontWeight: 700 }}>{items.filter(i => i.is_available).length}/{items.length}</span> available
            </p>
            {/* Search */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.4rem 0.75rem', gap: '0.5rem' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                type="text"
                placeholder="Search items…"
                value={itemSearch}
                onChange={e => setItemSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.82rem', width: 130, fontFamily: 'inherit' }}
              />
              {itemSearch && <button onClick={() => setItemSearch('')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.30)', cursor: 'pointer', fontSize: '0.875rem', lineHeight: 1 }}>✕</button>}
            </div>
          </div>

          {itemError && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '0.875rem', color: '#FCA5A5', fontSize: '0.85rem' }}>
              <span>⚠️ {itemError}</span>
              <button onClick={() => setItemError(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.40)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
          )}

          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.30)', background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)' }}>
              No menu items found for your shop.
            </div>
          ) : (
            categories.map(cat => {
              const catItems = filteredItems.filter(i => i.category === cat);
              if (catItems.length === 0) return null;
              const icon = CATEGORY_ICONS[cat] || CATEGORY_ICONS.Default;
              const avail = catItems.filter(i => i.is_available).length;
              return (
                <div key={cat} style={{ marginBottom: '1.25rem' }}>
                  {/* Category header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', padding: '0 0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem' }}>{icon}</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.50)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{cat}</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: avail === catItems.length ? '#10D98A' : 'rgba(255,255,255,0.30)' }}>
                      {avail}/{catItems.length} on
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {catItems.map(item => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        onToggle={handleToggle}
                        isToggling={togglingId === item.id}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
