import { useState, type FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES, STAFF_TYPES } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { registerStaff } from '@/services/auth/auth.service';
import FormInput from '@/components/common/FormInput';
import Logo from '@/components/common/Logo';

type AllowedStaffType = 'canteen_staff' | 'bookstore_staff';

interface FormState {
  name: string;
  mobileNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
  staffType: AllowedStaffType | '';
}

interface FormErrors {
  name?: string;
  mobileNumber?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  staffType?: string;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) errors.name = 'Name is required.';
  if (!form.mobileNumber.trim()) errors.mobileNumber = 'Mobile number is required.';
  else if (!/^\d{10}$/.test(form.mobileNumber.trim())) errors.mobileNumber = 'Mobile number must be exactly 10 digits.';
  if (!form.email.trim()) errors.email = 'Email is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Please enter a valid email address.';
  if (!form.password) errors.password = 'Password is required.';
  else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters.';
  if (!form.confirmPassword) errors.confirmPassword = 'Please confirm your password.';
  else if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  if (!form.staffType) errors.staffType = 'Please select a staff type.';

  return errors;
}

export default function StaffRegister() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    name: '', mobileNumber: '', email: '', password: '', confirmPassword: '', staffType: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      navigate(
        user.role === 'canteen_staff' ? ROUTES.STAFF_CANTEEN : user.role === 'bookstore_staff' ? ROUTES.STAFF_BOOKSTORE : ROUTES.HOME,
        { replace: true }
      );
    }
  }, [user, loading, navigate]);

  function handleChange<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field as keyof FormErrors]) setErrors((e) => ({ ...e, [field]: undefined }));
    setSubmitError(null);
  }

  function handleMobileChange(value: string) {
    if (/^\d*$/.test(value) && value.length <= 10) {
      handleChange('mobileNumber', value);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    if (form.staffType !== 'canteen_staff' && form.staffType !== 'bookstore_staff') return;

    setIsSubmitting(true);
    setSubmitError(null);

    const result = await registerStaff({
      name: form.name,
      mobileNumber: form.mobileNumber,
      email: form.email,
      password: form.password,
      staffType: form.staffType,
    });

    setIsSubmitting(false);

    if (result.error) {
      setSubmitError(result.error);
      return;
    }
    setSuccessMessage('Staff account created! Check your email to confirm your address, then sign in as staff.');
  }

  if (successMessage) {
    return (
      <div className="has-bg-image" style={{ minHeight: 'calc(100vh - 60px)' }}>
        <div className="bg-layer bg-auth" />
        <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', position: 'relative', zIndex: 10 }}>
          <div className="glass-strong" style={{ maxWidth: 440, width: '100%', padding: '3rem 2.5rem', borderRadius: 'var(--r-xl)', textAlign: 'center', boxShadow: 'var(--shadow-lg)', animation: 'slideInUp 0.4s ease' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1.25rem' }}>✅</div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>Staff Account Created!</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem', fontSize: '1.05rem' }}>{successMessage}</p>
            <Link to={ROUTES.LOGIN_STAFF} style={{ textDecoration: 'none' }}>
              <button className="btn-primary" style={{ width: '100%', background: 'linear-gradient(to bottom, #3B82F6, #2563EB)' }}>Go to Staff Sign In</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="has-bg-image" style={{ minHeight: 'calc(100vh - 60px)' }}>
      <div className="bg-layer bg-auth" />
      
      <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', position: 'relative', zIndex: 10 }}>
        <div style={{ width: '100%', maxWidth: 480, animation: 'slideInUp 0.4s ease forwards' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <Logo size="md" className="justify-center" style={{ marginBottom: '1.25rem' }} />
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Staff Registration</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>Register your campus staff account</p>
          </div>

          <div className="glass-strong" style={{ padding: '2.5rem', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-lg)' }}>
            {submitError && (
              <div role="alert" style={{ padding: '1rem', borderRadius: 'var(--r-md)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5', fontSize: '0.9rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span aria-hidden="true" style={{ fontSize: '1.2rem' }}>⚠</span><span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <FormInput
                id="staff-name"
                label="Full Name"
                type="text"
                placeholder="Your full name"
                autoComplete="name"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={errors.name}
                disabled={isSubmitting}
                leftIcon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
              />

              <FormInput
                id="staff-mobile"
                label="Mobile Number"
                type="tel"
                placeholder="10-digit mobile number"
                autoComplete="tel"
                value={form.mobileNumber}
                onChange={(e) => handleMobileChange(e.target.value)}
                error={errors.mobileNumber}
                disabled={isSubmitting}
                hint="Exactly 10 digits, numbers only"
                maxLength={10}
                inputMode="numeric"
                leftIcon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.48 2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.4a16 16 0 0 0 6.29 6.29l.9-.89a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>}
              />

              <FormInput
                id="staff-email"
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label htmlFor="staff-type" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Staff Type</label>
                <div style={{ position: 'relative' }}>
                  <select
                    id="staff-type"
                    value={form.staffType}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === 'canteen_staff' || v === 'bookstore_staff' || v === '') handleChange('staffType', v as AllowedStaffType | '');
                    }}
                    disabled={isSubmitting}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: `1px solid ${errors.staffType ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.12)'}`, borderRadius: 'var(--r-md)', padding: '0.75rem 1rem', color: form.staffType ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.95rem', outline: 'none', cursor: 'pointer', appearance: 'none', transition: 'border-color 0.15s, background 0.15s' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = errors.staffType ? '#EF4444' : '#3B82F6'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = errors.staffType ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  >
                    <option value="" disabled>Select staff type</option>
                    {STAFF_TYPES.map((st) => (
                      <option key={st.value} value={st.value} style={{ background: '#11131C' }}>{st.label}</option>
                    ))}
                  </select>
                  <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
                {errors.staffType && <p role="alert" style={{ fontSize: '0.8rem', color: '#FCA5A5', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span aria-hidden="true">⚠</span> {errors.staffType}</p>}
              </div>

              <FormInput
                id="staff-password"
                label="Password"
                isPassword
                placeholder="At least 6 characters"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                error={errors.password}
                disabled={isSubmitting}
                leftIcon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
              />

              <FormInput
                id="staff-confirm-password"
                label="Confirm Password"
                isPassword
                placeholder="Re-enter your password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                error={errors.confirmPassword}
                disabled={isSubmitting}
                leftIcon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
              />

              <button type="submit" className="btn-primary focus-ring" disabled={isSubmitting} style={{ width: '100%', marginTop: '1rem', background: 'linear-gradient(to bottom, #3B82F6, #2563EB)', boxShadow: '0 8px 20px rgba(59,130,246,0.3)' }}>
                {isSubmitting ? 'Creating Account…' : 'Create Staff Account'}
              </button>
            </form>
          </div>

          <div style={{ textAlign: 'center', marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Already have an account?{' '}
              <Link to={ROUTES.LOGIN_STAFF} style={{ color: '#60A5FA', fontWeight: 600, textDecoration: 'none' }}>Staff sign in</Link>
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Registering as a student?{' '}
              <Link to={ROUTES.REGISTER_STUDENT} style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Student registration</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
