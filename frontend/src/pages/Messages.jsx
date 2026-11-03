import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { tripAPI } from '../services/api';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import PageTransition from '../components/common/PageTransition';
import {
  MessageSquare, CheckCircle, XCircle, Clock,
  ArrowRight, Search, CheckCheck, Filter, Plane, Calendar, DollarSign
} from 'lucide-react';
import { format } from 'date-fns';

const ease = [0.25, 1, 0.5, 1];

export default function Messages() {
  const { isDark } = useTheme();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'approved' | 'rejected' | 'finance' | 'manager'
  const [search, setSearch] = useState('');
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ctm_read_messages') || '[]');
    } catch {
      return [];
    }
  });

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await tripAPI.getMessages();
      const data = res.data?.data || [];
      setMessages(data);

      // Auto-mark loaded messages as seen once viewed on this page
      const allIds = data.map(m => m.id);
      const prevRead = JSON.parse(localStorage.getItem('ctm_read_messages') || '[]');
      const combined = Array.from(new Set([...prevRead, ...allIds]));
      localStorage.setItem('ctm_read_messages', JSON.stringify(combined));
      setReadIds(combined);
      window.dispatchEvent(new CustomEvent('ctm_messages_read'));
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const markAllRead = () => {
    const allIds = messages.map(m => m.id);
    const prevRead = JSON.parse(localStorage.getItem('ctm_read_messages') || '[]');
    const combined = Array.from(new Set([...prevRead, ...allIds]));
    setReadIds(combined);
    localStorage.setItem('ctm_read_messages', JSON.stringify(combined));
    window.dispatchEvent(new CustomEvent('ctm_messages_read'));
  };

  const markSingleRead = (id) => {
    if (!readIds.includes(id)) {
      const next = [...readIds, id];
      setReadIds(next);
      localStorage.setItem('ctm_read_messages', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('ctm_messages_read'));
    }
  };

  const filtered = messages.filter((m) => {
    if (filter === 'approved' && m.status !== 'approved') return false;
    if (filter === 'rejected' && m.status !== 'rejected') return false;
    if (filter === 'finance' && m.approvalType !== 'finance') return false;
    if (filter === 'manager' && m.approvalType !== 'manager') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTripId = m.tripId?.toLowerCase().includes(q);
      const matchNote = m.note?.toLowerCase().includes(q);
      const matchRoute = `${m.trip?.fromCity} ${m.trip?.toCity}`.toLowerCase().includes(q);
      const matchApprover = m.approverName?.toLowerCase().includes(q);
      return matchTripId || matchNote || matchRoute || matchApprover;
    }
    return true;
  });

  const unreadCount = messages.filter(m => !readIds.includes(m.id)).length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--atmos-bg)' }}>
      <Navbar />
      <Sidebar />

      <main style={{ marginLeft: '220px', paddingTop: '68px', padding: '68px 2.5rem 2.5rem 220px' }}>
        <PageTransition>
          {/* Header */}
          <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  backgroundColor: 'var(--atmos-accent-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid var(--atmos-gold)'
                }}>
                  <MessageSquare style={{ width: '18px', height: '18px', color: 'var(--atmos-gold)' }} />
                </div>
                <h1 style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '1.85rem', fontWeight: 700,
                  color: 'var(--atmos-dark)', letterSpacing: '-0.02em', margin: 0
                }}>
                  Decision Messages
                </h1>
                {unreadCount > 0 && (
                  <span style={{
                    padding: '0.2rem 0.65rem', borderRadius: '999px',
                    backgroundColor: '#EF4444', color: '#fff',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '0.68rem', fontWeight: 700
                  }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '0.75rem', color: 'var(--atmos-muted)', margin: 0
              }}>
                Reviewer notes, approval budgets, and decisions sent by Finance and Managers for your trip requests.
              </p>
            </div>

            {/* Actions */}
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem 1rem', borderRadius: '0.65rem',
                  backgroundColor: 'var(--atmos-surface)',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #CBD5E1',
                  color: 'var(--atmos-dark)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '0.72rem', fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <CheckCheck style={{ width: '15px', height: '15px' }} />
                Mark all as read
              </button>
            )}
          </div>

          {/* Search & Filter Controls */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem',
            padding: '0.85rem 1.25rem', borderRadius: '1rem',
            backgroundColor: 'var(--atmos-surface)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid var(--atmos-glass-border)'
          }}>
            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: `All (${messages.length})` },
                { id: 'approved', label: 'Approved' },
                { id: 'rejected', label: 'Rejected' },
                { id: 'finance', label: 'Finance' },
                { id: 'manager', label: 'Manager' },
              ].map(t => {
                const active = filter === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setFilter(t.id)}
                    style={{
                      padding: '0.35rem 0.85rem', borderRadius: '0.5rem',
                      backgroundColor: active
                        ? 'var(--atmos-accent-grad)'
                        : 'transparent',
                      border: 'none',
                      color: active ? '#FFFFFF' : 'var(--atmos-muted)',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '0.72rem', fontWeight: active ? 700 : 500,
                      cursor: 'pointer', transition: 'all 0.15s ease'
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '260px', maxWidth: '100%' }}>
              <Search style={{
                position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                width: '14px', height: '14px', color: 'var(--atmos-muted)'
              }} />
              <input
                type="text"
                placeholder="Search note, city, trip ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '0.45rem 0.8rem 0.45rem 2rem',
                  borderRadius: '0.6rem',
                  backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #CBD5E1',
                  color: 'var(--atmos-dark)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '0.75rem', outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Messages List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--atmos-muted)' }}>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Loading messages...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '4.5rem 2rem',
              backgroundColor: 'var(--atmos-surface)',
              borderRadius: '1.2rem',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid var(--atmos-glass-border)'
            }}>
              <div style={{
                width: '54px', height: '54px', borderRadius: '50%',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <MessageSquare style={{ width: '26px', height: '26px', opacity: 0.5, color: 'var(--atmos-muted)' }} />
              </div>
              <h3 style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1rem',
                fontWeight: 600, color: 'var(--atmos-dark)', margin: '0 0 0.4rem'
              }}>
                No messages match your criteria
              </h3>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.75rem', color: 'var(--atmos-muted)', margin: 0 }}>
                When Finance or Manager reviewers approve or reject your trips with attached notes, they will appear right here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filtered.map((msg, idx) => {
                const isUnread = !readIds.includes(msg.id);
                const isApproved = msg.status === 'approved';
                const isFinance = msg.approvalType === 'finance';

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease, delay: idx * 0.04 }}
                    onClick={() => markSingleRead(msg.id)}
                    style={{
                      backgroundColor: 'var(--atmos-surface)',
                      border: isUnread
                        ? (isDark ? '1px solid rgba(59, 130, 246, 0.6)' : '1px solid rgba(37, 99, 235, 0.45)')
                        : (isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid var(--atmos-glass-border)'),
                      borderRadius: '1.1rem',
                      padding: '1.4rem 1.6rem',
                      position: 'relative',
                      boxShadow: isUnread
                        ? '0 8px 24px rgba(37, 99, 235, 0.08)'
                        : '0 4px 16px rgba(0, 0, 0, 0.04)',
                      cursor: 'pointer'
                    }}
                  >
                    {/* Header Row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.3rem 0.75rem', borderRadius: '999px',
                          backgroundColor: isApproved ? 'rgba(39, 174, 96, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: isApproved ? '#22C55E' : '#EF4444',
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontSize: '0.72rem', fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '0.04em'
                        }}>
                          {isApproved ? <CheckCircle style={{ width: '13px', height: '13px' }} /> : <XCircle style={{ width: '13px', height: '13px' }} />}
                          {isFinance ? 'Finance Department' : 'Manager'} {isApproved ? 'Approved' : 'Rejected'}
                        </span>

                        <span style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontSize: '0.72rem', color: 'var(--atmos-muted)',
                          display: 'flex', alignItems: 'center', gap: '0.3rem'
                        }}>
                          <Clock style={{ width: '12px', height: '12px' }} />
                          {msg.decidedAt ? format(new Date(msg.decidedAt), 'dd MMMM yyyy, hh:mm a') : 'Recently'}
                        </span>
                      </div>

                      <div style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: '0.75rem', color: 'var(--atmos-muted)'
                      }}>
                        Reviewed by <strong style={{ color: 'var(--atmos-dark)' }}>{msg.approverName}</strong>
                      </div>
                    </div>

                    {/* Attached Note / Remarks Callout Box */}
                    <div style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                      borderLeft: isApproved ? '4px solid #22C55E' : '4px solid #EF4444',
                      borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                      borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                      borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                      borderRadius: '0 10px 10px 0',
                      padding: '0.9rem 1.1rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em',
                        textTransform: 'uppercase', color: isApproved ? '#22C55E' : '#EF4444',
                        marginBottom: '0.3rem'
                      }}>
                        Reviewer Note / Decision Comments
                      </div>
                      <div style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: '0.85rem', color: 'var(--atmos-dark)', lineHeight: 1.5,
                        fontStyle: msg.note ? 'normal' : 'italic'
                      }}>
                        {msg.note ? `"${msg.note}"` : 'No written notes entered by the reviewer.'}
                      </div>
                    </div>

                    {/* Trip Details Card */}
                    <div style={{
                      backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                      borderRadius: '0.85rem',
                      padding: '1rem 1.25rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      flexWrap: 'wrap', gap: '1rem'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                          <span style={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontSize: '0.95rem', fontWeight: 700, color: 'var(--atmos-dark)'
                          }}>
                            {msg.trip?.fromCity || 'Origin'} ➔ {msg.trip?.toCity || 'Destination'}
                          </span>
                          <span style={{
                            padding: '0.15rem 0.5rem', borderRadius: '6px',
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                            fontFamily: 'monospace', fontSize: '0.68rem', color: 'var(--atmos-muted)'
                          }}>
                            {msg.tripId}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.72rem', color: 'var(--atmos-muted)' }}>
                          <span>
                            Date: <strong style={{ color: 'var(--atmos-dark)' }}>{msg.trip?.travelDate ? format(new Date(msg.trip.travelDate), 'dd MMM yyyy') : 'TBD'}</strong>
                          </span>
                          <span>
                            Mode: <strong style={{ color: 'var(--atmos-dark)', textTransform: 'capitalize' }}>{msg.trip?.travelMode || 'Mixed'}</strong>
                          </span>
                          {msg.trip?.purpose && (
                            <span>
                              Purpose: <strong style={{ color: 'var(--atmos-dark)' }}>{msg.trip.purpose}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Financials & Action Link */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.62rem', color: 'var(--atmos-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            {isApproved ? 'Approved Budget' : 'Requested Budget'}
                          </div>
                          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.25rem', fontWeight: 700, color: isApproved ? '#22C55E' : 'var(--atmos-dark)' }}>
                            ₹{Number(isApproved ? msg.budgetApproved : msg.budgetRequested).toLocaleString('en-IN')}
                          </div>
                          {isApproved && msg.budgetRequested && Number(msg.budgetRequested) !== Number(msg.budgetApproved) && (
                            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.62rem', color: 'var(--atmos-muted)' }}>
                              Requested: ₹{Number(msg.budgetRequested).toLocaleString('en-IN')}
                            </div>
                          )}
                        </div>

                        <Link
                          to={`/trip/${msg.tripId}`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.55rem 1rem', borderRadius: '0.65rem',
                            backgroundColor: 'var(--atmos-accent-grad)',
                            color: '#FFFFFF', textDecoration: 'none',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontSize: '0.72rem', fontWeight: 600,
                            boxShadow: '0 4px 12px var(--atmos-accent-glow)'
                          }}
                        >
                          View Details <ArrowRight style={{ width: '13px', height: '13px' }} />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </PageTransition>
      </main>
    </div>
  );
}

