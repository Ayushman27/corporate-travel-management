import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, Building2, Users, Eye, EyeOff, Loader2,
  ArrowRight, ArrowLeft, FileSpreadsheet, ShieldCheck, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

const ease = [0.25, 1, 0.5, 1];

const cardVariants = {
  initial: { opacity: 0, y: 24, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease } },
  exit:    { opacity: 0, y: -16, scale: 0.97, transition: { duration: 0.3, ease } },
};

export default function Login() {
  const { employeeLogin, adminLogin, registerCompany, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (user) navigate('/dashboard'); }, [user, navigate]);

  const [view, setView] = useState('choose');

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          style={{ textAlign: 'center', marginBottom: '2rem' }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '64px', height: '64px', borderRadius: '18px',
              background: 'linear-gradient(135deg, #C4A25D 0%, #B8923F 100%)',
              boxShadow: '0 12px 32px rgba(196,162,93,0.35)',
              marginBottom: '1rem',
            }}
          >
            <Plane style={{ color: '#fff', width: '28px', height: '28px' }} />
          </motion.div>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '2.2rem', fontWeight: 400,
            color: 'var(--atmos-dark)', letterSpacing: '-0.02em', lineHeight: 1.1,
          }}>
            AeroSync
          </h1>
          <p style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '0.68rem', letterSpacing: '0.15em',
            textTransform: 'uppercase', color: 'var(--atmos-muted)',
            marginTop: '0.4rem',
          }}>
            Corporate Travel Management
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {view === 'choose'   && <RoleChooser key="choose" onSelect={setView} />}
          {view === 'employee' && <EmployeeLoginForm key="employee" onBack={() => setView('choose')} loginFn={employeeLogin} navigate={navigate} />}
          {view === 'admin'    && <AdminLoginForm    key="admin"    onBack={() => setView('choose')} loginFn={adminLogin}    navigate={navigate} />}
          {view === 'register' && <CompanyRegisterForm key="register" onBack={() => setView('choose')} registerFn={registerCompany} navigate={navigate} />}
        </AnimatePresence>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{
            textAlign: 'center',
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '0.6rem', letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'rgba(168,164,160,0.6)',
            marginTop: '1.5rem',
          }}
        >
          AI-Powered Multi-Agent Travel System
        </motion.p>
      </div>
    </div>
  );
}

// ── Glass card wrapper ─────────────────────────────────────────────────────────
function GlassCard({ children }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        background: 'var(--atmos-glass)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(196,162,93,0.2)',
        borderRadius: '1.25rem',
        padding: '2rem',
        boxShadow: '0 24px 64px rgba(44,43,41,0.1), 0 4px 16px rgba(196,162,93,0.08)',
      }}
    >
      {children}
    </motion.div>
  );
}

// ── Shared input style ─────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '0.65rem 0.9rem',
  borderRadius: '0.65rem',
  border: '1px solid rgba(196,162,93,0.25)',
  background: 'var(--atmos-input-bg)',
  fontFamily: 'Montserrat, sans-serif',
  fontSize: '0.82rem', color: 'var(--atmos-dark)',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
};

const labelStyle = {
  display: 'block',
  fontFamily: 'Montserrat, sans-serif',
  fontSize: '0.65rem', fontWeight: 600,
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--atmos-mid)', marginBottom: '0.4rem',
};

function GoldButton({ children, onClick, type = 'button', disabled = false, style = {} }) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.015, boxShadow: '0 8px 24px rgba(196,162,93,0.35)' } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '0.5rem', padding: '0.75rem 1.5rem',
        borderRadius: '0.75rem',
        background: disabled
          ? 'rgba(196,162,93,0.3)'
          : 'linear-gradient(135deg, #C4A25D 0%, #B8923F 100%)',
        border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'Montserrat, sans-serif',
        fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: '#fff',
        boxShadow: disabled ? 'none' : '0 4px 16px rgba(196,162,93,0.25)',
        transition: 'background 0.2s ease',
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
}

function OutlineButton({ children, onClick, style = {} }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ background: 'rgba(196,162,93,0.08)' }}
      whileTap={{ scale: 0.97 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.45rem 0.85rem', borderRadius: '0.6rem',
        background: 'transparent',
        border: '1px solid rgba(196,162,93,0.3)',
        cursor: 'pointer', fontFamily: 'Montserrat, sans-serif',
        fontSize: '0.72rem', fontWeight: 500, color: 'var(--atmos-mid)',
        ...style,
      }}
    >
      {children}
    </motion.button>
  );
}

function ErrorBanner({ message, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        marginBottom: '1rem', padding: '0.75rem 1rem',
        borderRadius: '0.75rem',
        background: 'rgba(192,57,43,0.06)',
        border: '1px solid rgba(192,57,43,0.2)',
        fontFamily: 'Montserrat, sans-serif',
        fontSize: '0.75rem', color: '#C0392B',
      }}
    >
      {message}
      {children}
    </motion.div>
  );
}

// ── Role Chooser ──────────────────────────────────────────────────────────────
function RoleChooser({ onSelect }) {
  const choices = [
    {
      key: 'employee',
      icon: Users,
      title: 'Employee Login',
      sub: 'Registered employee — login with email only',
      accent: '#C4A25D',
      bg: 'rgba(196,162,93,0.08)',
      border: 'rgba(196,162,93,0.3)',
    },
    {
      key: 'admin',
      icon: ShieldCheck,
      title: 'Company Admin',
      sub: 'Company head — email and password',
      accent: '#27AE60',
      bg: 'rgba(39,174,96,0.08)',
      border: 'rgba(39,174,96,0.3)',
    },
  ];

  return (
    <GlassCard>
      <h2 style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '1.5rem', fontWeight: 400,
        color: 'var(--atmos-dark)', textAlign: 'center', marginBottom: '0.25rem',
      }}>
        Welcome
      </h2>
      <p style={{
        fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem',
        color: 'var(--atmos-muted)', textAlign: 'center', marginBottom: '1.75rem',
      }}>
        How would you like to proceed?
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {choices.map(({ key, icon: Icon, title, sub, accent, bg, border }, i) => (
          <motion.button
            key={key}
            onClick={() => onSelect(key)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 + 0.1, duration: 0.4, ease }}
            whileHover={{ background: bg, borderColor: border, x: 2 }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '0.9rem 1rem', borderRadius: '0.85rem',
              border: `1px solid rgba(196,162,93,0.15)`,
              background: 'var(--atmos-input-bg)', cursor: 'pointer',
              transition: 'all 0.2s ease', textAlign: 'left',
            }}
          >
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: bg, border: `1px solid ${border}`,
            }}>
              <Icon style={{ width: '18px', height: '18px', color: accent }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', fontWeight: 600, color: 'var(--atmos-dark)' }}>{title}</p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: 'var(--atmos-muted)', marginTop: '0.1rem' }}>{sub}</p>
            </div>
            <ArrowRight style={{ width: '16px', height: '16px', color: '#C4A25D', flexShrink: 0 }} />
          </motion.button>
        ))}

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '0.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(196,162,93,0.15)' }} />
          <span style={{
            padding: '0 0.85rem',
            fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem',
            letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FFFFFF',
            fontWeight: 500,
          }}>
            or
          </span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(196,162,93,0.15)' }} />
        </div>

        <motion.button
          onClick={() => onSelect('register')}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4, ease }}
          whileHover={{ background: 'rgba(196,162,93,0.06)', borderColor: 'rgba(196,162,93,0.4)', x: 2 }}
          whileTap={{ scale: 0.98 }}
          style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            padding: '0.9rem 1rem', borderRadius: '0.85rem',
            border: '1.5px dashed rgba(196,162,93,0.3)',
            background: 'transparent', cursor: 'pointer',
            transition: 'all 0.2s ease', textAlign: 'left',
          }}
        >
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(196,162,93,0.08)', border: '1px solid rgba(196,162,93,0.25)',
          }}>
            <Building2 style={{ width: '18px', height: '18px', color: '#C4A25D' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.82rem', fontWeight: 600, color: 'var(--atmos-dark)' }}>Register New Company</p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem', color: 'var(--atmos-muted)', marginTop: '0.1rem' }}>Company head — set up your organisation</p>
          </div>
          <ArrowRight style={{ width: '16px', height: '16px', color: '#C4A25D', flexShrink: 0 }} />
        </motion.button>
      </div>
    </GlassCard>
  );
}

// ── Employee Login ─────────────────────────────────────────────────────────────
function EmployeeLoginForm({ onBack, loginFn, navigate }) {
  const [email,      setEmail]      = useState('');
  const [companyId,  setCompanyId]  = useState('');
  const [companies,  setCompanies]  = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [loadingCos, setLoadingCos] = useState(true);
  const [deactivatedData, setDeactivatedData] = useState(null);
  const [requiresOTP, setRequiresOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [debugOtp, setDebugOtp] = useState('');

  useEffect(() => {
    authAPI.listCompanies()
      .then(({ data }) => setCompanies(data.data || []))
      .catch(() => {})
      .finally(() => setLoadingCos(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setDeactivatedData(null);
    if (!companyId) { setError('Please select your company'); return; }
    if (requiresOTP && (!otp || otp.length < 4)) { setError('Please enter the 4-digit OTP'); return; }
    
    setLoading(true);
    try {
      const res = await loginFn(email, companyId, requiresOTP ? otp : undefined);
      if (res?.requiresOTP) {
        setRequiresOTP(true);
        if (res.debugOtp) {
          setOtp(res.debugOtp);
          setDebugOtp(res.debugOtp);
          toast.success(`OTP generated: ${res.debugOtp}`);
        } else {
          toast.success(res.message || 'OTP sent to your email');
        }
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.response?.data?.deactivated) setDeactivatedData(err.response.data);
      setError(err.response?.data?.message || 'Login failed — please try again');
    } finally { setLoading(false); }
  };

  const handleRequestReactivation = async () => {
    try {
      const res = await authAPI.requestReactivation({ email: deactivatedData.email, companyId: deactivatedData.companyId });
      toast.success(res.data.message || 'Reactivation request sent.');
      setDeactivatedData(null); setError('');
    } catch (err) { setError(err.response?.data?.message || 'Failed to send request.'); }
  };

  return (
    <GlassCard>
      <OutlineButton onClick={onBack} style={{ marginBottom: '1.25rem' }}>
        <ArrowLeft style={{ width: '13px', height: '13px' }} /> Back
      </OutlineButton>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.5rem' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(196,162,93,0.1)', border: '1px solid rgba(196,162,93,0.25)',
        }}>
          <Users style={{ width: '20px', height: '20px', color: '#C4A25D' }} />
        </div>
        <div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', fontWeight: 400, color: 'var(--atmos-dark)' }}>Employee Login</h2>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: 'var(--atmos-muted)' }}>No password required — just your email</p>
        </div>
      </div>

      {error && (
        <ErrorBanner message={error}>
          {deactivatedData && (
            <motion.button
              type="button" onClick={handleRequestReactivation}
              whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.97 }}
              style={{
                display: 'block', marginTop: '0.5rem',
                fontFamily: 'Montserrat, sans-serif', fontSize: '0.68rem',
                fontWeight: 600, color: '#C0392B', background: 'none',
                border: 'none', cursor: 'pointer', padding: 0,
                textDecoration: 'underline',
              }}
            >
              Request Reactivation
            </motion.button>
          )}
        </ErrorBanner>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>Company</label>
          {loadingCos ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'Montserrat', fontSize: '0.75rem', color: '#A8A4A0', padding: '0.5rem 0' }}>
              <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} /> Loading companies…
            </div>
          ) : companies.length === 0 ? (
            <p style={{ fontFamily: 'Montserrat', fontSize: '0.72rem', color: '#8B6914', background: 'rgba(196,162,93,0.08)', padding: '0.75rem', borderRadius: '0.6rem' }}>
              No companies registered yet. Ask your admin to register first.
            </p>
          ) : (
            <div style={{ position: 'relative' }}>
              <select
                style={{ ...inputStyle, appearance: 'none', paddingRight: '2.5rem' }}
                value={companyId}
                onChange={e => setCompanyId(e.target.value)}
                required
              >
                <option value="">Select your company…</option>
                {companies.map(c => (
                  <option key={c.companyId} value={c.companyId}>{c.companyName}</option>
                ))}
              </select>
              <ChevronDown style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--atmos-muted)', pointerEvents: 'none' }} />
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>Email Address</label>
          <input
            type="email" style={inputStyle}
            placeholder="you@company.com"
            value={email} onChange={e => setEmail(e.target.value)}
            required autoFocus
          />
          <p style={{ fontFamily: 'Montserrat', fontSize: '0.6rem', color: 'var(--atmos-muted)', marginTop: '0.35rem' }}>
            Must match your email in company HRMS records
          </p>
        </div>

        {requiresOTP && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ overflow: 'hidden' }}>
            <label style={labelStyle}>Enter 4-Digit OTP</label>
            <input
              type="text" style={{ ...inputStyle, textAlign: 'center', letterSpacing: '0.2em', fontSize: '1rem', fontWeight: 600 }}
              placeholder="••••"
              maxLength={4}
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              required
            />
            {debugOtp ? (
              <div style={{ marginTop: '0.6rem', padding: '0.6rem 0.8rem', background: 'rgba(196,162,93,0.12)', border: '1px solid rgba(196,162,93,0.3)', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ fontFamily: 'Montserrat', fontSize: '0.72rem', color: '#E8D5B5', margin: 0 }}>
                  ⚡ Auto-filled OTP: <strong style={{ color: '#C4A25D', fontSize: '0.95rem', letterSpacing: '2px' }}>{debugOtp}</strong>
                </p>
                <p style={{ fontFamily: 'Montserrat', fontSize: '0.6rem', color: '#A8A4A0', marginTop: '0.25rem', marginBottom: 0 }}>
                  (SMTP not configured on Render — auto-filled for instant login)
                </p>
              </div>
            ) : (
              <p style={{ fontFamily: 'Montserrat', fontSize: '0.65rem', color: '#27AE60', marginTop: '0.35rem', textAlign: 'center' }}>
                OTP sent to {email}. Please check your inbox.
              </p>
            )}
          </motion.div>
        )}

        <GoldButton type="submit" disabled={loading || companies.length === 0 || (requiresOTP && otp.length < 4)}>
          {loading ? <><Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} /> Processing…</> : requiresOTP ? 'Verify & Login' : 'Send OTP'}
        </GoldButton>
      </form>
    </GlassCard>
  );
}

// ── Admin Login ────────────────────────────────────────────────────────────────
function AdminLoginForm({ onBack, loginFn, navigate }) {
  const [mode,           setMode]           = useState('password'); // 'password' | 'otp'
  const [email,          setEmail]          = useState('');
  const [password,       setPassword]       = useState('');
  const [showPwd,        setShowPwd]        = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');
  const [deactivatedData, setDeactivatedData] = useState(null);
  const [requiresOTP,    setRequiresOTP]    = useState(false);
  const [otp,            setOtp]            = useState('');
  const [debugOtp,       setDebugOtp]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setDeactivatedData(null);
    if (!email) { setError('Email is required'); return; }

    if (mode === 'otp') {
      if (requiresOTP && (!otp || otp.length < 4)) {
        setError('Please enter the 4-digit OTP');
        return;
      }
    } else {
      if (!password) {
        setError('Password is required');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'otp') {
        const res = await loginFn(email, undefined, requiresOTP ? otp : undefined);
        if (res?.requiresOTP) {
          setRequiresOTP(true);
          if (res.debugOtp) {
            setOtp(res.debugOtp);
            setDebugOtp(res.debugOtp);
            toast.success(`Admin OTP: ${res.debugOtp}`);
          } else {
            toast.success(res.message || 'OTP sent to your email');
          }
        } else {
          navigate('/dashboard');
        }
      } else {
        await loginFn(email, password);
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.response?.data?.deactivated) setDeactivatedData(err.response.data);
      setError(err.response?.data?.message || 'Login failed — please try again');
    } finally { setLoading(false); }
  };

  const handleReactivate = async () => {
    try {
      const res = await authAPI.reactivateAdmin({ email, password });
      toast.success(res.data.message || 'Account reactivated. You may now log in.');
      setDeactivatedData(null); setError('');
    } catch (err) { setError(err.response?.data?.message || 'Failed to reactivate.'); }
  };

  return (
    <GlassCard>
      <OutlineButton onClick={onBack} style={{ marginBottom: '1.25rem' }}>
        <ArrowLeft style={{ width: '13px', height: '13px' }} /> Back
      </OutlineButton>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(39,174,96,0.1)', border: '1px solid rgba(39,174,96,0.25)',
        }}>
          <ShieldCheck style={{ width: '20px', height: '20px', color: '#27AE60' }} />
        </div>
        <div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', fontWeight: 400, color: 'var(--atmos-dark)' }}>Company Admin</h2>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: 'var(--atmos-muted)' }}>Login with password or one-time code</p>
        </div>
      </div>

      {/* Mode Switcher */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '3px', marginBottom: '1.25rem', border: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          type="button"
          onClick={() => { setMode('password'); setError(''); setRequiresOTP(false); }}
          style={{
            flex: 1, padding: '0.45rem', borderRadius: '6px',
            fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s',
            background: mode === 'password' ? 'rgba(196,162,93,0.2)' : 'transparent',
            color: mode === 'password' ? '#C4A25D' : 'var(--atmos-muted)',
            border: mode === 'password' ? '1px solid rgba(196,162,93,0.4)' : '1px solid transparent'
          }}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => { setMode('otp'); setError(''); }}
          style={{
            flex: 1, padding: '0.45rem', borderRadius: '6px',
            fontFamily: 'Montserrat, sans-serif', fontSize: '0.72rem', fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s',
            background: mode === 'otp' ? 'rgba(196,162,93,0.2)' : 'transparent',
            color: mode === 'otp' ? '#C4A25D' : 'var(--atmos-muted)',
            border: mode === 'otp' ? '1px solid rgba(196,162,93,0.4)' : '1px solid transparent'
          }}
        >
          Email OTP
        </button>
      </div>

      {error && (
        <ErrorBanner message={error}>
          {deactivatedData && (
            <motion.button type="button" onClick={handleReactivate} whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.97 }}
              style={{ display: 'block', marginTop: '0.5rem', fontFamily: 'Montserrat', fontSize: '0.68rem', fontWeight: 600, color: '#C0392B', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
            >
              Reactivate Account
            </motion.button>
          )}
        </ErrorBanner>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>Admin Email Address</label>
          <input type="email" style={inputStyle} placeholder="admin@company.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
        </div>

        {mode === 'password' ? (
          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: '2.75rem' }}
                placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required
              />
              <button type="button" onClick={() => setShowPwd(s => !s)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#A8A4A0', padding: 0 }}>
                {showPwd ? <EyeOff style={{ width: '15px', height: '15px' }} /> : <Eye style={{ width: '15px', height: '15px' }} />}
              </button>
            </div>
          </div>
        ) : (
          requiresOTP && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ overflow: 'hidden' }}>
              <label style={labelStyle}>Enter 4-Digit Admin OTP</label>
              <input
                type="text" style={{ ...inputStyle, textAlign: 'center', letterSpacing: '0.25em', fontSize: '1.2rem', fontWeight: 700 }}
                placeholder="••••"
                maxLength={4}
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                required
              />
              {debugOtp ? (
                <div style={{ marginTop: '0.6rem', padding: '0.6rem 0.8rem', background: 'rgba(196,162,93,0.12)', border: '1px solid rgba(196,162,93,0.3)', borderRadius: '8px', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'Montserrat', fontSize: '0.72rem', color: '#E8D5B5', margin: 0 }}>
                    ⚡ Auto-filled OTP: <strong style={{ color: '#C4A25D', fontSize: '0.95rem', letterSpacing: '2px' }}>{debugOtp}</strong>
                  </p>
                </div>
              ) : (
                <p style={{ fontFamily: 'Montserrat', fontSize: '0.65rem', color: '#27AE60', marginTop: '0.35rem', textAlign: 'center' }}>
                  Admin OTP sent to {email}. Please check your inbox.
                </p>
              )}
            </motion.div>
          )
        )}

        <GoldButton type="submit" disabled={loading || (mode === 'otp' && requiresOTP && otp.length < 4)}>
          {loading ? (
            <><Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} /> Processing…</>
          ) : mode === 'password' ? (
            'Sign In'
          ) : requiresOTP ? (
            'Verify & Sign In'
          ) : (
            'Send Admin OTP'
          )}
        </GoldButton>
      </form>
    </GlassCard>
  );
}

// ── Company Registration ───────────────────────────────────────────────────────
function CompanyRegisterForm({ onBack, registerFn, navigate }) {
  const [form, setForm] = useState({
    companyName: '', headName: '', headEmail: '', headPassword: '',
    hrmsSheetUrl: '', financeSheetUrl: '',
    policy: {
      budgetLimits: { employee: 50000, manager: 150000, finance: 150000, admin: 500000 },
      minAdvanceNoticeDays: 2, maxTripDurationDays: 30,
    }
  });
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setPolicy = (key, val) => setForm(f => ({ ...f, policy: { ...f.policy, [key]: val } }));
  const setBudget = (key, val) => setForm(f => ({ ...f, policy: { ...f.policy, budgetLimits: { ...f.policy.budgetLimits, [key]: Number(val) } } }));

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try { await registerFn(form); navigate('/dashboard'); }
    catch (err) { setError(err.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  return (
    <GlassCard>
      <OutlineButton onClick={onBack} style={{ marginBottom: '1.25rem' }}>
        <ArrowLeft style={{ width: '13px', height: '13px' }} /> Back
      </OutlineButton>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(196,162,93,0.1)', border: '1px solid rgba(196,162,93,0.25)' }}>
          <Building2 style={{ width: '20px', height: '20px', color: '#C4A25D' }} />
        </div>
        <div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', fontWeight: 400, color: 'var(--atmos-dark)' }}>Register Company</h2>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '0.65rem', color: 'var(--atmos-muted)' }}>Step {step} of 3</p>
        </div>
      </div>

      {/* Step progress */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem' }}>
        {[1, 2, 3].map(s => (
          <motion.div
            key={s}
            animate={{ background: s <= step ? '#C4A25D' : 'rgba(196,162,93,0.15)' }}
            transition={{ duration: 0.3 }}
            style={{ flex: 1, height: '4px', borderRadius: '999px' }}
          />
        ))}
      </div>

      {error && <ErrorBanner message={error} />}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" variants={cardVariants} initial="initial" animate="animate" exit="exit" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: 'Company Name', key: 'companyName', placeholder: 'Acme Corp', type: 'text' },
              { label: 'Your Name (Company Head)', key: 'headName', placeholder: 'John Doe', type: 'text' },
              { label: 'Your Email', key: 'headEmail', placeholder: 'admin@acme.com', type: 'email' },
              { label: 'Password (min 6 chars)', key: 'headPassword', placeholder: '••••••••', type: 'password' },
            ].map(({ label, key, placeholder, type }) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input type={type} style={inputStyle} placeholder={placeholder} value={form[key]} onChange={e => set(key, e.target.value)} />
              </div>
            ))}
            <GoldButton onClick={() => {
              if (form.companyName && form.headName && form.headEmail && form.headPassword.length >= 6) { setError(''); setStep(2); }
              else setError('Please fill all fields (password ≥ 6 chars)');
            }}>
              Next — Link Spreadsheets <ArrowRight style={{ width: '14px', height: '14px' }} />
            </GoldButton>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" variants={cardVariants} initial="initial" animate="animate" exit="exit" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(196,162,93,0.06)', border: '1px solid rgba(196,162,93,0.2)', fontFamily: 'Montserrat', fontSize: '0.7rem', color: '#8B6914' }}>
              <strong>📋 Make sheets publicly accessible:</strong> Share → Anyone with link → Viewer
            </div>
            {[
              { label: 'HRMS / Employee Data Sheet', key: 'hrmsSheetUrl', icon: FileSpreadsheet, color: '#27AE60', hint: 'Columns: EmployeeID, Name, Email, Department, Role, ManagerID, TravelBudget, TravelBudgetUsed' },
              { label: 'Finance / Budget Data Sheet', key: 'financeSheetUrl', icon: FileSpreadsheet, color: '#C4A25D', hint: 'Columns: Month, Department, AllocatedBudget, SpentAmount' },
            ].map(({ label, key, icon: Icon, color, hint }) => (
              <div key={key}>
                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Icon style={{ width: '12px', height: '12px', color }} /> {label}
                </label>
                <input style={inputStyle} placeholder="https://docs.google.com/spreadsheets/d/..." value={form[key]} onChange={e => set(key, e.target.value)} />
                <p style={{ fontFamily: 'Montserrat', fontSize: '0.6rem', color: 'var(--atmos-muted)', marginTop: '0.3rem' }}>{hint}</p>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <OutlineButton onClick={() => setStep(1)} style={{ flex: 1, justifyContent: 'center', padding: '0.65rem 1rem' }}><ArrowLeft style={{ width: '13px', height: '13px' }} /> Back</OutlineButton>
              <GoldButton onClick={() => { if (form.hrmsSheetUrl && form.financeSheetUrl) { setError(''); setStep(3); } else setError('Both sheet URLs required'); }} style={{ flex: 2 }}>
                Next — Set Policy <ArrowRight style={{ width: '14px', height: '14px' }} />
              </GoldButton>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" variants={cardVariants} initial="initial" animate="animate" exit="exit" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontFamily: 'Montserrat', fontSize: '0.72rem', color: 'var(--atmos-mid)' }}>Set travel policy limits (changeable later).</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { key: 'employee', label: 'Employee Budget (₹)' },
                { key: 'manager',  label: 'Manager Budget (₹)' },
                { key: 'finance',  label: 'Finance Budget (₹)' },
                { key: 'admin',    label: 'Admin Budget (₹)' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label style={{ ...labelStyle, fontSize: '0.58rem' }}>{label}</label>
                  <input style={inputStyle} type="number" value={form.policy.budgetLimits[key]} onChange={e => setBudget(key, e.target.value)} />
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { key: 'minAdvanceNoticeDays', label: 'Min Advance (days)' },
                { key: 'maxTripDurationDays',  label: 'Max Duration (days)' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label style={{ ...labelStyle, fontSize: '0.58rem' }}>{label}</label>
                  <input style={inputStyle} type="number" value={form.policy[key]} onChange={e => setPolicy(key, Number(e.target.value))} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <OutlineButton onClick={() => setStep(2)} style={{ flex: 1, justifyContent: 'center', padding: '0.65rem 1rem' }}><ArrowLeft style={{ width: '13px', height: '13px' }} /> Back</OutlineButton>
              <GoldButton onClick={handleSubmit} disabled={loading} style={{ flex: 2 }}>
                {loading ? <><Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} /> Registering…</> : <><Building2 style={{ width: '14px', height: '14px' }} /> Register Company</>}
              </GoldButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
