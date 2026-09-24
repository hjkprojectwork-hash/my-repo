import { QRCodeSVG } from 'qrcode.react';

interface ReservationQRCodeProps {
  /** The secure UUID token — the only data encoded in the QR */
  qrToken: string;
  reservationCode: string;
}

/**
 * ReservationQRCode
 *
 * Renders the QR code a student shows at the canteen counter.
 * The QR encodes ONLY the qr_token (UUID) — no student name, phone,
 * items, price or any sensitive data is embedded in the QR.
 */
export default function ReservationQRCode({ qrToken, reservationCode }: ReservationQRCodeProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem',
        padding: '2.5rem',
        background: 'linear-gradient(135deg, rgba(16,217,138,0.07) 0%, rgba(56,189,248,0.05) 100%)',
        border: '1px solid rgba(16,217,138,0.25)',
        borderRadius: 'var(--r-2xl)',
        boxShadow: '0 0 40px rgba(16,217,138,0.08)',
        animation: 'fadeIn 0.4s ease',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(16,217,138,0.12)',
          border: '1px solid rgba(16,217,138,0.3)',
          borderRadius: 'var(--r-full)',
          padding: '0.35rem 1rem',
          marginBottom: '0.75rem',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            Show at Counter
          </span>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
          Staff will scan this to verify your order
        </p>
      </div>

      {/* QR Code */}
      <div style={{
        padding: '1.25rem',
        background: '#FFFFFF',
        borderRadius: 'var(--r-xl)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        lineHeight: 0,
      }}>
        <QRCodeSVG
          value={qrToken}
          size={220}
          bgColor="#FFFFFF"
          fgColor="#0A0A0F"
          level="M"
          includeMargin={false}
        />
      </div>

      {/* Reservation Code */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
          Reservation Code
        </p>
        <p style={{
          fontSize: '1.35rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '0.12em',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {reservationCode}
        </p>
      </div>

      <p style={{
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        textAlign: 'center',
        lineHeight: 1.5,
        maxWidth: 280,
        opacity: 0.7,
      }}>
        This QR is unique to your order. Do not share it until you arrive at the counter.
      </p>
    </div>
  );
}
