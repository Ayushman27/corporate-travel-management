import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar  from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import PageTransition from '../components/common/PageTransition';
import SetBudgetModal from '../components/common/SetBudgetModal';
import { useTheme } from '../context/ThemeContext';
import { financeAPI, tripAPI } from '../services/api';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Loader2, TrendingUp, DollarSign, BarChart2, AlertTriangle, RefreshCw, Calendar, Sliders, Edit3, Receipt, ChevronDown, PlaneTakeoff, Hotel, Users, Layers, Check } from 'lucide-react';
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
  border: '1px solid var(--atmos-glass-border)',
  borderRadius: '1.2rem',
  boxShadow: 'var(--atmos-shadow)',
};

const inputStyle = {
  width: '100%', padding: '0.6rem 0.85rem',
  borderRadius: '0.6rem',
  border: '1px solid rgba(196,162,93,0.2)',
  background: 'var(--atmos-input-bg)',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: '0.78rem', color: 'var(--atmos-dark)', outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6rem',
  fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--atmos-muted)', marginBottom: '0.35rem',
};

function BudgetGauge({ allocated, spent }) {
  const pct = allocated ? Math.min(100, (spent / allocated) * 100) : 0;
  const barColor = pct > 90 ? '#C0392B' : pct > 70 ? '#E8A838' : '#27AE60';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', color: 'var(--atmos-mid)' }}>
          Spent: <strong style={{ color: 'var(--atmos-dark)' }}>₹{(spent || 0).toLocaleString('en-IN')}</strong>
        </span>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', color: 'var(--atmos-mid)' }}>
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
      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6rem', color: 'var(--atmos-muted)', marginTop: '0.35rem' }}>
        {pct.toFixed(1)}% utilised
      </p>
    </div>
  );
}

function FinanceApprovalCard({ trip, onDecision, deciding, index }) {
  const [budgetApproved, setBudgetApproved] = useState(trip.estimatedBudget || '');
  const [comments, setComments] = useState('');
  const [showBillDetails, setShowBillDetails] = useState(false);
  const isDeciding = deciding === trip.tripId;

  const empLimit = trip.employeeBudgetLimit || 20000;
  const isExceeded = trip.isExceedingBudget || Number(trip.estimatedBudget || 0) > empLimit;
  const excess = trip.budgetExcessAmount || Math.max(0, Number(trip.estimatedBudget || 0) - empLimit);

  const travelCost = trip.billDetails?.travelCost || Math.max(0, (trip.estimatedBudget || 0) - (trip.selectedHotel?.totalCost || 0));
  const hotelCost = trip.selectedHotel?.totalCost || trip.billDetails?.hotelCost || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.45, ease, delay: index * 0.07 }}
      whileHover={{ y: -4, boxShadow: '0 24px 48px rgba(44,43,41,0.1)', transition: { duration: 0.22 } }}
      style={{
        ...glassCard, padding: '1.5rem',
        borderLeft: isExceeded ? '3px solid #E8A838' : '3px solid #C4A25D',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.15rem', fontWeight: 500, color: 'var(--atmos-dark)' }}>
            {trip.employeeName} · {trip.department}
          </p>
          <p style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--atmos-muted)', marginTop: '0.1rem' }}>{trip.tripId}</p>
        </div>
        <span style={{
          padding: '0.2rem 0.75rem', borderRadius: '999px',
          background: isExceeded ? 'rgba(232,168,56,0.12)' : 'rgba(26,95,122,0.1)',
          color: isExceeded ? '#D4922A' : '#1A5F7A',
          border: isExceeded ? '1px solid rgba(232,168,56,0.3)' : '1px solid rgba(26,95,122,0.2)',
          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6rem', fontWeight: 600,
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          {isExceeded ? 'Budget Warning' : 'Finance Review'}
        </span>
      </div>

      {/* Budget Warning Box */}
      {isExceeded && (
        <div style={{
          marginBottom: '1rem', padding: '0.75rem 0.9rem', borderRadius: '0.75rem',
          background: 'rgba(232,168,56,0.1)', border: '1px solid rgba(232,168,56,0.35)',
          display: 'flex', gap: '0.6rem', alignItems: 'flex-start'
        }}>
          <AlertTriangle style={{ width: '16px', height: '16px', color: '#E8A838', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', fontWeight: 700, color: '#D4922A', margin: 0 }}>
              Travel Budget Exceeded Warning
            </p>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.66rem', color: 'var(--atmos-dark)', margin: '0.2rem 0 0', lineHeight: 1.4 }}>
              Employee budget is <strong>₹{empLimit.toLocaleString('en-IN')}</strong>, but planned bill is <strong>₹{Number(trip.estimatedBudget || 0).toLocaleString('en-IN')}</strong> (Exceeds by <strong>₹{excess.toLocaleString('en-IN')}</strong>).
            </p>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6rem', color: 'var(--atmos-muted)', margin: '0.25rem 0 0' }}>
              ℹ️ Note: Amount will <strong>not</strong> be cut from employee personal budget.
            </p>
          </div>
        </div>
      )}

      {/* Basic info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem' }}>
        {[
          ['Route', `${trip.fromCity} → ${trip.toCity}`],
          ['Date', trip.travelDate ? format(new Date(trip.travelDate), 'dd MMM yyyy') : '—'],
          ['Employee Budget', `₹${empLimit.toLocaleString('en-IN')}`],
          ['Requested Bill', `₹${(trip.estimatedBudget || 0).toLocaleString('en-IN')}`],
        ].map(([label, value]) => (
          <div key={label} style={{ display: 'flex', gap: '0.5rem', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem' }}>
            <span style={{ color: 'var(--atmos-muted)', minWidth: '110px' }}>{label}:</span>
            <strong style={{ color: 'var(--atmos-dark)' }}>{value}</strong>
          </div>
        ))}
      </div>

      {/* Itemized Bill Details Toggle & Accordion */}
      <div style={{ marginBottom: '1.1rem' }}>
        <button
          type="button"
          onClick={() => setShowBillDetails(!showBillDetails)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
            background: 'rgba(196,162,93,0.08)', border: '1px solid rgba(196,162,93,0.25)',
            borderRadius: '0.6rem', padding: '0.5rem 0.8rem',
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.68rem', fontWeight: 600, color: '#C4A25D',
            cursor: 'pointer'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Receipt style={{ width: '13px', height: '13px' }} />
            {showBillDetails ? 'Hide Bill Details' : 'View Bill Details (Where Money is Used)'}
          </span>
          <ChevronDown style={{ width: '14px', height: '14px', transform: showBillDetails ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {showBillDetails && (
          <div style={{
            marginTop: '0.5rem', padding: '0.85rem', borderRadius: '0.75rem',
            background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(196,162,93,0.15)',
            display: 'flex', flexDirection: 'column', gap: '0.65rem'
          }}>
            {/* Travel breakdown */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.65rem', fontWeight: 700, color: 'var(--atmos-dark)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  ✈️ Flights & Transit
                </span>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.7rem', fontWeight: 600, color: '#C4A25D' }}>
                  ₹{Number(travelCost).toLocaleString('en-IN')}
                </span>
              </div>
              {(trip.billDetails?.segments && trip.billDetails.segments.length > 0) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {trip.billDetails.segments.map((seg, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.64rem', color: 'var(--atmos-muted)', background: 'rgba(255,255,255,0.03)', padding: '0.3rem 0.5rem', borderRadius: '0.35rem' }}>
                      <span><strong>{(seg.mode || 'transit').toUpperCase()}</strong>: {seg.operator || ''}{seg.flightNo ? ` (${seg.flightNo})` : ''} · {seg.from} → {seg.to}</span>
                      <strong style={{ color: 'var(--atmos-dark)' }}>₹{Number(seg.cost || 0).toLocaleString('en-IN')}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.62rem', color: 'var(--atmos-muted)', margin: 0 }}>
                  Standard route transit ({trip.fromCity} → {trip.toCity})
                </p>
              )}
            </div>

            {/* Hotel breakdown */}
            {(trip.selectedHotel || trip.billDetails?.hotel) && (
              <div style={{ borderTop: '1px solid rgba(196,162,93,0.1)', paddingTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.65rem', fontWeight: 700, color: 'var(--atmos-dark)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    🏨 Accommodation
                  </span>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.7rem', fontWeight: 600, color: '#C4A25D' }}>
                    ₹{Number(hotelCost).toLocaleString('en-IN')}
                  </span>
                </div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.64rem', color: 'var(--atmos-muted)', background: 'rgba(255,255,255,0.03)', padding: '0.35rem 0.5rem', borderRadius: '0.35rem' }}>
                  <p style={{ margin: 0, fontWeight: 600, color: 'var(--atmos-dark)' }}>
                    {trip.selectedHotel?.name || trip.billDetails?.hotel?.name}
                  </p>
                  <p style={{ margin: '0.2rem 0 0' }}>
                    {trip.selectedHotel?.nights || trip.billDetails?.hotel?.nights || 1} Nights @ ₹{(trip.selectedHotel?.pricePerNight || trip.billDetails?.hotel?.pricePerNight || 0).toLocaleString('en-IN')}/night
                    {(trip.selectedHotel?.foodingIncluded || trip.billDetails?.hotel?.foodingIncluded) ? ' · Fooding included' : ''}
                  </p>
                </div>
              </div>
            )}

            {/* Total */}
            <div style={{ borderTop: '1px solid rgba(196,162,93,0.15)', paddingTop: '0.45rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.7rem', fontWeight: 700, color: 'var(--atmos-dark)' }}>
                Total Bill Amount:
              </span>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.1rem', fontWeight: 600, color: '#C4A25D' }}>
                ₹{(trip.estimatedBudget || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}
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
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.68rem', fontWeight: 600,
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
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.68rem', fontWeight: 600,
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

export default function FinancePanel() {
  const { isDark } = useTheme();
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
  const [budgetModalOpen,   setBudgetModalOpen]   = useState(false);
  const [budgetModalConfig, setBudgetModalConfig] = useState({ month: 'all', amount: 500000, dept: 'All' });
  const [distribution,      setDistribution]      = useState(null);
  const [distLoading,       setDistLoading]       = useState(false);
  const [savingBatch,       setSavingBatch]       = useState(false);
  const [inputAmounts,      setInputAmounts]      = useState({});
  const [initialAmounts,    setInitialAmounts]    = useState({});
  const [selectedDistMonth, setSelectedDistMonth] = useState(() => new Date().toLocaleString('en-US', { month: 'long' }));

  const fetchDistribution = async (m = selectedDistMonth) => {
    try {
      setDistLoading(true);
      const res = await financeAPI.getDistribution({ month: m, year: 2026 });
      const data = res.data?.data || null;
      setDistribution(data);
      if (data?.departments) {
        const initialInputs = {};
        data.departments.forEach(dept => {
          dept.employees.forEach(emp => {
            initialInputs[emp._id] = emp.travelBudgetLimit || 0;
          });
        });
        setInputAmounts(initialInputs);
        setInitialAmounts(initialInputs);
      }
    } catch (err) {
      // non-fatal
    } finally {
      setDistLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'distribution') {
      fetchDistribution(selectedDistMonth);
    }
  }, [tab, selectedDistMonth]);

  // Dynamic calculations based on live inputs
  const computeDeptAllocated = (dept) => {
    return dept.employees.reduce((sum, emp) => {
      const val = Number(inputAmounts[emp._id] !== undefined ? inputAmounts[emp._id] : (emp.travelBudgetLimit || 0));
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  };

  const computedTotalAssigned = (distribution?.departments || []).reduce((acc, dept) => {
    return acc + computeDeptAllocated(dept);
  }, 0);

  const totalMonthlyPool = distribution?.totalMonthlyBudget || 500000;
  const computedUnallocatedPool = totalMonthlyPool - computedTotalAssigned;

  const changedEmployees = Object.keys(inputAmounts).filter(
    id => Number(inputAmounts[id]) !== Number(initialAmounts[id])
  );
  const changedCount = changedEmployees.length;

  const handleSaveAllAllocations = async () => {
    const changedAllocations = [];
    for (const id of changedEmployees) {
      const num = Number(inputAmounts[id]);
      if (isNaN(num) || num < 0) {
        return toast.error('Please enter valid non-negative amounts for all modified employees');
      }
      changedAllocations.push({ userId: id, budgetLimit: num });
    }

    if (changedAllocations.length === 0) {
      return toast('No changes to save', { icon: 'ℹ️' });
    }

    setSavingBatch(true);
    try {
      const res = await financeAPI.batchSetEmployeeBudgets(changedAllocations);
      toast.success(res.data?.message || `Successfully updated ${changedAllocations.length} employee budget${changedAllocations.length === 1 ? '' : 's'}!`);
      await fetchDistribution(selectedDistMonth);
      await refreshFinanceData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update employee budgets');
    } finally {
      setSavingBatch(false);
    }
  };

  const handleDiscardChanges = () => {
    setInputAmounts({ ...initialAmounts });
    toast.success('Reverted all unsaved changes');
  };

  const refreshFinanceData = async () => {
    try {
      const [r, d] = await Promise.all([
        financeAPI.report(),
        financeAPI.departmentSummary()
      ]);
      setReport(r.data.data);
      setDeptSummary(d.data.data || {});
      fetchDistribution(selectedDistMonth);
    } catch (_) {}
  };

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
      window.dispatchEvent(new CustomEvent('ctm_approvals_updated'));
    } finally { setDeciding(null); }
  };

  const monthlyChartData = (report?.monthly || []).map(m => {
    const monthStr = String(m.Month || 'Unknown');
    return {
      name: monthStr.split(' ')[0]?.substring(0, 3) || monthStr,
      fullName: monthStr,
      Allocated: m.AllocatedBudget || 0,
      Spent: m.SpentAmount || 0,
      Remaining: m.RemainingBudget || 0
    };
  });

  const deptChartData = Object.entries(deptSummary).map(([dept, d]) => ({
    name: dept, value: d.totalBudgetUsed, allocated: d.totalBudgetAllocated,
  }));

  const STAT_ITEMS = [
    { label: 'Total Allocated', value: `₹${(report?.summary?.totalAllocated || 0).toLocaleString('en-IN')}`, icon: DollarSign, from: isDark ? '#C4A25D' : '#2563EB', to: isDark ? '#B8923F' : '#1D4ED8', glow: isDark ? 'rgba(196,162,93,0.3)' : 'rgba(37,99,235,0.3)' },
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
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '2rem', fontWeight: 700, color: 'var(--atmos-dark)' }}
              >
                Finance Dashboard
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', color: 'var(--atmos-muted)', marginTop: '0.3rem' }}
              >
                Live Neon DB sync · Real-time budget expenditure & approvals
              </motion.p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <motion.button
                onClick={() => {
                  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' });
                  setBudgetModalConfig({ month: currentMonthName, amount: 500000, dept: 'All' });
                  setBudgetModalOpen(true);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.45rem',
                  padding: '0.45rem 1rem', borderRadius: '0.65rem',
                  background: 'var(--atmos-accent-subtle)', border: '1px solid var(--atmos-gold)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.7rem', fontWeight: 600,
                  color: 'var(--atmos-gold)',
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
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.65rem', fontWeight: 600,
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
            <TabBtn id="overview"     label="Overview"                            active={tab === 'overview'}     onClick={setTab} />
            <TabBtn id="approvals"    label={`Approvals (${pending.length})`}     active={tab === 'approvals'}    onClick={setTab} />
            <TabBtn id="distribution" label="Budget Distribution"                 active={tab === 'distribution'} onClick={setTab} />
            <TabBtn id="reports"      label="Reports"                             active={tab === 'reports'}      onClick={setTab} />
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
                          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.6rem', fontWeight: 500, color: 'var(--atmos-dark)', lineHeight: 1 }}>{value}</p>
                          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--atmos-muted)', marginTop: '0.2rem' }}>{label}</p>
                          {subtext && <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.62rem', color: '#1A7F45', marginTop: '0.25rem', fontWeight: 600 }}>{subtext}</p>}
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.25rem', fontWeight: 600, color: 'var(--atmos-dark)', margin: 0 }}>
                          Monthly Budget vs Spend (12 Months)
                        </h2>
                        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.62rem', color: 'var(--atmos-muted)', margin: '0.2rem 0 0' }}>
                          Company-wide budget allocations and actual recorded trip expenses for all 12 months (2026)
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setBudgetModalConfig({ month: 'all', amount: 500000, dept: 'All' });
                          setBudgetModalOpen(true);
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.35rem',
                          background: 'var(--atmos-accent-subtle)', border: '1px solid var(--atmos-gold)',
                          borderRadius: '0.5rem', padding: '0.3rem 0.75rem',
                          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.65rem', fontWeight: 600,
                          color: 'var(--atmos-gold)',
                          cursor: 'pointer'
                        }}
                      >
                        <Sliders style={{ width: '12px', height: '12px', color: 'var(--atmos-gold)' }} /> Adjust Allocation
                      </button>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={monthlyChartData}>
                        <XAxis dataKey="name" tick={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fill: 'var(--atmos-muted)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fill: 'var(--atmos-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                        <Tooltip
                          cursor={{ fill: 'transparent' }}
                          formatter={v => `₹${v.toLocaleString('en-IN')}`}
                          contentStyle={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.75rem', fontWeight: 600, background: '#ffffff', border: '1px solid rgba(196,162,93,0.3)', borderRadius: '0.6rem', color: '#000000', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                          itemStyle={{ color: '#000000' }}
                        />
                        <Bar dataKey="Allocated" fill={isDark ? "rgba(196,162,93,0.2)" : "rgba(37,99,235,0.18)"} radius={[6, 6, 0, 0]} />
                        <Bar dataKey="Spent" fill={isDark ? "#C4A25D" : "#2563EB"} radius={[6, 6, 0, 0]} />
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
                      <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.2rem', fontWeight: 600, color: 'var(--atmos-dark)', marginBottom: '1.25rem' }}>
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
                                <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.7rem', fontWeight: 600 }}>
                                  {`${(percent * 100).toFixed(0)}%`}
                                </text>
                              );
                            }}
                          >
                            {deptChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <Legend wrapperStyle={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.68rem', color: 'var(--atmos-dark)' }} />
                          <Tooltip 
                            formatter={v => `₹${v.toLocaleString('en-IN')}`} 
                            contentStyle={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.75rem', fontWeight: 600, background: '#ffffff', border: '1px solid rgba(196,162,93,0.3)', borderRadius: '0.6rem', color: '#000000', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
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
                      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.3rem', color: 'var(--atmos-dark)', marginBottom: '0.5rem' }}>No pending approvals</p>
                      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', color: 'var(--atmos-muted)' }}>All finance reviews are up to date</p>
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

              {tab === 'distribution' && (
                <motion.div
                  key="distribution"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
                >
                  {/* Top Summary Banner */}
                  <div style={{ ...glassCard, padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                      <div>
                        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.35rem', fontWeight: 600, color: 'var(--atmos-dark)', margin: 0 }}>
                          Monthly Budget Distribution
                        </h2>
                        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.7rem', color: 'var(--atmos-muted)', margin: '0.25rem 0 0' }}>
                          Edit employee budgets across departments. Live preview updates automatically; click <strong>Save All Allocations</strong> when done.
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {/* Month Selector */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.68rem', color: 'var(--atmos-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Month:</span>
                          <select
                            value={selectedDistMonth}
                            onChange={(e) => {
                              const m = e.target.value;
                              setSelectedDistMonth(m);
                              fetchDistribution(m);
                            }}
                            style={{
                              padding: '0.42rem 0.75rem', borderRadius: '0.55rem',
                              border: '1px solid rgba(196,162,93,0.3)',
                              background: 'var(--atmos-input-bg)', color: 'var(--atmos-dark)',
                              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', fontWeight: 600,
                              outline: 'none', cursor: 'pointer'
                            }}
                          >
                            {[
                              'January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'
                            ].map(m => (
                              <option key={m} value={m} style={{ background: '#1c1916', color: '#fff' }}>{m} 2026</option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setBudgetModalConfig({ month: selectedDistMonth, amount: totalMonthlyPool, dept: 'All' });
                            setBudgetModalOpen(true);
                          }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                            padding: '0.45rem 0.85rem', borderRadius: '0.6rem',
                            background: 'var(--atmos-accent-subtle)', border: '1px solid var(--atmos-gold)',
                            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.68rem', fontWeight: 600,
                            color: 'var(--atmos-gold)', cursor: 'pointer'
                          }}
                        >
                          <Sliders style={{ width: '13px', height: '13px' }} />
                          Set Total Monthly Budget
                        </button>

                        {/* FINAL SAVE ALL BUTTON (PREVENTS EXCESS REQUESTS) */}
                        <button
                          type="button"
                          disabled={savingBatch || changedCount === 0}
                          onClick={handleSaveAllAllocations}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                            padding: '0.45rem 1.15rem', borderRadius: '0.65rem',
                            background: changedCount > 0 ? 'var(--atmos-accent-grad)' : 'rgba(255,255,255,0.06)',
                            border: changedCount > 0 ? 'none' : '1px solid var(--atmos-glass-border)',
                            color: changedCount > 0 ? '#FFFFFF' : 'var(--atmos-muted)',
                            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', fontWeight: 700,
                            cursor: (savingBatch || changedCount === 0) ? 'not-allowed' : 'pointer',
                            boxShadow: changedCount > 0 ? '0 4px 16px var(--atmos-accent-glow)' : 'none',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {savingBatch ? <Loader2 style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} /> : <Check style={{ width: '13px', height: '13px' }} />}
                          <span>Save All Allocations</span>
                          {changedCount > 0 && (
                            <span style={{
                              padding: '0.1rem 0.45rem', borderRadius: '999px',
                              backgroundColor: '#FFFFFF', color: '#1E40AF',
                              fontSize: '0.6rem', fontWeight: 800
                            }}>
                              {changedCount} modified
                            </span>
                          )}
                        </button>

                        {changedCount > 0 && (
                          <button
                            type="button"
                            disabled={savingBatch}
                            onClick={handleDiscardChanges}
                            style={{
                              padding: '0.45rem 0.75rem', borderRadius: '0.6rem',
                              background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.4)',
                              color: '#EF4444', fontFamily: "'Plus Jakarta Sans', sans-serif",
                              fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer'
                            }}
                          >
                            Discard
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 3 Metric Cards (Calculated Live!) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                      {/* Total Monthly Pool */}
                      <div style={{
                        padding: '1.1rem 1.25rem', borderRadius: '1rem',
                        background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                        border: '1px solid rgba(196,162,93,0.25)', display: 'flex', flexDirection: 'column', gap: '0.35rem'
                      }}>
                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--atmos-gold)' }}>
                          Total Monthly Budget (Fixed Pool)
                        </span>
                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.65rem', fontWeight: 700, color: 'var(--atmos-dark)' }}>
                          ₹{totalMonthlyPool.toLocaleString('en-IN')}
                        </span>
                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.65rem', color: 'var(--atmos-muted)' }}>
                          Company-wide cap for {selectedDistMonth} 2026
                        </span>
                      </div>

                      {/* Total Assigned */}
                      <div style={{
                        padding: '1.1rem 1.25rem', borderRadius: '1rem',
                        background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                        border: '1px solid var(--atmos-glass-border)', display: 'flex', flexDirection: 'column', gap: '0.35rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--atmos-muted)' }}>
                            Total Assigned to People
                          </span>
                          {changedCount > 0 && (
                            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.58rem', color: 'var(--atmos-gold)', fontWeight: 700 }}>
                              Preview
                            </span>
                          )}
                        </div>
                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.65rem', fontWeight: 700, color: 'var(--atmos-dark)' }}>
                          ₹{computedTotalAssigned.toLocaleString('en-IN')}
                        </span>
                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.65rem', color: 'var(--atmos-muted)' }}>
                          {totalMonthlyPool ? `${Math.round((computedTotalAssigned / totalMonthlyPool) * 100)}% allocated across all team members` : 'Across all team members'}
                        </span>
                      </div>

                      {/* Remaining Unallocated Pool */}
                      <div style={{
                        padding: '1.1rem 1.25rem', borderRadius: '1rem',
                        background: computedUnallocatedPool >= 0 ? 'rgba(39, 174, 96, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                        border: computedUnallocatedPool >= 0 ? '1px solid rgba(39, 174, 96, 0.3)' : '1px solid rgba(239, 68, 68, 0.35)',
                        display: 'flex', flexDirection: 'column', gap: '0.35rem'
                      }}>
                        <span style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                          color: computedUnallocatedPool >= 0 ? '#16A34A' : '#EF4444'
                        }}>
                          {computedUnallocatedPool >= 0 ? 'Unallocated Remaining Pool' : 'Budget Pool Exceeded'}
                        </span>
                        <span style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.65rem', fontWeight: 700,
                          color: computedUnallocatedPool >= 0 ? '#16A34A' : '#EF4444'
                        }}>
                          ₹{Math.abs(computedUnallocatedPool).toLocaleString('en-IN')}
                        </span>
                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.65rem', color: computedUnallocatedPool >= 0 ? '#16A34A' : '#EF4444', fontWeight: 500 }}>
                          {computedUnallocatedPool >= 0
                            ? 'Available to distribute to team members'
                            : `⚠️ Total assigned exceeds monthly pool by ₹${Math.abs(computedUnallocatedPool).toLocaleString('en-IN')}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Departments & People Breakdown */}
                  {distLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                      <Loader2 style={{ width: '32px', height: '32px', color: '#C4A25D', animation: 'spin 1s linear infinite' }} />
                    </div>
                  ) : (distribution?.departments || []).length === 0 ? (
                    <div style={{ ...glassCard, padding: '3.5rem 2rem', textAlign: 'center' }}>
                      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1rem', color: 'var(--atmos-dark)' }}>No departments or employees found</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {distribution.departments.map((dept) => {
                        const deptAssigned = computeDeptAllocated(dept);
                        return (
                          <div key={dept.name} style={{ ...glassCard, overflow: 'hidden' }}>
                            {/* Department Header */}
                            <div style={{
                              padding: '1.15rem 1.5rem',
                              borderBottom: '1px solid rgba(196,162,93,0.12)',
                              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                  width: '36px', height: '36px', borderRadius: '10px',
                                  background: 'var(--atmos-accent-subtle)', border: '1px solid var(--atmos-gold)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                  <Layers style={{ width: '16px', height: '16px', color: 'var(--atmos-gold)' }} />
                                </div>
                                <div>
                                  <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.15rem', fontWeight: 700, color: 'var(--atmos-dark)', margin: 0 }}>
                                    {dept.name}
                                  </h3>
                                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.65rem', color: 'var(--atmos-muted)' }}>
                                    {dept.employees.length} {dept.employees.length === 1 ? 'Person' : 'People'} under this department
                                  </span>
                                </div>
                              </div>

                              {/* Department Aggregates */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <div style={{
                                  padding: '0.35rem 0.85rem', borderRadius: '0.6rem',
                                  background: 'var(--atmos-accent-subtle)', border: '1px solid var(--atmos-gold)',
                                  display: 'flex', alignItems: 'center', gap: '0.4rem'
                                }}>
                                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.62rem', fontWeight: 600, color: 'var(--atmos-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Assigned:
                                  </span>
                                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.82rem', fontWeight: 700, color: 'var(--atmos-gold)' }}>
                                    ₹{deptAssigned.toLocaleString('en-IN')}
                                  </span>
                                </div>

                                <div style={{
                                  padding: '0.35rem 0.85rem', borderRadius: '0.6rem',
                                  background: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9',
                                  border: '1px solid var(--atmos-glass-border)',
                                  display: 'flex', alignItems: 'center', gap: '0.4rem'
                                }}>
                                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.62rem', fontWeight: 600, color: 'var(--atmos-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Spent:
                                  </span>
                                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.82rem', fontWeight: 700, color: 'var(--atmos-dark)' }}>
                                    ₹{dept.totalSpent.toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* People Table */}
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid rgba(196,162,93,0.08)' }}>
                                    {['Team Member', 'Role', 'Current Spend', 'Assigned Travel Budget (Per Person)', 'Status'].map(h => (
                                      <th key={h} style={{
                                        padding: '0.75rem 1.25rem', textAlign: 'left',
                                        fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.58rem',
                                        fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C4A25D'
                                      }}>
                                        {h}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {dept.employees.map((emp) => {
                                    const currentVal = inputAmounts[emp._id] ?? emp.travelBudgetLimit ?? 0;
                                    const isModified = Number(inputAmounts[emp._id]) !== Number(initialAmounts[emp._id]);
                                    const isExceeded = (emp.travelBudgetUsed || 0) > Number(currentVal);

                                    return (
                                      <tr key={emp._id} style={{
                                        borderBottom: '1px solid rgba(196,162,93,0.05)',
                                        background: isModified ? 'rgba(196,162,93,0.04)' : 'transparent',
                                        transition: 'background 0.2s ease'
                                      }}>
                                        {/* Member */}
                                        <td style={{ padding: '0.9rem 1.25rem' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                            <div style={{
                                              width: '32px', height: '32px', borderRadius: '50%',
                                              background: 'var(--atmos-accent-grad)',
                                              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.75rem', fontWeight: 700
                                            }}>
                                              {emp.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.8rem', fontWeight: 600, color: 'var(--atmos-dark)' }}>
                                                {emp.name}
                                              </div>
                                              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.62rem', color: 'var(--atmos-muted)' }}>
                                                {emp.email} · {emp.employeeId}
                                              </div>
                                            </div>
                                          </div>
                                        </td>

                                        {/* Role */}
                                        <td style={{ padding: '0.9rem 1.25rem' }}>
                                          <span style={{
                                            padding: '0.2rem 0.55rem', borderRadius: '6px',
                                            background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                                            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.65rem',
                                            fontWeight: 600, textTransform: 'capitalize', color: 'var(--atmos-mid)'
                                          }}>
                                            {emp.role || 'Employee'}
                                          </span>
                                        </td>

                                        {/* Spend */}
                                        <td style={{ padding: '0.9rem 1.25rem' }}>
                                          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.8rem', fontWeight: 700, color: isExceeded ? '#EF4444' : 'var(--atmos-dark)' }}>
                                            ₹{(emp.travelBudgetUsed || 0).toLocaleString('en-IN')}
                                          </div>
                                          {isExceeded && (
                                            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.58rem', color: '#EF4444', fontWeight: 600 }}>
                                              Over budget by ₹{((emp.travelBudgetUsed || 0) - Number(currentVal)).toLocaleString('en-IN')}
                                            </div>
                                          )}
                                        </td>

                                        {/* Person-wise Budget Allocation Input */}
                                        <td style={{ padding: '0.9rem 1.25rem' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <div style={{ position: 'relative', width: '140px' }}>
                                              <span style={{
                                                position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)',
                                                color: 'var(--atmos-gold)', fontSize: '0.8rem', fontWeight: 700
                                              }}>₹</span>
                                              <input
                                                type="number"
                                                min="0"
                                                step="5000"
                                                value={currentVal}
                                                onChange={(e) => {
                                                  const val = e.target.value;
                                                  setInputAmounts(prev => ({
                                                    ...prev,
                                                    [emp._id]: val
                                                  }));
                                                }}
                                                style={{
                                                  width: '100%', boxSizing: 'border-box',
                                                  padding: '0.4rem 0.6rem 0.4rem 1.6rem',
                                                  borderRadius: '0.55rem',
                                                  border: isModified
                                                    ? '1px solid var(--atmos-gold)'
                                                    : '1px solid rgba(196,162,93,0.35)',
                                                  background: isModified
                                                    ? (isDark ? 'rgba(196,162,93,0.1)' : 'rgba(37,99,235,0.06)')
                                                    : 'var(--atmos-input-bg)',
                                                  color: 'var(--atmos-dark)',
                                                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                                                  fontSize: '0.8rem', fontWeight: 600, outline: 'none'
                                                }}
                                              />
                                            </div>

                                            {/* Quick Presets */}
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                              {[20000, 50000, 100000].map(pVal => (
                                                <button
                                                  key={pVal}
                                                  type="button"
                                                  onClick={() => setInputAmounts(prev => ({ ...prev, [emp._id]: pVal }))}
                                                  style={{
                                                    padding: '0.2rem 0.45rem', borderRadius: '4px',
                                                    border: '1px solid rgba(196,162,93,0.2)',
                                                    background: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9',
                                                    color: 'var(--atmos-muted)',
                                                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.58rem', fontWeight: 600,
                                                    cursor: 'pointer'
                                                  }}
                                                >
                                                  ₹{pVal / 1000}k
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        </td>

                                        {/* Status */}
                                        <td style={{ padding: '0.9rem 1.25rem' }}>
                                          {isModified ? (
                                            <span style={{
                                              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                              padding: '0.25rem 0.65rem', borderRadius: '999px',
                                              background: 'rgba(196,162,93,0.15)', border: '1px solid var(--atmos-gold)',
                                              color: 'var(--atmos-gold)', fontFamily: "'Plus Jakarta Sans', sans-serif",
                                              fontSize: '0.62rem', fontWeight: 700
                                            }}>
                                              ● Modified
                                            </span>
                                          ) : (
                                            <span style={{
                                              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                              padding: '0.25rem 0.65rem', borderRadius: '999px',
                                              background: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9',
                                              color: 'var(--atmos-muted)', fontFamily: "'Plus Jakarta Sans', sans-serif",
                                              fontSize: '0.62rem', fontWeight: 600
                                            }}>
                                              Current
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Sticky bottom banner when changes exist */}
                  {changedCount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        position: 'sticky', bottom: '1.5rem', zIndex: 30,
                        padding: '1rem 1.5rem', borderRadius: '1rem',
                        background: 'var(--atmos-surface)', border: '1px solid var(--atmos-gold)',
                        boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        flexWrap: 'wrap', gap: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{
                          width: '8px', height: '8px', borderRadius: '50%',
                          backgroundColor: 'var(--atmos-gold)'
                        }} />
                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.8rem', fontWeight: 600, color: 'var(--atmos-dark)' }}>
                          You have modified budget allocations for <strong>{changedCount} team member{changedCount === 1 ? '' : 's'}</strong>.
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button
                          type="button"
                          disabled={savingBatch}
                          onClick={handleDiscardChanges}
                          style={{
                            padding: '0.45rem 0.9rem', borderRadius: '0.6rem',
                            background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.4)',
                            color: '#EF4444', fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer'
                          }}
                        >
                          Discard Changes
                        </button>

                        <button
                          type="button"
                          disabled={savingBatch}
                          onClick={handleSaveAllAllocations}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                            padding: '0.5rem 1.35rem', borderRadius: '0.65rem',
                            background: 'var(--atmos-accent-grad)', border: 'none',
                            color: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontSize: '0.75rem', fontWeight: 700,
                            cursor: savingBatch ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 16px var(--atmos-accent-glow)'
                          }}
                        >
                          {savingBatch ? <Loader2 style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} /> : <Check style={{ width: '13px', height: '13px' }} />}
                          <span>Save All Allocations ({changedCount})</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {tab === 'reports' && (
                <motion.div key="reports" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease }}
                  style={{ ...glassCard, overflow: 'hidden' }}
                >
                  <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(196,162,93,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.2rem', fontWeight: 600, color: 'var(--atmos-dark)' }}>Monthly Budget Report</h2>
                      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.65rem', color: 'var(--atmos-muted)', marginTop: '0.2rem' }}>
                        Live from Neon DB · Last Synced: {report?.summary?.lastSyncedAt ? format(new Date(report.summary.lastSyncedAt), 'dd MMM yyyy, hh:mm a') : 'Recently'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                      <button
                        onClick={() => {
                          const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' });
                          setBudgetModalConfig({ month: currentMonthName, amount: 500000, dept: 'All' });
                          setBudgetModalOpen(true);
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.35rem',
                          background: 'rgba(196,162,93,0.15)', border: '1px solid #C4A25D',
                          borderRadius: '0.5rem', padding: '0.35rem 0.75rem',
                          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.65rem', fontWeight: 600, color: '#C4A25D',
                          cursor: 'pointer'
                        }}
                      >
                        <Edit3 style={{ width: '11px', height: '11px' }} />
                        Set Budget
                      </button>
                    <button
                      onClick={handleSyncSheets}
                      disabled={syncing}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                        background: 'transparent', border: '1px solid rgba(196,162,93,0.3)',
                        borderRadius: '0.5rem', padding: '0.35rem 0.75rem',
                        fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.65rem', color: '#C4A25D',
                        cursor: syncing ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <RefreshCw style={{ width: '11px', height: '11px', animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                      Sync Sheets
                    </button>
                    </div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(196,162,93,0.1)' }}>
                          {['Month', 'Department', 'Allocated', 'Spent', 'Remaining', 'Last Updated', 'Action'].map(h => (
                            <th key={h} style={{ padding: '0.75rem 1.25rem', textAlign: 'left', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C4A25D' }}>{h}</th>
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
                            <td style={{ padding: '0.8rem 1.25rem', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', color: 'var(--atmos-dark)' }}>{row.Month}</td>
                            <td style={{ padding: '0.8rem 1.25rem', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', color: 'var(--atmos-mid)' }}>{row.Department}</td>
                            <td style={{ padding: '0.8rem 1.25rem', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', color: 'var(--atmos-dark)' }}>₹{(row.AllocatedBudget || 0).toLocaleString('en-IN')}</td>
                            <td style={{ padding: '0.8rem 1.25rem', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', color: 'var(--atmos-dark)' }}>₹{(row.SpentAmount || 0).toLocaleString('en-IN')}</td>
                            <td style={{ padding: '0.8rem 1.25rem', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', fontWeight: 600, color: (row.RemainingBudget || 0) < 0 ? '#C0392B' : '#1A7F45' }}>
                              ₹{(row.RemainingBudget || 0).toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '0.8rem 1.25rem', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.65rem', color: 'var(--atmos-muted)' }}>
                              {row.LastUpdated ? (() => { try { const d = new Date(row.LastUpdated); if (isNaN(d.getTime())) return '—'; const isMidnight = d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0; return isMidnight ? format(d, 'dd MMM yyyy') : format(d, 'dd MMM yyyy, hh:mm a'); } catch (_) { return '—'; } })() : '—'}
                            </td>
                            <td style={{ padding: '0.8rem 1.25rem' }}>
                              <button
                                onClick={() => {
                                  setBudgetModalConfig({
                                    month: row.Month,
                                    amount: row.AllocatedBudget || 500000,
                                    dept: row.Department || 'All'
                                  });
                                  setBudgetModalOpen(true);
                                }}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                  background: 'rgba(196,162,93,0.1)', border: '1px solid rgba(196,162,93,0.3)',
                                  borderRadius: '0.4rem', padding: '0.25rem 0.55rem',
                                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.62rem', fontWeight: 600, color: '#C4A25D',
                                  cursor: 'pointer'
                                }}
                              >
                                <Edit3 style={{ width: '10px', height: '10px' }} /> Edit
                              </button>
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

      <SetBudgetModal
        isOpen={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        onSuccess={refreshFinanceData}
        initialMonth={budgetModalConfig.month}
        initialAmount={budgetModalConfig.amount}
        initialDept={budgetModalConfig.dept}
      />
    </div>
  );
}
