import { useSelector } from 'react-redux';
import { CheckCircle, Clock, XCircle, Shield, Mail, Phone, ArrowRight } from 'lucide-react';
import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';

const LawyerVerification = () => {
  const { lawyer } = useSelector(s => s.lawyer);
  const { setPage } = useContext(AppContext);
  const status = lawyer?.status || 'pending';

  const config = {
    approved: {
      icon: CheckCircle,
      color: '#10B981',
      bg: 'rgba(16,185,129,0.1)',
      border: 'rgba(16,185,129,0.3)',
      title: 'Verification Approved!',
      subtitle: 'You are now a verified lawyer on Shakti-Setu.',
      message: 'Your profile is live and clients can find and book consultations with you. Start by setting up your profile and availability.',
    },
    pending: {
      icon: Clock,
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.1)',
      border: 'rgba(245,158,11,0.3)',
      title: 'Verification Pending',
      subtitle: 'Your application is under review.',
      message: 'Our admin team typically reviews applications within 24–48 hours. You will be able to access all features once approved. Make sure your bar council number and documents are accurate.',
    },
    rejected: {
      icon: XCircle,
      color: '#F43F5E',
      bg: 'rgba(244,63,94,0.1)',
      border: 'rgba(244,63,94,0.3)',
      title: 'Verification Rejected',
      subtitle: 'Your application was not approved.',
      message: lawyer?.rejectionReason || 'Your application did not meet our verification criteria. Please contact our support team to understand the reason and reapply with correct information.',
    },
  };

  const c = config[status];
  const Icon = c.icon;

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 0' }}>
      {/* Status card */}
      <div style={{
        background: 'rgba(12,16,32,0.8)', border: `1px solid ${c.border}`,
        borderRadius: '24px', padding: '2.5rem', textAlign: 'center',
        marginBottom: '24px',
        boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 40px ${c.bg}`,
      }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: c.bg, border: `2px solid ${c.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: `0 0 30px ${c.bg}`,
        }}>
          <Icon size={38} color={c.color} />
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '4px 16px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700,
          background: c.bg, border: `1px solid ${c.border}`, color: c.color,
          marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.color }} />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>

        <h1 style={{
          fontFamily: "'Outfit', sans-serif", fontSize: '1.8rem', fontWeight: 800,
          color: 'var(--text-1)', marginBottom: '8px',
        }}>{c.title}</h1>
        <p style={{ color: c.color, fontWeight: 600, marginBottom: '16px', fontSize: '1rem' }}>{c.subtitle}</p>
        <p style={{ color: 'var(--text-2)', lineHeight: 1.7, fontSize: '0.92rem' }}>{c.message}</p>

        {status === 'approved' && (
          <button onClick={() => setPage('lawyer-dashboard')} style={{
            marginTop: '24px',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            color: 'white', border: 'none', borderRadius: '12px',
            padding: '12px 28px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
          }}>
            Go to Dashboard <ArrowRight size={16} />
          </button>
        )}
      </div>

      {/* Profile info */}
      <div style={{
        background: 'rgba(12,16,32,0.6)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '1.5rem',
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '16px', fontFamily: "'Outfit', sans-serif" }}>
          Your Submitted Details
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { label: 'Full Name', value: lawyer?.name },
            { label: 'Email', value: lawyer?.email, icon: Mail },
            { label: 'Specialization', value: lawyer?.specialization },
            { label: 'Bar Council No.', value: lawyer?.barCouncilNumber || 'N/A' },
            { label: 'State', value: lawyer?.state },
            { label: 'Experience', value: lawyer?.experience ? `${lawyer.experience} years` : 'N/A' },
          ].map(({ label, value }) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-3)', fontWeight: 600 }}>{label}</span>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-1)', fontWeight: 500 }}>{value || '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Help */}
      {(status === 'pending' || status === 'rejected') && (
        <div style={{
          background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: '14px', padding: '1.2rem 1.5rem', marginTop: '16px',
          display: 'flex', gap: '12px', alignItems: 'flex-start',
        }}>
          <Shield size={18} color="#A78BFA" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-light)', marginBottom: '4px' }}>
              Need help?
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
              Contact us at <strong style={{ color: 'var(--primary-light)' }}>support@shaktisetu.in</strong> with your registered email for any queries regarding your verification status.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LawyerVerification;
