import { useState, useEffect, useRef } from 'react';
import AuthService from '../services/authService.js';
import './LoginPage.css';

/* ── Animated particle canvas background ──────────────────────────────────── */
function ParticleCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current, ctx = c.getContext('2d');
    let raf, w, h;
    const particles = [];
    const resize = () => { w = c.width = window.innerWidth; h = c.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.8 + 0.4,
        o: Math.random() * 0.5 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(96,165,250,${p.o})`; ctx.fill();
      }
      // connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 140) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(96,165,250,${0.06 * (1 - d / 140)})`;
            ctx.lineWidth = 0.6; ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className="lp-canvas" />;
}

/* ── Radar sweep animation ────────────────────────────────────────────────── */
function RadarSweep() {
  return (
    <div className="lp-radar">
      <div className="lp-radar-ring r1" />
      <div className="lp-radar-ring r2" />
      <div className="lp-radar-ring r3" />
      <div className="lp-radar-sweep" />
      <div className="lp-radar-dot d1" /><div className="lp-radar-dot d2" /><div className="lp-radar-dot d3" />
    </div>
  );
}

/* ── SVG icons ────────────────────────────────────────────────────────────── */
const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeClosed = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const UserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const MapIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

/* ── Main LoginPage ───────────────────────────────────────────────────────── */
export default function LoginPage({ onLoginSuccess }) {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  // Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [district, setDistrict] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Forgot
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Live clock
  const [clock, setClock] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(t); }, []);

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { const data = await AuthService.login(email, password); onLoginSuccess(data); }
    catch (err) { setError(err.message || 'Login failed. Please check your credentials.'); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setError('');
    if (regPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (regPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await AuthService.register({ fullName, email: regEmail, password: regPassword, phoneNumber, district, role: 'USER', preferredLanguage: 'EN', isActive: true });
      setSuccess('Account created successfully! You can now sign in.');
      setMode('login'); setEmail(regEmail);
    } catch (err) { setError(err.message || 'Registration failed.'); }
    finally { setLoading(false); }
  };

  const handleForgot = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (!otpSent) { await AuthService.forgotPassword(forgotEmail); setOtpSent(true); setSuccess('Reset link sent. Enter your new password below.'); }
      else { await AuthService.resetPassword(forgotEmail, newPassword); setSuccess('Password reset! You can now sign in.'); setMode('login'); setEmail(forgotEmail); setOtpSent(false); }
    } catch (err) { setError(err.message || 'Reset failed.'); }
    finally { setLoading(false); }
  };

  const go = (m) => { setMode(m); setError(''); setSuccess(''); setOtpSent(false); setShowPw(false); setShowPw2(false); };

  return (
    <div className="lp">
      <ParticleCanvas />

      {/* ── Ambient glow blobs ──────────────────────────────────────────── */}
      <div className="lp-glow g1" />
      <div className="lp-glow g2" />
      <div className="lp-glow g3" />

      {/* ── Grid overlay ───────────────────────────────────────────────── */}
      <div className="lp-grid" />

      <div className="lp-shell">
        {/* ════ LEFT — branding hero ════ */}
        <section className="lp-hero">
          <div className="lp-hero-inner">
            {/* Logo */}
            <div className="lp-logo-wrap">
              <img src="/eris-logo.png" alt="ERIS Logo" className="lp-logo-img" />
              <div className="lp-logo-pulse" />
            </div>

            <h1 className="lp-brand">ERIS</h1>
            <p className="lp-tagline">Early Risk Identification System</p>

            <div className="lp-divider" />

            <p className="lp-desc">
              Government Operations Centre for real-time disaster monitoring,
              ML-powered predictions, and nationwide emergency coordination across Sri Lanka.
            </p>

            {/* Radar */}
            <RadarSweep />

            {/* Live status bar */}
            <div className="lp-status-bar">
              <div className="lp-status-item">
                <span className="lp-pulse-dot" />
                <span>System Online</span>
              </div>
              <div className="lp-status-item">
                <span>{clock.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
              <div className="lp-status-item">
                <span>IST UTC+5:30</span>
              </div>
            </div>

            {/* HUD stats */}
            <div className="lp-hud">
              <div className="lp-hud-stat"><strong>18</strong><span>Stations</span></div>
              <div className="lp-hud-stat"><strong>94.6%</strong><span>ML Accuracy</span></div>
              <div className="lp-hud-stat"><strong>1.2M</strong><span>Protected</span></div>
            </div>
          </div>
        </section>

        {/* ════ RIGHT — form card ════ */}
        <section className="lp-form-section">
          <div className="lp-glass-card">
            {/* ── LOGIN ── */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="lp-form" autoComplete="on">
                <div className="lp-form-header">
                  <h2>Welcome back</h2>
                  <p>Sign in to access the operations dashboard</p>
                </div>

                {error && <div className="lp-toast lp-toast-error"><span>⚠</span>{error}</div>}
                {success && <div className="lp-toast lp-toast-ok"><span>✓</span>{success}</div>}

                <div className="lp-field">
                  <div className="lp-field-icon"><MailIcon /></div>
                  <input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required autoComplete="email" />
                </div>

                <div className="lp-field">
                  <div className="lp-field-icon"><LockIcon /></div>
                  <input id="login-password" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required autoComplete="current-password" />
                  <button type="button" className="lp-eye" onClick={() => setShowPw(!showPw)} tabIndex={-1}>{showPw ? <EyeClosed /> : <EyeOpen />}</button>
                </div>

                <div className="lp-row-between">
                  <label className="lp-check"><input type="checkbox" defaultChecked /><span>Remember me</span></label>
                  <button type="button" className="lp-text-btn" onClick={() => go('forgot')}>Forgot password?</button>
                </div>

                <button type="submit" className="lp-submit" disabled={loading}>
                  {loading ? <span className="lp-spinner" /> : null}
                  {loading ? 'Authenticating…' : 'Sign in'}
                </button>

                <div className="lp-alt">
                  <span>Don't have an account?</span>
                  <button type="button" className="lp-text-btn" onClick={() => go('register')}>Create account</button>
                </div>
              </form>
            )}

            {/* ── REGISTER ── */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="lp-form lp-form-reg" autoComplete="on">
                <div className="lp-form-header">
                  <h2>Create account</h2>
                  <p>Register for ERIS operations access</p>
                </div>

                {error && <div className="lp-toast lp-toast-error"><span>⚠</span>{error}</div>}

                <div className="lp-field"><div className="lp-field-icon"><UserIcon /></div>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full name" required /></div>

                <div className="lp-field"><div className="lp-field-icon"><MailIcon /></div>
                  <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="Email address" required /></div>

                <div className="lp-field-row">
                  <div className="lp-field"><div className="lp-field-icon"><PhoneIcon /></div>
                    <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="Phone" required /></div>
                  <div className="lp-field"><div className="lp-field-icon"><MapIcon /></div>
                    <input type="text" value={district} onChange={e => setDistrict(e.target.value)} placeholder="District" required /></div>
                </div>

                <div className="lp-field"><div className="lp-field-icon"><LockIcon /></div>
                  <input type={showPw ? 'text' : 'password'} value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="Password (min 8 chars)" required />
                  <button type="button" className="lp-eye" onClick={() => setShowPw(!showPw)} tabIndex={-1}>{showPw ? <EyeClosed /> : <EyeOpen />}</button></div>

                <div className="lp-field"><div className="lp-field-icon"><LockIcon /></div>
                  <input type={showPw2 ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" required />
                  <button type="button" className="lp-eye" onClick={() => setShowPw2(!showPw2)} tabIndex={-1}>{showPw2 ? <EyeClosed /> : <EyeOpen />}</button></div>

                <button type="submit" className="lp-submit" disabled={loading}>
                  {loading ? <span className="lp-spinner" /> : null}
                  {loading ? 'Creating account…' : 'Create account'}
                </button>

                <div className="lp-alt">
                  <button type="button" className="lp-text-btn" onClick={() => go('login')}>← Back to sign in</button>
                </div>
              </form>
            )}

            {/* ── FORGOT ── */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgot} className="lp-form" autoComplete="on">
                <div className="lp-form-header">
                  <h2>Reset password</h2>
                  <p>{otpSent ? 'Enter your new password below' : "We'll send a reset link to your email"}</p>
                </div>

                {error && <div className="lp-toast lp-toast-error"><span>⚠</span>{error}</div>}
                {success && <div className="lp-toast lp-toast-ok"><span>✓</span>{success}</div>}

                <div className="lp-field"><div className="lp-field-icon"><MailIcon /></div>
                  <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="Email address" required disabled={otpSent} /></div>

                {otpSent && (
                  <div className="lp-field"><div className="lp-field-icon"><LockIcon /></div>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min 8 chars)" required /></div>
                )}

                <button type="submit" className="lp-submit" disabled={loading}>
                  {loading ? <span className="lp-spinner" /> : null}
                  {loading ? 'Processing…' : otpSent ? 'Reset password' : 'Send reset link'}
                </button>

                <div className="lp-alt">
                  <button type="button" className="lp-text-btn" onClick={() => go('login')}>← Back to sign in</button>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <p className="lp-footer">© {new Date().getFullYear()} ERIS — Disaster Management Centre, Sri Lanka</p>
        </section>
      </div>
    </div>
  );
}
