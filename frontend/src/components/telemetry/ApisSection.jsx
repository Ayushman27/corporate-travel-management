/**
 * API & Tool Monitoring Section
 */
import { SectionCard, StatusBadge, StatusDot } from './TelemetryWidgets';

export default function ApisSection({ apis }) {
  const topFailing = [...apis].sort((a, b) => b.errorRate - a.errorRate).slice(0, 5);

  return (
    <div className="tm-section">
      <div className="tm-section-title">API & Tool Monitoring</div>

      {/* Dependency Health Map */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {apis.map(a => (
          <div key={a.id} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 0.85rem',
            background: 'var(--tm-surface)', border: '1px solid var(--tm-border)',
            borderRadius: '0.6rem', fontSize: '0.7rem', fontWeight: 500,
            transition: 'border-color 0.2s',
          }}>
            <StatusDot status={a.status} />
            <span style={{ color: 'var(--tm-text)' }}>{a.icon} {a.name}</span>
            <span className="tm-mono" style={{ color: 'var(--tm-text-3)', fontSize: '0.62rem' }}>{a.latency}ms</span>
          </div>
        ))}
      </div>

      {/* Full API table */}
      <SectionCard title="API Performance Detail" flush>
        <div style={{ overflowX: 'auto' }}>
          <table className="tm-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Category</th>
                <th>Status</th>
                <th>Latency</th>
                <th>P95</th>
                <th>P99</th>
                <th>Error %</th>
                <th>Calls</th>
                <th>Timeouts</th>
                <th>4xx</th>
                <th>5xx</th>
                <th>Rate Limits</th>
                <th>Retries</th>
              </tr>
            </thead>
            <tbody>
              {apis.map(a => (
                <tr key={a.id} className="tm-row-click">
                  <td style={{ fontWeight: 600 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <StatusDot status={a.status} />
                      {a.name}
                    </span>
                  </td>
                  <td style={{ color: 'var(--tm-text-2)' }}>{a.category}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td className="tm-mono">{a.latency}ms</td>
                  <td className="tm-mono">{a.p95Latency}ms</td>
                  <td className="tm-mono">{a.p99Latency}ms</td>
                  <td>
                    <StatusBadge
                      status={a.errorRate < 1 ? 'success' : a.errorRate < 3 ? 'warning' : 'error'}
                      label={`${a.errorRate}%`}
                    />
                  </td>
                  <td className="tm-mono">{a.calls.toLocaleString()}</td>
                  <td className="tm-mono" style={{ color: a.timeouts > 5 ? 'var(--tm-warning)' : 'var(--tm-text)' }}>{a.timeouts}</td>
                  <td className="tm-mono">{a.http4xx}</td>
                  <td className="tm-mono" style={{ color: a.http5xx > 5 ? 'var(--tm-error)' : 'var(--tm-text)' }}>{a.http5xx}</td>
                  <td className="tm-mono">{a.rateLimits}</td>
                  <td className="tm-mono">{a.retries}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Top Failing APIs */}
      <div style={{ marginTop: '1rem' }}>
        <SectionCard title="🔴 Top Failing APIs" flush>
          <table className="tm-table">
            <thead><tr><th>API</th><th>Error Rate</th><th>5xx</th><th>Timeouts</th></tr></thead>
            <tbody>
              {topFailing.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 500 }}>{a.icon} {a.name}</td>
                  <td><StatusBadge status={a.errorRate < 1 ? 'success' : a.errorRate < 3 ? 'warning' : 'error'} label={`${a.errorRate}%`} /></td>
                  <td className="tm-mono" style={{ color: 'var(--tm-error)' }}>{a.http5xx}</td>
                  <td className="tm-mono">{a.timeouts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      </div>
    </div>
  );
}
