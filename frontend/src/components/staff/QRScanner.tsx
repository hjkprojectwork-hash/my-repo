import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import type { QRReservationResult } from '@/types';
import { getReservationByQrToken } from '@/services/reservation.service';
import { updateReservationStatus } from '@/services/staff.service';

interface QRScannerProps {
  onClose: () => void;
  onStatusUpdated: () => void;
}

type ScanState = 'scanning' | 'loading' | 'result' | 'error';

/**
 * QRScanner
 *
 * Canteen staff camera-based QR code scanner.
 * Security: The RPC enforces authenticated + canteen_staff + shop ownership
 *            + order_type='canteen' + valid status on the server side.
 * This component only handles the camera + result UI.
 */
export default function QRScanner({ onClose, onStatusUpdated }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [result, setResult] = useState<QRReservationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'checking' | 'granted' | 'denied'>('checking');
  const scannerIdRef = useRef(`qr-scanner-${Date.now()}`);
  const isScanning = useRef(false);

  const stopScanner = async () => {
    if (scannerRef.current && isScanning.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {
        // ignore errors on stop
      }
      isScanning.current = false;
    }
  };

  const handleScan = async (decodedText: string) => {
    if (scanState !== 'scanning') return;
    await stopScanner();
    setScanState('loading');
    
    try {
      const data = await getReservationByQrToken(decodedText);
      setResult(data);
      setScanState('result');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or unrecognized QR code.');
      setScanState('error');
    }
  };

  const handleScanError = (errorMessage: string) => {
    // These fire constantly while scanning (no QR found) — only log unusual ones
    if (!errorMessage.includes('No MultiFormat Readers') && !errorMessage.includes('QR code parse error')) {
      console.debug('[QRScanner]', errorMessage);
    }
  };

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      try {
        // Check for camera permission
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(t => t.stop());
        if (!mounted) return;
        setCameraPermission('granted');

        // Short delay to allow the DOM element to render
        await new Promise(r => setTimeout(r, 300));
        if (!mounted) return;

        const scanner = new Html5Qrcode(scannerIdRef.current);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          handleScan,
          handleScanError
        );
        isScanning.current = true;
      } catch (err: any) {
        if (!mounted) return;
        if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
          setCameraPermission('denied');
        } else {
          setCameraPermission('granted');
          setErrorMsg('Could not start camera: ' + (err.message || 'Unknown error'));
          setScanState('error');
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!result) return;
    setUpdatingStatus(true);
    try {
      await updateReservationStatus(result.id, newStatus);
      setResult(prev => prev ? { ...prev, status: newStatus as any } : null);
      onStatusUpdated();
    } catch (err: any) {
      alert(err.message || 'Could not update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const rescan = () => {
    setResult(null);
    setErrorMsg('');
    setScanState('scanning');
    setUpdatingStatus(false);
    // Restart scanner
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode(scannerIdRef.current);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          handleScan,
          handleScanError
        );
        isScanning.current = true;
      } catch {
        setErrorMsg('Could not restart scanner.');
        setScanState('error');
      }
    }, 400);
  };

  const statusActions: Record<string, { label: string; nextStatus: string; color: string; bg: string }> = {
    pending:   { label: '✅ Confirm Order',    nextStatus: 'confirmed', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
    confirmed: { label: '🍳 Mark Ready',       nextStatus: 'ready',     color: 'var(--accent)', bg: 'rgba(16,217,138,0.15)' },
    ready:     { label: '✅ Mark as Collected', nextStatus: 'collected', color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
  };

  const currentAction = result ? statusActions[result.status] : null;

  return (
    // Backdrop
    <div
      onClick={(e) => { if (e.target === e.currentTarget) { stopScanner().then(onClose); } }}
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.25s ease',
      }}
    >
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--r-2xl)',
        width: '100%',
        maxWidth: 520,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        animation: 'slideInUp 0.3s ease',
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 1.75rem', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>📷</span>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Scan Order QR</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.15rem' }}>Point camera at student's QR code</p>
            </div>
          </div>
          <button
            onClick={() => { stopScanner().then(onClose); }}
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.1rem' }}
          >✕</button>
        </div>

        <div style={{ padding: '1.75rem' }}>
          
          {/* Camera Permission Denied */}
          {cameraPermission === 'denied' && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📵</div>
              <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: '0.5rem' }}>Camera Access Denied</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Allow camera access in your browser settings to use the QR scanner.
                Alternatively, ask the student for their reservation code.
              </p>
              <button onClick={() => stopScanner().then(onClose)} className="btn-secondary" style={{ marginTop: '1.5rem' }}>
                Close Scanner
              </button>
            </div>
          )}

          {/* Scanner View */}
          {cameraPermission === 'granted' && scanState === 'scanning' && (
            <div>
              <div
                id={scannerIdRef.current}
                style={{ width: '100%', overflow: 'hidden', borderRadius: 'var(--r-xl)' }}
              />
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem' }}>
                Scanning for QR code…
              </p>
            </div>
          )}

          {/* Loading */}
          {scanState === 'loading' && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <svg style={{ animation: 'spin 0.8s linear infinite', width: 40, height: 40, margin: '0 auto 1rem' }} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Verifying QR code…</p>
            </div>
          )}

          {/* Error State */}
          {scanState === 'error' && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
              <h3 style={{ color: 'var(--danger)', fontWeight: 700, marginBottom: '0.5rem' }}>Scan Failed</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                {errorMsg}
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button onClick={rescan} className="btn-primary">
                  Try Again
                </button>
                <button onClick={() => stopScanner().then(onClose)} className="btn-secondary">
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Result: Order Details */}
          {scanState === 'result' && result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Status Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {result.reservation_code}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.25rem' }}>
                    {new Date(result.created_at).toLocaleString()}
                  </p>
                </div>
                <span className={`badge badge-${result.status}`} style={{ padding: '0.5rem 1rem' }}>
                  {result.status}
                </span>
              </div>

              {/* Student Info */}
              <div style={{ padding: '1.25rem', background: 'var(--glass-bg)', borderRadius: 'var(--r-lg)', border: '1px solid var(--glass-border)' }}>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {result.student.name}
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.5rem', fontSize: '0.9rem' }}>
                    ({result.student.roll_number})
                  </span>
                </p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>📞 {result.student.mobile}</p>
              </div>

              {/* Items */}
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem', fontWeight: 700 }}>Order Items</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {result.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1.1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)', border: '1px dashed var(--glass-border)' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        <strong>{item.quantity}×</strong> {item.item_name}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{item.subtotal}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--r-lg)', border: '1px solid var(--glass-border)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Total</span>
                  <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--accent)' }}>₹{result.total_amount}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {currentAction && (
                  <button
                    onClick={() => handleUpdateStatus(currentAction.nextStatus)}
                    disabled={updatingStatus}
                    className="btn-primary"
                    style={{ width: '100%', padding: '1.1rem', fontSize: '1rem', background: currentAction.color, opacity: updatingStatus ? 0.7 : 1 }}
                  >
                    {updatingStatus ? 'Updating…' : currentAction.label}
                  </button>
                )}

                {result.status === 'collected' && (
                  <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(16,217,138,0.1)', border: '1px solid rgba(16,217,138,0.3)', borderRadius: 'var(--r-lg)' }}>
                    <p style={{ color: 'var(--accent)', fontWeight: 700 }}>✅ Order Collected</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>This order has been picked up.</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={rescan} className="btn-secondary" style={{ flex: 1 }}>
                    📷 Scan Another
                  </button>
                  <button onClick={() => stopScanner().then(onClose)} className="btn-ghost" style={{ flex: 1 }}>
                    Close
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
