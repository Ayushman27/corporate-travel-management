import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useState, useEffect } from 'react';
import { tripAPI } from '../../services/api';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, PlusCircle,
  MessageSquare, CheckCircle, DollarSign, Users, Receipt, Activity
} from 'lucide-react';

const SECTION_LABEL = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: '0.58rem',
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'rgba(196,162,93,0.6)',
  padding: '0 0.75rem',
  marginTop: '1.25rem',
  marginBottom: '0.4rem',
};

function SideNavItem({ to, icon: Icon, label, delay = 0, badge = null }) {
  return (
    <NavLink to={to} style={{ textDecoration: 'none' }}>
      {({ isActive }) => (
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1], delay }}
          whileHover={{
            x: 3,
            background: 'var(--atmos-accent-subtle)',
            transition: { duration: 0.18 },
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.65rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '0.65rem',
            cursor: 'pointer',
            background: isActive ? 'var(--atmos-accent-subtle)' : 'transparent',
            borderLeft: isActive ? '2px solid var(--atmos-gold)' : '2px solid transparent',
            marginBottom: '0.15rem',
          }}
        >
          <Icon
            style={{
              width: '15px', height: '15px', flexShrink: 0,
              color: isActive ? 'var(--atmos-gold)' : 'var(--atmos-muted)',
              transition: 'color 0.2s ease',
            }}
          />
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '0.72rem', fontWeight: isActive ? 600 : 500,
            color: isActive ? 'var(--atmos-dark)' : 'var(--atmos-mid)',
            letterSpacing: '0.03em',
            transition: 'color 0.2s ease',
            flex: 1
          }}>
            {label}
          </span>
          {badge ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: '16px', height: '16px', borderRadius: '999px',
              backgroundColor: '#EF4444', color: '#fff',
              fontSize: '0.58rem', fontWeight: 700, padding: '0 4px',
              lineHeight: 1
            }}>
              {badge}
            </span>
          ) : null}
        </motion.div>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [pendingManagerCount, setPendingManagerCount] = useState(0);
  const [pendingFinanceCount, setPendingFinanceCount] = useState(0);
  const [tripsSpend, setTripsSpend] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchSpend = async () => {
      try {
        const res = await tripAPI.myTrips();
        const trips = res.data?.data || [];
        const spent = trips
          .filter(t => ['approved', 'booked', 'completed'].includes(t.status))
          .reduce((s, t) => s + (t.actualCost || t.approvedBudget || t.estimatedBudget || 0), 0);
        if (mounted) setTripsSpend(spent);
      } catch {
        // non-fatal
      }
    };
    fetchSpend();
    return () => { mounted = false; };
  }, []);

  const spentAmount = tripsSpend !== null ? tripsSpend : (user?.travelBudgetUsed || 0);
  const budgetLimit = user?.travelBudgetLimit || 20000;
  const pct = budgetLimit > 0 ? (spentAmount / budgetLimit) * 100 : 0;
  const isOverBudget = spentAmount > budgetLimit;
  const excess = Math.max(0, spentAmount - budgetLimit);
  const remaining = Math.max(0, budgetLimit - spentAmount);

  useEffect(() => {
    let mounted = true;

    const fetchAllCounts = async () => {
      // 1. Messages count
      if (location.pathname === '/messages') {
        if (mounted) setUnreadMsgCount(0);
      } else {
        try {
          const res = await tripAPI.getMessages();
          const msgs = res.data?.data || [];
          const readIds = JSON.parse(localStorage.getItem('ctm_read_messages') || '[]');
          const unread = msgs.filter(m => !readIds.includes(m.id)).length;
          if (mounted) setUnreadMsgCount(unread);
        } catch {}
      }

      // 2. Manager pending approvals count
      if (user?.role === 'manager' || user?.role === 'admin') {
        try {
          const res = await tripAPI.pendingManager();
          const count = res.data?.data?.length || 0;
          if (mounted) setPendingManagerCount(count);
        } catch {}
      } else {
        if (mounted) setPendingManagerCount(0);
      }

      // 3. Finance pending approvals count
      if (user?.role === 'finance' || user?.role === 'admin') {
        try {
          const res = await tripAPI.pendingFinance();
          const count = res.data?.data?.length || 0;
          if (mounted) setPendingFinanceCount(count);
        } catch {}
      } else {
        if (mounted) setPendingFinanceCount(0);
      }
    };

    fetchAllCounts();

    const interval = setInterval(fetchAllCounts, 20000);
    const onApprovalsUpdated = () => fetchAllCounts();
    const onMessagesRead = () => fetchAllCounts();

    window.addEventListener('ctm_approvals_updated', onApprovalsUpdated);
    window.addEventListener('ctm_messages_read', onMessagesRead);
    window.addEventListener('storage', onMessagesRead);

    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener('ctm_approvals_updated', onApprovalsUpdated);
      window.removeEventListener('ctm_messages_read', onMessagesRead);
      window.removeEventListener('storage', onMessagesRead);
    };
  }, [location.pathname, user?.role]);

  return (
    <motion.aside
      initial={{ x: -240, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.25, 1, 0.5, 1] }}
      style={{
        position: 'fixed',
        left: 0, top: '68px', bottom: 0,
        width: '220px',
        background: 'var(--atmos-glass)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(196,162,93,0.15)',
        boxShadow: '4px 0 24px rgba(44,43,41,0.04)',
        display: 'flex', flexDirection: 'column',
        padding: '1rem 0.75rem',
        zIndex: 30,
        overflowY: 'auto',
      }}
    >
      {/* Navigation label */}
      <p style={SECTION_LABEL}>Navigation</p>

      <SideNavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard"  delay={0.05} />
      <SideNavItem to="/trip/new"  icon={PlusCircle}      label="New Trip"   delay={0.1} />
      <SideNavItem to="/messages"       icon={MessageSquare} label="Messages"   delay={0.11} badge={unreadMsgCount > 0 ? unreadMsgCount : null} />
      <SideNavItem to="/reimbursements" icon={Receipt}    label="Reimbursements" delay={0.12} />

      {(user?.role === 'manager' || user?.role === 'admin') && (
        <>
          <p style={SECTION_LABEL}>Manager</p>
          <SideNavItem to="/manager" icon={CheckCircle} label="Trip Approvals" delay={0.15} badge={pendingManagerCount > 0 ? pendingManagerCount : null} />
        </>
      )}

      {(user?.role === 'finance' || user?.role === 'admin') && (
        <>
          <p style={SECTION_LABEL}>Finance</p>
          <SideNavItem to="/finance" icon={DollarSign} label="Finance Dashboard" delay={0.2} badge={pendingFinanceCount > 0 ? pendingFinanceCount : null} />
          <SideNavItem to="/finance-reimbursements" icon={Receipt} label="Reimbursements" delay={0.22} />
        </>
      )}

      {user?.role === 'admin' && (
        <>
          <p style={SECTION_LABEL}>Admin</p>
          <SideNavItem to="/admin" icon={Users} label="User Management" delay={0.25} />
          <SideNavItem to="/admin/telemetry" icon={Activity} label="Telemetry" delay={0.28} />
        </>
      )}

      {/* Budget indicator */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          style={{
            marginTop: 'auto',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(196,162,93,0.12)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <p style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.62rem', fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: isDark ? 'rgba(196,162,93,0.9)' : 'rgba(37,99,235,0.95)', margin: 0,
            }}>
              Monthly Travel Budget
            </p>
            <span style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.52rem', fontWeight: 700,
              letterSpacing: '0.04em', textTransform: 'uppercase',
              padding: '0.12rem 0.35rem', borderRadius: '4px',
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              color: 'var(--atmos-muted)',
            }}>
              Per Month
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
            <div>
              <span style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.78rem', fontWeight: 700,
                color: isOverBudget ? '#EF4444' : 'var(--atmos-dark)'
              }}>
                ₹{spentAmount.toLocaleString('en-IN')}
              </span>
              <span style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.58rem',
                color: 'var(--atmos-muted)', marginLeft: '0.25rem'
              }}>
                spent
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', color: 'var(--atmos-muted)', fontWeight: 500 }}>
                ₹{budgetLimit.toLocaleString('en-IN')}
              </span>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.58rem', color: 'var(--atmos-muted)', marginLeft: '0.2rem' }}>
                / mo
              </span>
            </div>
          </div>

          {/* Track */}
          <div style={{
            height: '6px', borderRadius: '999px',
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, pct)}%` }}
              transition={{ duration: 1, ease: [0.25, 1, 0.5, 1], delay: 0.3 }}
              style={{
                height: '100%',
                borderRadius: '999px',
                background: isOverBudget
                  ? 'linear-gradient(90deg, #DC2626, #EF4444)'
                  : pct > 80
                    ? 'linear-gradient(90deg, #D97706, #F59E0B)'
                    : (isDark ? 'linear-gradient(90deg, #C4A25D, #E8C97A)' : 'linear-gradient(90deg, #2563EB, #60A5FA)'),
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem', flexWrap: 'wrap', gap: '0.2rem' }}>
            <span style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.62rem', fontWeight: 600,
              color: isOverBudget ? '#EF4444' : 'var(--atmos-muted)'
            }}>
              {pct.toFixed(0)}% used
            </span>
            <span style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.62rem', fontWeight: 600,
              color: isOverBudget ? '#EF4444' : '#16A34A'
            }}>
              {isOverBudget ? `Over limit by ₹${excess.toLocaleString('en-IN')}` : `₹${remaining.toLocaleString('en-IN')} available`}
            </span>
          </div>
        </motion.div>
      )}
    </motion.aside>
  );
}
