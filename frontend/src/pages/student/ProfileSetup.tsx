import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import FormInput from '@/components/common/FormInput';
import { ROUTES } from '@/constants';
import { supabase } from '@/lib/supabase';

export default function ProfileSetup() {
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [mobile, setMobile] = useState('');
  const [classSection, setClassSection] = useState('');
  const [year, setYear] = useState('1st');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError(null);

    if (!/^\d{10}$/.test(mobile)) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }

    if (!name || !rollNumber || !classSection || !year) {
      setError('All fields are required.');
      return;
    }

    setLoading(true);

    try {
      const { error: dbError } = await (supabase as any).from('profiles').insert({
        id: user.id,
        name: name.trim(),
        roll_number: rollNumber.trim().toUpperCase(),
        mobile: mobile.trim(),
        class_section: classSection.trim(),
        year: year,
      });

      if (dbError) {
        if (dbError.code === '23505') {
          setError('This roll number is already registered.');
        } else {
          setError(dbError.message || 'An error occurred while saving your profile.');
        }
        setLoading(false);
        return;
      }

      window.location.href = ROUTES.DASHBOARD; 
    } catch (err: any) {
      setError(err.message || 'Unexpected error');
      setLoading(false);
    }
  };

  return (
    <div className="has-bg-image" style={{ minHeight: 'calc(100vh - 60px)' }}>
      <div className="bg-layer bg-auth" />
      
      <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', position: 'relative', zIndex: 10 }}>
        <div style={{ width: '100%', maxWidth: 480, animation: 'slideInUp 0.4s ease forwards' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16,217,138,0.1)', border: '1px solid rgba(16,217,138,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 8px 16px rgba(16,217,138,0.15)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Complete Profile</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>Please provide your details to continue</p>
          </div>

          <div className="glass-strong" style={{ padding: '2.5rem', borderRadius: 'var(--r-xl)', boxShadow: 'var(--shadow-lg)' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {error && (
                <div role="alert" style={{ padding: '1rem', borderRadius: 'var(--r-md)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span aria-hidden="true" style={{ fontSize: '1.2rem' }}>⚠</span><span>{error}</span>
                </div>
              )}

              <FormInput
                id="profile-name"
                label="Full Name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />

              <FormInput
                id="profile-roll"
                label="Roll Number"
                type="text"
                required
                placeholder="25M61A05I3"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                disabled={loading}
                style={{ textTransform: 'uppercase' }}
              />

              <FormInput
                id="profile-mobile"
                label="Mobile Number"
                type="tel"
                required
                placeholder="10 digits"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
                disabled={loading}
              />

              <FormInput
                id="profile-class"
                label="Class & Section"
                type="text"
                required
                placeholder="e.g. CSE-A"
                value={classSection}
                onChange={(e) => setClassSection(e.target.value)}
                disabled={loading}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label htmlFor="profile-year" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Year
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    id="profile-year"
                    required
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    disabled={loading}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--r-md)', padding: '0.75rem 1rem', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', cursor: 'pointer', appearance: 'none', transition: 'border-color 0.15s, background 0.15s' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  >
                    <option value="1st" style={{ background: '#11131C' }}>1st</option>
                    <option value="2nd" style={{ background: '#11131C' }}>2nd</option>
                    <option value="3rd" style={{ background: '#11131C' }}>3rd</option>
                    <option value="4th" style={{ background: '#11131C' }}>4th</option>
                  </select>
                  <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-primary focus-ring" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
                {loading ? 'Saving...' : 'Complete Profile'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
