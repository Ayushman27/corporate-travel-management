import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { LogOut, ChevronDown, Sun, Moon, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { tripAPI } from '../../services/api';

const ROLE_COLOR = {
  employee: { bg: 'rgba(196,162,93,0.12)', color: '#8B6914' },
  manager:  { bg: 'rgba(139,115,85,0.12)', color: '#5C4A2A' },
  finance:  { bg: 'rgba(39,174,96,0.12)',  color: '#1A7F45' },
  admin:    { bg: 'rgba(192,57,43,0.12)',   color: '#C0392B' },
};

const NavLink = ({ to, children }) => {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(to + '/');
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <motion.span
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.9rem',
          borderRadius: '0.6rem',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '0.72rem', fontWeight: 500,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: active ? 'var(--atmos-gold)' : 'var(--atmos-mid)',
          background: active ? 'var(--atmos-accent-subtle)' : 'transparent',
          transition: 'all 0.2s ease',
        }}
        whileHover={{ color: 'var(--atmos-gold)', background: 'var(--atmos-accent-subtle)' }}
      >
        {children}
      </motion.span>
    </Link>
  );
};

export default function Navbar() {
  const { user, company, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [scrolled,  setScrolled]  = useState(false);
  const [profileHovered, setProfileHovered] = useState(false);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [pendingManagerCount, setPendingManagerCount] = useState(0);
  const [pendingFinanceCount, setPendingFinanceCount] = useState(0);

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
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 20));

  const handleLogout = () => { logout(); navigate('/login'); };

  const rc = ROLE_COLOR[user?.role] || ROLE_COLOR.employee;

  return (
    <motion.header
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: scrolled
          ? 'var(--atmos-glass)'
          : 'var(--atmos-glass)',
        borderBottom: '1px solid rgba(196,162,93,0.15)',
        boxShadow: scrolled
          ? '0 4px 24px rgba(44,43,41,0.07)'
          : '0 1px 0 rgba(196,162,93,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingLeft: '1.75rem', paddingRight: '1.75rem',
        transition: 'height 0.4s cubic-bezier(0.25,1,0.5,1), box-shadow 0.4s ease, background 0.4s ease',
        height: scrolled ? '56px' : '68px',
      }}
    >
      {/* Brand */}
      <Link to="/dashboard" style={{ textDecoration: 'none' }}>
        <motion.div
          style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}
          whileHover={{ opacity: 0.9 }}
        >
          <img
            src="/travello-mark.png"
            alt="Travello"
            style={{
              height: scrolled ? '28px' : '34px',
              width: 'auto',
              objectFit: 'contain',
              transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
              filter: 'drop-shadow(0 2px 8px rgba(37,99,235,0.25))'
            }}
          />
          <div>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: scrolled ? '1.15rem' : '1.3rem',
              fontWeight: 800, letterSpacing: '-0.03em',
              color: 'var(--atmos-dark)', lineHeight: 1.1,
              transition: 'font-size 0.3s ease',
            }}>
              Travello
            </div>
            {company?.companyName && (
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6rem',
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'var(--atmos-gold)', lineHeight: 1,
              }}>
                {company.companyName}
              </div>
            )}
          </div>
        </motion.div>
      </Link>

      {/* Nav links */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/trip/new">New Trip</NavLink>
        <NavLink to="/messages">
          <span>Messages</span>
          {unreadMsgCount > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: '16px', height: '16px', borderRadius: '999px',
              backgroundColor: '#EF4444', color: '#fff',
              fontSize: '0.58rem', fontWeight: 700, padding: '0 4px',
              lineHeight: 1
            }}>
              {unreadMsgCount}
            </span>
          )}
        </NavLink>
        {(user?.role === 'manager' || user?.role === 'admin') && (
          <NavLink to="/manager">
            <span>Approvals</span>
            {pendingManagerCount > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: '16px', height: '16px', borderRadius: '999px',
                backgroundColor: '#EF4444', color: '#fff',
                fontSize: '0.58rem', fontWeight: 700, padding: '0 4px',
                lineHeight: 1
              }}>
                {pendingManagerCount}
              </span>
            )}
          </NavLink>
        )}
        {(user?.role === 'finance' || user?.role === 'admin') && (
          <NavLink to="/finance">
            <span>Finance</span>
            {pendingFinanceCount > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: '16px', height: '16px', borderRadius: '999px',
                backgroundColor: '#EF4444', color: '#fff',
                fontSize: '0.58rem', fontWeight: 700, padding: '0 4px',
                lineHeight: 1
              }}>
                {pendingFinanceCount}
              </span>
            )}
          </NavLink>
        )}
        {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
      </nav>

      {/* Right controls: Theme toggle + User menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Theme Toggle Button */}
        <motion.button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.4rem 0.8rem',
            borderRadius: '0.75rem',
            background: 'var(--atmos-glass)',
            border: isDark ? '1px solid rgba(196,162,93,0.3)' : '1px solid rgba(37,99,235,0.3)',
            color: isDark ? '#C4A25D' : '#2563EB',
            cursor: 'pointer',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '0.68rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease',
          }}
        >
          {isDark ? (
            <>
              <Sun style={{ width: '14px', height: '14px', color: '#E8C97A' }} />
              <span style={{ color: '#E8C97A' }}>Light</span>
            </>
          ) : (
            <>
              <Moon style={{ width: '14px', height: '14px', color: '#2563EB' }} />
              <span style={{ color: '#2563EB' }}>Dark</span>
            </>
          )}
        </motion.button>

        {/* User menu */}
        <div style={{ position: 'relative' }}>
          <motion.button
            onClick={() => setMenuOpen(o => !o)}
            onHoverStart={() => setProfileHovered(true)}
            onHoverEnd={() => setProfileHovered(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.4rem 0.75rem',
              borderRadius: '0.75rem',
              background: profileHovered
                ? (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(37, 99, 235, 0.06)')
                : (isDark ? 'rgba(255, 255, 255, 0.04)' : 'var(--atmos-glass)'),
              border: isDark
                ? (profileHovered ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)')
                : (profileHovered ? '1px solid rgba(37, 99, 235, 0.3)' : '1px solid var(--atmos-glass-border)'),
              boxShadow: profileHovered ? '0 4px 16px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            whileTap={{ scale: 0.97 }}
          >
            {/* Avatar */}
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'var(--atmos-accent-grad)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.9rem',
              fontWeight: 600, color: '#fff', flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', fontWeight: 600, color: 'var(--atmos-dark)', lineHeight: 1.2 }}>
                {user?.name?.split(' ')[0]}
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '0.1rem 0.45rem', borderRadius: '999px',
                background: rc.bg, color: rc.color,
                fontSize: '0.58rem', fontWeight: 600,
                letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>
                {user?.role}
              </div>
            </div>
            <motion.div animate={{ rotate: menuOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
              <ChevronDown style={{ width: '14px', height: '14px', color: 'var(--atmos-muted)' }} />
            </motion.div>
          </motion.button>

          {/* Backdrop click outside */}
          {menuOpen && (
            <div
              onClick={() => setMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 49 }}
            />
          )}

          {/* Dropdown */}
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                width: '220px', borderRadius: '1rem',
                backgroundColor: isDark ? '#161D2B' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
                boxShadow: isDark
                  ? '0 20px 48px -4px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                  : '0 20px 48px -4px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(15, 23, 42, 0.04)',
                overflow: 'hidden', zIndex: 50,
              }}
            >
              <div style={{
                padding: '1rem',
                backgroundColor: isDark ? '#1B2232' : '#F8FAFC',
                borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0'
              }}>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--atmos-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>Signed in as</p>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.95rem', color: 'var(--atmos-dark)', fontWeight: 600 }}>{user?.name}</p>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.68rem', color: 'var(--atmos-muted)', marginTop: '0.1rem', wordBreak: 'break-all' }}>{user?.email}</p>
              </div>
              <motion.button
                onClick={handleLogout}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.85rem 1rem', background: 'transparent', border: 'none',
                  cursor: 'pointer', color: '#EF4444',
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.78rem', fontWeight: 600,
                  letterSpacing: '0.04em',
                  transition: 'background 0.15s ease',
                }}
                whileHover={{ background: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.06)' }}
              >
                <LogOut style={{ width: '15px', height: '15px' }} />
                Sign out
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
