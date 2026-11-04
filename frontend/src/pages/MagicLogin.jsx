import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authAPI } from '../services/api';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

const ease = [0.25, 1, 0.5, 1];

export default function MagicLogin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithSession } = useAuth();
  const { isDark } = useTheme();

  const token = searchParams.get('token');
  const redirect = searchParams.get('redirect');

  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (attemptedRef.current) return;
    attemptedRef.current = true;

    if (!token) {
      setStatus('error');
      setErrorMsg('No secure access token found in this link. Please use the original link from your email.');
      return;
    }

    const authenticate = async () => {
      try {
        const res = await authAPI.magicLogin({ token });
        const data = res.data;
        setUserProfile(data.user);
        setStatus('success');

        // Log the user in to AuthContext & localStorage
        loginWithSession(data);

        // Determine destination: redirect param, or trip page, or dashboard
        const destination = redirect || (data.tripId ? `/trip/${data.tripId}` : '/dashboard');

        setTimeout(() => {
          navigate(destination, { replace: true });
        }, 800);
      } catch (err) {
        setStatus('error');
        setErrorMsg(
          err.response?.data?.message ||
          'This one-click access link is invalid or has expired. Please sign in manually via OTP.'
        );
      }
    };

    authenticate();
  }, [token, redirect, loginWithSession, navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      backgroundColor: 'var(--atmos-bg)'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: isDark ? '#141A26' : '#FFFFFF',
          borderRadius: '1.25rem',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #E2E8F0',
          boxShadow: isDark
            ? '0 24px 64px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            : '0 24px 64px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.04)',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem', marginBottom: '1.75rem' }}>
          <img
            src="/travello-mark.png"
            alt="Travello"
            style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
          />
          <div style={{ textAlign: 'left' }}>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '1.15rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--atmos-dark)',
              lineHeight: 1.1
            }}>
              Travello
            </div>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '0.58rem',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--atmos-gold)',
              lineHeight: 1
            }}>
              Corporate Travel Management
            </div>
          </div>
        </div>

        {/* State Content */}
        {status === 'verifying' && (
          <div>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              backgroundColor: 'var(--atmos-accent-subtle)',
              border: '1px solid var(--atmos-gold)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <Loader2 style={{ width: '26px', height: '26px', color: 'var(--atmos-gold)', animation: 'spin 1s linear infinite' }} />
            </div>
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--atmos-dark)',
              margin: '0 0 0.5rem',
              letterSpacing: '-0.02em'
            }}>
              Authenticating Access...
            </h2>
            <p style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '0.78rem',
              color: 'var(--atmos-muted)',
              lineHeight: 1.6,
              margin: 0
            }}>
              Verifying your unique travel link token and signing into your dashboard. Please hold on.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              backgroundColor: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <CheckCircle style={{ width: '28px', height: '28px', color: '#22C55E' }} />
            </div>
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--atmos-dark)',
              margin: '0 0 0.5rem',
              letterSpacing: '-0.02em'
            }}>
              Authenticated Successfully!
            </h2>
            <p style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '0.78rem',
              color: 'var(--atmos-muted)',
              lineHeight: 1.6,
              margin: '0 0 1rem'
            }}>
              Welcome back, <strong style={{ color: 'var(--atmos-dark)' }}>{userProfile?.name}</strong>. Opening your trip & dashboard now...
            </p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              fontSize: '0.68rem', color: '#22C55E', fontWeight: 600,
              letterSpacing: '0.04em', textTransform: 'uppercase'
            }}>
              <ShieldCheck style={{ width: '14px', height: '14px' }} />
              Secure 1-Click Access Verified
            </div>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <XCircle style={{ width: '28px', height: '28px', color: '#EF4444' }} />
            </div>
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--atmos-dark)',
              margin: '0 0 0.5rem',
              letterSpacing: '-0.02em'
            }}>
              Link Expired or Invalid
            </h2>
            <p style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '0.78rem',
              color: 'var(--atmos-muted)',
              lineHeight: 1.6,
              margin: '0 0 1.5rem'
            }}>
              {errorMsg}
            </p>
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                width: '100%',
                padding: '0.75rem 1.25rem',
                borderRadius: '0.75rem',
                backgroundColor: 'var(--atmos-accent-grad)',
                color: '#FFFFFF',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '0.8rem',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 4px 16px var(--atmos-accent-glow)'
              }}
            >
              Go to Standard Login <ArrowRight style={{ width: '15px', height: '15px' }} />
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}

