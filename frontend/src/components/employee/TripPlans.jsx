import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrip } from '../../context/TripContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Zap, DollarSign, Smile, ChevronDown, ChevronUp, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { tripAPI } from '../../services/api';
import TripMap from './TripMap';

const ease = [0.25, 1, 0.5, 1];

const PLAN_META = {
  lowest_cost:      { label: 'Lowest Cost',     icon: DollarSign, from: '#27AE60', to: '#1E8449', glow: 'rgba(39,174,96,0.25)',    borderActive: 'rgba(39,174,96,0.4)' },
  fastest:          { label: 'Fastest Route',   icon: Zap,         from: '#C4A25D', to: '#B8923F', glow: 'rgba(196,162,93,0.25)',   borderActive: 'rgba(196,162,93,0.5)' },
  most_comfortable: { label: 'Most Comfortable', icon: Smile,      from: '#F59E0B', to: '#D97706', glow: 'rgba(245,158,11,0.25)',   borderActive: 'rgba(245,158,11,0.4)' },
};

const MODE_EMOJI = { flight: '✈️', train: '🚆', bus: '🚌', metro: '🚇', cab: '🚕', walk: '🚶' };

function ScoreBar({ label, value, color }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <span style={{ fontFamily: 'Montserrat', fontSize: '0.62rem', color: 'var(--atmos-muted)' }}>{label}</span>
        <span style={{ fontFamily: 'Montserrat', fontSize: '0.62rem', fontWeight: 600, color: 'var(--atmos-dark)' }}>{value?.toFixed(1)}/10</span>
      </div>
      <div style={{ height: '4px', borderRadius: '999px', background: 'rgba(196,162,93,0.1)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / 10) * 100}%` }}
          transition={{ duration: 1.1, ease: [0.25, 1, 0.5, 1] }}
          style={{ height: '100%', borderRadius: '999px', background: color }}
        />
      </div>
    </div>
  );
}

function PlanCard({ plan, selected, onSelect, onBook, booking, tripStatus, index }) {
  const [expanded, setExpanded] = useState(false);
  const meta = PLAN_META[plan.planType] || PLAN_META.fastest;
  const Icon = meta.icon;
  const hrs  = Math.floor(plan.totalDuration / 60);
  const mins = plan.totalDuration % 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease, delay: index * 0.1 }}
      whileHover={!selected ? { y: -6, boxShadow: `0 28px 56px ${meta.glow}`, transition: { duration: 0.22 } } : {}}
      style={{
        background: selected ? 'var(--atmos-surface)' : 'var(--atmos-glass)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: selected ? `2px solid ${meta.borderActive}` : '1px solid rgba(196,162,93,0.15)',
        borderRadius: '1.2rem',
        boxShadow: selected
          ? `0 16px 40px ${meta.glow}, 0 4px 16px rgba(44,43,41,0.06)`
          : '0 4px 16px rgba(44,43,41,0.05)',
        overflow: 'hidden',
        transition: 'border 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {/* Header */}
      <div style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `linear-gradient(135deg, ${meta.from}, ${meta.to})`,
              boxShadow: `0 4px 12px ${meta.glow}`,
              flexShrink: 0,
            }}>
              <Icon style={{ width: '16px', height: '16px', color: '#fff' }} />
            </div>
            <span style={{ fontFamily: 'Montserrat', fontSize: '0.78rem', fontWeight: 700, color: 'var(--atmos-dark)' }}>
              {meta.label}
            </span>
          </div>
          {selected && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: '0.18rem 0.65rem', borderRadius: '999px',
                background: 'rgba(39,174,96,0.1)', color: '#1A7F45',
                fontFamily: 'Montserrat', fontSize: '0.6rem', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
              }}
            >
              Selected
            </motion.span>
          )}
        </div>

        {/* Price & time */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 500, color: 'var(--atmos-dark)', lineHeight: 1 }}>
              ₹{plan.totalCost?.toLocaleString('en-IN')}
            </p>
            <p style={{ fontFamily: 'Montserrat', fontSize: '0.65rem', color: 'var(--atmos-muted)', marginTop: '0.2rem' }}>
              {hrs}h {mins}m total travel
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end', marginBottom: '0.2rem' }}>
              {[...new Set(plan.segments?.map(s => s.mode))].map(m => (
                <span key={m} style={{ fontSize: '1rem' }} title={m}>{MODE_EMOJI[m] || '🚗'}</span>
              ))}
            </div>
            <p style={{ fontFamily: 'Montserrat', fontSize: '0.6rem', color: 'var(--atmos-muted)' }}>{plan.segments?.length} segments</p>
          </div>
        </div>

        {/* Score bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.85rem' }}>
          <ScoreBar label="Cost"    value={plan.costScore}    color={meta.from} />
          <ScoreBar label="Speed"   value={plan.speedScore}   color={meta.from} />
          <ScoreBar label="Comfort" value={plan.comfortScore} color={meta.from} />
        </div>

        {/* Highlights */}
        {plan.highlights?.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.6rem' }}>
            {plan.highlights.slice(0, 2).map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontFamily: 'Montserrat', fontSize: '0.68rem', color: '#6B6760' }}>
                <Check style={{ width: '12px', height: '12px', color: '#27AE60', marginTop: '0.15rem', flexShrink: 0 }} /> {h}
              </div>
            ))}
          </div>
        )}

        {/* Warnings */}
        {plan.warnings?.length > 0 && (
          <div style={{ padding: '0.5rem 0.75rem', borderRadius: '0.6rem', background: 'rgba(196,162,93,0.08)', border: '1px solid rgba(196,162,93,0.2)', marginBottom: '0.6rem' }}>
            {plan.warnings.map((w, i) => (
              <p key={i} style={{ fontFamily: 'Montserrat', fontSize: '0.65rem', color: '#8B6914' }}>⚠️ {w}</p>
            ))}
          </div>
        )}
      </div>

      {/* Expand segments */}
      <motion.button
        onClick={() => setExpanded(e => !e)}
        whileHover={{ background: 'rgba(196,162,93,0.06)' }}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
          padding: '0.6rem',
          background: 'none', border: 'none', borderTop: '1px solid rgba(196,162,93,0.1)',
          cursor: 'pointer', fontFamily: 'Montserrat', fontSize: '0.65rem',
          fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
          color: 'var(--atmos-muted)',
        }}
      >
        {expanded ? <><ChevronUp style={{ width: '12px', height: '12px' }} /> Hide Route</> : <><ChevronDown style={{ width: '12px', height: '12px' }} /> View Route</>}
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0.75rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {plan.segments?.map((seg, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.65rem',
                  padding: '0.6rem 0.75rem', borderRadius: '0.65rem',
                  background: 'rgba(196,162,93,0.05)',
                  border: '1px solid rgba(196,162,93,0.1)',
                }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>{MODE_EMOJI[seg.mode] || '🚗'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'Montserrat', fontSize: '0.7rem', fontWeight: 600, color: 'var(--atmos-dark)' }}>{seg.from} → {seg.to}</p>
                    <p style={{ fontFamily: 'Montserrat', fontSize: '0.62rem', color: 'var(--atmos-muted)', marginTop: '0.1rem' }}>
                      {seg.operator} · {seg.departureTime}–{seg.arrivalTime} · ₹{seg.cost?.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(196,162,93,0.1)', display: 'flex', gap: '0.65rem' }}>
        {!selected ? (
          <motion.button
            onClick={() => onSelect(plan._id)}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            style={{
              flex: 1, padding: '0.6rem', borderRadius: '0.7rem',
              background: 'transparent',
              border: `1.5px solid ${meta.borderActive}`,
              cursor: 'pointer', fontFamily: 'Montserrat',
              fontSize: '0.68rem', fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: meta.from,
            }}
          >
            Select This Plan
          </motion.button>
        ) : tripStatus === 'draft' ? (
          <motion.button
            onClick={() => onBook(plan._id)}
            disabled={booking}
            whileHover={!booking ? { scale: 1.02, boxShadow: '0 8px 20px rgba(196,162,93,0.3)' } : {}}
            whileTap={!booking ? { scale: 0.97 } : {}}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              padding: '0.6rem', borderRadius: '0.7rem',
              background: booking ? 'rgba(196,162,93,0.3)' : `linear-gradient(135deg, ${meta.from}, ${meta.to})`,
              border: 'none', cursor: booking ? 'not-allowed' : 'pointer',
              fontFamily: 'Montserrat', fontSize: '0.68rem', fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff',
              boxShadow: `0 4px 14px ${meta.glow}`,
            }}
          >
            {booking ? <><Loader2 style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} /> Processing…</> : '🏨 Continue to Hotels'}
          </motion.button>
        ) : (
          <motion.button
            onClick={() => onBook(plan._id)}
            disabled={booking}
            whileHover={!booking ? { scale: 1.02, boxShadow: `0 8px 20px ${meta.glow}` } : {}}
            whileTap={!booking ? { scale: 0.97 } : {}}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              padding: '0.6rem', borderRadius: '0.7rem',
              background: booking ? 'rgba(196,162,93,0.3)' : `linear-gradient(135deg, ${meta.from}, ${meta.to})`,
              border: 'none', cursor: booking ? 'not-allowed' : 'pointer',
              fontFamily: 'Montserrat', fontSize: '0.68rem', fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff',
              boxShadow: `0 4px 14px ${meta.glow}`,
            }}
          >
            {booking ? <><Loader2 style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} /> Booking…</> : '🎫 Confirm & Book'}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

export default function TripPlans({ trip, plans, onPlanSelected, onBooked, onBack, compact }) {
  const { bookSelectedPlan } = useTrip();
  const navigate = useNavigate();
  const [selectedPlanId, setSelectedPlanId] = useState(trip?.selectedPlanId || null);
  const [booking, setBooking] = useState(false);

  const handleSelect = async (planId) => {
    try {
      if (trip.status !== 'draft' && trip.status !== 'pending_manager') {
        setSelectedPlanId(planId);
        toast.success('Plan selected for booking.');
        return;
      }
      await tripAPI.selectPlan(trip.tripId, planId);
      setSelectedPlanId(planId);
      onPlanSelected?.();
      if (trip.status === 'draft') {
        toast.success('Plan selected! Click "Continue to Hotels" to proceed.');
      } else {
        toast.success('Plan selected! Budget updated.');
      }
      // Removed window.location.reload() to prevent the page from resetting
    } catch (err) {
      toast.error('Failed to update selected plan');
    }
  };

  const handleBook = async (planId) => {
    if (trip.status === 'draft') {
      // Just move to the next step, don't send to manager yet
      onPlanSelected?.();
      return;
    }
    if (trip.status !== 'approved') {
      toast.error('Trip must be approved before booking');
      return;
    }
    setBooking(true);
    try {
      const bk = await bookSelectedPlan(trip.tripId, planId);
      onBooked?.(bk);
    } finally { setBooking(false); }
  };

  if (!plans || plans.length === 0) {
    return (
      <div style={{
        background: 'var(--atmos-glass)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(196,162,93,0.15)', borderRadius: '1.2rem',
        padding: '3rem 2rem', textAlign: 'center',
      }}>
        <p style={{ fontFamily: 'Montserrat', fontSize: '0.75rem', color: 'var(--atmos-muted)' }}>No plans generated yet</p>
      </div>
    );
  }

  return (
    <div>
      {!compact && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 400, color: 'var(--atmos-dark)' }}>
              AI-Generated Plans
            </h2>
            <p style={{ fontFamily: 'Montserrat', fontSize: '0.68rem', color: 'var(--atmos-muted)', marginTop: '0.2rem' }}>
              {trip.fromCity} → {trip.toCity} · 3 optimised options
            </p>
          </div>
          {onBack && (
            <motion.button
              onClick={onBack}
              whileHover={{ x: -3 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                background: 'transparent', border: '1px solid rgba(196,162,93,0.3)',
                borderRadius: '0.6rem', padding: '0.45rem 0.9rem',
                fontFamily: 'Montserrat', fontSize: '0.68rem', fontWeight: 500,
                color: '#8B8480', cursor: 'pointer',
              }}
            >
              ← Back
            </motion.button>
          )}
        </div>
      )}

      {/* Status notices */}
      {trip.status !== 'approved' && trip.status !== 'draft' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '0.75rem',
            background: 'rgba(196,162,93,0.06)', border: '1px solid rgba(196,162,93,0.2)',
            fontFamily: 'Montserrat', fontSize: '0.72rem', color: '#8B6914',
          }}
        >
          ⏳ Trip status: <strong>{trip.status?.replace(/_/g, ' ')}</strong> — booking available after all approvals
        </motion.div>
      )}

      {trip.status === 'draft' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '0.75rem',
            background: 'rgba(196,162,93,0.06)', border: '1px solid rgba(196,162,93,0.2)',
            fontFamily: 'Montserrat', fontSize: '0.72rem', color: '#8B6914',
          }}
        >
          📝 Draft mode — select a plan and send to manager for approval
        </motion.div>
      )}

      {/* Map visualization */}
      {!compact && trip.fromCity && trip.toCity && (
        <TripMap startCity={trip.fromCity} endCity={trip.toCity} />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        {plans.map((plan, i) => (
          <PlanCard
            key={plan._id}
            plan={plan}
            selected={selectedPlanId === plan._id}
            onSelect={handleSelect}
            onBook={handleBook}
            booking={booking}
            tripStatus={trip.status}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
