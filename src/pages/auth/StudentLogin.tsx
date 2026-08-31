import { useState, type FormEvent, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { signIn, hasCompletedStudentProfile } from '@/services/auth/auth.service';
import { supabase } from '@/lib/supabase';
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

const FEATURES = [
  { icon: '⚡', label: 'Skip the queue', desc: 'Reserve & collect instantly' },
  { icon: '🍔', label: 'Campus Canteen', desc: 'Hot meals pre-ordered for you' },
  { icon: '📚', label: 'Bookstore', desc: 'Books ready before class starts' },
];

export default function StudentLogin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState<FormState>({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'student') {
        navigate(from ?? ROUTES.DASHBOARD, { replace: true });
      } else {
        navigate(user.role === 'canteen_staff' ? ROUTES.STAFF_CANTEEN : ROUTES.STAFF_BOOKSTORE, { replace: true });
      }
    }
  }, [user, loading, navigate, from]);

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

    if (role !== 'student') {
      setIsSubmitting(false);
      setSubmitError('This login is for students only. Staff should use the Staff Sign In page.');
      return;
    }

    const { data: sessionData } = await supabase.auth.getUser();
    const userId = sessionData?.user?.id ?? '';

    const profileComplete = await hasCompletedStudentProfile(userId);
    setIsSubmitting(false);

    if (!profileComplete) {
      navigate(ROUTES.PROFILE_SETUP, { replace: true });
    } else {
      navigate(from ?? ROUTES.DASHBOARD, { replace: true });
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
      {/* Campus building background — lighter overlay so image shows through */}
      <BackgroundLayer type="login" overlayOpacity={0.55} />

      {/* ── Left panel: campus branding (desktop only) ── */}
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
        {/* Bottom-left brand block */}
        <div style={{ maxWidth: 460, animation: 'slideInUp 0.5s ease forwards' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(16,217,138,0.12)',
              border: '1px solid rgba(16,217,138,0.30)',
              borderRadius: '9999px',
              padding: '0.35rem 1rem',
              marginBottom: '1.5rem',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse-accent 2s infinite' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Campus Portal</span>
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
            Your campus,<br />
            <span style={{ background: 'linear-gradient(135deg, #10D98A 0%, #38BDF8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              at your fingertips.
            </span>
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '1.1rem', lineHeight: 1.65, marginBottom: '2.5rem' }}>
            Pre-order canteen meals, reserve bookstore items, and collect without ever waiting in line.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {FEATURES.map((f, i) => (
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
        <div
          style={{
            width: '100%',
            maxWidth: 440,
            animation: 'slideInUp 0.4s ease forwards',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <Logo size="md" className="justify-center" style={{ marginBottom: '1.25rem' }} />
            <h2 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '0.4rem', color: '#fff' }}>
              Student Sign In
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.60)', fontSize: '1rem' }}>Welcome back to CampusOne</p>
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
                id="login-email"
                label="Email Address"
                type="email"
                placeholder="you@college.edu"
                autoComplete="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={errors.email}
                disabled={isSubmitting}
                leftIcon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
              />

              <FormInput
                id="login-password"
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
                id="student-login-submit"
                type="submit"
                className="btn-primary focus-ring"
                disabled={isSubmitting}
                style={{ width: '100%', marginTop: '0.5rem', minHeight: 52, fontSize: '1rem' }}
              >
                {isSubmitting ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg style={{ animation: 'spin 0.8s linear infinite' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    Signing In…
                  </span>
                ) : 'Sign In →'}
              </button>
            </form>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: '0.93rem' }}>
              Don't have an account?{' '}
              <Link to={ROUTES.REGISTER_STUDENT} style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                Create account
              </Link>
            </p>
            <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: '0.93rem' }}>
              Staff member?{' '}
              <Link to={ROUTES.LOGIN_STAFF} style={{ color: '#38BDF8', fontWeight: 600, textDecoration: 'none' }}>
                Staff sign in →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
