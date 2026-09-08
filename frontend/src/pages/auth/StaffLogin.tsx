import { useState, type FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { signIn } from '@/services/auth/auth.service';
import FormInput from '@/components/common/FormInput';
import Logo from '@/components/common/Logo';
import BackgroundLayer from '@/components/common/BackgroundLayer';

interface FormState {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.email.trim()) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Please enter a valid email address.';
  if (!form.password) errors.password = 'Password is required.';
  return errors;
}

const STAFF_FEATURES = [
  { icon: '📋', label: 'Manage Orders', desc: 'View and process student reservations' },
  { icon: '✅', label: 'Mark Ready', desc: 'Update order status in real-time' },
  { icon: '📊', label: 'Dashboard', desc: 'Track inventory and order flow' },
];

export default function StaffLogin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'canteen_staff') navigate(ROUTES.STAFF_CANTEEN, { replace: true });
      else if (user.role === 'bookstore_staff') navigate(ROUTES.STAFF_BOOKSTORE, { replace: true });
      else if (user.role === 'student') navigate(ROUTES.DASHBOARD, { replace: true });
    }
  }, [user, loading, navigate]);

  function handleChange(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
    setSubmitError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const result = await signIn({ email: form.email, password: form.password });

    if (result.error) {
      setIsSubmitting(false);
      setSubmitError(result.error);
      return;
    }

    const role = result.data?.role;

    if (role === 'student') {
      setIsSubmitting(false);
      setSubmitError('This login is for staff only. Students should use the Student Sign In page.');
      return;
    }

    if (role !== 'canteen_staff' && role !== 'bookstore_staff') {
      setIsSubmitting(false);
      setSubmitError('Your account does not have a recognized staff role. Please contact your administrator.');
      return;
    }

    setIsSubmitting(false);
    if (role === 'canteen_staff') {
      navigate(ROUTES.STAFF_CANTEEN, { replace: true });
    } else {
      navigate(ROUTES.STAFF_BOOKSTORE, { replace: true });
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
      {/* Campus building background with lighter overlay so image shines through */}
      <BackgroundLayer type="staff" overlayOpacity={0.55} />

      {/* ── Left panel: staff branding (desktop only) ── */}
      <div
        className="hide-mobile"
        style={{
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '3rem',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: 460, animation: 'slideInUp 0.5s ease forwards' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(59,130,246,0.14)',
              border: '1px solid rgba(59,130,246,0.35)',
              borderRadius: '9999px',
              padding: '0.35rem 1rem',
              marginBottom: '1.5rem',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6', display: 'inline-block' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#60A5FA', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Staff Portal</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.4rem, 5vw, 3.5rem)',
              fontWeight: 900,
              lineHeight: 1.1,
              color: '#fff',
              marginBottom: '1.25rem',
              letterSpacing: '-0.03em',
            }}
          >
            Power your<br />
            <span style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              canteen & store.
            </span>
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '1.1rem', lineHeight: 1.65, marginBottom: '2.5rem' }}>
            Manage student reservations, update order statuses, and keep your stall running at full speed.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {STAFF_FEATURES.map((f, i) => (
              <div
                key={f.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.875rem 1.25rem',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '16px',
                  backdropFilter: 'blur(12px)',
                  animation: `slideInUp 0.5s ease ${0.15 + i * 0.1}s both`,
                }}
              >
                <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{f.icon}</span>
                <div>
                  <p style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{f.label}</p>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel: login form ── */}
      <div
        style={{
          flex: '1 1 50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div style={{ width: '100%', maxWidth: 440, animation: 'slideInUp 0.4s ease forwards' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <Logo size="md" className="justify-center" style={{ marginBottom: '1.25rem' }} />
            <h2 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '0.4rem', color: '#fff' }}>
              Staff Sign In
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.60)', fontSize: '1rem' }}>Canteen &amp; Bookstore staff</p>
          </div>

          <div
            style={{
              padding: '2.5rem',
              borderRadius: '24px',
              background: 'rgba(10,12,20,0.82)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.55)',
            }}
          >
            {/* Staff badge */}
            <div
              style={{
                padding: '0.75rem',
                borderRadius: '12px',
                background: 'rgba(59,130,246,0.10)',
                border: '1px solid rgba(59,130,246,0.25)',
                color: '#60A5FA',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '1.5rem',
                textAlign: 'center',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>🏪</span> Staff Access Only
            </div>

            {submitError && (
              <div
                role="alert"
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  background: 'rgba(239,68,68,0.10)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  color: '#FCA5A5',
                  fontSize: '0.9rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'center',
                }}
              >
                <span aria-hidden="true" style={{ fontSize: '1.2rem' }}>⚠</span>
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <FormInput
                id="staff-login-email"
                label="Email Address"
                type="email"
                placeholder="staff@college.edu"
                autoComplete="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={errors.email}
                disabled={isSubmitting}
                leftIcon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
              />

              <FormInput
                id="staff-login-password"
                label="Password"
                isPassword
                placeholder="Your password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                error={errors.password}
                disabled={isSubmitting}
                leftIcon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
              />

              <button
                id="staff-login-submit"
                type="submit"
                className="btn-primary focus-ring"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  marginTop: '0.5rem',
                  minHeight: 52,
                  fontSize: '1rem',
                  background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                  boxShadow: '0 8px 28px rgba(59,130,246,0.35)',
                }}
              >
                {isSubmitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg style={{ animation: 'spin 0.8s linear infinite' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    Signing In…
                  </span>
                ) : 'Staff Sign In →'}
              </button>
            </form>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: '0.93rem' }}>
              Need a staff account?{' '}
              <Link to={ROUTES.REGISTER_STAFF} style={{ color: '#60A5FA', fontWeight: 600, textDecoration: 'none' }}>
                Register as Staff
              </Link>
            </p>
            <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: '0.93rem' }}>
              Student?{' '}
              <Link to={ROUTES.LOGIN} style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                Student sign in →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
