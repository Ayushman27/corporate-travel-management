import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar  from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import PageTransition from '../components/common/PageTransition';
import { tripAPI } from '../services/api';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Loader2, MapPin, Calendar, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const ease = [0.25, 1, 0.5, 1];

const inputStyle = {
  width: '100%', padding: '0.6rem 0.85rem',
  borderRadius: '0.6rem',
  border: '1px solid rgba(196,162,93,0.2)',
  background: 'var(--atmos-input-bg)',
  fontFamily: 'Montserrat, sans-serif',
  fontSize: '0.78rem', color: 'var(--atmos-dark)', outline: 'none',
  boxSizing: 'border-box',
};

function ApprovalCard({ trip, onDecision, deciding, index }) {
  const [comments, setComments] = useState('');
  const isDeciding = deciding === trip.tripId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.45, ease, delay: index * 0.07 }}
      whileHover={{ y: -4, boxShadow: '0 24px 48px rgba(44,43,41,0.1), 0 4px 16px rgba(196,162,93,0.08)', transition: { duration: 0.22 } }}
      style={{
        background: 'var(--atmos-glass)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(196,162,93,0.18)',
        borderRadius: '1.2rem',
        padding: '1.5rem',
        boxShadow: '0 4px 20px rgba(44,43,41,0.06)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem', fontWeight: 400, color: 'var(--atmos-dark)' }}>
            {trip.employeeName}
          </p>
          <p style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--atmos-muted)', marginTop: '0.15rem' }}>
            {trip.tripId} · {trip.department}
          </p>
        </div>
        <span style={{
          padding: '0.2rem 0.75rem', borderRadius: '999px',
          background: 'rgba(196,162,93,0.1)', color: '#8B6914',
          fontFamily: 'Montserrat', fontSize: '0.6rem', fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          Pending Approval
        </span>
      </div>

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
        {[
          { icon: MapPin,     label: 'Route',      value: `${trip.fromCity} → ${trip.toCity}` },
          { icon: Calendar,   label: 'Date',       value: trip.travelDate ? format(new Date(trip.travelDate), 'dd MMM yyyy') : '—' },
          { icon: DollarSign, label: 'Est. Budget', value: `₹${(trip.estimatedBudget || 0).toLocaleString('en-IN')}` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <Icon style={{ width: '13px', height: '13px', color: '#C4A25D', marginTop: '0.2rem', flexShrink: 0 }} />
            <div>
              <p style={{ fontFamily: 'Montserrat', fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--atmos-muted)' }}>{label}</p>
              <p style={{ fontFamily: 'Montserrat', fontSize: '0.72rem', fontWeight: 600, color: 'var(--atmos-dark)', marginTop: '0.1rem' }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Purpose */}
      <div style={{
        padding: '0.75rem 1rem', borderRadius: '0.75rem',
        background: 'rgba(196,162,93,0.05)',
        border: '1px solid rgba(196,162,93,0.1)',
        marginBottom: '1rem',
      }}>
        <p style={{ fontFamily: 'Montserrat', fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C4A25D', marginBottom: '0.3rem' }}>
          Purpose
        </p>
        <p style={{ fontFamily: 'Montserrat', fontSize: '0.75rem', color: 'var(--atmos-dark)' }}>{trip.purpose}</p>
        {trip.preferenceNote && (
          <p style={{ fontFamily: 'Montserrat', fontSize: '0.68rem', color: 'var(--atmos-muted)', marginTop: '0.35rem' }}>{trip.preferenceNote}</p>
        )}
      </div>

      {/* Comment input */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontFamily: 'Montserrat', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--atmos-muted)', marginBottom: '0.35rem' }}>
          Comments (optional)
        </label>
        <input
          type="text" style={inputStyle}
          placeholder="Add approval note or rejection reason"
          value={comments}
          onChange={e => setComments(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <motion.button
          onClick={() => onDecision(trip.tripId, 'approved', comments)}
          disabled={isDeciding}
          whileHover={!isDeciding ? { scale: 1.03, boxShadow: '0 8px 20px rgba(39,174,96,0.3)' } : {}}
          whileTap={!isDeciding ? { scale: 0.97 } : {}}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            padding: '0.65rem', borderRadius: '0.7rem',
            background: isDeciding ? 'rgba(39,174,96,0.3)' : 'linear-gradient(135deg, #27AE60, #1E8449)',
            border: 'none', cursor: isDeciding ? 'not-allowed' : 'pointer',
            fontFamily: 'Montserrat', fontSize: '0.7rem', fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff',
            boxShadow: '0 4px 12px rgba(39,174,96,0.2)',
          }}
        >
          {isDeciding ? <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} /> : <CheckCircle style={{ width: '14px', height: '14px' }} />}
          Approve
        </motion.button>

        <motion.button
          onClick={() => onDecision(trip.tripId, 'rejected', comments)}
          disabled={isDeciding}
          whileHover={!isDeciding ? { scale: 1.03, boxShadow: '0 8px 20px rgba(192,57,43,0.25)' } : {}}
          whileTap={!isDeciding ? { scale: 0.97 } : {}}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            padding: '0.65rem', borderRadius: '0.7rem',
            background: isDeciding ? 'rgba(192,57,43,0.2)' : 'transparent',
            border: '1.5px solid rgba(192,57,43,0.4)',
            cursor: isDeciding ? 'not-allowed' : 'pointer',
            fontFamily: 'Montserrat', fontSize: '0.7rem', fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase', color: '#C0392B',
          }}
        >
          {isDeciding ? <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} /> : <XCircle style={{ width: '14px', height: '14px' }} />}
          Reject
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function ManagerPanel() {
  const [trips,    setTrips]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [deciding, setDeciding] = useState(null);

  const fetchPending = async () => {
    setLoading(true);
    try { const { data } = await tripAPI.pendingManager(); setTrips(data.data || []); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleDecision = async (tripId, status, comments) => {
    setDeciding(tripId);
    try {
      await tripAPI.managerApprove({ tripId, status, comments });
      toast.success(`Trip ${status} successfully`);
      fetchPending();
    } finally { setDeciding(null); }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <Sidebar />

      <main style={{ marginLeft: '220px', paddingTop: '68px', padding: '68px 2.5rem 2.5rem 220px' }}>
        <PageTransition>
          <div style={{ marginBottom: '2rem' }}>
            <motion.h1
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease }}
              style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 400, color: 'var(--atmos-dark)' }}
            >
              Manager Approvals
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              style={{ fontFamily: 'Montserrat', fontSize: '0.72rem', color: 'var(--atmos-muted)', marginTop: '0.3rem' }}
            >
              Review and approve employee trip requests
            </motion.p>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <Loader2 style={{ width: '32px', height: '32px', color: '#C4A25D', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : trips.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease }}
              style={{
                background: 'var(--atmos-glass)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(196,162,93,0.15)', borderRadius: '1.25rem',
                padding: '4rem 2rem', textAlign: 'center',
                boxShadow: '0 4px 20px rgba(44,43,41,0.05)',
              }}
            >
              <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2.5, repeat: Infinity }}>
                <CheckCircle style={{ width: '48px', height: '48px', color: 'rgba(39,174,96,0.4)', margin: '0 auto 1rem' }} />
              </motion.div>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: 'var(--atmos-dark)', marginBottom: '0.5rem' }}>All caught up!</p>
              <p style={{ fontFamily: 'Montserrat', fontSize: '0.72rem', color: 'var(--atmos-muted)' }}>No trips pending your approval</p>
            </motion.div>
          ) : (
            <AnimatePresence>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
                {trips.map((trip, i) => (
                  <ApprovalCard
                    key={trip._id}
                    trip={trip}
                    onDecision={handleDecision}
                    deciding={deciding}
                    index={i}
                  />
                ))}
              </div>
            </AnimatePresence>
          )}
        </PageTransition>
      </main>
    </div>
  );
}
