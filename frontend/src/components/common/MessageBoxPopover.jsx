import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { tripAPI } from '../../services/api';
import {
  MessageSquare, CheckCircle, XCircle, Clock,
  ArrowRight, ExternalLink, CheckCheck, X, Shield, DollarSign
} from 'lucide-react';
import { format } from 'date-fns';

const ease = [0.25, 1, 0.5, 1];

export default function MessageBoxPopover({ isOpen, onClose, onUnreadChange }) {
  const { isDark } = useTheme();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'approved' | 'rejected'
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
      const list = res.data?.data || [];
      setMessages(list);

      const unread = list.filter(m => !readIds.includes(m.id)).length;
      if (onUnreadChange) onUnreadChange(unread);
    } catch {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen]);

  // Initial fetch for unread badge
  useEffect(() => {
    fetchMessages();
  }, []);

  const markAllRead = () => {
    const allIds = messages.map(m => m.id);
    setReadIds(allIds);
    localStorage.setItem('ctm_read_messages', JSON.stringify(allIds));
    if (onUnreadChange) onUnreadChange(0);
  };

  const markSingleRead = (id) => {
    if (!readIds.includes(id)) {
      const next = [...readIds, id];
      setReadIds(next);
      localStorage.setItem('ctm_read_messages', JSON.stringify(next));
      const unread = messages.filter(m => !next.includes(m.id)).length;
      if (onUnreadChange) onUnreadChange(unread);
    }
  };

  const filteredMessages = messages.filter(m => {
    if (filter === 'approved') return m.status === 'approved';
    if (filter === 'rejected') return m.status === 'rejected';
    return true;
  });

  const unreadCount = messages.filter(m => !readIds.includes(m.id)).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 48 }}
      />

      {/* Popover Card */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.97 }}
        transition={{ duration: 0.22, ease }}
        style={{
          position: 'absolute',
          top: 'calc(100% + 10px)',
          left: 0,
          width: '460px',
          maxWidth: '92vw',
          maxHeight: '560px',
          backgroundColor: isDark ? '#161D2B' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #E2E8F0',
          borderRadius: '1.2rem',
          boxShadow: isDark
            ? '0 24px 64px -8px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            : '0 24px 64px -8px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(15, 23, 42, 0.04)',
          overflow: 'hidden',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1rem 1.25rem',
          backgroundColor: isDark ? '#1B2232' : '#F8FAFC',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              backgroundColor: 'var(--atmos-accent-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--atmos-gold)'
            }}>
              <MessageSquare style={{ width: '16px', height: '16px', color: 'var(--atmos-gold)' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '0.95rem', fontWeight: 700,
                  color: 'var(--atmos-dark)', margin: 0
                }}>
                  Decision Messages
                </h3>
                {unreadCount > 0 && (
                  <span style={{
                    padding: '0.15rem 0.5rem', borderRadius: '999px',
                    backgroundColor: '#EF4444', color: '#fff',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '0.62rem', fontWeight: 700
                  }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '0.65rem', color: 'var(--atmos-muted)', margin: '0.15rem 0 0'
              }}>
                Approvals & notes from Manager & Finance
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                title="Mark all as read"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  padding: '0.3rem 0.6rem', borderRadius: '0.45rem',
                  backgroundColor: 'transparent',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #CBD5E1',
                  color: 'var(--atmos-muted)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.65rem', fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <CheckCheck style={{ width: '13px', height: '13px' }} />
                Read all
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '28px', height: '28px', borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'transparent', border: 'none',
                color: 'var(--atmos-muted)', cursor: 'pointer'
              }}
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{
          display: 'flex', gap: '0.4rem', padding: '0.6rem 1.25rem',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #F1F5F9',
          backgroundColor: isDark ? '#141A26' : '#FFFFFF',
          flexShrink: 0
        }}>
          {['all', 'approved', 'rejected'].map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                style={{
                  padding: '0.3rem 0.75rem', borderRadius: '0.5rem',
                  backgroundColor: active
                    ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(37, 99, 235, 0.1)')
                    : 'transparent',
                  border: 'none',
                  color: active
                    ? (isDark ? '#FFFFFF' : '#2563EB')
                    : 'var(--atmos-muted)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '0.68rem', fontWeight: active ? 700 : 500,
                  cursor: 'pointer', textTransform: 'capitalize',
                  transition: 'all 0.15s ease'
                }}
              >
                {f} {f === 'all' && `(${messages.length})`}
              </button>
            );
          })}
        </div>

        {/* Message Items List */}
        <div style={{
          padding: '0.75rem',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--atmos-muted)' }}>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.75rem' }}>Loading messages...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--atmos-muted)' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 0.75rem'
              }}>
                <MessageSquare style={{ width: '20px', height: '20px', opacity: 0.5 }} />
              </div>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.82rem', fontWeight: 600, color: 'var(--atmos-dark)', margin: 0 }}>
                No messages found
              </p>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.7rem', color: 'var(--atmos-muted)', marginTop: '0.3rem' }}>
                When your manager or the finance team approves or rejects a trip, their notes and decisions will appear here.
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isUnread = !readIds.includes(msg.id);
              const isApproved = msg.status === 'approved';
              const isFinance = msg.approvalType === 'finance';

              return (
                <div
                  key={msg.id}
                  onClick={() => markSingleRead(msg.id)}
                  style={{
                    backgroundColor: isDark ? '#192132' : '#F8FAFC',
                    border: isUnread
                      ? (isDark ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(37, 99, 235, 0.4)')
                      : (isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0'),
                    borderRadius: '0.9rem',
                    padding: '1rem',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Unread dot */}
                  {isUnread && (
                    <div style={{
                      position: 'absolute', top: '12px', right: '12px',
                      width: '8px', height: '8px', borderRadius: '50%',
                      backgroundColor: '#3B82F6'
                    }} />
                  )}

                  {/* Top Badge & Sender */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                      padding: '0.2rem 0.55rem', borderRadius: '999px',
                      backgroundColor: isApproved ? 'rgba(39, 174, 96, 0.14)' : 'rgba(239, 68, 68, 0.14)',
                      color: isApproved ? '#22C55E' : '#EF4444',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '0.65rem', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.04em'
                    }}>
                      {isApproved ? <CheckCircle style={{ width: '12px', height: '12px' }} /> : <XCircle style={{ width: '12px', height: '12px' }} />}
                      {isFinance ? 'Finance' : 'Manager'} {isApproved ? 'Approved' : 'Rejected'}
                    </span>

                    <span style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '0.65rem', color: 'var(--atmos-muted)',
                      display: 'flex', alignItems: 'center', gap: '0.25rem'
                    }}>
                      <Clock style={{ width: '11px', height: '11px' }} />
                      {msg.decidedAt ? format(new Date(msg.decidedAt), 'dd MMM yyyy, hh:mm a') : 'Recently'}
                    </span>
                  </div>

                  {/* Reviewer line */}
                  <div style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '0.72rem', color: 'var(--atmos-muted)', marginBottom: '0.6rem'
                  }}>
                    Reviewed by <strong style={{ color: 'var(--atmos-dark)' }}>{msg.approverName}</strong> ({isFinance ? 'Finance' : 'Manager'})
                  </div>

                  {/* Attached Note / Remarks Callout Box */}
                  <div style={{
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
                    borderLeft: isApproved ? '3px solid #22C55E' : '3px solid #EF4444',
                    borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                    borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                    borderRadius: '0 8px 8px 0',
                    padding: '0.65rem 0.85rem',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em',
                      textTransform: 'uppercase', color: isApproved ? '#22C55E' : '#EF4444',
                      marginBottom: '0.2rem'
                    }}>
                      Attached Note / Reviewer Remarks
                    </div>
                    <div style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '0.76rem', color: 'var(--atmos-dark)', lineHeight: 1.4,
                      fontStyle: msg.note ? 'normal' : 'italic'
                    }}>
                      {msg.note ? `"${msg.note}"` : 'No written notes provided by the reviewer.'}
                    </div>
                  </div>

                  {/* Trip Details Sub-card */}
                  <div style={{
                    backgroundColor: isDark ? '#141A26' : '#FFFFFF',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #E2E8F0',
                    borderRadius: '0.65rem',
                    padding: '0.65rem 0.85rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: '0.78rem', fontWeight: 700, color: 'var(--atmos-dark)'
                      }}>
                        {msg.trip?.fromCity || 'Origin'} ➔ {msg.trip?.toCity || 'Destination'}
                      </span>
                      <span style={{
                        fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--atmos-muted)'
                      }}>
                        {msg.tripId}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--atmos-muted)' }}>
                      <span>
                        Date: <strong style={{ color: 'var(--atmos-dark)' }}>{msg.trip?.travelDate ? format(new Date(msg.trip.travelDate), 'dd MMM yyyy') : 'TBD'}</strong>
                      </span>
                      <span>
                        {isApproved ? (
                          <>Approved: <strong style={{ color: '#22C55E' }}>₹{Number(msg.budgetApproved || 0).toLocaleString('en-IN')}</strong></>
                        ) : (
                          <>Requested: <strong style={{ color: 'var(--atmos-dark)' }}>₹{Number(msg.budgetRequested || 0).toLocaleString('en-IN')}</strong></>
                        )}
                      </span>
                    </div>

                    {/* View trip link */}
                    <div style={{ marginTop: '0.6rem', textAlign: 'right' }}>
                      <Link
                        to={`/trip/${msg.tripId}`}
                        onClick={onClose}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontSize: '0.68rem', fontWeight: 600,
                          color: 'var(--atmos-gold)', textDecoration: 'none'
                        }}
                      >
                        View Trip Details <ArrowRight style={{ width: '12px', height: '12px' }} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '0.75rem 1.25rem',
          backgroundColor: isDark ? '#141A26' : '#F8FAFC',
          borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #E2E8F0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <Link
            to="/messages"
            onClick={onClose}
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '0.72rem', fontWeight: 600, color: 'var(--atmos-gold)',
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem'
            }}
          >
            Open Full Message Inbox <ExternalLink style={{ width: '12px', height: '12px' }} />
          </Link>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '0.65rem', color: 'var(--atmos-muted)'
          }}>
            {messages.length} total messages
          </span>
        </div>
      </motion.div>
    </>
  );
}

