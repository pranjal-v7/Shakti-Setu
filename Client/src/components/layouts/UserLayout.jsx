import { useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard, Scale, MessageSquare, MessageCircle, Bot,
  BookOpen, Phone, User, LogOut, Globe, Menu, X, Shield, ChevronRight,
} from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import { logout } from '../../store/slices/authSlice';

const NAV = [
  { id: 'dashboard',        label: 'Dashboard',        icon: LayoutDashboard },
  { id: 'lawyers',          label: 'Find Lawyers',      icon: Scale },
  { id: 'my-consultations', label: 'Consultations',     icon: MessageSquare },
  { id: 'chat',             label: 'Live Chat',         icon: MessageCircle },
  { id: 'assistant',        label: 'AI Assistant',      icon: Bot },
  { id: 'legal-guide',      label: 'Know Your Rights',  icon: BookOpen },
  { id: 'resources',        label: 'Helplines',         icon: Phone },
  { id: 'profile',          label: 'My Profile',        icon: User },
];

const ADMIN_NAV = [
  { id: 'admin', label: 'Admin Panel', icon: Shield },
];

const UserLayout = ({ children }) => {
  const dispatch = useDispatch();
  const { page, setPage, language, setLanguage } = useContext(AppContext);
  const { user } = useSelector(s => s.auth);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user?.role === 'admin';
  const allNav = isAdmin ? [...NAV, ...ADMIN_NAV] : NAV;

  const handleLogout = () => {
    dispatch(logout());
    setPage('home');
  };

  const NavItem = ({ item }) => {
    const active = page === item.id;
    return (
      <button
        id={`user-nav-${item.id}`}
        onClick={() => { setPage(item.id); setMobileOpen(false); }}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          width: '100%', padding: '11px 14px',
          borderRadius: '12px',
          background: active ? 'rgba(124,58,237,0.2)' : 'transparent',
          border: active ? '1px solid rgba(124,58,237,0.4)' : '1px solid transparent',
          color: active ? 'var(--primary-light)' : 'var(--text-2)',
          fontWeight: active ? 600 : 400,
          fontSize: '0.88rem',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.15s',
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
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid var(--border)',
        marginBottom: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={() => setPage('dashboard')}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #7C3AED, #C026D3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(124,58,237,0.4)',
            flexShrink: 0,
          }}>
            <Shield size={18} color="white" />
          </div>
          <span style={{
            fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem', fontWeight: 800,
            background: 'linear-gradient(135deg, #fff, #A78BFA)',
            WebkitBackgroundClip: 'text', color: 'transparent', backgroundClip: 'text',
          }}>Shakti-Setu</span>
        </div>
      </div>

      {/* User badge */}
      <div style={{ padding: '10px 16px 14px', marginBottom: '4px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)',
          borderRadius: '12px', padding: '10px 12px',
        }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #7C3AED, #C026D3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.9rem', fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
              {isAdmin ? '🛡️ Admin' : '👤 User'}
            </div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {allNav.map(item => <NavItem key={item.id} item={item} />)}
        </div>
      </nav>

      {/* Footer actions */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button onClick={() => setLanguage(l => l === 'en' ? 'hi' : 'en')}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', padding: '10px 14px', borderRadius: '10px',
            background: 'transparent', border: '1px solid transparent',
            color: 'var(--text-2)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          <Globe size={16} />
          {language === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}
        </button>
        <button onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            width: '100%', padding: '10px 14px', borderRadius: '10px',
            background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
            color: '#fb7185', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
            transition: 'all 0.15s',
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
      {/* Background */}
      <div className="background-overlay" />

      {/* Desktop Sidebar */}
      <aside style={{
        width: '240px', flexShrink: 0,
        background: 'rgba(8,11,20,0.9)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border)',
        position: 'fixed', top: 0, left: 0, height: '100vh',
        zIndex: 100, display: 'none',
      }} className="sidebar-desktop">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)', zIndex: 200,
        }} onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile Drawer */}
      <aside style={{
        position: 'fixed', top: 0, left: mobileOpen ? 0 : '-260px',
        width: '240px', height: '100vh',
        background: 'rgba(8,11,20,0.98)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid var(--border)',
        zIndex: 300,
        transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, minHeight: '100vh', overflowY: 'auto' }} className="sidebar-main">
        {/* Mobile top bar */}
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
            background: 'linear-gradient(135deg, #fff, #A78BFA)',
            WebkitBackgroundClip: 'text', color: 'transparent', backgroundClip: 'text',
          }}>Shakti-Setu</span>
          <div style={{ width: '36px' }} />
        </div>

        <div style={{ padding: '24px 20px', maxWidth: '1100px', margin: '0 auto' }}>
          {children}
        </div>
      </main>

      {/* Sidebar layout CSS */}
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

export default UserLayout;
