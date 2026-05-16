import { useState, useEffect } from 'react';
import AuthService from '../services/authService.js';
import './ProfilePage.css';

export default function ProfilePage({ currentUser, onClose, onProfileUpdate }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [toast, setToast] = useState(null);

  // Editable fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('');
  const [language, setLanguage] = useState('EN');

  // Password fields
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load profile from API
  useEffect(() => {
    (async () => {
      try {
        const data = await AuthService.getProfile();
        setProfile(data);
        setFullName(data.fullName || '');
        setPhone(data.phoneNumber || '');
        setDistrict(data.district || '');
        setLanguage(data.preferredLanguage || 'EN');
      } catch (err) {
        showToast(err.message || 'Failed to load profile', 'error');
        // Fallback to locally stored user
        if (currentUser) {
          setProfile(currentUser);
          setFullName(currentUser.fullName || '');
          setPhone(currentUser.phoneNumber || '');
          setDistrict(currentUser.district || '');
          setLanguage(currentUser.preferredLanguage || 'EN');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser]);

  const initials = (profile?.fullName || 'U')
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await AuthService.updateProfile({
        fullName, phoneNumber: phone, district, preferredLanguage: language,
      });
      setProfile(data);
      setEditing(false);
      showToast('Profile updated successfully');
      if (onProfileUpdate) onProfileUpdate(data);
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePw = async () => {
    if (newPw.length < 8) { showToast('Password must be at least 8 characters', 'error'); return; }
    if (newPw !== confirmPw) { showToast('Passwords do not match', 'error'); return; }
    setSaving(true);
    try {
      await AuthService.changePassword(currentPw, newPw);
      showToast('Password changed successfully');
      setChangingPw(false);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      showToast(err.message || 'Password change failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    AuthService.logout();
  };

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  const langLabel = { EN: 'English', SI: 'Sinhala', TA: 'Tamil' };

  if (loading) {
    return (
      <div className="pp-overlay" onClick={onClose}>
        <div className="pp-panel" onClick={e => e.stopPropagation()}>
          <div className="pp-loading"><div className="pp-spinner" /><span>Loading profile…</span></div>
        </div>
      </div>
    );
  }

  return (
    <div className="pp-overlay" onClick={onClose}>
      <div className="pp-panel" onClick={e => e.stopPropagation()}>
        {/* Toast */}
        {toast && (
          <div className={`pp-toast ${toast.type === 'error' ? 'pp-toast-error' : 'pp-toast-ok'}`}>
            <span>{toast.type === 'error' ? '⚠' : '✓'}</span>
            {toast.msg}
          </div>
        )}

        {/* Close button */}
        <button className="pp-close" onClick={onClose} title="Close profile">✕</button>

        {/* Header */}
        <header className="pp-header">
          <div className="pp-avatar-wrap">
            <div className="pp-avatar">{initials}</div>
            <div className="pp-avatar-ring" />
            <span className={`pp-status-badge ${profile?.isActive !== false ? 'active' : 'inactive'}`}>
              {profile?.isActive !== false ? 'Active' : 'Inactive'}
            </span>
          </div>
          <h2 className="pp-name">{profile?.fullName || 'User'}</h2>
          <p className="pp-email">{profile?.email || ''}</p>
          <div className="pp-role-badge">{profile?.role || 'USER'}</div>
        </header>

        <div className="pp-divider" />

        {/* ── Personal Info Card ── */}
        <section className="pp-card">
          <div className="pp-card-head">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <h3>Personal Information</h3>
            {!editing && (
              <button className="pp-edit-btn" onClick={() => setEditing(true)}>Edit</button>
            )}
          </div>

          {!editing ? (
            <div className="pp-fields">
              <div className="pp-field"><span className="pp-field-label">FULL NAME</span><span className="pp-field-value">{profile?.fullName || '—'}</span></div>
              <div className="pp-field"><span className="pp-field-label">PHONE</span><span className="pp-field-value">{profile?.phoneNumber || '—'}</span></div>
              <div className="pp-field"><span className="pp-field-label">EMAIL</span><span className="pp-field-value">{profile?.email || '—'}</span></div>
              <div className="pp-field"><span className="pp-field-label">DISTRICT</span><span className="pp-field-value">{profile?.district || '—'}</span></div>
              <div className="pp-field"><span className="pp-field-label">LANGUAGE</span><span className="pp-field-value">{langLabel[profile?.preferredLanguage] || profile?.preferredLanguage || 'English'}</span></div>
              <div className="pp-field"><span className="pp-field-label">MEMBER SINCE</span><span className="pp-field-value">{memberSince}</span></div>
            </div>
          ) : (
            <div className="pp-edit-form">
              <label className="pp-edit-label">Full Name<input type="text" value={fullName} onChange={e => setFullName(e.target.value)} /></label>
              <label className="pp-edit-label">Phone<input type="tel" value={phone} onChange={e => setPhone(e.target.value)} /></label>
              <label className="pp-edit-label">District<input type="text" value={district} onChange={e => setDistrict(e.target.value)} /></label>
              <label className="pp-edit-label">Language
                <select value={language} onChange={e => setLanguage(e.target.value)}>
                  <option value="EN">English</option>
                  <option value="SI">Sinhala</option>
                  <option value="TA">Tamil</option>
                </select>
              </label>
              <div className="pp-edit-actions">
                <button className="pp-btn pp-btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
                <button className="pp-btn pp-btn-ghost" onClick={() => { setEditing(false); setFullName(profile?.fullName || ''); setPhone(profile?.phoneNumber || ''); setDistrict(profile?.district || ''); setLanguage(profile?.preferredLanguage || 'EN'); }}>Cancel</button>
              </div>
            </div>
          )}
        </section>

        {/* ── Activity Card ── */}
        <section className="pp-card">
          <div className="pp-card-head">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <h3>Activity</h3>
          </div>
          <div className="pp-fields">
            <div className="pp-field"><span className="pp-field-label">ROLE</span><span className="pp-field-value">{profile?.role || 'USER'}</span></div>
            <div className="pp-field"><span className="pp-field-label">ACCOUNT STATUS</span><span className="pp-field-value pp-val-active">{profile?.isActive !== false ? '● Active' : '● Inactive'}</span></div>
            <div className="pp-field"><span className="pp-field-label">MEMBER SINCE</span><span className="pp-field-value">{memberSince}</span></div>
          </div>
        </section>

        {/* ── Change Password ── */}
        <section className="pp-card">
          <div className="pp-card-head">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <h3>Security</h3>
          </div>

          {!changingPw ? (
            <button className="pp-btn pp-btn-outline" onClick={() => setChangingPw(true)}>
              Change password
            </button>
          ) : (
            <form className="pp-edit-form" onSubmit={(e) => { e.preventDefault(); handleChangePw(); }}>
              <label className="pp-edit-label">Current Password<input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Enter current password" required autoComplete="current-password" /></label>
              <label className="pp-edit-label">New Password<input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min 8 characters" required autoComplete="new-password" /></label>
              <label className="pp-edit-label">Confirm New Password<input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat new password" required autoComplete="new-password" /></label>
              <div className="pp-edit-actions">
                <button type="submit" className="pp-btn pp-btn-primary" disabled={saving}>{saving ? 'Changing…' : 'Update password'}</button>
                <button type="button" className="pp-btn pp-btn-ghost" onClick={() => { setChangingPw(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }}>Cancel</button>
              </div>
            </form>
          )}
        </section>

        {/* ── Sign Out ── */}
        <button className="pp-btn pp-btn-danger pp-btn-full" onClick={handleLogout}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign out
        </button>
      </div>
    </div>
  );
}
