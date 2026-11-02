import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Plane, LogOut, ChevronDown, Sun, Moon } from 'lucide-react';
import { useState } from 'react';

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
    <Link to={to}>
      <motion.span
        style={{
          display: 'inline-block', padding: '0.35rem 0.9rem',
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
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [scrolled,  setScrolled]  = useState(false);
  const [profileHovered, setProfileHovered] = useState(false);
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
          whileHover={{ opacity: 0.85 }}
        >
          <motion.div
            style={{
              width: scrolled ? '32px' : '38px', height: scrolled ? '32px' : '38px',
              borderRadius: '10px',
              background: 'var(--atmos-accent-grad)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isDark ? '0 4px 12px rgba(196,162,93,0.35)' : '0 4px 12px rgba(37,99,235,0.35)',
              transition: 'all 0.4s cubic-bezier(0.25,1,0.5,1)',
              flexShrink: 0,
            }}
          >
            <Plane style={{ color: '#fff', width: scrolled ? '15px' : '18px', height: scrolled ? '15px' : '18px', transition: 'all 0.4s ease' }} />
          </motion.div>
          <div>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: scrolled ? '1.1rem' : '1.3rem',
              fontWeight: 400, letterSpacing: '-0.02em',
              color: 'var(--atmos-dark)', lineHeight: 1.1,
              transition: 'font-size 0.4s ease',
            }}>
              AeroSync
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
        {(user?.role === 'manager' || user?.role === 'admin') && <NavLink to="/manager">Approvals</NavLink>}
        {(user?.role === 'finance' || user?.role === 'admin') && <NavLink to="/finance">Finance</NavLink>}
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
              background: profileHovered ? '#FFFFFF' : 'var(--atmos-glass)',
              border: profileHovered ? '1px solid #FFFFFF' : '1px solid rgba(196,162,93,0.2)',
              boxShadow: profileHovered ? '0 8px 24px rgba(0,0,0,0.15)' : 'none',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
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
              fontWeight: 500, color: '#fff', flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', fontWeight: 500, color: profileHovered ? '#000000' : 'var(--atmos-dark)', lineHeight: 1.2, transition: 'color 0.2s ease' }}>
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
              <ChevronDown style={{ width: '14px', height: '14px', color: profileHovered ? '#000000' : 'var(--atmos-muted)', transition: 'color 0.2s ease' }} />
            </motion.div>
          </motion.button>

          {/* Dropdown */}
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                width: '210px', borderRadius: '1rem',
                background: 'var(--atmos-glass)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(196,162,93,0.2)',
                boxShadow: '0 16px 48px rgba(44,43,41,0.12)',
                overflow: 'hidden', zIndex: 50,
              }}
            >
              <div style={{ padding: '1rem', borderBottom: '1px solid rgba(196,162,93,0.1)' }}>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--atmos-muted)', marginBottom: '0.25rem' }}>Signed in as</p>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1rem', color: 'var(--atmos-dark)', fontWeight: 400 }}>{user?.name}</p>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.68rem', color: 'var(--atmos-muted)' }}>{user?.email}</p>
              </div>
              <motion.button
                onClick={handleLogout}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.8rem 1rem', background: 'none', border: 'none',
                  cursor: 'pointer', color: '#C0392B',
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.75rem', fontWeight: 500,
                  letterSpacing: '0.06em',
                }}
                whileHover={{ background: 'rgba(192,57,43,0.05)' }}
              >
                <LogOut style={{ width: '14px', height: '14px' }} />
                Sign out
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.header>
  );
}
