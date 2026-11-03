import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
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

function SideNavItem({ to, icon: Icon, label, delay = 0 }) {
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
          }}>
            {label}
          </span>
        </motion.div>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const pct = Math.min(100, ((user?.travelBudgetUsed || 0) / (user?.travelBudgetLimit || 50000)) * 100);

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
      <SideNavItem to="/messages"       icon={MessageSquare} label="Messages"   delay={0.11} />
      <SideNavItem to="/reimbursements" icon={Receipt}    label="Reimbursements" delay={0.12} />

      {(user?.role === 'manager' || user?.role === 'admin') && (
        <>
          <p style={SECTION_LABEL}>Manager</p>
          <SideNavItem to="/manager" icon={CheckCircle} label="Trip Approvals" delay={0.15} />
        </>
      )}

      {(user?.role === 'finance' || user?.role === 'admin') && (
        <>
          <p style={SECTION_LABEL}>Finance</p>
          <SideNavItem to="/finance" icon={DollarSign} label="Finance Dashboard" delay={0.2} />
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
          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6rem', fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: isDark ? 'rgba(196,162,93,0.7)' : 'rgba(37,99,235,0.85)', marginBottom: '0.6rem',
          }}>
            Travel Budget
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.68rem', fontWeight: 600, color: 'var(--atmos-dark)' }}>
              ₹{(user.travelBudgetUsed || 0).toLocaleString('en-IN')}
            </span>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.68rem', color: 'var(--atmos-muted)' }}>
              ₹{(user.travelBudgetLimit || 50000).toLocaleString('en-IN')}
            </span>
          </div>
          {/* Track */}
          <div style={{
            height: '5px', borderRadius: '999px',
            background: 'rgba(196,162,93,0.12)',
            overflow: 'hidden',
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: [0.25, 1, 0.5, 1], delay: 0.5 }}
              style={{
                height: '100%',
                borderRadius: '999px',
                background: pct > 85
                  ? 'linear-gradient(90deg, #C0392B, #E74C3C)'
                  : (isDark ? 'linear-gradient(90deg, #C4A25D, #E8C97A)' : 'linear-gradient(90deg, #2563EB, #60A5FA)'),
              }}
            />
          </div>
          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6rem', color: 'var(--atmos-muted)',
            marginTop: '0.35rem', textAlign: 'right',
          }}>
            {pct.toFixed(0)}% used
          </p>
        </motion.div>
      )}
    </motion.aside>
  );
}
