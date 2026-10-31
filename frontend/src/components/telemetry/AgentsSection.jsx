/**
 * Agent Observability Section — runs, success rates, latency, cost, quality tables + charts
 */
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { SectionCard, StatusBadge, ProgressBar, fmtDuration, fmtCost } from './TelemetryWidgets';

const chartTooltip = {
  contentStyle: { background: 'var(--tm-surface)', border: '1px solid var(--tm-border)', borderRadius: 8, fontSize: '0.68rem', fontFamily: 'Montserrat' },
};

export default function AgentsSection({ agents }) {
  const topFailing = [...agents].sort((a, b) => b.failures - a.failures).slice(0, 5);
  const topSlowest = [...agents].sort((a, b) => b.p95Duration - a.p95Duration).slice(0, 5);

  return (
    <div className="tm-section">
      <div className="tm-section-title">AI Agent Observability</div>

      {/* Charts row */}
      <div className="tm-grid tm-grid-2" style={{ marginBottom: '1rem' }}>
        {/* Runs by Agent */}
        <SectionCard title="Total Runs by Agent">
          <div className="tm-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agents} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--tm-border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: 'var(--tm-text-3)' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: 'var(--tm-text-2)' }} width={100} />
                <Tooltip {...chartTooltip} />
                <Bar dataKey="totalRuns" fill="#C4A25D" radius={[0, 4, 4, 0]} barSize={16} name="Runs" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Success Rate by Agent */}
        <SectionCard title="Success Rate by Agent">
          <div className="tm-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agents} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--tm-border)" horizontal={false} />
                <XAxis type="number" domain={[90, 100]} tick={{ fontSize: 9, fill: 'var(--tm-text-3)' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: 'var(--tm-text-2)' }} width={100} />
                <Tooltip {...chartTooltip} />
                <Bar dataKey="successRate" fill="#10b981" radius={[0, 4, 4, 0]} barSize={16} name="Success %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* Full Agent Table */}
      <SectionCard title="Agent Performance Detail" flush>
        <div style={{ overflowX: 'auto' }}>
          <table className="tm-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Runs</th>
                <th>Active</th>
                <th>Success</th>
                <th>Failures</th>
                <th>Avg Dur</th>
                <th>P95 Dur</th>
                <th>Tokens</th>
                <th>Cost</th>
                <th>Tool Calls</th>
                <th>Handoffs</th>
                <th>Escalations</th>
                <th>Quality</th>
              </tr>
            </thead>
            <tbody>
              {agents.map(a => (
                <tr key={a.id} className="tm-row-click">
                  <td style={{ fontWeight: 600 }}>{a.name}</td>
                  <td className="tm-mono">{a.totalRuns}</td>
                  <td className="tm-mono">{a.activeSessions}</td>
                  <td>
                    <StatusBadge status={a.successRate >= 97 ? 'success' : a.successRate >= 93 ? 'warning' : 'error'} label={`${a.successRate}%`} />
                  </td>
                  <td className="tm-mono" style={{ color: a.failures > 10 ? 'var(--tm-error)' : 'var(--tm-text)' }}>{a.failures}</td>
                  <td className="tm-mono">{a.avgDuration}s</td>
                  <td className="tm-mono">{a.p95Duration}s</td>
                  <td className="tm-mono">{a.tokenUsage.toLocaleString()}</td>
                  <td className="tm-mono">{fmtCost(a.modelCost)}</td>
                  <td className="tm-mono">{a.toolCalls}</td>
                  <td className="tm-mono">{a.handoffs}</td>
                  <td className="tm-mono">{a.escalations}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="tm-mono" style={{ fontSize: '0.7rem', fontWeight: 600 }}>{a.qualityScore}</span>
                      <ProgressBar value={a.qualityScore} max={5} color={a.qualityScore >= 4.0 ? 'var(--tm-success)' : 'var(--tm-warning)'} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Ranked mini-tables */}
      <div className="tm-grid tm-grid-2" style={{ marginTop: '1rem' }}>
        <SectionCard title="🔴 Top Failing Agents" flush>
          <table className="tm-table">
            <thead><tr><th>Agent</th><th>Failures</th><th>Rate</th></tr></thead>
            <tbody>
              {topFailing.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 500 }}>{a.name}</td>
                  <td className="tm-mono" style={{ color: 'var(--tm-error)' }}>{a.failures}</td>
                  <td className="tm-mono">{(100 - a.successRate).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        <SectionCard title="🐢 Top Slowest Agents" flush>
          <table className="tm-table">
            <thead><tr><th>Agent</th><th>P95 Latency</th><th>Avg</th></tr></thead>
            <tbody>
              {topSlowest.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 500 }}>{a.name}</td>
                  <td className="tm-mono" style={{ color: 'var(--tm-warning)' }}>{a.p95Duration}s</td>
                  <td className="tm-mono">{a.avgDuration}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      </div>
    </div>
  );
}
