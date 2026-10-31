/**
 * Reusable Telemetry Widget Components
 * MetricCard, StatusBadge, Sparkline, HealthRing, SectionCard
 */
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

// ── Sparkline ──────────────────────────────────────────────────────────────
export function Sparkline({ data, color = 'var(--tm-accent)', height = 32, width = 80 }) {
  if (!data || data.length === 0) return null;
  return (
    <ResponsiveContainer width={width} height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5}
          fill={`url(#spark-${color.replace(/[^a-z0-9]/gi, '')})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Metric / KPI Card ──────────────────────────────────────────────────────
export function MetricCard({ label, value, unit, trend, spark, sparkColor, tooltip }) {
  const trendUp = trend > 0;
  const trendClass = trend === 0 ? 'tm-kpi-trend--neutral' : trendUp ? 'tm-kpi-trend--up' : 'tm-kpi-trend--down';
  return (
    <div className="tm-kpi" title={tooltip}>
      <span className="tm-kpi-label">{label}</span>
      <span className="tm-kpi-value">
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && <span style={{ fontSize: '0.65rem', fontWeight: 400, marginLeft: 2, color: 'var(--tm-text-2)' }}>{unit}</span>}
      </span>
      {trend !== undefined && trend !== null && (
        <span className={`tm-kpi-trend ${trendClass}`}>
          {trendUp ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
          <span style={{ fontWeight: 400, color: 'var(--tm-text-3)', marginLeft: 4 }}>vs prev</span>
        </span>
      )}
      {spark && (
        <div className="tm-kpi-spark">
          <Sparkline data={spark} color={sparkColor || 'var(--tm-accent)'} height={28} width={70} />
        </div>
      )}
    </div>
  );
}

// ── Status Badge ───────────────────────────────────────────────────────────
export function StatusBadge({ status, label }) {
  const map = {
    success: 'tm-badge--success', healthy: 'tm-badge--success',
    warning: 'tm-badge--warning', degraded: 'tm-badge--warning', 'half-open': 'tm-badge--warning',
    error: 'tm-badge--error', critical: 'tm-badge--error', failed: 'tm-badge--error', down: 'tm-badge--error',
    info: 'tm-badge--info', active: 'tm-badge--info',
    neutral: 'tm-badge--neutral', closed: 'tm-badge--success', resolved: 'tm-badge--neutral',
    investigating: 'tm-badge--purple', acknowledged: 'tm-badge--warning',
  };
  return <span className={`tm-badge ${map[status] || 'tm-badge--neutral'}`}>{label || status}</span>;
}

// ── Status Dot ─────────────────────────────────────────────────────────────
export function StatusDot({ status }) {
  const map = { healthy: 'tm-dot--healthy', degraded: 'tm-dot--degraded', down: 'tm-dot--down' };
  return <span className={`tm-dot ${map[status] || 'tm-dot--unknown'}`} />;
}

// ── Progress Bar ───────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = 'var(--tm-accent)' }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="tm-progress">
      <div className="tm-progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ── Section Card (reusable wrapper) ────────────────────────────────────────
export function SectionCard({ title, icon, headerRight, children, flush }) {
  return (
    <div className="tm-card">
      {title && (
        <div className="tm-card-header">
          <div className="tm-card-title">{icon} {title}</div>
          {headerRight}
        </div>
      )}
      <div className={flush ? 'tm-card-body--flush' : 'tm-card-body'}>
        {children}
      </div>
    </div>
  );
}

// ── Health Score Ring ───────────────────────────────────────────────────────
export function HealthRing({ score }) {
  const color = score >= 95 ? 'var(--tm-success)' : score >= 80 ? 'var(--tm-warning)' : 'var(--tm-error)';
  const circumference = 2 * Math.PI * 34;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="tm-health-ring">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="34" fill="none" stroke="var(--tm-surface-2)" strokeWidth="6" />
        <circle cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 40 40)"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <span className="tm-health-value" style={{ position: 'absolute', color }}>{score}</span>
    </div>
  );
}

// ── Severity Icon ──────────────────────────────────────────────────────────
export function SeverityIcon({ severity }) {
  const map = {
    critical: { cls: 'tm-alert-icon--critical', icon: '🔴' },
    warning:  { cls: 'tm-alert-icon--warning',  icon: '🟡' },
    info:     { cls: 'tm-alert-icon--info',      icon: '🔵' },
  };
  const s = map[severity] || map.info;
  return <div className={`tm-alert-icon ${s.cls}`}>{s.icon}</div>;
}

// ── Time Ago Helper ────────────────────────────────────────────────────────
export function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Format Duration ────────────────────────────────────────────────────────
export function fmtDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ── Format Cost ────────────────────────────────────────────────────────────
export function fmtCost(val) {
  return `$${val.toFixed(2)}`;
}
