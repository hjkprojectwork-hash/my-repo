import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { StudentProfile } from '@/types';
import FormInput from '@/components/common/FormInput';
import BackgroundLayer from '@/components/common/BackgroundLayer';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editClass, setEditClass] = useState('');
  const [editYear, setEditYear] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (dbError) throw dbError;
        if (data) {
          const p: StudentProfile = {
            id: data.id,
            userId: data.id,
            name: data.name,
            rollNumber: data.roll_number,
            mobileNumber: data.mobile,
            classSection: data.class_section,
            year: data.year,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
          setProfile(p);
          setEditName(data.name);
          setEditMobile(data.mobile);
          setEditClass(data.class_section);
          setEditYear(data.year);
        }
      } catch (err: any) {
        setError('Unable to load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user || !profile) return;
    setError(null);

    if (!/^\d{10}$/.test(editMobile)) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }
    if (!editName.trim() || !editClass.trim() || !editYear) {
      setError('All fields are required.');
      return;
    }

    setSaving(true);
    try {
      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          name: editName.trim(),
          mobile: editMobile.trim(),
          class_section: editClass.trim(),
          year: editYear,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (dbError) throw dbError;

      setProfile((prev) =>
        prev
          ? { ...prev, name: editName.trim(), mobileNumber: editMobile.trim(), classSection: editClass.trim(), year: editYear }
          : null
      );
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (!profile) return;
    setEditName(profile.name);
    setEditMobile(profile.mobileNumber);
    setEditClass(profile.classSection);
    setEditYear(profile.year);
    setError(null);
    setEditing(false);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 0' }}>
        <BackgroundLayer type="neutral" />
        <div className="skeleton" style={{ height: 200, borderRadius: 'var(--r-xl)', marginBottom: '1.5rem' }} />
        <div className="skeleton" style={{ height: 350, borderRadius: 'var(--r-xl)' }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">⚠️</span>
        <h3>Profile not found</h3>
        <p>{error || 'We could not load your student profile.'}</p>
      </div>
    );
  }

  const userInitial = profile.name.charAt(0).toUpperCase();

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>

      {/* Identity Card */}
      <div
        className="glass-strong"
        style={{
          borderRadius: 'var(--r-xl)',
          padding: '2.5rem 2rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow blob */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 250,
            height: 250,
            background: 'var(--accent-glow)',
            filter: 'blur(80px)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        {/* Avatar */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(16,217,138,0.12)',
            border: '2px solid rgba(16,217,138,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--accent)',
            flexShrink: 0,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {userInitial}
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {profile.name}
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Student</p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            <span
              className="badge badge-ready"
              style={{ padding: '0.3rem 0.75rem' }}
            >
              {profile.rollNumber}
            </span>
            <span
              className="badge badge-confirmed"
              style={{ padding: '0.3rem 0.75rem' }}
            >
              {profile.year} Year
            </span>
          </div>
        </div>
      </div>

      {/* Feedback messages */}
      {success && (
        <div
          role="status"
          style={{
            padding: '1rem 1.25rem',
            background: 'rgba(16,217,138,0.1)',
            border: '1px solid rgba(16,217,138,0.25)',
            color: 'var(--accent)',
            borderRadius: 'var(--r-md)',
            marginBottom: '1.5rem',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          ✓ Profile updated successfully.
        </div>
      )}
      {error && (
        <div
          role="alert"
          style={{
            padding: '1rem 1.25rem',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#FCA5A5',
            borderRadius: 'var(--r-md)',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
          }}
        >
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Info Card */}
      <div className="glass" style={{ borderRadius: 'var(--r-xl)', padding: '2rem', boxShadow: 'var(--shadow-card)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.75rem',
          }}
        >
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Personal Information
          </h2>
          {!editing && (
            <button
              className="btn-secondary"
              style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </button>
          )}
        </div>

        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <FormInput
              id="profile-edit-name"
              label="Full Name"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              disabled={saving}
            />
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.375rem' }}>
                Roll Number
              </label>
              <div
                className="input-glass"
                style={{ opacity: 0.5, cursor: 'not-allowed', display: 'flex', alignItems: 'center', userSelect: 'none' }}
              >
                {profile.rollNumber}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Roll number cannot be changed.</p>
            </div>
            <FormInput
              id="profile-edit-mobile"
              label="Mobile Number"
              type="tel"
              value={editMobile}
              onChange={(e) => setEditMobile(e.target.value.replace(/\D/g, ''))}
              maxLength={10}
              disabled={saving}
            />
            <FormInput
              id="profile-edit-class"
              label="Class & Section"
              type="text"
              value={editClass}
              onChange={(e) => setEditClass(e.target.value)}
              disabled={saving}
            />
            <div>
              <label htmlFor="profile-edit-year" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.375rem' }}>
                Year
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  id="profile-edit-year"
                  value={editYear}
                  onChange={(e) => setEditYear(e.target.value)}
                  disabled={saving}
                  className="input-glass"
                  style={{ appearance: 'none', cursor: 'pointer' }}
                >
                  {['1st', '2nd', '3rd', '4th'].map((y) => (
                    <option key={y} value={y} style={{ background: '#11131C' }}>{y} Year</option>
                  ))}
                </select>
                <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                className="btn-ghost"
                style={{ flex: 1, border: '1px solid var(--glass-border)' }}
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {[
              { label: 'Full Name', value: profile.name },
              { label: 'Roll Number', value: profile.rollNumber },
              { label: 'Mobile', value: profile.mobileNumber },
              { label: 'Class & Section', value: profile.classSection },
              { label: 'Year', value: `${profile.year} Year` },
              { label: 'Email', value: user?.email },
            ].map(({ label, value }, idx, arr) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.1rem 0',
                  borderBottom: idx < arr.length - 1 ? '1px solid var(--glass-border)' : 'none',
                  gap: '1rem',
                }}
              >
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500, flexShrink: 0 }}>
                  {label}
                </span>
                <span
                  style={{
                    fontSize: '0.925rem',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    textAlign: 'right',
                    wordBreak: 'break-all',
                  }}
                >
                  {value || '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
