import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tripAPI } from '../../services/api';
import { Send, Bot, User, Loader2 } from 'lucide-react';

const ease = [0.25, 1, 0.5, 1];

const SUGGESTIONS = [
  'Cheapest option',
  'Use flight instead',
  'Change travel date',
  'Fastest route',
];

export default function ChatInterface({ tripId, onTripUpdated }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hi! I'm your AI travel assistant ✨ I can help you modify your trip, change budget preferences, switch transport modes, or answer travel questions. What would you like to change?` }
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const { data } = await tripAPI.chat(tripId, msg);
      setMessages(prev => [...prev, { role: 'assistant', content: data.data.reply }]);
      if (data.data.tripUpdates) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '✅ Trip updated! Regenerating your plans with the new parameters…',
          isSystem: true,
        }]);
        // Actually trigger the parent to reload trip data + plans
        try {
          await onTripUpdated?.();
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '🔄 Plans refreshed! Check the updated options above.',
            isSystem: true,
          }]);
        } catch (_) {
          // silently ignore refresh errors
        }
      }
    } catch (_) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        isError: true,
      }]);
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      background: 'var(--atmos-glass)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(196,162,93,0.15)',
      borderRadius: '1.2rem',
      boxShadow: '0 4px 20px rgba(44,43,41,0.06)',
      display: 'flex', flexDirection: 'column',
      height: '600px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '1.1rem 1.25rem',
        borderBottom: '1px solid rgba(196,162,93,0.1)',
      }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #C4A25D 0%, #B8923F 100%)',
          boxShadow: '0 4px 12px rgba(196,162,93,0.3)',
        }}>
          <Bot style={{ width: '18px', height: '18px', color: '#fff' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.1rem', fontWeight: 400, color: 'var(--atmos-dark)' }}>
            AI Chat Agent
          </p>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.62rem', color: 'var(--atmos-muted)' }}>
            Modify your trip conversationally
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <motion.div
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#27AE60' }}
          />
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6rem', color: 'var(--atmos-muted)' }}>Online</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease }}
              style={{
                display: 'flex', gap: '0.6rem',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              }}
            >
              <div style={{
                width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #C4A25D, #B8923F)'
                  : msg.isSystem
                    ? 'rgba(39,174,96,0.12)'
                    : 'rgba(196,162,93,0.1)',
              }}>
                {msg.role === 'user'
                  ? <User style={{ width: '13px', height: '13px', color: '#fff' }} />
                  : <Bot style={{ width: '13px', height: '13px', color: msg.isSystem ? '#27AE60' : '#C4A25D' }} />
                }
              </div>
              <div style={{
                maxWidth: '78%',
                padding: '0.7rem 0.9rem',
                borderRadius: msg.role === 'user' ? '1rem 0.25rem 1rem 1rem' : '0.25rem 1rem 1rem 1rem',
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.75rem', lineHeight: 1.6,
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #C4A25D, #B8923F)'
                  : msg.isError
                    ? 'rgba(192,57,43,0.06)'
                    : msg.isSystem
                      ? 'rgba(39,174,96,0.07)'
                      : 'var(--atmos-glass)',
                color: msg.role === 'user' ? '#fff'
                  : msg.isError ? '#C0392B'
                  : msg.isSystem ? '#1A7F45'
                  : 'var(--atmos-dark)',
                border: msg.role === 'user' ? 'none'
                  : msg.isError ? '1px solid rgba(192,57,43,0.15)'
                  : msg.isSystem ? '1px solid rgba(39,174,96,0.2)'
                  : '1px solid rgba(196,162,93,0.12)',
                boxShadow: msg.role === 'user' ? '0 4px 12px rgba(196,162,93,0.25)' : '0 2px 8px rgba(44,43,41,0.04)',
              }}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', gap: '0.6rem' }}
          >
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(196,162,93,0.1)', flexShrink: 0 }}>
              <Bot style={{ width: '13px', height: '13px', color: '#C4A25D' }} />
            </div>
            <div style={{ padding: '0.7rem 0.9rem', borderRadius: '0.25rem 1rem 1rem 1rem', background: 'var(--atmos-glass)', border: '1px solid rgba(196,162,93,0.12)', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              {[0, 1, 2].map(j => (
                <motion.div
                  key={j}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 0.6, delay: j * 0.15, repeat: Infinity }}
                  style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C4A25D' }}
                />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div style={{
        padding: '0.65rem 1.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap',
        borderTop: '1px solid rgba(196,162,93,0.08)',
      }}>
        {SUGGESTIONS.map(s => (
          <motion.button
            key={s}
            onClick={() => send(s)}
            whileHover={{ background: 'rgba(196,162,93,0.12)', color: '#8B6914' }}
            whileTap={{ scale: 0.96 }}
            style={{
              padding: '0.3rem 0.75rem', borderRadius: '999px',
              background: 'rgba(196,162,93,0.07)',
              border: '1px solid rgba(196,162,93,0.18)',
              cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '0.62rem', fontWeight: 500,
              color: 'var(--atmos-muted)', transition: 'all 0.2s ease',
            }}
          >
            {s}
          </motion.button>
        ))}
      </div>

      {/* Input */}
      <div style={{
        padding: '0.75rem 1.25rem', display: 'flex', gap: '0.6rem',
        borderTop: '1px solid rgba(196,162,93,0.1)',
      }}>
        <input
          type="text"
          placeholder="Ask me to modify your trip…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          disabled={loading}
          style={{
            flex: 1, padding: '0.65rem 0.9rem',
            borderRadius: '0.75rem',
            border: '1px solid rgba(196,162,93,0.2)',
            background: 'var(--atmos-input-bg)',
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.78rem',
            color: 'var(--atmos-dark)', outline: 'none',
          }}
        />
        <motion.button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          whileHover={input.trim() && !loading ? { scale: 1.06, boxShadow: '0 6px 16px rgba(196,162,93,0.35)' } : {}}
          whileTap={input.trim() && !loading ? { scale: 0.94 } : {}}
          style={{
            width: '42px', height: '42px', borderRadius: '0.75rem', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: (!input.trim() || loading)
              ? 'rgba(196,162,93,0.25)'
              : 'linear-gradient(135deg, #C4A25D, #B8923F)',
            border: 'none', cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
            boxShadow: (!input.trim() || loading) ? 'none' : '0 4px 12px rgba(196,162,93,0.3)',
          }}
        >
          {loading
            ? <Loader2 style={{ width: '16px', height: '16px', color: '#fff', animation: 'spin 1s linear infinite' }} />
            : <Send style={{ width: '16px', height: '16px', color: '#fff' }} />
          }
        </motion.button>
      </div>
    </div>
  );
}
