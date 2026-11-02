import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar  from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import PageTransition from '../components/common/PageTransition';
import { financeAPI, tripAPI } from '../services/api';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Loader2, TrendingUp, DollarSign, BarChart2, AlertTriangle, RefreshCw, Calendar } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend,
} from 'recharts';
import toast from 'react-hot-toast';

const ease = [0.25, 1, 0.5, 1];
const CHART_COLORS = ['#C4A25D', '#27AE60', '#E8A838', '#C0392B', '#8B5CF6', '#06B6D4'];

const glassCard = {
  background: 'var(--atmos-glass)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(196,162,93,0.15)',
  borderRadius: '1.2rem',
  boxShadow: '0 4px 20px rgba(44,43,41,0.06)',
};

const inputStyle = {
  width: '100%', padding: '0.6rem 0.85rem',
  borderRadius: '0.6rem',
  border: '1px solid rgba(196,162,93,0.2)',
  background: 'var(--atmos-input-bg)',
  fontFamily: 'Montserrat, sans-serif',
  fontSize: '0.78rem', color: 'var(--atmos-dark)', outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block', fontFamily: 'Montserrat', fontSize: '0.6rem',
  fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--atmos-muted)', marginBottom: '0.35rem',
};

function BudgetGauge({ allocated, spent }) {
  const pct = allocated ? Math.min(100, (spent / allocated) * 100) : 0;
  const barColor = pct > 90 ? '#C0392B' : pct > 70 ? '#E8A838' : '#27AE60';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontFamily: 'Montserrat', fontSize: '0.72rem', color: 'var(--atmos-mid)' }}>
          Spent: <strong style={{ color: 'var(--atmos-dark)' }}>₹{(spent || 0).toLocaleString('en-IN')}</strong>
        </span>
        <span style={{ fontFamily: 'Montserrat', fontSize: '0.72rem', color: 'var(--atmos-mid)' }}>
          Allocated: <strong style={{ color: 'var(--atmos-dark)' }}>₹{(allocated || 0).toLocaleString('en-IN')}</strong>
        </span>
      </div>
      <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(196,162,93,0.12)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
          style={{ height: '100%', borderRadius: '999px', background: barColor }}
        />
      </div>
      <p style={{ fontFamily: 'Montserrat', fontSize: '0.6rem', color: 'var(--atmos-muted)', marginTop: '0.35rem' }}>
        {pct.toFixed(1)}% utilised
      </p>
    </div>
  );
}

function FinanceApprovalCard({ trip, onDecision, deciding, index }) {
  const [budgetApproved, setBudgetApproved] = useState(trip.estimatedBudget || '');
  const [comments, setComments] = useState('');
  const isDeciding = deciding === trip.tripId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.45, ease, delay: index * 0.07 }}
      whileHover={{ y: -4, boxShadow: '0 24px 48px rgba(44,43,41,0.1)', transition: { duration: 0.22 } }}
      style={{
        ...glassCard, padding: '1.5rem',
        borderLeft: '3px solid #C4A25D',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 400, color: 'var(--atmos-dark)' }}>
            {trip.employeeName} · {trip.department}
          </p>
          <p style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--atmos-muted)', marginTop: '0.1rem' }}>{trip.tripId}</p>
        </div>
        <span style={{
          padding: '0.2rem 0.75rem', borderRadius: '999px',
          background: 'rgba(26,95,122,0.1)', color: '#1A5F7A',
          fontFamily: 'Montserrat', fontSize: '0.6rem', fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          Finance Review
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
        {[
          ['Route', `${trip.fromCity} → ${trip.toCity}`],
          ['Date', trip.travelDate ? format(new Date(trip.travelDate), 'dd MMM yyyy') : '—'],
          ['Requested', `₹${(trip.estimatedBudget || 0).toLocaleString('en-IN')}`],
        ].map(([label, value]) => (
          <div key={label} style={{ display: 'flex', gap: '0.5rem', fontFamily: 'Montserrat', fontSize: '0.72rem' }}>
            <span style={{ color: 'var(--atmos-muted)', minWidth: '70px' }}>{label}:</span>
            <strong style={{ color: 'var(--atmos-dark)' }}>{value}</strong>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <label style={labelStyle}>Approved Budget (₹)</label>
          <input type="number" style={inputStyle} value={budgetApproved} onChange={e => setBudgetApproved(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Comments</label>
          <input type="text" style={inputStyle} value={comments} onChange={e => setComments(e.target.value)} placeholder="Optional note" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <motion.button
          onClick={() => onDecision(trip.tripId, 'approved', Number(budgetApproved), comments)}
          disabled={isDeciding}
          whileHover={!isDeciding ? { scale: 1.02 } : {}} whileTap={!isDeciding ? { scale: 0.97 } : {}}
          style={{
            flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            padding: '0.65rem', borderRadius: '0.7rem',
            background: isDeciding ? 'rgba(39,174,96,0.3)' : 'linear-gradient(135deg, #27AE60, #1E8449)',
            border: 'none', cursor: isDeciding ? 'not-allowed' : 'pointer',
            fontFamily: 'Montserrat', fontSize: '0.68rem', fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff',
          }}
        >
          {isDeciding ? <Loader2 style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} /> : <CheckCircle style={{ width: '13px', height: '13px' }} />}
          Approve ₹{Number(budgetApproved || 0).toLocaleString('en-IN')}
        </motion.button>
        <motion.button
          onClick={() => onDecision(trip.tripId, 'rejected', 0, comments)}
          disabled={isDeciding}
          whileHover={!isDeciding ? { scale: 1.02 } : {}} whileTap={!isDeciding ? { scale: 0.97 } : {}}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            padding: '0.65rem', borderRadius: '0.7rem',
            background: 'transparent', border: '1.5px solid rgba(192,57,43,0.4)',
            cursor: isDeciding ? 'not-allowed' : 'pointer',
            fontFamily: 'Montserrat', fontSize: '0.68rem', fontWeight: 600,
            letterSpacing: '0.06em', textTransform: 'uppercase', color: '#C0392B',
          }}
        >
          <XCircle style={{ width: '13px', height: '13px' }} /> Reject
        </motion.button>
      </div>
    </motion.div>
  );
}

function TabBtn({ id, label, active, onClick }) {
  return (
    <motion.button
      onClick={() => onClick(id)}
      whileHover={{ background: active ? undefined : 'rgba(196,162,93,0.08)' }}
      whileTap={{ scale: 0.97 }}
      style={{
        padding: '0.5rem 1.1rem', borderRadius: '0.6rem',
        background: active ? 'linear-gradient(135deg, #C4A25D, #B8923F)' : 'transparent',
        border: 'none', cursor: 'pointer',
        fontFamily: 'Montserrat', fontSize: '0.68rem',
        fontWeight: active ? 600 : 500, letterSpacing: '0.06em',
        color: active ? '#fff' : 'var(--atmos-mid)',
        boxShadow: active ? '0 4px 12px rgba(196,162,93,0.25)' : 'none',
        transition: 'color 0.2s ease',
      }}
    >
      {label}
    </motion.button>
  );
}

export default function FinancePanel() {
  const [report,      setReport]      = useState(null);
  const [syncing,     setSyncing]     = useState(false);

  const handleSyncSheets = async () => {
    setSyncing(true);
    try {
      await financeAPI.syncSheets();
      toast.success('HRMS and Budget data successfully synced to Neon DB!');
      const [p, r, d] = await Promise.all([
        tripAPI.pendingFinance(),
        financeAPI.report(),
        financeAPI.departmentSummary(),
      ]);
      setPending(p.data.data);
      setReport(r.data.data);
      setDeptSummary(d.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to sync sheets');
    } finally {
      setSyncing(false);
    }
  };
  const [pending,     setPending]     = useState([]);
  const [deptSummary, setDeptSummary] = useState({});
  const [loading,     setLoading]     = useState(true);
  const [deciding,    setDeciding]    = useState(null);
  const [tab,         setTab]         = useState('overview');

  useEffect(() => {
    Promise.all([
      financeAPI.report(),
      tripAPI.pendingFinance(),
      financeAPI.departmentSummary(),
    ]).then(([r, p, d]) => {
      setReport(r.data.data);
      setPending(p.data.data || []);
      setDeptSummary(d.data.data || {});
    }).finally(() => setLoading(false));
  }, []);

  const handleDecision = async (tripId, status, budgetApproved, comments) => {
    setDeciding(tripId);
    try {
      await tripAPI.financeApprove({ tripId, status, budgetApproved, comments });
      toast.success(`Budget ${status} — Excel updated`);
      const [p, r] = await Promise.all([tripAPI.pendingFinance(), financeAPI.report()]);
      setPending(p.data.data || []);
      setReport(r.data.data);
    } finally { setDeciding(null); }
  };

  const monthlyChartData = report?.monthly?.slice(0, 6).map(m => {
    const monthStr = String(m.Month || 'Unknown');
    return { name: monthStr.split(' ')[0]?.substring(0, 3) || monthStr, Allocated: m.AllocatedBudget || 0, Spent: m.SpentAmount || 0 };
  }) || [];

  const deptChartData = Object.entries(deptSummary).map(([dept, d]) => ({
    name: dept, value: d.totalBudgetUsed, allocated: d.totalBudgetAllocated,
  }));

  const STAT_ITEMS = [
    { label: 'Total Allocated', value: `₹${(report?.summary?.totalAllocated || 0).toLocaleString('en-IN')}`, icon: DollarSign, from: '#C4A25D', to: '#B8923F', glow: 'rgba(196,162,93,0.3)' },
    { label: 'Total Spent',     value: `₹${(report?.summary?.totalSpent || 0).toLocaleString('en-IN')}`,     icon: TrendingUp, from: '#E8A838', to: '#D4922A', glow: 'rgba(232,168,56,0.3)' },
    { label: 'Remaining Budget', value: `₹${(report?.summary?.totalRemaining || 0).toLocaleString('en-IN')}`, icon: CheckCircle, from: '#1A7F45', to: '#145A32', glow: 'rgba(26,127,69,0.3)' },
    {
      label: `${report?.summary?.currentMonth?.month || 'Current Month'} Spend`,
      value: `₹${(report?.summary?.currentMonth?.spent || 0).toLocaleString('en-IN')}`,
      subtext: `Utilised: ${report?.summary?.currentMonth?.utilisation || 0}% · Remaining: ₹${(report?.summary?.currentMonth?.remaining || 0).toLocaleString('en-IN')}`,
      icon: Calendar,
      from: '#8B5CF6',
      to: '#7C3AED',
      glow: 'rgba(139,92,246,0.3)'
    },
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <Sidebar />

      <main style={{ marginLeft: '220px', paddingTop: '68px', padding: '68px 2.5rem 2.5rem 220px' }}>
        <PageTransition>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, ease }}
                style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 400, color: 'var(--atmos-dark)' }}
              >
                Finance Dashboard
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                style={{ fontFamily: 'Montserrat', fontSize: '0.72rem', color: 'var(--atmos-muted)', marginTop: '0.3rem' }}
              >
                Live Neon DB sync · Real-time budget expenditure & approvals
              </motion.p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <motion.button
                onClick={handleSyncSheets}
                disabled={syncing}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.45rem',
                  padding: '0.45rem 1rem', borderRadius: '0.65rem',
                  background: 'rgba(196,162,93,0.12)', border: '1px solid rgba(196,162,93,0.3)',
                  color: '#C4A25D', fontFamily: 'Montserrat', fontSize: '0.7rem', fontWeight: 600,
                  cursor: syncing ? 'not-allowed' : 'pointer'
                }}
              >
                <RefreshCw style={{ width: '13px', height: '13px', animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                {syncing ? 'Syncing...' : 'Sync HRMS Data'}
              </motion.button>
              {pending.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.45rem 0.9rem', borderRadius: '999px',
                    background: 'rgba(196,162,93,0.1)', border: '1px solid rgba(196,162,93,0.3)',
                    fontFamily: 'Montserrat', fontSize: '0.65rem', fontWeight: 600,
                    letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8B6914',
                  }}
                >
                  <AlertTriangle style={{ width: '12px', height: '12px' }} />
                  {pending.length} pending
                </motion.div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease }}
            style={{
              display: 'flex', gap: '0.25rem', marginBottom: '1.5rem',
              background: 'var(--atmos-glass)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(196,162,93,0.15)', borderRadius: '0.85rem',
              padding: '0.35rem', width: 'fit-content',
            }}
          >
            <TabBtn id="overview"   label="Overview"                          active={tab === 'overview'}   onClick={setTab} />
            <TabBtn id="approvals"  label={`Approvals (${pending.length})`}   active={tab === 'approvals'}  onClick={setTab} />
            <TabBtn id="reports"    label="Reports"                           active={tab === 'reports'}    onClick={setTab} />
          </motion.div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <Loader2 style={{ width: '32px', height: '32px', color: '#C4A25D', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {tab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                >
                  {/* Stat cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                    {STAT_ITEMS.map(({ label, value, subtext, icon: Icon, from, to, glow }, i) => (
                      <motion.div
                        key={label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.45, ease }}
                        whileHover={{ y: -4, boxShadow: `0 20px 40px ${glow}`, transition: { duration: 0.22 } }}
                        style={{ ...glassCard, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
                      >
                        <div style={{
                          width: '46px', height: '46px', borderRadius: '13px', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: `linear-gradient(135deg, ${from}, ${to})`,
                          boxShadow: `0 6px 16px ${glow}`,
                        }}>
                          <Icon style={{ width: '20px', height: '20px', color: '#fff' }} />
                        </div>
                        <div>
                          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', fontWeight: 500, color: 'var(--atmos-dark)', lineHeight: 1 }}>{value}</p>
                          <p style={{ fontFamily: 'Montserrat', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--atmos-muted)', marginTop: '0.2rem' }}>{label}</p>
                          {subtext && <p style={{ fontFamily: 'Montserrat', fontSize: '0.62rem', color: '#1A7F45', marginTop: '0.25rem', fontWeight: 600 }}>{subtext}</p>}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Monthly chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5, ease }}
                    style={{ ...glassCard, padding: '1.5rem' }}
                  >
                    <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontWeight: 400, color: 'var(--atmos-dark)', marginBottom: '1.25rem' }}>
                      Monthly Budget vs Spend
                    </h2>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={monthlyChartData}>
                        <XAxis dataKey="name" tick={{ fontFamily: 'Montserrat', fontSize: 11, fill: 'var(--atmos-muted)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontFamily: 'Montserrat', fontSize: 11, fill: 'var(--atmos-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                        <Tooltip
                          cursor={{ fill: 'transparent' }}
                          formatter={v => `₹${v.toLocaleString('en-IN')}`}
                          contentStyle={{ fontFamily: 'Montserrat', fontSize: '0.75rem', fontWeight: 600, background: '#ffffff', border: '1px solid rgba(196,162,93,0.3)', borderRadius: '0.6rem', color: '#000000', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                          itemStyle={{ color: '#000000' }}
                        />
                        <Bar dataKey="Allocated" fill="rgba(196,162,93,0.2)" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="Spent"     fill="#C4A25D"              radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>

                  {/* Dept pie */}
                  {deptChartData.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.5, ease }}
                      style={{ ...glassCard, padding: '1.5rem' }}
                    >
                      <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontWeight: 400, color: 'var(--atmos-dark)', marginBottom: '1.25rem' }}>
                        Department Budget Usage
                      </h2>
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie 
                            data={deptChartData} 
                            dataKey="value" 
                            nameKey="name" 
                            cx="50%" 
                            cy="50%" 
                            outerRadius={90} 
                            labelLine={false}
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                              if (percent < 0.05) return null;
                              const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                              const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                              const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                              return (
                                <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" style={{ fontFamily: 'Montserrat', fontSize: '0.7rem', fontWeight: 600 }}>
                                  {`${(percent * 100).toFixed(0)}%`}
                                </text>
                              );
                            }}
                          >
                            {deptChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <Legend wrapperStyle={{ fontFamily: 'Montserrat', fontSize: '0.68rem', color: 'var(--atmos-dark)' }} />
                          <Tooltip 
                            formatter={v => `₹${v.toLocaleString('en-IN')}`} 
                            contentStyle={{ fontFamily: 'Montserrat', fontSize: '0.75rem', fontWeight: 600, background: '#ffffff', border: '1px solid rgba(196,162,93,0.3)', borderRadius: '0.6rem', color: '#000000', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                            itemStyle={{ color: '#000000' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {tab === 'approvals' && (
                <motion.div key="approvals" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease }}>
                  {pending.length === 0 ? (
                    <div style={{ ...glassCard, padding: '4rem 2rem', textAlign: 'center' }}>
                      <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2.5, repeat: Infinity }}>
                        <CheckCircle style={{ width: '48px', height: '48px', color: 'rgba(39,174,96,0.4)', margin: '0 auto 1rem' }} />
                      </motion.div>
                      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', color: 'var(--atmos-dark)', marginBottom: '0.5rem' }}>No pending approvals</p>
                      <p style={{ fontFamily: 'Montserrat', fontSize: '0.72rem', color: 'var(--atmos-muted)' }}>All finance reviews are up to date</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                      <AnimatePresence>
                        {pending.map((trip, i) => (
                          <FinanceApprovalCard key={trip._id} trip={trip} onDecision={handleDecision} deciding={deciding} index={i} />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              )}

              {tab === 'reports' && (
                <motion.div key="reports" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease }}
                  style={{ ...glassCard, overflow: 'hidden' }}
                >
                  <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(196,162,93,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontWeight: 400, color: 'var(--atmos-dark)' }}>Monthly Budget Report</h2>
                      <p style={{ fontFamily: 'Montserrat', fontSize: '0.65rem', color: 'var(--atmos-muted)', marginTop: '0.2rem' }}>
                        Live from Neon DB · Last Synced: {report?.summary?.lastSyncedAt ? format(new Date(report.summary.lastSyncedAt), 'dd MMM yyyy, hh:mm a') : 'Recently'}
                      </p>
                    </div>
                    <button
                      onClick={handleSyncSheets}
                      disabled={syncing}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                        background: 'transparent', border: '1px solid rgba(196,162,93,0.3)',
                        borderRadius: '0.5rem', padding: '0.35rem 0.75rem',
                        fontFamily: 'Montserrat', fontSize: '0.65rem', color: '#C4A25D',
                        cursor: syncing ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <RefreshCw style={{ width: '11px', height: '11px', animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                      Sync Sheets
                    </button>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(196,162,93,0.1)' }}>
                          {['Month', 'Department', 'Allocated', 'Spent', 'Remaining', 'Last Updated'].map(h => (
                            <th key={h} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontFamily: 'Montserrat', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C4A25D' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {report?.monthly?.concat(report?.departmental || []).map((row, i) => (
                          <motion.tr
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                            whileHover={{ background: 'rgba(196,162,93,0.04)' }}
                            style={{ borderBottom: '1px solid rgba(196,162,93,0.06)' }}
                          >
                            <td style={{ padding: '0.8rem 1.25rem', fontFamily: 'Montserrat', fontSize: '0.72rem', color: 'var(--atmos-dark)' }}>{row.Month}</td>
                            <td style={{ padding: '0.8rem 1.25rem', fontFamily: 'Montserrat', fontSize: '0.72rem', color: 'var(--atmos-mid)' }}>{row.Department}</td>
                            <td style={{ padding: '0.8rem 1.25rem', fontFamily: 'Montserrat', fontSize: '0.72rem', color: 'var(--atmos-dark)' }}>₹{(row.AllocatedBudget || 0).toLocaleString('en-IN')}</td>
                            <td style={{ padding: '0.8rem 1.25rem', fontFamily: 'Montserrat', fontSize: '0.72rem', color: 'var(--atmos-dark)' }}>₹{(row.SpentAmount || 0).toLocaleString('en-IN')}</td>
                            <td style={{ padding: '0.8rem 1.25rem', fontFamily: 'Montserrat', fontSize: '0.72rem', fontWeight: 600, color: (row.RemainingBudget || 0) < 0 ? '#C0392B' : '#1A7F45' }}>
                              ₹{(row.RemainingBudget || 0).toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '0.8rem 1.25rem', fontFamily: 'Montserrat', fontSize: '0.65rem', color: 'var(--atmos-muted)' }}>
                              {row.LastUpdated ? (() => { try { const d = new Date(row.LastUpdated); if (isNaN(d.getTime())) return '—'; const isMidnight = d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0; return isMidnight ? format(d, 'dd MMM yyyy') : format(d, 'dd MMM yyyy, hh:mm a'); } catch (_) { return '—'; } })() : '—'}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </PageTransition>
      </main>
    </div>
  );
}
