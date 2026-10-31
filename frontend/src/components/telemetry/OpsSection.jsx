/**
 * Business Funnel + Alerts Section
 */
import { useState } from 'react';
import { SectionCard, SeverityIcon, StatusBadge, timeAgo } from './TelemetryWidgets';

// ── Business Funnel ────────────────────────────────────────────────────────
function BusinessFunnel({ funnel }) {
  const maxVal = funnel[0]?.value || 1;
  return (
    <SectionCard title="Travel Operations Funnel">
      <div>
        {funnel.map((step, i) => {
          const prevVal = i > 0 ? funnel[i - 1].value : step.value;
          const convRate = i > 0 ? ((step.value / prevVal) * 100).toFixed(1) : '100';
          const barPct = (step.value / maxVal) * 100;
          return (
            <div className="tm-funnel-step" key={step.label}>
              <span className="tm-funnel-label">{step.label}</span>
              <div className="tm-funnel-bar-wrap">
                <div className="tm-funnel-bar" style={{ width: `${barPct}%`, background: step.color, opacity: 0.75 }} />
              </div>
              <span className="tm-funnel-value">{step.value.toLocaleString()}</span>
              <span className="tm-funnel-rate">{i > 0 ? `${convRate}%` : ''}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', padding: '0.5rem 0', borderTop: '1px solid var(--tm-border)' }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--tm-text-3)' }}>Overall conversion: Search → Booking</span>
        <span className="tm-mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--tm-accent)' }}>
          {((funnel[funnel.length - 2]?.value / funnel[0]?.value) * 100).toFixed(1)}%
        </span>
      </div>
    </SectionCard>
  );
}

// ── Alert Center ───────────────────────────────────────────────────────────
function AlertCenter({ alerts }) {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.severity === filter);
  const critCount = alerts.filter(a => a.severity === 'critical').length;
  const warnCount = alerts.filter(a => a.severity === 'warning').length;

  return (
    <SectionCard
      title="Alert Center"
      headerRight={
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          {critCount > 0 && <StatusBadge status="critical" label={`${critCount} critical`} />}
          {warnCount > 0 && <StatusBadge status="warning" label={`${warnCount} warning`} />}
          <div style={{ display: 'flex', gap: 2, marginLeft: '0.5rem' }}>
            {['all', 'critical', 'warning', 'info'].map(f => (
              <button key={f} className={`tm-btn tm-btn--sm ${filter === f ? 'tm-btn--accent' : 'tm-btn--ghost'}`}
                onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>
                {f}
              </button>
            ))}
          </div>
        </div>
      }
      flush
    >
      {filtered.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--tm-text-3)', fontSize: '0.72rem' }}>
          No alerts matching filter
        </div>
      ) : (
        filtered.map(alert => (
          <div className="tm-alert-item" key={alert.id}>
            <SeverityIcon severity={alert.severity} />
            <div className="tm-alert-body">
              <div className="tm-alert-title-row">
                <span className="tm-alert-msg">{alert.title}</span>
                <StatusBadge status={alert.status} />
              </div>
              <div className="tm-alert-desc">{alert.desc}</div>
              <div className="tm-alert-meta">
                {alert.component} · {timeAgo(alert.timestamp)} · {alert.impactedTraces} traces impacted
              </div>
            </div>
            <div className="tm-alert-actions">
              <button className="tm-btn tm-btn--sm">Ack</button>
              <button className="tm-btn tm-btn--sm">Mute</button>
            </div>
          </div>
        ))
      )}
    </SectionCard>
  );
}

// ── Combined Export ─────────────────────────────────────────────────────────
export default function OpsSection({ funnel, alerts }) {
  return (
    <div className="tm-section">
      <div className="tm-section-title">Business Funnel & Alerts</div>
      <div className="tm-grid tm-grid-2">
        <BusinessFunnel funnel={funnel} />
        <AlertCenter alerts={alerts} />
      </div>
    </div>
  );
}
