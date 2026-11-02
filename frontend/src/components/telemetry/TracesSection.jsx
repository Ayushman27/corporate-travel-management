/**
 * Trace Explorer + Logs Stream + Trace Detail Drawer
 */
import { useState } from 'react';
import { SectionCard, StatusBadge, fmtDuration, fmtCost, timeAgo } from './TelemetryWidgets';

// ── Trace Detail Drawer ────────────────────────────────────────────────────
function TraceDrawer({ trace, onClose }) {
  if (!trace) return null;
  const statusColor = { success: 'var(--tm-success)', failed: 'var(--tm-error)', retry: 'var(--tm-warning)' };
  return (
    <>
      <div className="tm-drawer-overlay" onClick={onClose} />
      <div className="tm-drawer">
        <div className="tm-drawer-header">
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--tm-text)' }}>Trace Detail</div>
            <div className="tm-mono" style={{ fontSize: '0.65rem', color: 'var(--tm-text-3)', marginTop: 2 }}>{trace.traceId}</div>
          </div>
          <button className="tm-btn tm-btn--sm" onClick={onClose}>✕ Close</button>
        </div>
        <div className="tm-drawer-body">
          {/* Metadata grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem', marginBottom: '1.25rem', fontSize: '0.68rem' }}>
            <div><span style={{ color: 'var(--tm-text-3)' }}>Session:</span> <span className="tm-mono">{trace.sessionId}</span></div>
            <div><span style={{ color: 'var(--tm-text-3)' }}>User:</span> <span className="tm-mono">{trace.userId}</span></div>
            <div><span style={{ color: 'var(--tm-text-3)' }}>Company:</span> {trace.company}</div>
            <div><span style={{ color: 'var(--tm-text-3)' }}>Workflow:</span> {trace.workflow}</div>
            <div><span style={{ color: 'var(--tm-text-3)' }}>Duration:</span> <span className="tm-mono">{fmtDuration(trace.duration)}</span></div>
            <div><span style={{ color: 'var(--tm-text-3)' }}>Status:</span> <StatusBadge status={trace.status} /></div>
            <div><span style={{ color: 'var(--tm-text-3)' }}>Model:</span> {trace.model}</div>
            <div><span style={{ color: 'var(--tm-text-3)' }}>Tokens:</span> <span className="tm-mono">{trace.totalTokens.toLocaleString()}</span></div>
            <div><span style={{ color: 'var(--tm-text-3)' }}>Cost:</span> <span className="tm-mono">{fmtCost(trace.totalCost)}</span></div>
            <div><span style={{ color: 'var(--tm-text-3)' }}>Started:</span> {timeAgo(trace.startTime)}</div>
          </div>

          {/* Error banner */}
          {trace.error && (
            <div style={{ padding: '0.6rem 0.85rem', background: 'var(--tm-error-bg)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.68rem', color: 'var(--tm-error)' }}>
              ⚠ {trace.error}
            </div>
          )}

          {/* Agents involved */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--tm-text-3)', marginBottom: '0.4rem' }}>Agents Involved</div>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {trace.agents.map(a => <StatusBadge key={a} status="info" label={a} />)}
            </div>
          </div>

          {/* Execution Timeline */}
          <div style={{ fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--tm-text-3)', marginBottom: '0.6rem' }}>Execution Timeline</div>
          <div className="tm-timeline">
            {trace.steps.map((step, i) => (
              <div className="tm-timeline-step" key={i}>
                <div className="tm-timeline-dot" style={{ background: statusColor[step.status] || 'var(--tm-text-3)' }} />
                <div className="tm-timeline-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.7rem', color: 'var(--tm-text)' }}>{step.name}</span>
                    <StatusBadge status={step.status} />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.62rem', color: 'var(--tm-text-2)' }}>
                    <span className="tm-mono">⏱ {fmtDuration(step.duration)}</span>
                    {step.tokens > 0 && <span className="tm-mono">🔤 {step.tokens} tokens</span>}
                    <span>{step.detail}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Trace Table ────────────────────────────────────────────────────────────
function TraceExplorer({ traces, onSelectTrace }) {
  return (
    <SectionCard title="Recent Traces" flush>
      <table className="tm-table">
        <thead>
          <tr>
            <th>Trace ID</th>
            <th>Workflow</th>
            <th>Company</th>
            <th>User</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Tokens</th>
            <th>Cost</th>
            <th>Agents</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          {traces.map(t => (
            <tr key={t.traceId} className="tm-row-click" onClick={() => onSelectTrace(t)}>
              <td className="tm-mono" style={{ color: 'var(--tm-info)', fontSize: '0.65rem' }}>{t.traceId}</td>
              <td>{t.workflow}</td>
              <td style={{ color: 'var(--tm-text-2)' }}>{t.company}</td>
              <td className="tm-mono" style={{ fontSize: '0.65rem' }}>{t.userId}</td>
              <td><StatusBadge status={t.status} /></td>
              <td className="tm-mono">{fmtDuration(t.duration)}</td>
              <td className="tm-mono">{t.totalTokens.toLocaleString()}</td>
              <td className="tm-mono">{fmtCost(t.totalCost)}</td>
              <td style={{ fontSize: '0.62rem', color: 'var(--tm-text-2)' }}>{t.agents.length} agents</td>
              <td style={{ color: 'var(--tm-text-3)', fontSize: '0.62rem' }}>{timeAgo(t.startTime)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </SectionCard>
  );
}

// ── Logs Stream ────────────────────────────────────────────────────────────
function LogsStream({ logs }) {
  const [search, setSearch] = useState('');
  const [sevFilter, setSevFilter] = useState('all');
  const filtered = logs.filter(l => {
    if (sevFilter !== 'all' && l.severity !== sevFilter) return false;
    if (search && !l.message.toLowerCase().includes(search.toLowerCase()) && !l.traceId.includes(search)) return false;
    return true;
  }).slice(0, 30);

  return (
    <SectionCard
      title="Event Log Stream"
      headerRight={
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search logs..."
            style={{
              padding: '0.3rem 0.6rem', fontSize: '0.65rem', fontFamily: "'Plus Jakarta Sans', sans-serif",
              background: 'var(--tm-surface-2)', border: '1px solid var(--tm-border)',
              borderRadius: '0.4rem', color: 'var(--tm-text)', outline: 'none', width: 160,
            }}
          />
          {['all', 'error', 'warning', 'info'].map(f => (
            <button key={f} className={`tm-btn tm-btn--sm ${sevFilter === f ? 'tm-btn--accent' : 'tm-btn--ghost'}`}
              onClick={() => setSevFilter(f)} style={{ textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>
      }
      flush
    >
      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        <table className="tm-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Severity</th>
              <th>Type</th>
              <th>Agent / Service</th>
              <th>Message</th>
              <th>Trace</th>
              <th>Duration</th>
              <th>Company</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(log => (
              <tr key={log.id} className="tm-row-click">
                <td style={{ fontSize: '0.6rem', color: 'var(--tm-text-3)', whiteSpace: 'nowrap' }}>
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </td>
                <td><StatusBadge status={log.severity} /></td>
                <td style={{ color: 'var(--tm-text-2)', fontSize: '0.62rem' }}>{log.type}</td>
                <td style={{ fontWeight: 500, fontSize: '0.65rem' }}>{log.agent}</td>
                <td style={{ fontSize: '0.65rem', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.message}</td>
                <td className="tm-mono" style={{ color: 'var(--tm-info)', fontSize: '0.6rem' }}>{log.traceId.slice(0, 12)}</td>
                <td className="tm-mono" style={{ fontSize: '0.62rem' }}>{fmtDuration(log.duration)}</td>
                <td style={{ color: 'var(--tm-text-3)', fontSize: '0.62rem' }}>{log.company}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

// ── Combined Export ─────────────────────────────────────────────────────────
export default function TracesSection({ traces, logs }) {
  const [selectedTrace, setSelectedTrace] = useState(null);
  return (
    <div className="tm-section">
      <div className="tm-section-title">Traces & Logs</div>
      <div style={{ marginBottom: '1rem' }}>
        <TraceExplorer traces={traces} onSelectTrace={setSelectedTrace} />
      </div>
      <LogsStream logs={logs} />
      {selectedTrace && <TraceDrawer trace={selectedTrace} onClose={() => setSelectedTrace(null)} />}
    </div>
  );
}
