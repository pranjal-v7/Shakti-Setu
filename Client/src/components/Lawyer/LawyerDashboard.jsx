import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Users, MessageSquare, CheckCircle, Clock, Star, TrendingUp, Award, Calendar } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const lawyerGet = (path) => {
  const token = localStorage.getItem('lawyerToken');
  return axios.get(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
};

const StatCard = ({ icon: Icon, label, value, color, bg, trend }) => (
  <div style={{
    background: 'rgba(12,16,32,0.8)', border: `1px solid ${color}30`,
    borderRadius: '18px', padding: '1.4rem',
    transition: 'all 0.25s',
    cursor: 'default',
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = `${color}60`; e.currentTarget.style.boxShadow = `0 16px 40px rgba(0,0,0,0.3), 0 0 20px ${color}20`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = `${color}30`; e.currentTarget.style.boxShadow = 'none'; }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px',
        background: bg, border: `1px solid ${color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} color={color} />
      </div>
      {trend && (
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: '99px' }}>
          {trend}
        </div>
      )}
    </div>
    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.2rem', fontWeight: 800, color: '#fff', lineHeight: 1, marginBottom: '6px' }}>
      {value ?? '—'}
    </div>
    <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', fontWeight: 500 }}>{label}</div>
  </div>
);

const LawyerDashboard = () => {
  const { lawyer } = useSelector(s => s.lawyer);
  const [stats, setStats] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, consultRes] = await Promise.all([
          lawyerGet('/lawyer/stats').catch(() => ({ data: null })),
          lawyerGet('/consultations/lawyer').catch(() => ({ data: [] })),
        ]);
        setStats(statsRes.data);
        setConsultations(Array.isArray(consultRes.data) ? consultRes.data : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const counts = {
    total:     consultations.length,
    pending:   consultations.filter(c => c.status === 'pending').length,
    accepted:  consultations.filter(c => c.status === 'accepted').length,
    completed: consultations.filter(c => c.status === 'completed').length,
  };

  const recent = consultations.slice(0, 5);

  const statusColor = { pending: '#F59E0B', accepted: '#10B981', completed: '#7C3AED', rejected: '#F43F5E', cancelled: '#6B7A9C' };

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Welcome */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 800, color: 'var(--text-1)', marginBottom: '6px' }}>
          Welcome back, {lawyer?.name?.split(' ')[0] || 'Counselor'} 👋
        </h1>
        <p style={{ color: 'var(--text-3)', fontSize: '0.92rem' }}>
          {lawyer?.specialization} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        <StatCard icon={MessageSquare} label="Total Consultations" value={counts.total} color="#7C3AED" bg="rgba(124,58,237,0.12)" />
        <StatCard icon={Clock}        label="Pending Review"       value={counts.pending}   color="#F59E0B" bg="rgba(245,158,11,0.12)" />
        <StatCard icon={CheckCircle}  label="Active / Accepted"    value={counts.accepted}  color="#10B981" bg="rgba(16,185,129,0.12)" />
        <StatCard icon={Award}        label="Completed"            value={counts.completed} color="#F43F5E" bg="rgba(244,63,94,0.12)" />
        <StatCard icon={Star}         label="Avg. Rating"   value={lawyer?.rating ? `${lawyer.rating.toFixed(1)}★` : 'N/A'} color="#F59E0B" bg="rgba(245,158,11,0.12)" />
        <StatCard icon={Users}        label="Total Ratings" value={lawyer?.totalRatings ?? 0} color="#A78BFA" bg="rgba(167,139,250,0.12)" />
      </div>

      {/* Profile summary + Recent consultations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>

        {/* Lawyer profile card */}
        <div style={{ background: 'rgba(12,16,32,0.8)', border: '1px solid var(--border)', borderRadius: '18px', padding: '1.5rem' }}>
          <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={16} color="#F59E0B" /> My Profile
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Specialization', value: lawyer?.specialization },
              { label: 'State',          value: lawyer?.state },
              { label: 'Experience',     value: lawyer?.experience ? `${lawyer.experience} yrs` : 'N/A' },
              { label: 'Fee',            value: lawyer?.fee ? `₹${lawyer.fee}` : 'N/A' },
              { label: 'Languages',      value: lawyer?.languages?.join(', ') || 'N/A' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-3)', fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-1)', fontWeight: 500, textAlign: 'right', maxWidth: '55%' }}>{value || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent consultations */}
        <div style={{ background: 'rgba(12,16,32,0.8)', border: '1px solid var(--border)', borderRadius: '18px', padding: '1.5rem' }}>
          <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} color="#7C3AED" /> Recent Requests
          </h3>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '52px', borderRadius: '10px' }} />)}
            </div>
          ) : recent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-3)' }}>
              <MessageSquare size={28} style={{ opacity: 0.4, marginBottom: '8px' }} />
              <p style={{ fontSize: '0.85rem' }}>No consultations yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recent.map(c => (
                <div key={c._id} style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                  borderRadius: '10px', padding: '10px 12px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-1)', marginBottom: '2px' }}>
                      {c.user?.name || 'Anonymous'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                      {c.subject?.slice(0, 30)}{c.subject?.length > 30 ? '…' : ''}
                    </div>
                  </div>
                  <div style={{
                    padding: '3px 10px', borderRadius: '99px', fontSize: '0.68rem', fontWeight: 700,
                    background: `${statusColor[c.status] || '#888'}18`,
                    color: statusColor[c.status] || '#888',
                    border: `1px solid ${statusColor[c.status] || '#888'}30`,
                    textTransform: 'capitalize', whiteSpace: 'nowrap',
                  }}>
                    {c.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile single column fix */}
      <style>{`
        @media (max-width: 640px) {
          .lawyer-dash-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default LawyerDashboard;
