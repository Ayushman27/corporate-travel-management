/**
 * Overview Section — KPI strip + System Health charts + Health Score
 */
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MetricCard, SectionCard, HealthRing, StatusBadge, ProgressBar } from './TelemetryWidgets';

const chartTooltipStyle = {
  contentStyle: { background: 'var(--tm-surface)', border: '1px solid var(--tm-border)', borderRadius: 8, fontSize: '0.68rem', fontFamily: 'Montserrat' },
  labelStyle: { color: 'var(--tm-text-2)', fontSize: '0.6rem' },
};

export default function OverviewSection({ kpi, health }) {
  return (
    <div>
      {/* KPI Strip */}
      <div className="tm-kpi-strip">
        <MetricCard label="Total Requests" value={kpi.totalRequests.value} trend={kpi.totalRequests.trend} spark={kpi.totalRequests.spark} sparkColor="var(--tm-info)" tooltip="Total API requests processed today" />
        <MetricCard label="Active Sessions" value={kpi.activeSessions.value} trend={kpi.activeSessions.trend} spark={kpi.activeSessions.spark} sparkColor="var(--tm-purple)" />
        <MetricCard label="Agent Runs" value={kpi.agentRuns.value} trend={kpi.agentRuns.trend} spark={kpi.agentRuns.spark} sparkColor="var(--tm-accent)" />
        <MetricCard label="Success Rate" value={kpi.successRate.value} unit="%" trend={kpi.successRate.trend} sparkColor="var(--tm-success)" />
        <MetricCard label="Error Rate" value={kpi.errorRate.value} unit="%" trend={kpi.errorRate.trend} sparkColor="var(--tm-error)" />
        <MetricCard label="P95 Latency" value={kpi.p95Latency.value} unit="ms" trend={kpi.p95Latency.trend} spark={kpi.p95Latency.spark} sparkColor="var(--tm-warning)" />
        <MetricCard label="Bookings Today" value={kpi.bookingsToday.value} trend={kpi.bookingsToday.trend} spark={kpi.bookingsToday.spark} sparkColor="var(--tm-success)" />
        <MetricCard label="API Calls" value={kpi.apiCalls.value} trend={kpi.apiCalls.trend} spark={kpi.apiCalls.spark} sparkColor="var(--tm-info)" />
        <MetricCard label="AI Cost" value={`$${kpi.aiCost.value}`} trend={kpi.aiCost.trend} spark={kpi.aiCost.spark} sparkColor="var(--tm-purple)" />
        <MetricCard label="API Cost" value={`$${kpi.apiCost.value}`} trend={kpi.apiCost.trend} spark={kpi.apiCost.spark} sparkColor="var(--tm-accent)" />
        <MetricCard label="Open Alerts" value={kpi.openAlerts.value} trend={kpi.openAlerts.trend} sparkColor="var(--tm-error)" />
      </div>

      {/* System Health Section */}
      <div className="tm-section">
        <div className="tm-section-title">System Health</div>
        <div className="tm-grid tm-grid-3" style={{ marginBottom: '1rem' }}>
          {/* Requests / min */}
          <SectionCard title="Requests / min">
            <div className="tm-chart-wrap--sm">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={health.requestsPerMin}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--tm-border)" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'var(--tm-text-3)' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: 'var(--tm-text-3)' }} width={35} />
                  <Tooltip {...chartTooltipStyle} />
                  <defs>
                    <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#reqGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          {/* Error Rate over time */}
          <SectionCard title="Error Rate %">
            <div className="tm-chart-wrap--sm">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={health.errorRateTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--tm-border)" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'var(--tm-text-3)' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: 'var(--tm-text-3)' }} width={30} />
                  <Tooltip {...chartTooltipStyle} />
                  <defs>
                    <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} fill="url(#errGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          {/* Latency P50/P95/P99 */}
          <SectionCard title="Latency (ms)">
            <div className="tm-chart-wrap--sm">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={health.latency}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--tm-border)" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'var(--tm-text-3)' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: 'var(--tm-text-3)' }} width={40} />
                  <Tooltip {...chartTooltipStyle} />
                  <Line type="monotone" dataKey="p50" stroke="#10b981" strokeWidth={1.5} dot={false} name="P50" />
                  <Line type="monotone" dataKey="p95" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="P95" />
                  <Line type="monotone" dataKey="p99" stroke="#ef4444" strokeWidth={1.5} dot={false} name="P99" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        {/* Health indicators row */}
        <div className="tm-grid tm-grid-5">
          <SectionCard title="Health Score">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0' }}>
              <HealthRing score={Math.round(health.uptime * 100) / 100 > 99.9 ? 98 : 87} />
            </div>
          </SectionCard>

          <SectionCard title="Uptime">
            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--tm-success)', fontVariantNumeric: 'tabular-nums' }}>{health.uptime}%</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--tm-text-3)', marginTop: 4 }}>Last 30 days</div>
            </div>
          </SectionCard>

          <SectionCard title="Queue Backlog">
            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              <div className="tm-mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: health.queueBacklog > 30 ? 'var(--tm-warning)' : 'var(--tm-text)' }}>
                {health.queueBacklog}
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--tm-text-3)', marginTop: 4 }}>pending jobs</div>
            </div>
          </SectionCard>

          <SectionCard title="Rate Limits">
            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              <div className="tm-mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--tm-warning)' }}>{health.rateLimitEvents}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--tm-text-3)', marginTop: 4 }}>events today</div>
            </div>
          </SectionCard>

          <SectionCard title="Retries">
            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              <div className="tm-mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--tm-text-2)' }}>{health.retryVolume}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--tm-text-3)', marginTop: 4 }}>retry attempts</div>
            </div>
          </SectionCard>
        </div>

        {/* Circuit breakers */}
        <div style={{ marginTop: '1rem' }}>
          <SectionCard title="Circuit Breakers">
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {health.circuitBreakers.map(cb => (
                <div key={cb.service} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.7rem', background: 'var(--tm-surface-2)', borderRadius: '0.4rem', fontSize: '0.68rem' }}>
                  <StatusBadge status={cb.status} />
                  <span style={{ color: 'var(--tm-text-2)' }}>{cb.service}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
