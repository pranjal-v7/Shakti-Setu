import { useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard, Users, MessageCircle,
  User, LogOut, Globe, Menu, X, Scale, BookOpen, Phone,
  ChevronRight,
} from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { logoutLawyer } from '../../store/slices/lawyerSlice';

const NAV = [
  { id: 'lawyer-dashboard',  label: 'Dashboard',          icon: LayoutDashboard },
  { id: 'lawyer-clients',    label: 'My Clients',          icon: Users },
  { id: 'chat',              label: 'Live Chat',           icon: MessageCircle },
  { id: 'legal-guide',       label: 'Legal Resources',     icon: BookOpen },
  { id: 'resources',         label: 'Helplines',           icon: Phone },
  { id: 'lawyer-profile',    label: 'My Profile',          icon: User },
];

const LawyerLayout = ({ children }) => {
  const dispatch = useDispatch();
  const { page, setPage, language, setLanguage } = useContext(AppContext);
  const { lawyer } = useSelector(s => s.lawyer);
  const [mobileOpen, setMobileOpen] = useState(false);
  const status = lawyer?.status;

  const handleLogout = () => {
    dispatch(logoutLawyer());
    setPage('home');
  };

  const statusColor = status === 'approved' ? '#10B981' : status === 'rejected' ? '#F43F5E' : '#F59E0B';
  const statusLabel = status === 'approved' ? 'Verified' : status === 'rejected' ? 'Rejected' : 'Pending';

  const NavItem = ({ item }) => {
    const active = page === item.id;

    return (
      <button
        id={`lawyer-nav-${item.id}`}
        onClick={() => { setPage(item.id); setMobileOpen(false); }}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          width: '100%', padding: '11px 14px', borderRadius: '12px',
          background: active ? 'rgba(245,158,11,0.2)' : 'transparent',
          border: active ? '1px solid rgba(245,158,11,0.35)' : '1px solid transparent',
          color: active ? '#FCD34D' : 'var(--text-2)',
          fontWeight: active ? 600 : 400, fontSize: '0.88rem',
          cursor: 'pointer',
          textAlign: 'left', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--text-1)'; } }}
        onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)'; } }}
      >
        <item.icon size={17} />
        <span>{item.label}</span>
        {active && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
      </button>
    );
  };

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={() => setPage('lawyer-dashboard')}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(245,158,11,0.4)', flexShrink: 0,
          }}>
            <Scale size={18} color="white" />
          </div>
          <span style={{
            fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem', fontWeight: 800,
            background: 'linear-gradient(135deg, #fff, #FCD34D)',
            WebkitBackgroundClip: 'text', color: 'transparent', backgroundClip: 'text',
          }}>Shakti-Setu</span>
        </div>
      </div>

      {/* Lawyer badge */}
      <div style={{ padding: '10px 16px 14px' }}>
        <div style={{
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: '12px', padding: '10px 12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.9rem', fontWeight: 700, color: 'white', flexShrink: 0,
            }}>
              {lawyer?.name?.[0]?.toUpperCase() || 'L'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {lawyer?.name || 'Lawyer'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>Legal Professional</div>
            </div>
          </div>
          {/* Verification status badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '3px 10px', borderRadius: '99px', fontSize: '0.7rem', fontWeight: 700,
            background: `${statusColor}18`, border: `1px solid ${statusColor}40`,
            color: statusColor,
          }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: statusColor }} />
            {statusLabel}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV.map(item => <NavItem key={item.id} item={item} />)}
        </div>
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button onClick={() => setLanguage(l => l === 'en' ? 'hi' : 'en')}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px',
            borderRadius: '10px', background: 'transparent', border: '1px solid transparent',
            color: 'var(--text-2)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <Globe size={16} />
          {language === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}
        </button>
        <button onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px',
            borderRadius: '10px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
            color: '#fb7185', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.15s',
          }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div className="background-overlay" />

      {/* Desktop Sidebar */}
      <aside style={{
        width: '240px', flexShrink: 0, background: 'rgba(8,11,20,0.9)',
        backdropFilter: 'blur(20px)', borderRight: '1px solid var(--border)',
        position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100, display: 'none',
      }} className="sidebar-desktop">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200 }}
          onClick={() => setMobileOpen(false)} />
      )}

      <aside style={{
        position: 'fixed', top: 0, left: mobileOpen ? 0 : '-260px', width: '240px', height: '100vh',
        background: 'rgba(8,11,20,0.98)', backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border)', zIndex: 300,
        transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <SidebarContent />
      </aside>

      <main style={{ flex: 1, minHeight: '100vh', overflowY: 'auto' }} className="sidebar-main">
        <div style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(8,11,20,0.9)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)',
          padding: '0 16px', height: '56px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }} className="mobile-topbar">
          <button onClick={() => setMobileOpen(o => !o)} style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-1)', cursor: 'pointer',
          }}>
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <span style={{
            fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '1rem',
            background: 'linear-gradient(135deg, #fff, #FCD34D)',
            WebkitBackgroundClip: 'text', color: 'transparent', backgroundClip: 'text',
          }}>Shakti-Setu</span>
          <div style={{
            padding: '3px 10px', borderRadius: '99px', fontSize: '0.68rem', fontWeight: 700,
            background: `${statusColor}18`, color: statusColor,
          }}>{statusLabel}</div>
        </div>

        <div style={{ padding: '24px 20px', maxWidth: '1100px', margin: '0 auto' }}>
          {children}
        </div>
      </main>

      <style>{`
        @media (min-width: 768px) {
          .sidebar-desktop { display: block !important; }
          .sidebar-main { margin-left: 240px; }
          .mobile-topbar { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default LawyerLayout;
