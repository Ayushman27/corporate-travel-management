import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BedDouble, Coffee, MapPin, Check, Loader2 } from 'lucide-react';
import { tripAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ease = [0.25, 1, 0.5, 1];

function HotelCard({ hotel, selected, onSelect, index }) {
  const [fooding, setFooding] = useState(false);
  
  // Extract hotel info safely handling different possible headers
  const name = hotel.Name || hotel.name || 'Premium Hotel';
  const price = Number(hotel.Price || hotel.price || 5000);
  const rating = hotel.Rating || hotel.rating || '4.5';
  const foodCost = 1500; // Flat fooding cost per night

  const handleSelect = () => {
    onSelect(hotel, fooding);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease, delay: index * 0.1 }}
      whileHover={!selected ? { y: -6, boxShadow: `0 28px 56px rgba(196,162,93,0.15)` } : {}}
      style={{
        background: selected ? 'var(--atmos-surface)' : 'var(--atmos-glass)',
        backdropFilter: 'blur(20px)',
        border: selected ? `2px solid #C4A25D` : '1px solid rgba(196,162,93,0.15)',
        borderRadius: '1.2rem',
        padding: '1.5rem',
        cursor: 'pointer',
        position: 'relative'
      }}
      onClick={handleSelect}
    >
      {selected && (
        <div style={{
          position: 'absolute', top: '-10px', right: '-10px',
          background: '#C4A25D', color: '#fff', borderRadius: '50%',
          width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(196,162,93,0.4)'
        }}>
          <Check style={{ width: '16px', height: '16px' }} />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', color: 'var(--atmos-dark)', margin: 0 }}>
            {name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#F59E0B' }}>★ {rating}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', color: 'var(--atmos-dark)' }}>
            ₹{price.toLocaleString('en-IN')}
          </span>
          <p style={{ fontFamily: 'Montserrat', fontSize: '0.65rem', color: 'var(--atmos-muted)' }}>per night</p>
        </div>
      </div>

      <div 
        onClick={(e) => { e.stopPropagation(); setFooding(!fooding); if(selected) onSelect(hotel, !fooding); }}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
          background: fooding ? 'rgba(196,162,93,0.15)' : 'rgba(255,255,255,0.05)',
          border: fooding ? '1px solid rgba(196,162,93,0.4)' : '1px solid rgba(196,162,93,0.1)',
          borderRadius: '0.75rem', marginTop: '1rem', transition: 'all 0.2s ease'
        }}
      >
        <div style={{ 
          width: '18px', height: '18px', borderRadius: '4px', border: '1.5px solid #C4A25D',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: fooding ? '#C4A25D' : 'transparent'
        }}>
          {fooding && <Check style={{ width: '12px', height: '12px', color: '#fff' }} />}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: 'Montserrat', fontSize: '0.75rem', fontWeight: 600, color: 'var(--atmos-dark)' }}>Include Fooding (All Meals)</p>
          <p style={{ fontFamily: 'Montserrat', fontSize: '0.65rem', color: 'var(--atmos-muted)' }}>+ ₹{foodCost.toLocaleString('en-IN')} per night</p>
        </div>
        <Coffee style={{ width: '18px', height: '18px', color: fooding ? '#C4A25D' : 'var(--atmos-muted)' }} />
      </div>
    </motion.div>
  );
}

export default function HotelSelection({ trip, onHotelSelected, onBack }) {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotelData, setSelectedHotelData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate nights
  const travelDate = new Date(trip.travelDate);
  const returnDate = trip.returnDate ? new Date(trip.returnDate) : new Date(travelDate.getTime() + 2 * 24 * 60 * 60 * 1000); // default 2 nights
  const defaultNights = Math.max(1, Math.ceil((returnDate - travelDate) / (1000 * 60 * 60 * 24)));

  const [nights, setNights] = useState(defaultNights);

  useEffect(() => {
    async function fetchHotels() {
      try {
        const res = await tripAPI.getHotels(trip.toCity);
        setHotels(res.data.data || []);
      } catch (err) {
        toast.error('Failed to load hotels');
      } finally {
        setLoading(false);
      }
    }
    if (trip.toCity) fetchHotels();
  }, [trip.toCity]);

  const handleSelectHotel = (hotel, foodingIncluded) => {
    setSelectedHotelData({ hotel, foodingIncluded });
  };

  const handleConfirm = async () => {
    if (!selectedHotelData) return toast.error('Please select a hotel first');
    setIsSubmitting(true);
    try {
      await tripAPI.selectHotel(trip.tripId, {
        hotel: selectedHotelData.hotel,
        foodingIncluded: selectedHotelData.foodingIncluded,
        nights
      });
      toast.success('Hotel selected successfully!');
      onHotelSelected?.();
    } catch (err) {
      toast.error('Failed to select hotel');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <Loader2 style={{ width: '32px', height: '32px', color: '#C4A25D', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', color: 'var(--atmos-dark)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            Hotels in {trip.toCity}
            <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--atmos-glass)', border: '1px solid rgba(196,162,93,0.3)', borderRadius: '0.6rem', padding: '0.2rem 0.6rem' }}>
              <span style={{ fontSize: '1rem', fontFamily: 'Montserrat', color: 'var(--atmos-dark)' }}>Nights: </span>
              <input 
                type="number" 
                min="1" 
                max="30"
                value={nights}
                onChange={(e) => setNights(Math.max(1, parseInt(e.target.value) || 1))}
                style={{
                  width: '3rem', background: 'transparent', border: 'none', 
                  fontFamily: 'Montserrat', fontSize: '1.1rem', fontWeight: 600, color: '#C4A25D',
                  outline: 'none', textAlign: 'center', padding: '0.1rem'
                }}
              />
            </div>
          </h2>
          <p style={{ fontFamily: 'Montserrat', fontSize: '0.8rem', color: 'var(--atmos-muted)', marginTop: '0.3rem' }}>
            <MapPin style={{ width: '14px', height: '14px', display: 'inline', verticalAlign: 'text-bottom' }} /> Select accommodation for your stay
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
            ← Back to Plans
          </motion.button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {hotels.length > 0 ? hotels.map((h, i) => (
          <HotelCard 
            key={i} 
            hotel={h} 
            index={i}
            selected={selectedHotelData?.hotel === h}
            onSelect={handleSelectHotel}
          />
        )) : (
          <p style={{ fontFamily: 'Montserrat', fontSize: '0.9rem', color: 'var(--atmos-muted)' }}>No hotels found for this city.</p>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <motion.button
          onClick={handleConfirm}
          disabled={!selectedHotelData || isSubmitting}
          whileHover={selectedHotelData && !isSubmitting ? { scale: 1.02 } : {}}
          whileTap={selectedHotelData && !isSubmitting ? { scale: 0.98 } : {}}
          style={{
            padding: '0.85rem 2rem', borderRadius: '0.75rem',
            background: selectedHotelData ? 'linear-gradient(135deg, #C4A25D, #B8923F)' : 'rgba(196,162,93,0.3)',
            color: '#fff', fontFamily: 'Montserrat', fontSize: '0.85rem', fontWeight: 600,
            border: 'none', cursor: selectedHotelData ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            boxShadow: selectedHotelData ? '0 8px 24px rgba(196,162,93,0.3)' : 'none'
          }}
        >
          {isSubmitting ? <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : 'Continue to Summary'}
        </motion.button>
      </div>
    </div>
  );
}
