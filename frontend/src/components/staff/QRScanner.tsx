import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import type { QRReservationResult } from '@/types';
import { getReservationByQrToken } from '@/services/reservation.service';
import { updateReservationStatus, getReservationByCode } from '@/services/staff.service';

/* ── Status colours (matching dashboard) ── */
const STATUS_COLOR: Record<string, string> = {
  pending:   '#F59E0B',
  confirmed: '#38BDF8',
  ready:     '#10D98A',
  collected: '#8B5CF6',
  cancelled: '#EF4444',
};

const NEXT_ACTIONS: Record<string, { label: string; icon: string; next: string; color: string; bg: string }> = {
  pending:   { label: 'Accept Order',  icon: '✓', next: 'confirmed', color: '#38BDF8', bg: 'linear-gradient(135deg,#38BDF8,#0EA5E9)' },
  confirmed: { label: 'Mark Ready',   icon: '🔔', next: 'ready',     color: '#10D98A', bg: 'linear-gradient(135deg,#10D98A,#0BBF78)' },
  ready:     { label: 'Mark Collected', icon: '✓', next: 'collected', color: '#8B5CF6', bg: 'linear-gradient(135deg,#8B5CF6,#7C3AED)' },
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', confirmed: 'Preparing', ready: 'Ready',
  collected: 'Collected', cancelled: 'Cancelled',
};

/* ─────────────────────────────────────────────
   ORDER RESULT VIEW
   ───────────────────────────────────────────── */
function OrderResult({ result, onUpdate, onRescan, onClose, updating }: {
  result: QRReservationResult;
  onUpdate: (next: string) => void;
  onRescan: () => void;
  onClose: () => void;
  updating: boolean;
}) {
  const action = NEXT_ACTIONS[result.status];
  const statusColor = STATUS_COLOR[result.status] || '#94A3B8';
  const totalQty = result.items?.reduce((a: number, i: { quantity: number }) => a + i.quantity, 0) ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Order header */}
      <div style={{
        padding: '1rem 1.1rem',
        background: `${statusColor}10`,
        border: `1px solid ${statusColor}25`,
        borderRadius: 12,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <p style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, margin: '0 0 0.2rem' }}>Order</p>
          <p style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '0.05em' }}>{result.reservation_code}</p>
        </div>
        <span style={{
          padding: '0.3rem 0.8rem', borderRadius: 9999, fontSize: '0.72rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.05em',
          color: statusColor, background: `${statusColor}15`, border: `1px solid ${statusColor}30`,
        }}>
          {STATUS_LABEL[result.status] || result.status}
        </span>
      </div>

      {/* Student */}
      <div style={{ padding: '0.875rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${statusColor}20`, border: `1px solid ${statusColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: statusColor, fontSize: '0.95rem', flexShrink: 0 }}>
          {(result.student.name || 'U').charAt(0).toUpperCase()}
        </div>
        <div>
          <p style={{ fontWeight: 700, color: '#fff', margin: 0, fontSize: '0.9rem' }}>{result.student.name}</p>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', margin: '0.15rem 0 0', fontFamily: 'monospace' }}>
            {result.student.roll_number}
            {result.student.mobile && result.student.mobile !== 'N/A' && ` · ${result.student.mobile}`}
          </p>
        </div>
      </div>

      {/* Items */}
      <div>
        <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, margin: '0 0 0.5rem' }}>
          {totalQty} Item{totalQty !== 1 ? 's' : ''}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.625rem' }}>
          {result.items.map((item: { item_name: string; quantity: number; subtotal: number }, i: number) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.625rem 0.875rem',
              background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 9,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: statusColor, background: `${statusColor}15`, borderRadius: 6, padding: '0.1rem 0.35rem' }}>{item.quantity}×</span>
                <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.75)' }}>{item.item_name}</span>
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>₹{item.subtotal}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(16,217,138,0.06)', border: '1px solid rgba(16,217,138,0.15)', borderRadius: 10 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>Total</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#10D98A' }}>₹{result.total_amount}</span>
        </div>
      </div>

      {/* Action */}
      {action && (
        <button
          onClick={() => onUpdate(action.next)}
          disabled={updating}
          style={{
            width: '100%', padding: '0.875rem',
            background: action.bg, border: 'none', borderRadius: 12,
            color: '#fff', fontWeight: 800, fontSize: '0.95rem',
            cursor: updating ? 'not-allowed' : 'pointer',
            opacity: updating ? 0.65 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            fontFamily: 'inherit', transition: 'opacity 0.18s',
            boxShadow: `0 6px 20px ${action.color}30`,
          }}
        >
          <span>{action.icon}</span>
          {updating ? 'Updating…' : action.label}
        </button>
      )}

      {(result.status === 'collected' || result.status === 'cancelled') && (
        <div style={{ textAlign: 'center', padding: '0.75rem', background: `${statusColor}10`, border: `1px solid ${statusColor}25`, borderRadius: 10 }}>
          <p style={{ margin: 0, color: statusColor, fontWeight: 700, fontSize: '0.875rem' }}>
            {result.status === 'collected' ? '✓ Order Complete' : '✗ Order Cancelled'}
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <button onClick={onRescan} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
        >
          📷 Scan Another
        </button>
        <button onClick={onClose} style={{ padding: '0.75rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.60)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN QR SCANNER MODAL
   ───────────────────────────────────────────── */
interface QRScannerProps {
  onClose: () => void;
  onStatusUpdated: () => void;
}

type Phase = 'scan' | 'loading' | 'result' | 'error';

export default function QRScanner({ onClose, onStatusUpdated }: QRScannerProps) {
  const [phase, setPhase]           = useState<Phase>('scan');
  const [result, setResult]         = useState<QRReservationResult | null>(null);
  const [errMsg, setErrMsg]         = useState('');
  const [updating, setUpdating]     = useState(false);
  const [camAllowed, setCamAllowed] = useState<boolean | null>(null); // null = checking
  const [manualCode, setManualCode] = useState('');
  const [manualErr, setManualErr]   = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  const scannerId = useRef(`qr-${Date.now()}`);
  const scannerObj = useRef<Html5Qrcode | null>(null);
  const scanning   = useRef(false);
  const mounted    = useRef(true);

  const stopScanner = useCallback(async () => {
    if (scannerObj.current && scanning.current) {
      try { await scannerObj.current.stop(); await scannerObj.current.clear(); } catch {}
      scanning.current = false;
    }
  }, []);

  const handleQrSuccess = useCallback(async (text: string) => {
    if (phase !== 'scan') return;
    await stopScanner();
    setPhase('loading');
    try {
      const data = await getReservationByQrToken(text);
      if (!mounted.current) return;
      setResult(data);
      setPhase('result');
    } catch (err: any) {
      if (!mounted.current) return;
      setErrMsg(err.message || 'Invalid or unrecognized QR code.');
      setPhase('error');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, stopScanner]);

  const startScanner = useCallback(async () => {
    await new Promise(r => setTimeout(r, 200));
    if (!mounted.current) return;
    try {
      const scanner = new Html5Qrcode(scannerId.current);
      scannerObj.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        handleQrSuccess,
        (e: string) => { if (!e.includes('No MultiFormat')) console.debug('[QR]', e); }
      );
      scanning.current = true;
    } catch (err: any) {
      if (!mounted.current) return;
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
        setCamAllowed(false);
      } else {
        setErrMsg('Could not start camera: ' + (err.message || 'Unknown error'));
        setPhase('error');
      }
    }
  }, [handleQrSuccess]);

  useEffect(() => {
    mounted.current = true;
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(s => { s.getTracks().forEach(t => t.stop()); if (mounted.current) { setCamAllowed(true); } })
      .catch(() => { if (mounted.current) setCamAllowed(false); });
    return () => { mounted.current = false; stopScanner(); };
  }, [stopScanner]);

  useEffect(() => {
    if (camAllowed === true && phase === 'scan') startScanner();
  }, [camAllowed, phase, startScanner]);

  const rescan = async () => {
    setResult(null); setErrMsg(''); setManualCode(''); setManualErr('');
    setPhase('scan');
  };

  const handleManualSearch = async () => {
    const code = manualCode.trim().toUpperCase();
    if (!code) return;
    setManualErr('');
    setManualLoading(true);
    try {
      await stopScanner();
      setPhase('loading');
      const data = await getReservationByCode(code);
      setResult(data);
      setPhase('result');
    } catch (err: any) {
      setPhase('scan');
      setManualErr(err.message || 'Order not found.');
    } finally {
      setManualLoading(false);
    }
  };

  const handleUpdate = async (nextStatus: string) => {
    if (!result) return;
    setUpdating(true);
    try {
      await updateReservationStatus(result.id, nextStatus);
      setResult(prev => prev ? { ...prev, status: nextStatus as any } : null);
      onStatusUpdated();
    } catch (err: any) {
      alert(err.message || 'Could not update status.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) { stopScanner(); onClose(); } }}
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(4,5,10,0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.22s ease',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 480,
        maxHeight: '92dvh',
        background: '#0E1019',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
        animation: 'slideInUp 0.28s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
      }}>

        {/* ── Modal header ── */}
        <div style={{ padding: '1.1rem 1.4rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(16,217,138,0.12)', border: '1px solid rgba(16,217,138,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10D98A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
                <rect x="7" y="7" width="10" height="10" rx="1"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', margin: 0 }}>Scan Order QR</p>
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.30)', margin: 0 }}>
                {phase === 'result' ? 'Order verified' : 'Point camera at student\'s QR code'}
              </p>
            </div>
          </div>
          <button
            onClick={() => { stopScanner(); onClose(); }}
            style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.40)', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.40)'; }}
          >✕</button>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.4rem' }}>

          {/* Camera denied */}
          {camAllowed === false && (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📵</div>
              <p style={{ fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>Camera Access Denied</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                Allow camera in your browser settings, or use the manual Order ID search below.
              </p>
            </div>
          )}

          {/* Camera view */}
          {camAllowed === true && phase === 'scan' && (
            <div>
              <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', marginBottom: '0.875rem' }}>
                <div id={scannerId.current} style={{ width: '100%' }} />
                {/* Corner marks */}
                {[
                  { top: 0, left: 0, borderTop: '3px solid #10D98A', borderLeft: '3px solid #10D98A', borderRadius: '12px 0 0 0' },
                  { top: 0, right: 0, borderTop: '3px solid #10D98A', borderRight: '3px solid #10D98A', borderRadius: '0 12px 0 0' },
                  { bottom: 0, left: 0, borderBottom: '3px solid #10D98A', borderLeft: '3px solid #10D98A', borderRadius: '0 0 0 12px' },
                  { bottom: 0, right: 0, borderBottom: '3px solid #10D98A', borderRight: '3px solid #10D98A', borderRadius: '0 0 12px 0' },
                ].map((style, i) => (
                  <div key={i} style={{ position: 'absolute', width: 24, height: 24, zIndex: 5, ...style }} />
                ))}
              </div>
              <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.30)', margin: 0 }}>
                Scanning…
              </p>
            </div>
          )}

          {/* Checking camera */}
          {camAllowed === null && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <svg style={{ animation: 'spin 0.8s linear infinite', width: 32, height: 32, margin: '0 auto 0.75rem' }} viewBox="0 0 24 24" fill="none" stroke="#10D98A" strokeWidth="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.85rem' }}>Requesting camera…</p>
            </div>
          )}

          {/* Loading */}
          {phase === 'loading' && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <svg style={{ animation: 'spin 0.8s linear infinite', width: 36, height: 36, margin: '0 auto 0.875rem' }} viewBox="0 0 24 24" fill="none" stroke="#10D98A" strokeWidth="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.875rem' }}>Verifying order…</p>
            </div>
          )}

          {/* Error */}
          {phase === 'error' && (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem' }}>⚠️</div>
              <p style={{ fontWeight: 700, color: '#FCA5A5', marginBottom: '0.4rem' }}>Verification Failed</p>
              <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>{errMsg}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button onClick={rescan} style={{ padding: '0.75rem', background: 'rgba(16,217,138,0.10)', border: '1px solid rgba(16,217,138,0.25)', borderRadius: 10, color: '#10D98A', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Try Again
                </button>
                <button onClick={() => { stopScanner(); onClose(); }} style={{ padding: '0.75rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Result */}
          {phase === 'result' && result && (
            <div style={{ animation: 'fadeIn 0.25s ease' }}>
              <OrderResult
                result={result}
                onUpdate={handleUpdate}
                onRescan={rescan}
                onClose={() => { stopScanner(); onClose(); }}
                updating={updating}
              />
            </div>
          )}

          {/* Manual order search — shown when scanning or camera denied */}
          {(phase === 'scan' || camAllowed === false) && (
            <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, margin: '0 0 0.625rem' }}>
                Or enter Order ID manually
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value.toUpperCase())}
                  onKeyDown={e => { if (e.key === 'Enter') handleManualSearch(); }}
                  placeholder="CAMP-2026-XXXXXX"
                  style={{
                    flex: 1, padding: '0.65rem 0.875rem',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10, color: '#fff', fontSize: '0.875rem',
                    fontFamily: 'monospace', outline: 'none',
                    letterSpacing: '0.04em', transition: 'border-color 0.15s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(16,217,138,0.40)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                />
                <button
                  onClick={handleManualSearch}
                  disabled={manualLoading || !manualCode.trim()}
                  style={{
                    padding: '0.65rem 1rem',
                    background: 'rgba(16,217,138,0.10)', border: '1px solid rgba(16,217,138,0.25)',
                    borderRadius: 10, color: '#10D98A', fontSize: '0.875rem', fontWeight: 700,
                    cursor: (manualLoading || !manualCode.trim()) ? 'not-allowed' : 'pointer',
                    opacity: (manualLoading || !manualCode.trim()) ? 0.5 : 1,
                    fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap',
                  }}
                >
                  {manualLoading ? '…' : 'Search'}
                </button>
              </div>
              {manualErr && (
                <p style={{ fontSize: '0.8rem', color: '#FCA5A5', marginTop: '0.5rem' }}>⚠ {manualErr}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
