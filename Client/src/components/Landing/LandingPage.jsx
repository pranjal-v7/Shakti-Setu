import { useState, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock, User, Scale, Shield, ChevronRight, BookOpen, MapPin, Heart, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { loginUser, clearError as clearAuthError } from '../../store/slices/authSlice';
import { loginLawyer, clearError as clearLawyerError } from '../../store/slices/lawyerSlice';
import { AppContext } from '../../context/AppContext';
import GlassCard from '../common/GlassCard';

// ─── Role cards shown on landing ─────────────────────────────────────────────
const ROLES = [
  {
    key: 'user',
    icon: User,
    label: 'I need legal help',
    title: 'User / Citizen',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.12)',
    border: 'rgba(124,58,237,0.35)',
    desc: 'Access legal guidance, find lawyers, and get AI-powered assistance.',
  },
  {
    key: 'lawyer',
    icon: Scale,
    label: 'I am a lawyer',
    title: 'Legal Professional',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.3)',
    desc: 'Manage consultations, connect with clients, and grow your practice.',
  },
  {
    key: 'admin',
    icon: Shield,
    label: 'Admin access',
    title: 'Administrator',
    color: '#F43F5E',
    bg: 'rgba(244,63,94,0.1)',
    border: 'rgba(244,63,94,0.3)',
    desc: 'Oversee platform operations, verify lawyers, and manage content.',
  },
];

// ─── Stats for hero ───────────────────────────────────────────────────────────
const STATS = [
  { value: '15+', label: 'Legal Topics' },
  { value: '100%', label: 'Free Access' },
  { value: '24/7', label: 'AI Support' },
];

// ─── Feature pills for hero ───────────────────────────────────────────────────
const FEATURES = [
  { icon: BookOpen, color: '#A78BFA', label: 'Know Your Rights' },
  { icon: Scale,    color: '#F59E0B', label: 'Find Lawyers' },
  { icon: Heart,    color: '#F43F5E', label: 'Get Support' },
];

// ─── Login Form ───────────────────────────────────────────────────────────────
const LoginForm = ({ role, onBack }) => {
  const dispatch = useDispatch();
  const { setUser, setPage } = useContext(AppContext);
  const { loading: authLoading, error: authError } = useSelector(s => s.auth);
  const { loading: lawyerLoading, error: lawyerError } = useSelector(s => s.lawyer);

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  const loading = role === 'user' || role === 'admin' ? authLoading : lawyerLoading;
  const error   = role === 'user' || role === 'admin' ? authError   : lawyerError;
  const r = ROLES.find(x => x.key === role);

  const clearErrors = () => {
    dispatch(clearAuthError());
    dispatch(clearLawyerError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearErrors();

    if (role === 'lawyer') {
      const result = await dispatch(loginLawyer(form));
      if (loginLawyer.fulfilled.match(result)) {
        setPage('lawyer-dashboard');
      }
    } else {
      const result = await dispatch(loginUser(form));
      if (loginUser.fulfilled.match(result)) {
        setUser(result.payload.user);
        const isAdmin = result.payload.user?.role === 'admin';
        setPage(isAdmin ? 'admin' : 'dashboard');
      }
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        width: '100%', maxWidth: '440px',
        background: 'rgba(12,16,32,0.97)',
        border: `1px solid ${r.border}`,
        borderRadius: '24px',
        padding: '2rem',
        boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 40px ${r.bg}`,
        animation: 'fadeInUp 0.3s ease',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.8rem' }}>
          <button onClick={onBack} style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-2)', cursor: 'pointer', flexShrink: 0,
          }}>
            <ArrowLeft size={16} />
          </button>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: r.bg, border: `1px solid ${r.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <r.icon size={20} color={r.color} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-1)', fontFamily: "'Outfit', sans-serif" }}>
              {r.title} Login
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '2px' }}>
              Sign in with your email address
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
            padding: '10px 14px', borderRadius: '10px', marginBottom: '1rem',
            color: '#fca5a5', fontSize: '0.85rem',
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Email */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '6px', letterSpacing: '0.02em' }}>
              Email Address
            </label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', padding: '0 14px',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
              onFocus={() => {}} // handled via CSS
            >
              <Mail size={16} color="var(--text-3)" />
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="your.email@example.com"
                style={{
                  flex: 1, padding: '13px 0', fontSize: '0.92rem',
                  color: 'var(--text-1)', background: 'transparent', border: 'none', outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '6px', letterSpacing: '0.02em' }}>
              Password
            </label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', padding: '0 14px',
            }}>
              <Lock size={16} color="var(--text-3)" />
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Enter your password"
                style={{
                  flex: 1, padding: '13px 0', fontSize: '0.92rem',
                  color: 'var(--text-1)', background: 'transparent', border: 'none', outline: 'none',
                }}
              />
              <button type="button" onClick={() => setShowPass(s => !s)}
                style={{ color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            marginTop: '6px',
            background: loading ? 'rgba(124,58,237,0.4)' : `linear-gradient(135deg, ${r.color}, ${r.color}cc)`,
            color: 'white', border: 'none', borderRadius: '12px',
            padding: '14px', fontWeight: 700, fontSize: '0.95rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'all 0.2s',
            boxShadow: loading ? 'none' : `0 8px 24px ${r.bg}`,
          }}>
            {loading ? 'Signing in…' : `Sign in as ${r.title}`}
          </button>

          {role !== 'admin' && (
            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-3)', marginTop: '4px' }}>
              No account?{' '}
              <button type="button"
                onClick={() => setPage(role === 'lawyer' ? 'lawyer-register' : 'register')}
                style={{ background: 'none', border: 'none', color: r.color, cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>
                Register here
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

// ─── Main Landing Page ────────────────────────────────────────────────────────
const LandingPage = () => {
  const [activeRole, setActiveRole] = useState(null);
  const { t, setPage } = useContext(AppContext);

  return (
    <div className="hero-container" style={{ minHeight: '100vh', flexDirection: 'column', gap: 0, padding: '40px 24px 60px' }}>
      {/* Background orbs */}
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />

      {/* ── Hero Section ── */}
      <div className="hero-content" style={{ marginBottom: '5rem' }}>
        <div className="tagline-pill">
          <span className="pulsing-dot" />
          <span>{t.tagline || 'Legal Empowerment for Every Woman'}</span>
        </div>

        <h1 className="hero-title">
          {t.homeHeader || 'Know Your Rights'}<br />
          <span className="hero-subtitle">{t.homeSubHeader || 'Get Legal Help Today'}</span>
        </h1>

        <p className="hero-description">
          {t.homeIntro || 'Shakti-Setu empowers women across India with free legal guidance, verified lawyers, and AI-powered assistance.'}
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', marginBottom: '3rem', flexWrap: 'wrap' }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 800,
                background: 'linear-gradient(135deg, #7C3AED, #C026D3)',
                WebkitBackgroundClip: 'text', color: 'transparent', backgroundClip: 'text', lineHeight: 1.1,
              }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 600, marginTop: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {FEATURES.map(({ icon: Icon, color, label }) => (
            <div key={label} style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              padding: '8px 16px', borderRadius: '99px', fontSize: '0.85rem', color: 'var(--text-2)',
            }}>
              <Icon size={15} color={color} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Role Selector ── */}
      <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
        <p style={{
          textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-3)',
          letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px',
        }}>
          Select your role to get started
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
        }}>
          {ROLES.map(role => (
            <button
              key={role.key}
              id={`role-${role.key}-btn`}
              onClick={() => setActiveRole(role.key)}
              style={{
                textAlign: 'left',
                background: role.bg,
                border: `1px solid ${role.border}`,
                borderRadius: '20px',
                padding: '1.6rem',
                cursor: 'pointer',
                color: 'var(--text-1)',
                transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
                e.currentTarget.style.boxShadow = `0 20px 50px rgba(0,0,0,0.4), 0 0 30px ${role.bg}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Icon */}
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: `${role.color}22`, border: `1px solid ${role.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '14px',
              }}>
                <role.icon size={22} color={role.color} />
              </div>

              {/* Text */}
              <h3 style={{
                fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem',
                fontWeight: 700, marginBottom: '6px', color: 'var(--text-1)',
              }}>
                {role.title}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-2)', lineHeight: 1.5, marginBottom: '16px' }}>
                {role.desc}
              </p>

              {/* CTA */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '0.82rem', fontWeight: 700, color: role.color,
              }}>
                {role.label}
                <ChevronRight size={14} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active role login modal */}
      {activeRole && <LoginForm role={activeRole} onBack={() => setActiveRole(null)} />}
    </div>
  );
};

export default LandingPage;
