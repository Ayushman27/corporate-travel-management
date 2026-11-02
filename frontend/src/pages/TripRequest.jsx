import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrip } from '../context/TripContext';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar  from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import PageTransition from '../components/common/PageTransition';
import TripRequestForm from '../components/employee/TripRequestForm';
import TripPlans       from '../components/employee/TripPlans';
import HotelPlans      from '../components/employee/HotelPlans';
import TripSummary     from '../components/employee/TripSummary';
import ChatInterface   from '../components/employee/ChatInterface';
import { Plane, MessageSquare, CheckCircle, Hotel, DollarSign } from 'lucide-react';

const ease = [0.25, 1, 0.5, 1];

const STEPS = [
  { id: 1, label: 'Trip Details', icon: Plane },
  { id: 2, label: 'AI Plans',     icon: CheckCircle },
  { id: 3, label: 'Hotels',       icon: Hotel },
  { id: 4, label: 'Summary',      icon: DollarSign },
];

export default function TripRequest() {
  const { currentTrip, currentPlans, loadTripDetail } = useTrip();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const handleFormSuccess = () => setStep(2);
  const handlePlanSelected = async () => {
    if (currentTrip?.tripId) await loadTripDetail(currentTrip.tripId);
    setStep(3);
  };
  const handleHotelSelected = async () => {
    if (currentTrip?.tripId) await loadTripDetail(currentTrip.tripId);
    setStep(4);
  };
  const handleBookingDone = () => navigate(`/trip/${currentTrip?.tripId}`);

  // Called by ChatInterface when AI updates the trip — re-fetches trip + fresh plans
  const handleChatTripUpdated = useCallback(async () => {
    if (currentTrip?.tripId) {
      await loadTripDetail(currentTrip.tripId);
    }
  }, [currentTrip, loadTripDetail]);

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <Sidebar />

      <main style={{ marginLeft: '220px', paddingTop: '68px', padding: '68px 2.5rem 2.5rem 220px' }}>
        <PageTransition>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <motion.h1
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease }}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '2rem', fontWeight: 700,
                color: 'var(--atmos-dark)', letterSpacing: '-0.02em',
              }}
            >
              New Trip Request
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '0.72rem', color: 'var(--atmos-muted)',
                marginTop: '0.3rem',
              }}
            >
              Our AI agents will generate optimised travel plans for you
            </motion.p>
          </div>

          {/* Step Indicator */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.45, ease }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}
          >
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = step === s.id;
              const done   = step > s.id;
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <motion.div
                    onClick={() => { if (done) setStep(s.id); }}
                    whileHover={done ? { scale: 1.05 } : {}}
                    whileTap={done ? { scale: 0.95 } : {}}
                    animate={{
                      background: active
                        ? 'linear-gradient(135deg, #C4A25D 0%, #B8923F 100%)'
                        : done
                          ? 'rgba(39,174,96,0.1)'
                          : 'rgba(196,162,93,0.08)',
                      color: active ? '#fff' : done ? '#1A7F45' : 'var(--atmos-muted)',
                      boxShadow: active ? '0 4px 14px rgba(196,162,93,0.35)' : 'none',
                    }}
                    transition={{ duration: 0.3 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.45rem',
                      padding: '0.45rem 1rem', borderRadius: '999px',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '0.7rem', fontWeight: 600,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      border: active
                        ? 'none'
                        : done
                          ? '1px solid rgba(39,174,96,0.3)'
                          : '1px solid rgba(196,162,93,0.2)',
                      cursor: done ? 'pointer' : 'default',
                    }}
                  >
                    <Icon style={{ width: '13px', height: '13px' }} />
                    {s.label}
                  </motion.div>
                  {i < STEPS.length - 1 && (
                    <motion.div
                      animate={{ background: step > s.id ? '#C4A25D' : 'rgba(196,162,93,0.15)' }}
                      transition={{ duration: 0.4 }}
                      style={{ width: '2.5rem', height: '2px', borderRadius: '1px' }}
                    />
                  )}
                </div>
              );
            })}
          </motion.div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease }}
              >
                <TripRequestForm onSuccess={handleFormSuccess} />
              </motion.div>
            )}

            {step === 2 && currentTrip && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease }}
              >
                <TripPlans
                  trip={currentTrip}
                  plans={currentPlans}
                  onPlanSelected={handlePlanSelected}
                  onBooked={handleBookingDone}
                  onBack={() => setStep(1)}
                />
              </motion.div>
            )}

            {step === 3 && currentTrip && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease }}
              >
                <HotelPlans
                  trip={currentTrip}
                  onHotelSelected={handleHotelSelected}
                  onBack={() => setStep(2)}
                />
              </motion.div>
            )}

            {step === 4 && currentTrip && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease }}
              >
                <TripSummary
                  trip={currentTrip}
                  onBack={() => setStep(3)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </PageTransition>
      </main>
    </div>
  );
}
