import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar  from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import PageTransition from '../components/common/PageTransition';
import SetBudgetModal from '../components/common/SetBudgetModal';
import { useTheme } from '../context/ThemeContext';
import { adminAPI } from '../services/api';
import { format } from 'date-fns';
import { Users, Activity, Loader2, Shield, ToggleLeft, ToggleRight, Sliders, Receipt, AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ease = [0.25, 1, 0.5, 1];

const glassCard = {
  background: 'var(--atmos-glass)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid var(--atmos-glass-border)',
  borderRadius: '1.2rem',
  boxShadow: '0 4px 20px rgba(44,43,41,0.06)',
};

const getStatColors = (isDark) => [
  { from: isDark ? '#C4A25D' : '#2563EB', to: isDark ? '#B8923F' : '#1D4ED8', glow: isDark ? 'rgba(196,162,93,0.3)' : 'rgba(37,99,235,0.3)' },
  { from: '#27AE60', to: '#1E8449', glow: 'rgba(39,174,96,0.3)' },
  { from: '#E8A838', to: '#D4922A', glow: 'rgba(232,168,56,0.3)' },
  { from: '#C0392B', to: '#A93226', glow: 'rgba(192,57,43,0.3)' },
];

const STATUS_BADGE = (status) => {
  if (status === 'booked' || status === 'approved') return { bg: 'rgba(39,174,96,0.1)', color: '#1A7F45' };
  if (status === 'rejected') return { bg: 'rgba(192,57,43,0.1)', color: '#C0392B' };
  if (status?.startsWith('pending')) return { bg: 'var(--atmos-glass-border)', color: '#8B6914' };
  return { bg: 'rgba(168,164,160,0.1)', color: '#A8A4A0' };
};

function TabBtn({ id, label, active, onClick }) {
  return (
    <motion.button
      onClick={() => onClick(id)}
      whileHover={{ background: active ? undefined : 'var(--atmos-accent-subtle)' }}
      whileTap={{ scale: 0.97 }}
      style={{
        padding: '0.5rem 1.1rem', borderRadius: '0.6rem',
        background: active ? 'var(--atmos-accent-grad)' : 'transparent',
        border: 'none', cursor: 'pointer',
        fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.68rem',
        fontWeight: active ? 600 : 500, letterSpacing: '0.06em',
        color: active ? '#fff' : 'var(--atmos-mid)',
        boxShadow: active ? '0 4px 12px var(--atmos-accent-glow)' : 'none',
        transition: 'color 0.2s ease',
      }}
    >
      {label}
    </motion.button>
  );
}

const thStyle = {
  padding: '0.75rem 1rem', textAlign: 'left',
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.58rem',
  fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: 'var(--atmos-gold)',
};
const tdStyle = {
  padding: '0.8rem 1rem',
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', color: 'var(--atmos-dark)',
};

function TripBillModal({ trip, onClose }) {
  if (!trip) return null;
  const empLimit = trip.employeeBudgetLimit || 20000;
  const isExceeded = trip.isExceedingBudget || Number(trip.estimatedBudget || 0) > empLimit;
  const excess = trip.budgetExcessAmount || Math.max(0, Number(trip.estimatedBudget || 0) - empLimit);
  const travelCost = trip.billDetails?.travelCost || Math.max(0, (trip.estimatedBudget || 0) - (trip.selectedHotel?.totalCost || 0));
  const hotelCost = trip.selectedHotel?.totalCost || trip.billDetails?.hotelCost || 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'rgba(18,16,14,0.96)', border: '1px solid rgba(196,162,93,0.35)',
        borderRadius: '1.25rem', width: '100%', maxWidth: '520px', padding: '1.75rem',
        boxShadow: '0 24px 64px rgba(0,0,0,0.7)', boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem' }}>
          <div>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.4rem', color: 'var(--atmos-dark)', margin: 0 }}>
              Trip Bill Details & Breakdown
            </h3>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.65rem', color: 'var(--atmos-muted)', margin: '0.2rem 0 0' }}>
              {trip.employeeName} ({trip.department}) · {trip.tripId}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: '4px' }}>
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {isExceeded && (
          <div style={{
            marginBottom: '1rem', padding: '0.75rem 0.9rem', borderRadius: '0.75rem',
            background: 'rgba(232,168,56,0.12)', border: '1px solid rgba(232,168,56,0.4)',
            display: 'flex', gap: '0.6rem', alignItems: 'flex-start'
          }}>
            <AlertTriangle style={{ width: '16px', height: '16px', color: '#E8A838', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', fontWeight: 700, color: '#D4922A', margin: 0 }}>
                Budget Exceeded Warning
              </p>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.66rem', color: 'var(--atmos-dark)', margin: '0.2rem 0 0', lineHeight: 1.4 }}>
                Employee budget is <strong>₹{empLimit.toLocaleString('en-IN')}</strong>, but planned bill is <strong>₹{Number(trip.estimatedBudget || 0).toLocaleString('en-IN')}</strong> (Exceeds by <strong>₹{excess.toLocaleString('en-IN')}</strong>).
              </p>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6rem', color: 'var(--atmos-muted)', margin: '0.25rem 0 0' }}>
                ℹ️ Not deducted from employee personal budget.
              </p>
            </div>
          </div>
        )}

        {/* Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '340px', overflowY: 'auto' }}>
          {/* Flights / transit */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--atmos-glass-border)', borderRadius: '0.75rem', padding: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.68rem', fontWeight: 700, color: 'var(--atmos-dark)' }}>
                ✈️ Transport & Flights
              </span>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', fontWeight: 600, color: 'var(--atmos-gold)' }}>
                ₹{Number(travelCost).toLocaleString('en-IN')}
              </span>
            </div>
            {(trip.billDetails?.segments && trip.billDetails.segments.length > 0) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {trip.billDetails.segments.map((seg, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.64rem', color: 'var(--atmos-muted)', background: 'rgba(0,0,0,0.2)', padding: '0.35rem 0.5rem', borderRadius: '0.35rem' }}>
                    <span>{(seg.mode || 'transit').toUpperCase()}: {seg.operator || ''}{seg.flightNo ? ` (${seg.flightNo})` : ''} · {seg.from} → {seg.to}</span>
                    <strong style={{ color: 'var(--atmos-dark)' }}>₹{Number(seg.cost || 0).toLocaleString('en-IN')}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.64rem', color: 'var(--atmos-muted)', margin: 0 }}>
                {trip.fromCity} → {trip.toCity} (Travel Mode: {trip.travelMode})
              </p>
            )}
          </div>

          {/* Hotel */}
          {(trip.selectedHotel || trip.billDetails?.hotel) && (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--atmos-glass-border)', borderRadius: '0.75rem', padding: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.68rem', fontWeight: 700, color: 'var(--atmos-dark)' }}>
                  🏨 Accommodation
                </span>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', fontWeight: 600, color: 'var(--atmos-gold)' }}>
                  ₹{Number(hotelCost).toLocaleString('en-IN')}
                </span>
              </div>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.66rem', fontWeight: 600, color: 'var(--atmos-dark)', margin: 0 }}>
                {trip.selectedHotel?.name || trip.billDetails?.hotel?.name}
              </p>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.62rem', color: 'var(--atmos-muted)', margin: '0.2rem 0 0' }}>
                {trip.selectedHotel?.nights || trip.billDetails?.hotel?.nights || 1} Nights @ ₹{(trip.selectedHotel?.pricePerNight || trip.billDetails?.hotel?.pricePerNight || 0).toLocaleString('en-IN')}/night
                {(trip.selectedHotel?.foodingIncluded || trip.billDetails?.hotel?.foodingIncluded) ? ' · Fooding included' : ''}
              </p>
            </div>
          )}

          {/* Total summary */}
          <div style={{ borderTop: '1px solid rgba(196,162,93,0.2)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.75rem', fontWeight: 700, color: 'var(--atmos-dark)' }}>
              Total Bill:
            </span>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.3rem', fontWeight: 600, color: 'var(--atmos-gold)' }}>
              ₹{(trip.estimatedBudget || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const { isDark } = useTheme();
  const [tab,     setTab]     = useState('dashboard');
  const [stats,   setStats]   = useState(null);
  const [users,   setUsers]   = useState([]);
  const [logs,    setLogs]    = useState([]);
  const [trips,   setTrips]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [viewingBillTrip, setViewingBillTrip] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [d, u, l, t] = await Promise.all([
          adminAPI.dashboard(),
          adminAPI.users(),
          adminAPI.auditLogs({ limit: 50 }),
          adminAPI.allTrips({ limit: 30 }),
        ]);
        setStats(d.data.data);
        setUsers(u.data.data || []);
        setLogs(l.data.data || []);
        setTrips(t.data.data || []);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminAPI.updateRole(userId, newRole);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
      toast.success('Role updated');
    } catch (_) {}
  };

  const handleToggle = async (userId) => {
    try {
      const { data } = await adminAPI.toggleActive(userId);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: data.data.isActive } : u));
      toast.success(data.message);
    } catch (_) {}
  };

  const STAT_CARDS = stats ? [
    { label: 'Active Users',     value: stats.stats.totalUsers },
    { label: 'Total Trips',      value: stats.stats.totalTrips },
    { label: 'Pending Manager',  value: stats.stats.pendingManagerCount },
    { label: 'Pending Finance',  value: stats.stats.pendingFinanceCount },
  ] : [];

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <Sidebar />

      <main style={{ marginLeft: '220px', paddingTop: '68px', padding: '68px 2.5rem 2.5rem 220px' }}>
        <PageTransition>
          {/* Header */}
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease }}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '2rem', fontWeight: 700, color: 'var(--atmos-dark)' }}
              >
                Admin Panel
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', color: 'var(--atmos-muted)', marginTop: '0.3rem' }}
              >
                System management & audit logs
              </motion.p>
            </div>

            <motion.button
              onClick={() => setBudgetModalOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.45rem',
                padding: '0.5rem 1.15rem', borderRadius: '0.65rem',
                background: 'var(--atmos-accent-subtle)', border: '1px solid var(--atmos-gold)', color: 'var(--atmos-dark)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px var(--atmos-accent-glow)'
              }}
            >
              <Sliders style={{ width: '13px', height: '13px', color: 'var(--atmos-gold)' }} />
              Set Monthly Budget
            </motion.button>
          </div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease }}
            style={{
              display: 'flex', gap: '0.25rem', marginBottom: '1.5rem',
              background: 'var(--atmos-glass)', backdropFilter: 'blur(12px)',
              border: '1px solid var(--atmos-glass-border)', borderRadius: '0.85rem',
              padding: '0.35rem', width: 'fit-content',
            }}
          >
            {[['dashboard', 'Dashboard'], ['users', 'Users'], ['trips', 'All Trips'], ['logs', 'Audit Logs']].map(([id, label]) => (
              <TabBtn key={id} id={id} label={label} active={tab === id} onClick={setTab} />
            ))}
          </motion.div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <Loader2 style={{ width: '32px', height: '32px', color: 'var(--atmos-gold)', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* ── Dashboard ── */}
              {tab === 'dashboard' && stats && (
                <motion.div key="dash" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                    {STAT_CARDS.map(({ label, value }, i) => {
                      const c = STAT_COLORS[i];
                      return (
                        <motion.div
                          key={label}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.07, duration: 0.45, ease }}
                          whileHover={{ y: -4, boxShadow: `0 20px 40px ${c.glow}`, transition: { duration: 0.22 } }}
                          style={{ ...glassCard, padding: '1.5rem', textAlign: 'center' }}
                        >
                          <p style={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '2.2rem', fontWeight: 500,
                            background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            lineHeight: 1,
                          }}>{value}</p>
                          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--atmos-muted)', marginTop: '0.5rem' }}>{label}</p>
                        </motion.div>
                      );
                    })}
                  </div>

                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.45, ease }}
                    style={{ ...glassCard, overflow: 'hidden' }}
                  >
                    <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--atmos-glass-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Activity style={{ width: '16px', height: '16px', color: 'var(--atmos-gold)' }} />
                      <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.2rem', fontWeight: 600, color: 'var(--atmos-dark)' }}>Recent Activity</h2>
                    </div>
                    <div style={{ padding: '0.5rem 0' }}>
                      {stats.recentLogs?.slice(0, 10).map((log, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 + 0.1, duration: 0.3, ease }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.65rem 1.5rem',
                            borderBottom: '1px solid var(--atmos-glass-border)',
                          }}
                        >
                          <span style={{
                            fontFamily: 'monospace', fontSize: '0.65rem',
                            background: 'var(--atmos-accent-subtle)',
                            padding: '0.2rem 0.6rem', borderRadius: '0.4rem',
                            color: '#8B6914', flexShrink: 0,
                          }}>
                            {log.action}
                          </span>
                          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', color: 'var(--atmos-mid)', flex: 1 }}>{log.actorName || '—'}</span>
                          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.62rem', color: 'var(--atmos-muted)' }}>
                            {format(new Date(log.timestamp), 'dd MMM HH:mm')}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* ── Users ── */}
              {tab === 'users' && (
                <motion.div key="users" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease }}
                  style={{ ...glassCard, overflow: 'hidden' }}
                >
                  <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--atmos-glass-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users style={{ width: '16px', height: '16px', color: 'var(--atmos-gold)' }} />
                    <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.2rem', fontWeight: 600, color: 'var(--atmos-dark)' }}>User Management</h2>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--atmos-glass-border)' }}>
                          {['Emp ID', 'Name', 'Email', 'Department', 'Role', 'Budget Limit', 'Status', ''].map(h => (
                            <th key={h} style={thStyle}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u, i) => (
                          <motion.tr
                            key={u._id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.04 }}
                            whileHover={{ background: 'var(--atmos-accent-subtle)' }}
                            style={{ borderBottom: '1px solid var(--atmos-glass-border)' }}
                          >
                            <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--atmos-muted)' }}>{u.employeeId}</td>
                            <td style={{ ...tdStyle, fontWeight: 600 }}>{u.name}</td>
                            <td style={{ ...tdStyle, fontSize: '0.65rem', color: 'var(--atmos-mid)' }}>{u.email}</td>
                            <td style={{ ...tdStyle, color: 'var(--atmos-mid)' }}>{u.department}</td>
                            <td style={tdStyle}>
                              <select
                                value={u.role}
                                onChange={e => handleRoleChange(u._id, e.target.value)}
                                style={{
                                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.65rem',
                                  border: '1px solid rgba(196,162,93,0.25)',
                                  borderRadius: '0.45rem', padding: '0.25rem 0.5rem',
                                  background: 'var(--atmos-input-bg)',
                                  color: 'var(--atmos-dark)', cursor: 'pointer', outline: 'none',
                                }}
                              >
                                {['employee', 'manager', 'finance', 'admin'].map(r => <option key={r}>{r}</option>)}
                              </select>
                            </td>
                            <td style={{ ...tdStyle, fontSize: '0.68rem' }}>₹{(u.travelBudgetLimit || 0).toLocaleString('en-IN')}</td>
                            <td style={tdStyle}>
                              <span style={{
                                padding: '0.18rem 0.6rem', borderRadius: '999px',
                                background: u.isActive ? 'rgba(39,174,96,0.1)' : 'rgba(192,57,43,0.1)',
                                color: u.isActive ? '#1A7F45' : '#C0392B',
                                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6rem', fontWeight: 600,
                                letterSpacing: '0.08em', textTransform: 'uppercase',
                              }}>
                                {u.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              <motion.button
                                onClick={() => handleToggle(u._id)}
                                whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                              >
                                {u.isActive
                                  ? <ToggleRight style={{ width: '22px', height: '22px', color: '#27AE60' }} />
                                  : <ToggleLeft  style={{ width: '22px', height: '22px', color: '#A8A4A0' }} />
                                }
                              </motion.button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* ── Trips ── */}
              {tab === 'trips' && (
                <motion.div key="trips" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease }}
                  style={{ ...glassCard, overflow: 'hidden' }}
                >
                  <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--atmos-glass-border)' }}>
                    <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.2rem', fontWeight: 600, color: 'var(--atmos-dark)' }}>All Trips</h2>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--atmos-glass-border)' }}>
                          {['Trip ID', 'Employee', 'Route', 'Date', 'Budget', 'Status', 'Bill Details'].map(h => (
                            <th key={h} style={thStyle}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {trips.map((t, i) => {
                          const badge = STATUS_BADGE(t.status);
                          return (
                            <motion.tr key={t._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                              whileHover={{ background: 'var(--atmos-accent-subtle)' }}
                              style={{ borderBottom: '1px solid var(--atmos-glass-border)' }}
                            >
                              <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--atmos-muted)' }}>{t.tripId}</td>
                              <td style={tdStyle}>{t.employeeName}</td>
                              <td style={{ ...tdStyle, fontWeight: 600 }}>{t.fromCity} → {t.toCity}</td>
                              <td style={{ ...tdStyle, fontSize: '0.68rem', color: 'var(--atmos-mid)' }}>{t.travelDate ? format(new Date(t.travelDate), 'dd MMM yyyy') : '—'}</td>
                              <td style={tdStyle}>
                                <div>
                                  <span style={{ fontWeight: 600 }}>₹{(t.estimatedBudget || 0).toLocaleString('en-IN')}</span>
                                  {(t.isExceedingBudget || (t.estimatedBudget > (t.employeeBudgetLimit || 20000))) && (
                                    <div style={{ marginTop: '0.2rem' }}>
                                      <span style={{
                                        padding: '0.15rem 0.5rem', borderRadius: '999px',
                                        background: 'rgba(232,168,56,0.15)', border: '1px solid rgba(232,168,56,0.3)',
                                        color: '#D4922A', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.55rem', fontWeight: 600,
                                      }}>
                                        ⚠️ Exceeds (+₹{(t.budgetExcessAmount || Math.max(0, t.estimatedBudget - (t.employeeBudgetLimit || 20000))).toLocaleString('en-IN')})
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td style={tdStyle}>
                                <span style={{ padding: '0.2rem 0.65rem', borderRadius: '999px', background: badge.bg, color: badge.color, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                  {t.status?.replace(/_/g, ' ')}
                                </span>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* ── Audit Logs ── */}
              {tab === 'logs' && (
                <motion.div key="logs" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease }}
                  style={{ ...glassCard, overflow: 'hidden' }}
                >
                  <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--atmos-glass-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield style={{ width: '16px', height: '16px', color: 'var(--atmos-gold)' }} />
                    <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.2rem', fontWeight: 600, color: 'var(--atmos-dark)' }}>Audit Logs</h2>
                  </div>
                  <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    {logs.map((log, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.3, ease }}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                          padding: '0.75rem 1.5rem',
                          borderBottom: '1px solid var(--atmos-glass-border)',
                        }}
                      >
                        <span style={{
                          fontFamily: 'monospace', fontSize: '0.62rem', flexShrink: 0,
                          background: 'var(--atmos-accent-subtle)', padding: '0.2rem 0.6rem',
                          borderRadius: '0.4rem', color: '#8B6914',
                        }}>
                          {log.action}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', color: 'var(--atmos-dark)' }}>
                            <strong>{log.actorName || 'System'}</strong>
                            {log.tripId && <> · <span style={{ fontFamily: 'monospace', fontSize: '0.62rem', color: 'var(--atmos-muted)' }}>{log.tripId}</span></>}
                          </p>
                          {log.details && (
                            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.62rem', color: 'var(--atmos-muted)', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {JSON.stringify(log.details).substring(0, 100)}
                            </p>
                          )}
                        </div>
                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6rem', color: 'var(--atmos-muted)', flexShrink: 0 }}>
                          {format(new Date(log.timestamp), 'dd MMM HH:mm:ss')}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </PageTransition>
      </main>

      <TripBillModal trip={viewingBillTrip} onClose={() => setViewingBillTrip(null)} />

      <SetBudgetModal
        isOpen={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
      />
    </div>
  );
}
