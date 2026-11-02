import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { financeAPI } from '../../services/api';
import { DollarSign, X, Loader2, Calendar, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function SetBudgetModal({
  isOpen,
  onClose,
  onSuccess,
  initialMonth = 'all',
  initialAmount = 500000,
  initialDept = 'All'
}) {
  const [month, setMonth] = useState(initialMonth);
  const [amount, setAmount] = useState(initialAmount);
  const [department, setDepartment] = useState(initialDept);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMonth(initialMonth || 'all');
      setAmount(initialAmount || 500000);
      setDepartment(initialDept || 'All');
    }
  }, [isOpen, initialMonth, initialAmount, initialDept]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const val = Number(amount);
    if (isNaN(val) || val < 0) {
      return toast.error('Please enter a valid budget amount');
    }

    setLoading(true);
    try {
      const { data } = await financeAPI.setBudget({
        month,
        allocatedBudget: val,
        department,
        year: 2026
      });
      toast.success(data.message || 'Budget updated successfully');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update monthly budget');
    } finally {
      setLoading(false);
    }
  };

  const PRESETS = [100000, 250000, 500000, 750000, 1000000];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1.25rem'
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 10 }}
          transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
          style={{
            background: 'rgba(16, 14, 12, 0.95)',
            border: '1px solid rgba(196, 162, 93, 0.35)',
            borderRadius: '1.3rem',
            width: '100%', maxWidth: '480px',
            padding: '1.75rem',
            boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 40px rgba(196,162,93,0.1)',
            boxSizing: 'border-box',
            position: 'relative'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(196,162,93,0.25), rgba(196,162,93,0.1))',
                border: '1px solid rgba(196,162,93,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <DollarSign style={{ width: '18px', height: '18px', color: '#C4A25D' }} />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.45rem', fontWeight: 500, color: '#FFFFFF', margin: 0 }}>
                  Set Monthly Budget
                </h3>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)', margin: '0.2rem 0 0' }}>
                  Live Neon DB sync · Controls monthly expenditure caps
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.5rem', color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                padding: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* Month Selection */}
            <div>
              <label style={{
                display: 'block', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6rem',
                fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: '#C4A25D', marginBottom: '0.4rem'
              }}>
                Target Month
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  style={{
                    width: '100%', padding: '0.65rem 0.85rem',
                    borderRadius: '0.65rem',
                    border: '1px solid rgba(196,162,93,0.25)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.78rem',
                    outline: 'none', cursor: 'pointer', boxSizing: 'border-box'
                  }}
                >
                  <option value="all" style={{ background: '#1c1916', color: '#fff' }}>🌟 All 12 Months (Entire Year)</option>
                  {MONTH_NAMES.map(m => (
                    <option key={m} value={m} style={{ background: '#1c1916', color: '#fff' }}>{m} 2026</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Allocated Budget */}
            <div>
              <label style={{
                display: 'block', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6rem',
                fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: '#C4A25D', marginBottom: '0.4rem'
              }}>
                Allocated Budget Amount
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '0.9rem', top: '50%',
                  transform: 'translateY(-50%)', color: '#C4A25D',
                  fontSize: '0.9rem', fontWeight: 700
                }}>₹</span>
                <input
                  type="number"
                  step="5000"
                  min="0"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 500000"
                  style={{
                    width: '100%', padding: '0.65rem 0.85rem 0.65rem 2.2rem',
                    borderRadius: '0.65rem',
                    border: '1px solid rgba(196,162,93,0.3)',
                    background: 'rgba(255,255,255,0.06)',
                    color: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.92rem',
                    fontWeight: 600, outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.55rem', flexWrap: 'wrap' }}>
                {PRESETS.map(val => {
                  const isSelected = Number(amount) === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      style={{
                        background: isSelected ? 'rgba(196,162,93,0.3)' : 'rgba(255,255,255,0.04)',
                        border: isSelected ? '1px solid #C4A25D' : '1px solid rgba(255,255,255,0.1)',
                        color: isSelected ? '#C4A25D' : 'rgba(255,255,255,0.7)',
                        borderRadius: '0.45rem', padding: '0.25rem 0.55rem',
                        fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.63rem', fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.15s ease'
                      }}
                    >
                      ₹{(val / 100000).toFixed(val % 100000 === 0 ? 0 : 1)}L
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Department Option */}
            <div>
              <label style={{
                display: 'block', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.6rem',
                fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: '#C4A25D', marginBottom: '0.4rem'
              }}>
                Department Scope
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{
                  width: '100%', padding: '0.65rem 0.85rem',
                  borderRadius: '0.65rem',
                  border: '1px solid rgba(196,162,93,0.25)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.78rem',
                  outline: 'none', cursor: 'pointer', boxSizing: 'border-box'
                }}
              >
                <option value="All" style={{ background: '#1c1916', color: '#fff' }}>Company-Wide (All Departments)</option>
                <option value="Engineering" style={{ background: '#1c1916', color: '#fff' }}>Engineering</option>
                <option value="Sales" style={{ background: '#1c1916', color: '#fff' }}>Sales</option>
                <option value="Finance" style={{ background: '#1c1916', color: '#fff' }}>Finance</option>
                <option value="HR" style={{ background: '#1c1916', color: '#fff' }}>HR</option>
                <option value="Management" style={{ background: '#1c1916', color: '#fff' }}>Management / CEO</option>
              </select>
            </div>

            {/* Info note */}
            <div style={{
              padding: '0.75rem 1rem', borderRadius: '0.65rem',
              background: 'rgba(196,162,93,0.07)', border: '1px solid rgba(196,162,93,0.2)',
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.64rem', color: '#E8C97A', lineHeight: 1.4
            }}>
              ✨ <strong>Note:</strong> Saving will update the monthly budget in Neon DB. The remaining balance will automatically adjust against recorded expenditures.
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '0.55rem 1.2rem', borderRadius: '0.65rem',
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.7)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.45rem',
                  padding: '0.55rem 1.4rem', borderRadius: '0.65rem',
                  background: 'linear-gradient(135deg, #C4A25D, #A3823B)',
                  border: 'none', color: '#000000',
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.72rem', fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(196,162,93,0.35)'
                }}
              >
                {loading ? <Loader2 style={{ width: '13px', height: '13px', animation: 'spin 1s linear infinite' }} /> : <Check style={{ width: '13px', height: '13px' }} />}
                {loading ? 'Saving...' : 'Save Budget'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

