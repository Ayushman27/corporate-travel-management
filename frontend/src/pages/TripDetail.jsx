import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import { motion } from 'framer-motion';
import Navbar  from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import PageTransition from '../components/common/PageTransition';
import LoadingSpinner from '../components/common/ShimmerLoader';
import ChatInterface  from '../components/employee/ChatInterface';
import TripPlans      from '../components/employee/TripPlans';
import { format } from 'date-fns';
import { ArrowLeft, MapPin, Calendar, FileText, CheckCircle, XCircle, Clock, Ticket } from 'lucide-react';

const ease = [0.25, 1, 0.5, 1];

const STATUS_BADGE = (status) => {
  if (status === 'booked' || status === 'approved') return { bg: 'rgba(39,174,96,0.1)', color: '#1A7F45' };
  if (status === 'rejected') return { bg: 'rgba(192,57,43,0.1)', color: '#C0392B' };
  if (status?.startsWith('pending')) return { bg: 'var(--atmos-glass-border)', color: '#8B6914' };
  return { bg: 'rgba(168,164,160,0.1)', color: '#A8A4A0' };
};

const glassCard = {
  background: 'var(--atmos-glass)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid var(--atmos-glass-border)',
  borderRadius: '1.2rem',
  boxShadow: '0 4px 20px rgba(44,43,41,0.06)',
};

function Timeline({ approvals }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {approvals?.map((appr, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4, ease }}
          style={{ display: 'flex', gap: '0.75rem' }}
        >
          <div style={{
            width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
            marginTop: '0.1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: appr.status === 'approved'
              ? 'linear-gradient(135deg, #27AE60, #1E8449)'
              : appr.status === 'rejected'
                ? 'linear-gradient(135deg, #C0392B, #A93226)'
                : 'var(--atmos-glass-border)',
            border: appr.status === 'pending' ? '2px solid rgba(196,162,93,0.4)' : 'none',
          }}>
            {appr.status === 'approved' && <CheckCircle style={{ width: '12px', height: '12px', color: '#fff' }} />}
            {appr.status === 'rejected' && <XCircle style={{ width: '12px', height: '12px', color: '#fff' }} />}
          </div>
          <div>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.75rem', fontWeight: 600, color: 'var(--atmos-dark)', textTransform: 'capitalize' }}>
              {appr.approvalType} Approval
            </p>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.65rem', color: 'var(--atmos-muted)', marginTop: '0.1rem' }}>
              {appr.status === 'pending'
                ? 'Awaiting approval'
                : `${appr.status} by ${appr.approverName || '—'}`}
              {appr.decidedAt && ` · ${format(new Date(appr.decidedAt), 'dd MMM HH:mm')}`}
            </p>
            {appr.comments && (
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.62rem', color: 'var(--atmos-mid)', fontStyle: 'italic', marginTop: '0.2rem' }}>
                "{appr.comments}"
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function TripDetail() {
  const { tripId }  = useParams();
  const { loadTripDetail, loading } = useTrip();
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    loadTripDetail(tripId).then(setDetail).catch(() => {});
  }, [tripId]);

  if (loading && !detail) return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar /><Sidebar />
      <main style={{ marginLeft: '220px', paddingTop: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <LoadingSpinner size="lg" />
      </main>
    </div>
  );

  const { trip, plans, approvals, booking } = detail || {};
  const badge = trip ? STATUS_BADGE(trip.status) : {};

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <Sidebar />

      <main style={{ marginLeft: '220px', paddingTop: '68px', padding: '68px 2.5rem 2.5rem 220px' }}>
        <PageTransition>
          {/* Back link */}
          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <motion.div
              whileHover={{ x: -3 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', fontWeight: 500,
                color: 'var(--atmos-muted)', marginBottom: '1.5rem', cursor: 'pointer',
              }}
            >
              <ArrowLeft style={{ width: '14px', height: '14px' }} /> Back to Dashboard
            </motion.div>
          </Link>

          {trip && (
            <>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
                <div>
                  <motion.h1
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, ease }}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '2rem', fontWeight: 700, color: 'var(--atmos-dark)' }}
                  >
                    {trip.fromCity} → {trip.toCity}
                  </motion.h1>
                  <p style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: 'var(--atmos-muted)', marginTop: '0.3rem' }}>{trip.tripId}</p>
                </div>
                <span style={{
                  padding: '0.3rem 0.9rem', borderRadius: '999px',
                  background: badge.bg, color: badge.color,
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.65rem', fontWeight: 600,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>
                  {trip.status?.replace(/_/g, ' ')}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
                {/* Left column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Trip Info */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease, delay: 0.1 }}
                    style={{ ...glassCard, padding: '1.5rem' }}
                  >
                    <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.15rem', fontWeight: 600, color: 'var(--atmos-dark)', marginBottom: '1.1rem' }}>
                      Trip Information
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {[
                        { icon: MapPin,   label: 'Route',   value: `${trip.fromCity} → ${trip.toCity}` },
                        { icon: Calendar, label: 'Date',    value: trip.travelDate ? format(new Date(trip.travelDate), 'EEEE, dd MMM yyyy') : '—' },
                        { icon: FileText, label: 'Purpose', value: trip.purpose },
                        { icon: Clock,    label: 'Mode',    value: trip.travelMode },
                      ].map(({ icon: Icon, label, value }) => (
                        <div key={label} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                          <Icon style={{ width: '14px', height: '14px', color: 'var(--atmos-gold)', marginTop: '0.2rem', flexShrink: 0 }} />
                          <div>
                            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--atmos-muted)' }}>{label}</p>
                            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.75rem', fontWeight: 600, color: 'var(--atmos-dark)', marginTop: '0.1rem' }}>{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {trip.selectedHotel && (
                      <div style={{ marginTop: '1.1rem', paddingTop: '1rem', borderTop: '1px solid var(--atmos-glass-border)' }}>
                        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--atmos-muted)' }}>Hotel</p>
                        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.75rem', fontWeight: 600, color: 'var(--atmos-dark)', marginTop: '0.15rem' }}>{trip.selectedHotel.name}</p>
                        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.65rem', color: 'var(--atmos-muted)', marginTop: '0.1rem' }}>{trip.selectedHotel.nights} Nights {trip.selectedHotel.foodingIncluded ? '(Inc. Food)' : ''}</p>
                      </div>
                    )}
                    <div style={{ marginTop: '1.1rem', paddingTop: '1rem', borderTop: '1px solid var(--atmos-glass-border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      {[
                        { label: 'Estimated', value: `₹${(trip.estimatedBudget || 0).toLocaleString('en-IN')}`, color: 'var(--atmos-dark)' },
                        { label: 'Approved', value: `₹${(trip.approvedBudget || 0).toLocaleString('en-IN')}`,   color: '#1A7F45' },
                      ].map(({ label, value, color }) => (
                        <div key={label}>
                          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--atmos-muted)' }}>{label} Budget</p>
                          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.2rem', fontWeight: 500, color, marginTop: '0.15rem' }}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Approval Timeline */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease, delay: 0.2 }}
                    style={{ ...glassCard, padding: '1.5rem' }}
                  >
                    <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.15rem', fontWeight: 600, color: 'var(--atmos-dark)', marginBottom: '1rem' }}>
                      Approval Timeline
                    </h2>
                    {approvals?.length
                      ? <Timeline approvals={approvals} />
                      : <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', color: 'var(--atmos-muted)' }}>No approvals yet</p>
                    }
                  </motion.div>

                  {/* Booking Confirmation */}
                  {booking && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease, delay: 0.3 }}
                      style={{
                        ...glassCard, padding: '1.5rem',
                        background: 'rgba(39,174,96,0.06)',
                        border: '1px solid rgba(39,174,96,0.25)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <Ticket style={{ width: '16px', height: '16px', color: '#27AE60' }} />
                        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.1rem', fontWeight: 600, color: '#1A7F45' }}>Booking Confirmed</h2>
                      </div>
                      <p style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: '#27AE60', marginBottom: '0.4rem' }}>{booking.bookingId}</p>
                      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.3rem', color: '#1A7F45', fontWeight: 500 }}>
                        Total: ₹{booking.totalCost?.toLocaleString('en-IN')}
                      </p>
                      <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {booking.tickets?.map((t, i) => (
                          <div key={i} style={{
                            padding: '0.65rem 0.75rem', borderRadius: '0.65rem',
                            background: 'rgba(255,255,255,0.7)',
                            border: '1px solid rgba(39,174,96,0.2)',
                          }}>
                            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.7rem', fontWeight: 600, color: '#1A7F45' }}>
                              {t.mode?.toUpperCase()} · {t.from} → {t.to}
                            </p>
                            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.66rem', color: '#000000', fontWeight: 600, marginTop: '0.2rem' }}>
                              Ref: {t.refNo} · Seat: {t.seat} · ₹{t.cost?.toLocaleString('en-IN')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {plans?.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease, delay: 0.15 }}
                    >
                      <TripPlans
                        trip={trip}
                        plans={plans}
                        onPlanSelected={() => {}}
                        onBooked={() => loadTripDetail(tripId).then(setDetail)}
                        compact
                      />
                    </motion.div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease, delay: 0.25 }}
                  >
                    <ChatInterface
                      tripId={tripId}
                      onTripUpdated={() => loadTripDetail(tripId).then(setDetail)}
                    />
                  </motion.div>
                </div>
              </div>
            </>
          )}
        </PageTransition>
      </main>
    </div>
  );
}
