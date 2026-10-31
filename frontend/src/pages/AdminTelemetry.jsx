/**
 * Admin Telemetry Dashboard — Main Page
 * /admin/telemetry
 *
 * Production-grade observability surface for a corporate travel + multi-agent platform.
 * Sections: Overview · Agents · APIs & Tools · Operations · Traces · Costs
 */
import { useState, useMemo } from 'react';
import Navbar  from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import PageTransition from '../components/common/PageTransition';
import OverviewSection  from '../components/telemetry/OverviewSection';
import AgentsSection    from '../components/telemetry/AgentsSection';
import ApisSection      from '../components/telemetry/ApisSection';
import OpsSection       from '../components/telemetry/OpsSection';
import TracesSection    from '../components/telemetry/TracesSection';
import CostsSection     from '../components/telemetry/CostsSection';
import {
  getKPISummary, getSystemHealth, getAgentMetrics,
  getApiMetrics, getFunnelData, getAlerts,
  getTraces, getLogEvents, getCostData,
  TIME_RANGES, ENVIRONMENTS, AGENTS as AGENT_LIST, APIS as API_LIST, COMPANIES,
} from '../data/telemetryData';
import '../styles/telemetry.css';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'agents',   label: 'Agents' },
  { id: 'apis',     label: 'APIs & Tools' },
  { id: 'ops',      label: 'Operations' },
  { id: 'traces',   label: 'Traces & Logs' },
  { id: 'costs',    label: 'Costs' },
];

export default function AdminTelemetry() {
  const [tab, setTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('24h');
  const [env, setEnv] = useState('prod');

  // Load mock data (memoized so it doesn't regenerate on every tab switch)
  const kpi     = useMemo(() => getKPISummary(),    []);
  const health  = useMemo(() => getSystemHealth(),  []);
  const agents  = useMemo(() => getAgentMetrics(),  []);
  const apis    = useMemo(() => getApiMetrics(),    []);
  const funnel  = useMemo(() => getFunnelData(),    []);
  const alerts  = useMemo(() => getAlerts(),        []);
  const traces  = useMemo(() => getTraces(),        []);
  const logs    = useMemo(() => getLogEvents(),     []);
  const costs   = useMemo(() => getCostData(),      []);

  return (
    <div className="tm-page" style={{ minHeight: '100vh' }}>
      <Navbar />
      <Sidebar />

      <main style={{ marginLeft: '220px', paddingTop: '68px' }}>
        <div className="tm-content">
          <PageTransition>
            {/* Header */}
            <div className="tm-header">
              <div>
                <h1 className="tm-title">Telemetry Dashboard</h1>
                <p className="tm-subtitle">Platform observability · AI agents · APIs · Business metrics</p>
              </div>
              <div className="tm-header-actions">
                <button className="tm-btn">📥 Export Report</button>
                <button className="tm-btn tm-btn--accent">⟳ Refresh</button>
              </div>
            </div>

            {/* Global Filters */}
            <div className="tm-filters">
              <span className="tm-filter-label">Time</span>
              <select className="tm-filter-select" value={timeRange} onChange={e => setTimeRange(e.target.value)}>
                {TIME_RANGES.map(r => <option key={r} value={r}>{r === 'custom' ? 'Custom…' : `Last ${r}`}</option>)}
              </select>

              <span className="tm-filter-label" style={{ marginLeft: 8 }}>Env</span>
              <select className="tm-filter-select" value={env} onChange={e => setEnv(e.target.value)}>
                {ENVIRONMENTS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>

              <span className="tm-filter-label" style={{ marginLeft: 8 }}>Agent</span>
              <select className="tm-filter-select">
                <option value="">All agents</option>
                {AGENT_LIST.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>

              <span className="tm-filter-label" style={{ marginLeft: 8 }}>Provider</span>
              <select className="tm-filter-select">
                <option value="">All providers</option>
                {API_LIST.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>

              <span className="tm-filter-label" style={{ marginLeft: 8 }}>Company</span>
              <select className="tm-filter-select">
                <option value="">All companies</option>
                {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Tab Navigation */}
            <div className="tm-tabs">
              {TABS.map(t => (
                <button
                  key={t.id}
                  className={`tm-tab ${tab === t.id ? 'tm-tab--active' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {tab === 'overview' && <OverviewSection kpi={kpi} health={health} />}
            {tab === 'agents'   && <AgentsSection agents={agents} />}
            {tab === 'apis'     && <ApisSection apis={apis} />}
            {tab === 'ops'      && <OpsSection funnel={funnel} alerts={alerts} />}
            {tab === 'traces'   && <TracesSection traces={traces} logs={logs} />}
            {tab === 'costs'    && <CostsSection costs={costs} />}
          </PageTransition>
        </div>
      </main>
    </div>
  );
}
