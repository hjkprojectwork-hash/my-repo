import { useState, type FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { signIn } from '@/services/auth/auth.service';
import FormInput from '@/components/common/FormInput';
import Logo from '@/components/common/Logo';

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
    <div className="has-bg-image" style={{ minHeight: 'calc(100vh - 60px)' }}>
      <div className="bg-layer bg-auth" />
      
      <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', position: 'relative', zIndex: 10 }}>
        <div style={{ width: '100%', maxWidth: 440, animation: 'slideInUp 0.4s ease forwards' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <Logo size="md" className="justify-center" style={{ marginBottom: '1.25rem' }} />
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Staff Sign In</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>Canteen & Bookstore staff</p>
          </div>

          <div className="glass-strong" style={{ padding: '2.5rem', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-lg)' }}>
            
            <div style={{ padding: '0.75rem', borderRadius: 'var(--r-md)', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#60A5FA', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.5rem', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.1rem' }}>🏪</span> Staff Access Only
            </div>

            {submitError && (
              <div role="alert" style={{ padding: '1rem', borderRadius: 'var(--r-md)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5', fontSize: '0.9rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span aria-hidden="true" style={{ fontSize: '1.2rem' }}>⚠</span><span>{submitError}</span>
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

              <button type="submit" className="btn-primary focus-ring" disabled={isSubmitting} style={{ width: '100%', marginTop: '1rem', background: 'linear-gradient(to bottom, #3B82F6, #2563EB)', boxShadow: '0 8px 20px rgba(59,130,246,0.3)' }}>
                {isSubmitting ? 'Signing In…' : 'Staff Sign In'}
              </button>
            </form>
          </div>

          <div style={{ textAlign: 'center', marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Need a staff account?{' '}
              <Link to={ROUTES.REGISTER_STAFF} style={{ color: '#60A5FA', fontWeight: 600, textDecoration: 'none' }}>Register as Staff</Link>
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Student?{' '}
              <Link to={ROUTES.LOGIN} style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Student sign in →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
