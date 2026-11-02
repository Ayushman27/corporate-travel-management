/**
 * Cost Monitoring Section
 */
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';
import { SectionCard, fmtCost } from './TelemetryWidgets';

const chartTooltip = {
  contentStyle: { background: 'var(--tm-surface)', border: '1px solid var(--tm-border)', borderRadius: 8, fontSize: '0.68rem', fontFamily: "'Plus Jakarta Sans', sans-serif" },
};

export default function CostsSection({ costs }) {
  return (
    <div className="tm-section">
      <div className="tm-section-title">Cost Monitoring</div>

      {/* Cost summary cards */}
      <div className="tm-grid tm-grid-3" style={{ marginBottom: '1rem' }}>
        <div className="tm-kpi">
          <span className="tm-kpi-label">Total AI Cost Today</span>
          <span className="tm-kpi-value" style={{ color: 'var(--tm-purple)' }}>
            {fmtCost(costs.aiCostOverTime.reduce((s, d) => s + d.value, 0))}
          </span>
        </div>
        <div className="tm-kpi">
          <span className="tm-kpi-label">Total API Cost Today</span>
          <span className="tm-kpi-value" style={{ color: 'var(--tm-accent)' }}>
            {fmtCost(costs.apiCostOverTime.reduce((s, d) => s + d.value, 0))}
          </span>
        </div>
        <div className="tm-kpi">
          <span className="tm-kpi-label">Avg Cost / Booking</span>
          <span className="tm-kpi-value">{fmtCost(costs.avgCostPerBooking)}</span>
        </div>
      </div>

      {/* Cost charts */}
      <div className="tm-grid tm-grid-2" style={{ marginBottom: '1rem' }}>
        <SectionCard title="AI Model Cost Over Time">
          <div className="tm-chart-wrap--sm">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={costs.aiCostOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--tm-border)" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'var(--tm-text-3)' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9, fill: 'var(--tm-text-3)' }} width={30} tickFormatter={v => `$${v}`} />
                <Tooltip {...chartTooltip} formatter={v => `$${v.toFixed(2)}`} />
                <defs>
                  <linearGradient id="aiCostGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} fill="url(#aiCostGrad)" dot={false} name="AI Cost" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="External API Cost Over Time">
          <div className="tm-chart-wrap--sm">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={costs.apiCostOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--tm-border)" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'var(--tm-text-3)' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9, fill: 'var(--tm-text-3)' }} width={30} tickFormatter={v => `$${v}`} />
                <Tooltip {...chartTooltip} formatter={v => `$${v.toFixed(2)}`} />
                <defs>
                  <linearGradient id="apiCostGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C4A25D" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#C4A25D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#C4A25D" strokeWidth={2} fill="url(#apiCostGrad)" dot={false} name="API Cost" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* Cost tables */}
      <div className="tm-grid tm-grid-2">
        <SectionCard title="Cost by Agent" flush>
          <table className="tm-table">
            <thead><tr><th>Agent</th><th>Cost</th><th>Tokens</th><th>Runs</th><th>$/Run</th></tr></thead>
            <tbody>
              {costs.costByAgent.map(a => (
                <tr key={a.name}>
                  <td style={{ fontWeight: 500 }}>{a.name}</td>
                  <td className="tm-mono" style={{ color: 'var(--tm-purple)' }}>{fmtCost(a.cost)}</td>
                  <td className="tm-mono">{a.tokens.toLocaleString()}</td>
                  <td className="tm-mono">{a.runs}</td>
                  <td className="tm-mono">{fmtCost(a.cost / a.runs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>

        <SectionCard title="Cost by Provider" flush>
          <table className="tm-table">
            <thead><tr><th>Provider</th><th>Cost</th></tr></thead>
            <tbody>
              {costs.costByProvider.map(p => (
                <tr key={p.name}>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td className="tm-mono" style={{ color: 'var(--tm-accent)' }}>{fmtCost(p.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      </div>

      {/* Expensive traces */}
      <div style={{ marginTop: '1rem' }}>
        <SectionCard title="💰 Unusually Expensive Traces" flush>
          <table className="tm-table">
            <thead><tr><th>Trace ID</th><th>Workflow</th><th>Cost</th><th>Reason</th></tr></thead>
            <tbody>
              {costs.expensiveTraces.map(t => (
                <tr key={t.traceId} className="tm-row-click">
                  <td className="tm-mono" style={{ color: 'var(--tm-info)', fontSize: '0.65rem' }}>{t.traceId}</td>
                  <td>{t.workflow}</td>
                  <td className="tm-mono" style={{ color: 'var(--tm-error)', fontWeight: 600 }}>{fmtCost(t.cost)}</td>
                  <td style={{ color: 'var(--tm-text-2)', fontSize: '0.65rem' }}>{t.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      </div>
    </div>
  );
}
