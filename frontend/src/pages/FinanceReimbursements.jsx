import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import PageTransition from '../components/common/PageTransition';
import { Check, X, FileText, IndianRupee, Receipt } from 'lucide-react';
import api from '../services/api';

export default function FinanceReimbursements() {
  const [reimbursements, setReimbursements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReimbursements();
  }, []);

  const fetchReimbursements = async () => {
    try {
      const res = await api.get('/reimbursements/finance');
      setReimbursements(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessBill = async (reimbursementId, billId, status) => {
    const reason = status === 'rejected' ? prompt("Enter rejection reason:") : '';
    if (status === 'rejected' && reason === null) return;

    try {
      await api.put(`/reimbursements/finance/${reimbursementId}/bills/${billId}`, {
        status,
        rejectReason: reason
      });
      fetchReimbursements();
    } catch (err) {
      console.error(err);
      alert('Failed to process bill');
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
        background: 'radial-gradient(circle at top right, rgba(26,95,122,0.05), transparent 60%)'
      }}>
        <main style={{ padding: '2rem' }}>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: '2.4rem',
            color: 'var(--atmos-dark)', fontWeight: 500, margin: '0 0 2rem 0'
          }}>Finance - Reimbursements</h1>

          {loading ? (
            <p>Loading...</p>
          ) : reimbursements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--atmos-muted)', fontFamily: 'Montserrat', fontSize: '0.85rem' }}>
              <Receipt size={48} style={{ color: '#ffffff', opacity: 0.7, margin: '0 auto 1rem' }} />
              <p>No pending reimbursements.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {reimbursements.map((r, i) => (
                <motion.div
                  key={r._id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  style={{
                    padding: '1.5rem', borderRadius: '1rem',
                    background: 'var(--atmos-glass)', border: '1px solid rgba(196,162,93,0.15)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.25rem 0', fontFamily: 'Montserrat', fontSize: '1.1rem', color: 'var(--atmos-dark)' }}>{r.title}</h3>
                      <p style={{ margin: 0, fontFamily: 'Montserrat', fontSize: '0.8rem', color: 'var(--atmos-mid)' }}>
                        Employee: {r.employeeId.name} ({r.employeeId.email}) • Dept: {r.employeeId.department}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: '0.7rem', fontFamily: 'Montserrat', padding: '0.25rem 0.75rem', borderRadius: '1rem',
                        background: r.status === 'processed' ? 'rgba(39,174,96,0.1)' : 'rgba(232,168,56,0.1)',
                        color: r.status === 'processed' ? '#27AE60' : '#E8A838', fontWeight: 600
                      }}>
                        {r.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {r.bills.map(b => (
                      <div key={b._id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '1rem', background: 'rgba(255,255,255,0.4)', borderRadius: '0.5rem',
                        border: '1px solid rgba(0,0,0,0.03)'
                      }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <img src={b.billUrl} alt="Bill" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '0.25rem', border: '1px solid #ddd' }} />
                          <div>
                            <p style={{ margin: '0 0 0.2rem 0', fontFamily: 'Montserrat', fontWeight: 600, fontSize: '0.9rem', color: 'var(--atmos-dark)' }}>{b.merchant} - {b.extractedCategory}</p>
                            <p style={{ margin: 0, fontFamily: 'Montserrat', fontSize: '0.75rem', color: 'var(--atmos-muted)' }}>{b.extractedDate}</p>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                          <span style={{ fontFamily: 'Cormorant Garamond', fontSize: '1.3rem', fontWeight: 600, color: 'var(--atmos-dark)' }}>
                            ₹{b.extractedAmount}
                          </span>
                          
                          {b.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => handleProcessBill(r._id, b._id, 'approved')}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  width: '32px', height: '32px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                                  background: 'rgba(39,174,96,0.1)', color: '#27AE60'
                                }} title="Approve"
                              ><Check size={16} /></button>
                              <button
                                onClick={() => handleProcessBill(r._id, b._id, 'rejected')}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  width: '32px', height: '32px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                                  background: 'rgba(192,57,43,0.1)', color: '#C0392B'
                                }} title="Reject"
                              ><X size={16} /></button>
                            </div>
                          ) : (
                            <span style={{
                              fontSize: '0.7rem', fontFamily: 'Montserrat', padding: '0.2rem 0.6rem', borderRadius: '1rem',
                              background: b.status === 'approved' ? 'rgba(39,174,96,0.1)' : 'rgba(192,57,43,0.1)',
                              color: b.status === 'approved' ? '#27AE60' : '#C0392B', fontWeight: 600
                            }}>
                              {b.status.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'flex-end', gap: '2rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontFamily: 'Montserrat', fontSize: '0.75rem', color: 'var(--atmos-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Requested</p>
                      <p style={{ margin: 0, fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', fontWeight: 600, color: 'var(--atmos-dark)' }}>₹{r.totalRequestedAmount.toLocaleString()}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontFamily: 'Montserrat', fontSize: '0.75rem', color: '#27AE60', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approved So Far</p>
                      <p style={{ margin: 0, fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', fontWeight: 600, color: '#27AE60' }}>₹{r.totalApprovedAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    </PageTransition>
  );
}
