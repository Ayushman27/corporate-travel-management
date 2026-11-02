import { useTheme } from '../../context/ThemeContext';
import { useState } from 'react';
import { useTrip } from '../../context/TripContext';
import { motion } from 'framer-motion';
import { Loader2, MapPin, Calendar, FileText } from 'lucide-react';

const ease = [0.25, 1, 0.5, 1];

const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata',
  'Pune', 'Ahmedabad', 'Jaipur', 'Goa', 'Agra', 'Bhubaneswar',
  'Chandigarh', 'Kochi', 'Lucknow', 'Nagpur', 'Surat', 'Vadodara'
];

const MODES = [
  { value: 'mixed',  label: 'Mixed — AI Decides Best' },
  { value: 'flight', label: 'Flight Preferred' },
  { value: 'train',  label: 'Train Preferred' },
  { value: 'bus',    label: 'Bus Preferred' },
];

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().split('T')[0];
};

const labelStyle = {
  display: 'block',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: '0.62rem', fontWeight: 700,
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--atmos-muted)', marginBottom: '0.4rem',
};

const inputStyle = {
  width: '100%', padding: '0.65rem 0.9rem',
  borderRadius: '0.65rem',
  border: '1px solid var(--atmos-glass-border)',
  background: 'var(--atmos-input-bg)',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontSize: '0.8rem', color: 'var(--atmos-dark)',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
};

export default function TripRequestForm({
onSuccess }) {
  const { isDark } = useTheme();
  const { submitTrip, loading } = useTrip();

  const [form, setForm] = useState({
    fromCity: 'Mumbai',
    toCity: 'Delhi',
    travelDate: tomorrow(),
    returnDate: '',
    purpose: '',
    travelMode: 'mixed',
    preferenceNote: '',
  });
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.fromCity === form.toCity) {
      setError('Origin and destination cannot be the same');
      return;
    }
    try {
      const data = await submitTrip(form);
      onSuccess?.(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit trip request');
    }
  };

  return (
    <div style={{ maxWidth: '680px' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease }}
        style={{
          background: 'var(--atmos-glass)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--atmos-glass-border)',
          borderRadius: '1.25rem',
          padding: '2rem',
          boxShadow: 'var(--atmos-shadow)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.75rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '11px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--atmos-accent-grad)', boxShadow: '0 4px 12px var(--atmos-accent-glow)',
          }}>
            <MapPin style={{ width: '18px', height: '18px', color: '#fff' }} />
          </div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.35rem', fontWeight: 600, color: 'var(--atmos-dark)' }}>
            Trip Details
          </h2>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: '1.25rem', padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              background: 'rgba(192,57,43,0.06)',
              border: '1px solid rgba(192,57,43,0.2)',
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.75rem', color: '#C0392B',
            }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Route */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { field: 'fromCity', label: 'From City' },
              { field: 'toCity',   label: 'To City' },
            ].map(({ field, label }) => (
              <div key={field}>
                <label style={labelStyle}>{label} *</label>
                <select style={{ ...inputStyle, appearance: 'none' }} value={form[field]} onChange={set(field)}>
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Calendar style={{ width: '11px', height: '11px' }} /> Travel Date *
              </label>
              <input type="date" style={inputStyle} value={form.travelDate} onChange={set('travelDate')} required />
            </div>
            <div>
              <label style={labelStyle}>Return Date (optional)</label>
              <input type="date" style={inputStyle} value={form.returnDate} onChange={set('returnDate')} />
            </div>
          </div>

          {/* Travel mode */}
          <div>
            <label style={labelStyle}>Travel Mode</label>
            <select style={{ ...inputStyle, appearance: 'none' }} value={form.travelMode} onChange={set('travelMode')}>
              {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          {/* Purpose */}
          <div>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <FileText style={{ width: '11px', height: '11px' }} /> Purpose of Travel *
            </label>
            <input
              type="text"
              style={inputStyle}
              placeholder="e.g. Client meeting, Conference, Training"
              value={form.purpose}
              onChange={set('purpose')}
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Preferences / Special Notes</label>
            <textarea
              style={{ ...inputStyle, resize: 'none' }}
              rows={3}
              placeholder="e.g. Window seat preferred, vegetarian meals, early morning flight"
              value={form.preferenceNote}
              onChange={set('preferenceNote')}
            />
          </div>

          {/* Submit */}
          <div style={{ paddingTop: '0.5rem' }}>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.015, boxShadow: '0 10px 28px var(--atmos-accent-glow)' } : {}}
              whileTap={!loading ? { scale: 0.97 } : {}}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.5rem', padding: '0.85rem 1.5rem',
                borderRadius: '0.85rem',
                background: loading ? 'var(--atmos-accent-subtle)' : 'var(--atmos-accent-grad)',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.75rem', fontWeight: 600,
                letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff',
                boxShadow: loading ? 'none' : '0 4px 18px var(--atmos-accent-glow)',
              }}
            >
              {loading
                ? <><Loader2 style={{ width: '15px', height: '15px', animation: 'spin 1s linear infinite' }} /> AI Agents generating plans…</>
                : '🤖 Submit & Generate AI Plans'
              }
            </motion.button>
            <p style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.62rem', color: 'var(--atmos-muted)',
              textAlign: 'center', marginTop: '0.65rem',
            }}>
              Planning + Optimization agents will generate 3 optimised route options
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
