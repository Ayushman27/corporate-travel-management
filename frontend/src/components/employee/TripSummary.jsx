import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Send, CheckCircle2, PlaneTakeoff, Hotel, Receipt } from 'lucide-react';
import { tripAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ease = [0.25, 1, 0.5, 1];

export default function TripSummary({ trip, onBack }) {
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSendApproval = async () => {
    setSubmitting(true);
    try {
      await tripAPI.sendApproval(trip.tripId);
      toast.success('Approval request sent to manager!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to send approval request');
    } finally {
      setSubmitting(false);
    }
  };

  const travelCost = trip.estimatedBudget - (trip.selectedHotel?.totalCost || 0);
  const hotelCost = trip.selectedHotel?.totalCost || 0;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', color: 'var(--atmos-dark)' }}>
            Trip Summary
          </h2>
          <p style={{ fontFamily: 'Montserrat', fontSize: '0.8rem', color: 'var(--atmos-muted)', marginTop: '0.3rem' }}>
            Review your selection before submitting
          </p>
        </div>
        {onBack && (
          <motion.button onClick={onBack} whileHover={{ x: -3 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              background: 'transparent', border: '1px solid rgba(196,162,93,0.3)',
              borderRadius: '0.6rem', padding: '0.45rem 0.9rem',
              fontFamily: 'Montserrat', fontSize: '0.7rem', color: '#8B8480', cursor: 'pointer'
            }}
          >
            ← Back
          </motion.button>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        style={{
          background: 'var(--atmos-glass)',
          border: '1px solid rgba(196,162,93,0.2)',
          borderRadius: '1.25rem', padding: '2rem',
          boxShadow: '0 12px 32px rgba(196,162,93,0.08)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Travel Plan */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(196,162,93,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PlaneTakeoff style={{ width: '18px', height: '18px', color: '#C4A25D' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontFamily: 'Montserrat', fontSize: '0.85rem', fontWeight: 600, color: 'var(--atmos-dark)', margin: 0 }}>
                Travel: {trip.fromCity} to {trip.toCity}
              </h4>
              <p style={{ fontFamily: 'Montserrat', fontSize: '0.7rem', color: 'var(--atmos-muted)', marginTop: '0.25rem' }}>
                Mode: {trip.travelMode}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: 'var(--atmos-dark)' }}>
                ₹{(Number(travelCost) || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div style={{ height: '1px', background: 'rgba(196,162,93,0.15)' }} />

          {/* Hotel Plan */}
          {trip.selectedHotel && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(196,162,93,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Hotel style={{ width: '18px', height: '18px', color: '#C4A25D' }} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontFamily: 'Montserrat', fontSize: '0.85rem', fontWeight: 600, color: 'var(--atmos-dark)', margin: 0 }}>
                  Accommodation: {trip.selectedHotel.name}
                </h4>
                <p style={{ fontFamily: 'Montserrat', fontSize: '0.7rem', color: 'var(--atmos-muted)', marginTop: '0.25rem' }}>
                  {trip.selectedHotel.nights} Nights {trip.selectedHotel.foodingIncluded ? '+ Fooding' : ''}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: 'var(--atmos-dark)' }}>
                  ₹{(Number(hotelCost) || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}

          <div style={{ height: '1px', background: 'rgba(196,162,93,0.15)' }} />

          {/* Total */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(39,174,96,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt style={{ width: '18px', height: '18px', color: '#27AE60' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontFamily: 'Montserrat', fontSize: '1rem', fontWeight: 700, color: 'var(--atmos-dark)', margin: 0 }}>
                Total Estimated Cost
              </h4>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', color: '#C4A25D', fontWeight: 600 }}>
                ₹{(Number(trip.estimatedBudget) || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'center' }}
      >
        <motion.button
          onClick={handleSendApproval}
          disabled={submitting}
          whileHover={!submitting ? { scale: 1.02, boxShadow: '0 8px 24px rgba(196,162,93,0.35)' } : {}}
          whileTap={!submitting ? { scale: 0.98 } : {}}
          style={{
            padding: '1rem 3rem', borderRadius: '999px',
            background: 'linear-gradient(135deg, #C4A25D, #B8923F)',
            color: '#fff', fontFamily: 'Montserrat', fontSize: '0.9rem', fontWeight: 600,
            border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em'
          }}
        >
          {submitting ? (
            <><Loader2 style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} /> Sending...</>
          ) : (
            <><Send style={{ width: '16px', height: '16px' }} /> Send Request to Manager</>
          )}
        </motion.button>
      </motion.div>

    </div>
  );
}
