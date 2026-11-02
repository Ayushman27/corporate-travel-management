import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import PageTransition from '../components/common/PageTransition';
import { Upload, FileText, CheckCircle, Clock, XCircle, Plus, Receipt } from 'lucide-react';
import api from '../services/api';

const ease = [0.25, 1, 0.5, 1];

export default function EmployeeReimbursements() {
  const { user } = useAuth();
  const [reimbursements, setReimbursements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [bills, setBills] = useState([]); // Array of scanned bills
  const [title, setTitle] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReimbursements();
  }, []);

  const fetchReimbursements = async () => {
    try {
      const res = await api.get('/reimbursements/employee');
      setReimbursements(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        // Call backend to scan
        const res = await api.post('/reimbursements/scan', { billBase64: base64 });
        if (res.data.success) {
          setBills(prev => [...prev, { ...res.data.data, billUrl: base64 }]);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Scan failed", err);
      alert('Failed to scan bill');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = async () => {
    if (!title || bills.length === 0) return alert('Enter title and add bills');
    setIsSubmitting(true);
    try {
      await api.post('/reimbursements', { title, bills });
      setShowModal(false);
      setTitle('');
      setBills([]);
      fetchReimbursements();
    } catch (err) {
      console.error(err);
      alert('Failed to submit reimbursement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <Navbar />
      <Sidebar />
      <div style={{
        paddingLeft: '220px',
        paddingTop: '68px',
        minHeight: '100vh',
        background: 'radial-gradient(circle at top right, rgba(196,162,93,0.05), transparent 60%)'
      }}>
        <main style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '2.4rem',
              color: 'var(--atmos-dark)', fontWeight: 500, margin: 0
            }}>My Reimbursements</h1>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.6rem 1.25rem', borderRadius: '0.5rem',
                background: '#C4A25D', color: '#fff', border: 'none',
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.75rem', fontWeight: 600,
                letterSpacing: '0.05em', cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(196,162,93,0.3)'
              }}
            >
              <Plus size={16} /> New Request
            </motion.button>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : reimbursements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--atmos-muted)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.85rem' }}>
              <Receipt size={48} style={{ color: '#ffffff', opacity: 0.7, margin: '0 auto 1rem' }} />
              <p>No reimbursement requests found.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {reimbursements.map((r, i) => (
                <motion.div
                  key={r._id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  style={{
                    padding: '1.25rem', borderRadius: '0.75rem',
                    background: 'var(--atmos-glass)', border: '1px solid rgba(196,162,93,0.1)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.9rem', color: 'var(--atmos-dark)' }}>{r.title}</h3>
                    <p style={{ margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.75rem', color: 'var(--atmos-muted)' }}>
                      {r.bills.length} Bills • {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.4rem', fontWeight: 600, color: 'var(--atmos-dark)' }}>
                      ₹{r.totalRequestedAmount.toLocaleString()}
                    </p>
                    <span style={{
                      fontSize: '0.65rem', fontFamily: "'Plus Jakarta Sans', sans-serif", padding: '0.2rem 0.6rem', borderRadius: '1rem',
                      background: r.status === 'processed' ? 'rgba(39,174,96,0.1)' : 'rgba(196,162,93,0.1)',
                      color: r.status === 'processed' ? '#27AE60' : '#C4A25D', fontWeight: 600
                    }}>
                      {r.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <AnimatePresence>
            {showModal && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                  style={{
                    background: '#1A1816', borderRadius: '1rem', padding: '2rem', width: '100%', maxWidth: '500px',
                    border: '1px solid rgba(196,162,93,0.2)'
                  }}
                >
                  <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.8rem', color: '#fff', margin: '0 0 1.5rem' }}>New Reimbursement</h2>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', color: 'var(--atmos-muted)', fontSize: '0.75rem', fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: '0.5rem' }}>Request Title</label>
                    <input
                      type="text" value={title} onChange={e => setTitle(e.target.value)}
                      placeholder="e.g., Client Visit to Mumbai"
                      style={{
                        width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(196,162,93,0.2)', borderRadius: '0.5rem', color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif"
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '1rem', background: 'rgba(196,162,93,0.1)', border: '1px dashed #C4A25D', borderRadius: '0.5rem', justifyContent: 'center', color: '#C4A25D', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.85rem' }}>
                      <Upload size={18} />
                      {isScanning ? 'AI is scanning your bill...' : 'Upload & Scan Bill (Image/PDF)'}
                      <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleFileUpload} disabled={isScanning} />
                    </label>
                  </div>

                  {bills.length > 0 && (
                    <div style={{ marginBottom: '1.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                      {bills.map((b, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', marginBottom: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div>
                            <span style={{ color: '#fff', fontSize: '0.8rem', fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'block' }}>{b.merchant}</span>
                            <span style={{ color: 'var(--atmos-muted)', fontSize: '0.65rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{b.extractedCategory}</span>
                          </div>
                          <span style={{ color: '#C4A25D', fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.85rem' }}>₹{b.extractedAmount}</span>
                        </div>
                      ))}
                      <div style={{ textAlign: 'right', color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.9rem', marginTop: '1rem', fontWeight: 600 }}>
                        Total: ₹{bills.reduce((sum, b) => sum + b.extractedAmount, 0)}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button onClick={() => setShowModal(false)} style={{ padding: '0.6rem 1rem', background: 'transparent', color: 'var(--atmos-muted)', border: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.8rem' }}>Cancel</button>
                    <button onClick={handleSubmit} disabled={isSubmitting || bills.length === 0 || !title} style={{ padding: '0.6rem 1.25rem', background: '#C4A25D', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.8rem', fontWeight: 600 }}>
                      {isSubmitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </PageTransition>
  );
}
