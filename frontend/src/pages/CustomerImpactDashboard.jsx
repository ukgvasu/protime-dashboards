import { useState, useEffect } from 'react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { Users, ExternalLink } from 'lucide-react';
import { api } from '../services/api';

const JIRA_BASE = 'https://engjira.int.kronos.com';
const PRODUCT_COLORS = { uta: '#005151', utm: '#0d9488', wfmClassic: '#b7950b' };
const PRODUCT_LABELS = { uta: 'UTA', utm: 'UTM', wfmClassic: 'WFM Classic' };
const PRIORITY_COLOR = { P1: '#dc2626', P2: '#ea580c', P3: '#b7950b', P4: '#6b7280', P5: '#9ca3af' };
const SEVERITY_COLOR = { S1: '#dc2626', S2: '#ea580c', S3: '#b7950b', S4: '#6b7280' };

function Badge({ text, color = '#6b7280' }) {
  return (
    <span className="inline-block text-xs font-semibold px-1.5 py-0.5 rounded" style={{ color, background: color + '18' }}>
      {text}
    </span>
  );
}

function StatCard({ label, value, sublabel, color = '#005151' }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-3xl font-bold" style={{ color }}>{value ?? '—'}</div>
      {sublabel && <div className="text-xs text-gray-400 mt-1">{sublabel}</div>}
    </div>
  );
}


export default function CustomerImpactDashboard({ product = 'uta' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [defectFilter, setDefectFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.getCustomerImpact(product)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [product]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading {PRODUCT_LABELS[product] || product} Customer Impact...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!data) return <div className="p-8 text-center text-gray-500">No data</div>;

  const color = PRODUCT_COLORS[product] || '#005151';
  const label = PRODUCT_LABELS[product] || product.toUpperCase();

  // Priority chart data
  const priorityChartData = ['P1', 'P2', 'P3', 'P4'].map(p => ({
    priority: p,
    count: data.byPriority?.[p] || 0,
    fill: PRIORITY_COLOR[p],
  }));

  // Severity chart data
  const severityChartData = Object.entries(data.bySeverity || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([s, count]) => ({ severity: s, count, fill: SEVERITY_COLOR[s] || '#6b7280' }));

  // Weekly trend chart data
  const weeklyTrendData = (data.weeklyTrend || []).map(w => ({
    week: w.week_start
      ? new Date(w.week_start + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : w.week,
    count: w.count,
  }));

  // All impacted defects filtered
  const allDefects = data.allImpactedDefects || [];
  const filteredDefects = defectFilter === 'p1p2'
    ? allDefects.filter(d => ['P1', 'P2'].includes(d.priority))
    : defectFilter === 'unassigned'
    ? allDefects.filter(d => !d.assignee || d.assignee === 'Unassigned')
    : allDefects;

  const sortedDefects = [...filteredDefects].sort((a, b) => {
    const pOrder = { P1: 0, P2: 1, P3: 2, P4: 3, P5: 4 };
    return (pOrder[a.priority] ?? 5) - (pOrder[b.priority] ?? 5);
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Users style={{ color }} size={28} />
        <div>
          <h1 className="text-2xl font-bold" style={{ color }}>{label} — Customer Impact</h1>
          <p className="text-sm text-gray-500 mt-1">Open defects with customer_count &gt; 0 — live from Jira</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard label="Impacted Defects" value={data.totalImpacted} sublabel="With customer_count > 0" color={color} />
        <StatCard label="Unique Customers" value={data.uniqueCustomers} sublabel="Across all defects" color={color} />
        <StatCard label="P1 + P2" value={(data.byPriority?.P1 || 0) + (data.byPriority?.P2 || 0)} sublabel="High priority" color="#dc2626" />
        <StatCard label="Avg Age" value={data.avgAgeDays != null ? `${data.avgAgeDays}d` : '—'} sublabel="Days open" color="#7c3aed" />
        <StatCard label="Unassigned" value={data.unassigned} sublabel="No assignee" color="#ca8a04" />
      </div>

      {/* Weekly defect trend */}
      {weeklyTrendData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-4">
          <h2 className="font-semibold text-gray-700 mb-1">Weekly Defect Trend — Last 60 Days</h2>
          <p className="text-xs text-gray-400 mb-4">Customer-impacted defects created per week</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={weeklyTrendData} margin={{ left: 0, right: 20, top: 5, bottom: 0 }}>
              <defs>
                <linearGradient id={`trendGrad-${product}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={30} />
              <Tooltip formatter={(v) => [v, 'Defects']} />
              <Area
                type="monotone"
                dataKey="count"
                stroke={color}
                strokeWidth={2}
                fill={`url(#trendGrad-${product})`}
                dot={{ r: 3, fill: color, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Priority + Severity breakdown */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-3">By Priority</h2>
          <div className="space-y-2">
            {priorityChartData.filter(p => p.count > 0).map(({ priority, count, fill }) => (
              <div key={priority}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="font-semibold" style={{ color: fill }}>{priority}</span>
                  <span className="font-semibold text-gray-700">{count}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(count / (data.totalImpacted || 1)) * 100}%`, background: fill }} />
                </div>
              </div>
            ))}
            {priorityChartData.every(p => p.count === 0) && <p className="text-xs text-gray-400">No data</p>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-3">By Severity</h2>
          <div className="space-y-2">
            {severityChartData.filter(s => s.count > 0).map(({ severity, count, fill }) => (
              <div key={severity}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="font-semibold" style={{ color: fill }}>{severity}</span>
                  <span className="font-semibold text-gray-700">{count}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(count / (data.totalImpacted || 1)) * 100}%`, background: fill }} />
                </div>
              </div>
            ))}
            {severityChartData.length === 0 && <p className="text-xs text-gray-400">No severity data</p>}
          </div>
        </div>
      </div>

      {/* All impacted defects table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-700 mb-1">All Impacted Defects ({data.totalImpacted})</h2>
        <p className="text-xs text-gray-400 mb-3">All open {label} defects with at least one impacted customer.</p>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-4">
          {[
            { key: 'all', label: `All (${allDefects.length})` },
            { key: 'p1p2', label: `P1+P2 (${allDefects.filter(d => ['P1','P2'].includes(d.priority)).length})` },
            { key: 'unassigned', label: `Unassigned (${allDefects.filter(d => !d.assignee || d.assignee === 'Unassigned').length})` },
          ].map(f => (
            <button key={f.key}
              onClick={() => setDefectFilter(f.key)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${defectFilter === f.key ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
              style={defectFilter === f.key ? { background: color } : {}}>
              {f.label}
            </button>
          ))}
        </div>

        {sortedDefects.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-4 text-center">No defects match this filter.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Key</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Summary</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Priority</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Severity</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Assignee</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Customer(s)</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Age</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedDefects.map((d, i) => (
                  <tr key={d.key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <a href={`${JIRA_BASE}/browse/${d.key}`} target="_blank" rel="noreferrer"
                          className="font-medium hover:underline flex items-center gap-1" style={{ color }}>
                          {d.key}<ExternalLink size={11} className="text-gray-400 flex-shrink-0" />
                        </a>
                        {(d.labels || '').split(',').map(l => l.trim()).includes('UTA-INFOR-Defect') && (
                          <span style={{ padding: '1px 5px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', whiteSpace: 'nowrap' }}>
                            INFOR
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 max-w-xs">
                      <span className="text-gray-700 text-xs leading-snug line-clamp-2" title={d.summary}>{d.summary}</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Badge text={d.priority || '—'} color={PRIORITY_COLOR[d.priority] || '#6b7280'} />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {d.severity ? <Badge text={d.severity} color={SEVERITY_COLOR[d.severity] || '#6b7280'} /> : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-2"><span className="text-xs text-gray-600">{d.status || '—'}</span></td>
                    <td className="px-3 py-2">
                      <span className={`text-xs ${!d.assignee || d.assignee === 'Unassigned' ? 'text-amber-500' : 'text-gray-600'}`}>
                        {d.assignee || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-3 py-2 max-w-[180px]">
                      <span className="text-xs text-gray-500 break-words">
                        {(d.customers || []).filter(Boolean).join(', ') || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`text-xs font-medium ${(d.age_days || 0) >= 30 ? 'text-red-500' : 'text-gray-500'}`}>
                        {d.age_days ?? '?'}d
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
