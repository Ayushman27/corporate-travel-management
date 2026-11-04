import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTrip } from '../context/TripContext';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import Navbar   from '../components/common/Navbar';
import Sidebar  from '../components/common/Sidebar';
import PageTransition from '../components/common/PageTransition';
import LoadingSpinner from '../components/common/ShimmerLoader';
import {
  PlusCircle, Plane, Clock, CheckCircle, XCircle,
  Ticket, TrendingUp, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';

const ease = [0.25, 1, 0.5, 1];

const STATUS_CONFIG = {
  draft:            { label: 'Draft',          color: '#A8A4A0', bg: 'rgba(168,164,160,0.1)',   icon: Clock },
  pending_hrms:     { label: 'HRMS Check',     color: 'var(--atmos-gold)', bg: 'var(--atmos-accent-subtle)',   icon: Clock },
  pending_manager:  { label: 'Manager Review', color: 'var(--atmos-gold)', bg: 'var(--atmos-accent-subtle)',   icon: Clock },
  pending_finance:  { label: 'Finance Review', color: '#1A5F7A', bg: 'rgba(26,95,122,0.1)',     icon: Clock },
  approved:         { label: 'Approved',       color: '#1A7F45', bg: 'rgba(39,174,96,0.1)',     icon: CheckCircle },
  booked:           { label: 'Booked',         color: '#1A7F45', bg: 'rgba(39,174,96,0.1)',     icon: Ticket },
  completed:        { label: 'Completed',      color: '#A8A4A0', bg: 'rgba(168,164,160,0.1)',   icon: CheckCircle },
  rejected:         { label: 'Rejected',       color: '#C0392B', bg: 'rgba(192,57,43,0.1)',     icon: XCircle },
  cancelled:        { label: 'Cancelled',      color: '#A8A4A0', bg: 'rgba(168,164,160,0.1)',   icon: XCircle },
};

const getStatColors = (isDark) => [
  isDark
    ? { from: '#C4A25D', to: '#B8923F', glow: 'rgba(196,162,93,0.3)' }
    : { from: '#2563EB', to: '#1D4ED8', glow: 'rgba(37,99,235,0.3)' },
  { from: '#E8A838', to: '#D4922A', glow: 'rgba(232,168,56,0.3)' },
  { from: '#27AE60', to: '#1E8449', glow: 'rgba(39,174,96,0.3)' },
  { from: '#8B5CF6', to: '#7C3AED', glow: 'rgba(139,92,246,0.3)' },
];

function StatCard({ title, value, icon: Icon, colorIdx = 0, delay = 0, isDark = true }) {
  const STAT_COLORS = getStatColors(isDark);
  const c = STAT_COLORS[colorIdx];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease, delay }}
      whileHover={{ scale: 1.02, y: -4, boxShadow: `0 24px 48px ${c.glow}`, transition: { duration: 0.22 } }}
      style={{
        background: 'var(--atmos-glass)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--atmos-glass-border)',
        borderRadius: '1.1rem',
        padding: '1.25rem 1.4rem',
        display: 'flex', alignItems: 'center', gap: '1rem',
        boxShadow: '0 4px 20px rgba(44,43,41,0.05)',
      }}
    >
      <div style={{
        width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(135deg, ${c.from} 0%, ${c.to} 100%)`,
        boxShadow: `0 6px 16px ${c.glow}`,
      }}>
        <Icon style={{ width: '20px', height: '20px', color: '#fff' }} />
      </div>
      <div>
        <p style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '1.7rem', fontWeight: 500,
          color: 'var(--atmos-dark)', lineHeight: 1,
        }}>{value}</p>
        <p style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '0.65rem', fontWeight: 500,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'var(--atmos-muted)', marginTop: '0.25rem',
        }}>{title}</p>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.2rem 0.65rem', borderRadius: '999px',
      background: cfg.bg, color: cfg.color,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: '0.6rem', fontWeight: 600,
      letterSpacing: '0.08em', textTransform: 'uppercase',
    }}>
      <Icon style={{ width: '10px', height: '10px' }} />
      {cfg.label}
    </span>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { myTrips, fetchMyTrips, loading } = useTrip();

  useEffect(() => { fetchMyTrips(); }, [fetchMyTrips]);

  const stats = {
    total:    myTrips.length,
    pending:  myTrips.filter(t => t.status.startsWith('pending')).length,
    approved: myTrips.filter(t => ['approved', 'booked'].includes(t.status)).length,
    spent: myTrips.filter(t => ['approved', 'booked', 'completed'].includes(t.status))
                    .reduce((s, t) => {
                      const cost = (t.approvedBudget !== undefined && t.approvedBudget !== null && Number(t.approvedBudget) > 0)
                        ? Number(t.approvedBudget)
                        : (Number(t.actualCost) || Number(t.estimatedBudget) || 0);
                      return s + cost;
                    }, 0),
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <Sidebar />

      <main style={{ marginLeft: '220px', paddingTop: '68px', padding: '68px 2.5rem 2.5rem 220px' }}>
        <PageTransition>
          {/* Welcome */}
          <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55, ease }}
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '2rem', fontWeight: 700,
                  color: 'var(--atmos-dark)', letterSpacing: '-0.02em',
                }}
              >
                Welcome back, {user?.name?.split(' ')[0]}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '0.72rem', color: 'var(--atmos-muted)',
                  marginTop: '0.3rem', letterSpacing: '0.05em',
                }}
              >
                {user?.department} · {user?.role}
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.45, ease }}
            >
              <Link to="/trip/new" style={{ textDecoration: 'none' }}>
                <motion.div
                  whileHover={{ scale: 1.04, boxShadow: isDark ? '0 12px 32px rgba(196,162,93,0.35)' : '0 12px 32px rgba(37,99,235,0.35)' }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.65rem 1.25rem', borderRadius: '0.8rem',
                    background: 'var(--atmos-accent-grad)',
                    boxShadow: isDark ? '0 4px 16px rgba(196,162,93,0.25)' : '0 4px 16px rgba(37,99,235,0.25)',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '0.72rem', fontWeight: 600,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: '#fff', cursor: 'pointer',
                  }}
                >
                  <PlusCircle style={{ width: '15px', height: '15px' }} />
                  New Trip Request
                </motion.div>
              </Link>
            </motion.div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            <StatCard isDark={isDark} title="Total Trips"      value={stats.total}    icon={Plane}        colorIdx={0} delay={0.05} />
            <StatCard isDark={isDark} title="Pending"          value={stats.pending}  icon={Clock}        colorIdx={1} delay={0.1} />
            <StatCard isDark={isDark} title="Approved / Booked" value={stats.approved} icon={CheckCircle} colorIdx={2} delay={0.15} />
            <StatCard isDark={isDark} title="Total Spent"      value={`₹${stats.spent.toLocaleString('en-IN')}`} icon={TrendingUp} colorIdx={3} delay={0.2} />
          </div>

          {/* Trips Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease, delay: 0.25 }}
            style={{
              background: 'var(--atmos-glass)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--atmos-glass-border)',
              borderRadius: '1.25rem',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(44,43,41,0.06)',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--atmos-glass-border)',
            }}>
              <h2 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '1.25rem', fontWeight: 600, color: 'var(--atmos-dark)',
              }}>
                My Trips
              </h2>
              <span style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.62rem',
                fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--atmos-gold)',
              }}>
                {myTrips.length} {myTrips.length === 1 ? 'record' : 'records'}
              </span>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                <LoadingSpinner size="lg" />
              </div>
            ) : myTrips.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <motion.div
                  
                >
                  <Plane style={{ width: '48px', height: '48px', color: isDark ? 'rgba(196,162,93,0.3)' : 'rgba(37,99,235,0.3)', margin: '0 auto 1rem' }} />
                </motion.div>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.3rem', color: 'var(--atmos-dark)', marginBottom: '0.5rem' }}>
                  No trips yet
                </p>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', color: 'var(--atmos-muted)', marginBottom: '1.5rem' }}>
                  Start by creating a new trip request
                </p>
                <Link to="/trip/new" style={{ textDecoration: 'none' }}>
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: '0.75rem', background: 'var(--atmos-accent-grad)', color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
                    <PlusCircle style={{ width: '14px', height: '14px' }} /> Request a Trip
                  </motion.div>
                </Link>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--atmos-glass-border)' }}>
                      {['Trip ID', 'Route', 'Date', 'Budget', 'Status', ''].map(h => (
                        <th key={h} style={{
                          padding: '0.75rem 1.25rem', textAlign: 'left',
                          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.58rem',
                          fontWeight: 700, letterSpacing: '0.12em',
                          textTransform: 'uppercase', color: 'var(--atmos-gold)',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {myTrips.map((trip, i) => (
                      <motion.tr
                        key={trip._id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 + 0.1, duration: 0.35, ease }}
                        whileHover={{ background: isDark ? 'rgba(196,162,93,0.04)' : 'rgba(37,99,235,0.04)' }}
                        style={{ borderBottom: '1px solid var(--atmos-glass-border)', cursor: 'default' }}
                      >
                        <td style={{ padding: '0.9rem 1.25rem', fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--atmos-muted)' }}>{trip.tripId}</td>
                        <td style={{ padding: '0.9rem 1.25rem', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.78rem', fontWeight: 600, color: 'var(--atmos-dark)' }}>{trip.fromCity} → {trip.toCity}</td>
                        <td style={{ padding: '0.9rem 1.25rem', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', color: 'var(--atmos-mid)' }}>
                          {trip.travelDate ? format(new Date(trip.travelDate), 'dd MMM yyyy') : '—'}
                        </td>
                        <td style={{ padding: '0.9rem 1.25rem', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', color: 'var(--atmos-dark)' }}>
                          ₹{(trip.estimatedBudget || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '0.9rem 1.25rem' }}>
                          <StatusBadge status={trip.status} />
                        </td>
                        <td style={{ padding: '0.9rem 1.25rem' }}>
                          <Link to={`/trip/${trip.tripId}`} style={{ textDecoration: 'none' }}>
                            <motion.span
                              whileHover={{ color: isDark ? '#B8923F' : '#1D4ED8', x: 2 }}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.68rem', fontWeight: 600,
                                color: 'var(--atmos-gold)', letterSpacing: '0.05em',
                              }}
                            >
                              View <ArrowRight style={{ width: '12px', height: '12px' }} />
                            </motion.span>
                          </Link>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </PageTransition>
      </main>
    </div>
  );
}
