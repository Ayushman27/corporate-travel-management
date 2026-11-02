import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[AeroSync ErrorBoundary caught]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d0d0d',
          color: '#e5e5e5',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '520px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(196, 162, 93, 0.3)',
            borderRadius: '1.25rem',
            padding: '2.5rem',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.8rem', color: '#C4A25D', marginBottom: '0.5rem' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#a3a3a3', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
                style={{
                  padding: '0.65rem 1.5rem', borderRadius: '0.6rem',
                  background: 'linear-gradient(135deg, #C4A25D, #B8923F)',
                  color: '#fff', border: 'none', cursor: 'pointer',
                  fontSize: '0.75rem', fontWeight: 600
                }}
              >
                Reload Page
              </button>
              <button
                onClick={() => { window.location.href = '/dashboard'; }}
                style={{
                  padding: '0.65rem 1.5rem', borderRadius: '0.6rem',
                  background: 'transparent',
                  border: '1px solid rgba(196, 162, 93, 0.3)',
                  color: '#C4A25D', cursor: 'pointer',
                  fontSize: '0.75rem', fontWeight: 600
                }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

