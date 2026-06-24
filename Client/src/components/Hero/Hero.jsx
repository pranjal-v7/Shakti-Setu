import { useContext } from 'react';
import { Volume2, ChevronRight, BookOpen, MapPin, Heart, Shield, Users, Scale } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { useTTS } from '../../hooks/useTTS';
import GlassCard from '../common/GlassCard';

const features = [
  {
    icon: BookOpen,
    color: '#A78BFA',
    bg: 'rgba(124,58,237,0.15)',
    titleKey: 'feat1Title',
    descKey: 'feat1Desc',
  },
  {
    icon: Scale,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
    titleKey: 'feat2Title',
    descKey: 'feat2Desc',
  },
  {
    icon: Heart,
    color: '#F43F5E',
    bg: 'rgba(244,63,94,0.12)',
    titleKey: 'feat3Title',
    descKey: 'feat3Desc',
  },
];

const stats = [
  { value: '15+', label: 'Legal Topics' },
  { value: '100%', label: 'Free Access' },
  { value: '24/7', label: 'AI Support' },
];

const Hero = () => {
  const { t, setPage, language } = useContext(AppContext);
  const { speak, speaking, stop } = useTTS();

  const handleSpeak = () => {
    if (speaking) stop();
    else speak(t.homeIntro, language);
  };

  return (
    <div className="hero-container">
      {/* Animated background orbs */}
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />

      <div className="hero-content">
        {/* Tagline pill */}
        <div className="tagline-pill">
          <span className="pulsing-dot" />
          <span>{t.tagline}</span>
        </div>

        {/* Main heading */}
        <h1 className="hero-title">
          {t.homeHeader}
          <br />
          <span className="hero-subtitle">{t.homeSubHeader}</span>
        </h1>

        {/* Description */}
        <p className="hero-description">{t.homeIntro}</p>

        {/* CTA buttons */}
        <div className="hero-actions">
          <button
            id="hero-get-started-btn"
            onClick={() => setPage('register')}
            className="btn-primary"
          >
            {t.getStarted}
            <ChevronRight size={18} />
          </button>
          <button
            id="hero-hear-intro-btn"
            onClick={handleSpeak}
            className={`btn-secondary ${speaking ? 'speaking' : ''}`}
          >
            <Volume2 size={18} className={speaking ? 'icon-pulse' : ''} />
            {speaking ? 'Speaking…' : t.hearIntro}
          </button>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '40px',
          marginBottom: '3.5rem',
          flexWrap: 'wrap',
        }}>
          {stats.map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '2rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #7C3AED, #C026D3)',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1.1,
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', fontWeight: 600, marginTop: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Feature cards */}
        <div className="features-grid">
          {features.map(({ icon: Icon, color, bg, titleKey, descKey }) => (
            <GlassCard key={titleKey} className="feature-card">
              <div className="feature-icon" style={{ background: bg, border: `1px solid ${color}22` }}>
                <Icon size={22} color={color} />
              </div>
              <h3>{t[titleKey]}</h3>
              <p>{t[descKey]}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hero;
