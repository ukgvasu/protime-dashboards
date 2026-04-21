import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { api } from '../services/api';

const JIRA_BASE = 'https://engjira.int.kronos.com';
const PRIORITY_COLOR = { P1: '#dc2626', P2: '#ea580c', P3: '#b7950b', P4: '#6b7280', P5: '#9ca3af', None: '#9ca3af' };
const SEVERITY_COLOR = { S1: '#dc2626', S2: '#ea580c', S3: '#b7950b', S4: '#6b7280' };

const PRODUCT_COLORS = { uta: '#005151', utm: '#0d9488', wfmClassic: '#b7950b' };
const PRODUCT_LABELS = { uta: 'UTA', utm: 'UTM', wfmClassic: 'WFM Classic' };

function Badge({ text, color = '#6b7280' }) {
  return (
    <span className="inline-block text-xs font-semibold px-1.5 py-0.5 rounded" style={{ color, background: color + '18' }}>
      {text}
    </span>
  );
}

function StatCard({ label, value, sublabel, color = '#005151', trend }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="flex items-end gap-2">
        <div className="text-3xl font-bold" style={{ color }}>{value ?? '—'}</div>
        {trend != null && (
          <div className={`text-xs mb-1 flex items-center gap-0.5 ${trend > 0 ? 'text-red-500' : trend < 0 ? 'text-green-600' : 'text-gray-400'}`}>
            {trend > 0 ? <TrendingUp size={12} /> : trend < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
            {Math.abs(trend)}
          </div>
        )}
      </div>
      {sublabel && <div className="text-xs text-gray-400 mt-1">{sublabel}</div>}
    </div>
  );
}

function parseCustomers(raw) {
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : (raw || []);
    return arr.filter(Boolean).join(', ') || '—';
  } catch { return '—'; }
}

function DefectTable({ defects, maxRows = 20 }) {
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('all');
  const pageSize = maxRows;

  const filtered = filter === 'all' ? defects
    : filter === 'customer' ? defects.filter(d => d.is_customer_reported === 1 || d.is_customer_reported === true)
    : defects.filter(d => ['P1', 'P2'].includes(d.priority));

  const pages = Math.ceil(filtered.length / pageSize);
  const rows = filtered.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {['all', 'customer', 'high-priority'].map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(0); }}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${filter === f ? 'bg-[#005151] text-white border-[#005151]' : 'border-gray-200 text-gray-600 hover:border-[#005151]'}`}
          >
            {f === 'all' ? `All (${defects.length})` : f === 'customer' ? `Customer-Facing (${defects.filter(d => d.is_customer_reported === 1 || d.is_customer_reported === true).length})` : `P1+P2 (${defects.filter(d => ['P1','P2'].includes(d.priority)).length})`}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 italic py-4 text-center">No defects match this filter.</p>
      ) : (
        <>
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
                {rows.map((d, i) => (
                  <tr key={d.key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <a href={`${JIRA_BASE}/browse/${d.key}`} target="_blank" rel="noreferrer"
                        className="text-[#005151] font-medium hover:underline flex items-center gap-1">
                        {d.key}<ExternalLink size={11} className="text-gray-400 flex-shrink-0" />
                      </a>
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
                    <td className="px-3 py-2 max-w-[160px]">
                      <span className="text-xs text-gray-500 break-words">{parseCustomers(d.customers)}</span>
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
          {pages > 1 && (
            <div className="flex items-center gap-2 mt-3 justify-end">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="text-xs px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:border-[#005151]">Prev</button>
              <span className="text-xs text-gray-500">{page + 1} / {pages}</span>
              <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page === pages - 1}
                className="text-xs px-2 py-1 rounded border border-gray-200 disabled:opacity-40 hover:border-[#005151]">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SwagActualsDashboard({ product = 'uta' }) {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState(null);
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.getStats(product),
      api.getHistory(product, 6),
      api.getDefects(product),
    ])
      .then(([s, h, d]) => {
        setStats(s);
        setHistory(h);
        setDefects(d.defects || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [product]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading {PRODUCT_LABELS[product] || product} SWAG vs Actuals...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  const color = PRODUCT_COLORS[product] || '#005151';
  const label = PRODUCT_LABELS[product] || product.toUpperCase();

  const monthlyData = (history?.monthlyFlow || []).map(m => ({
    month: m.month?.slice(0, 7) || m.month,
    Opened: m.opened_count || 0,
    Closed: m.closed_count || 0,
  }));

  // Assignee distribution (top 8)
  const assigneeMap = {};
  defects.forEach(d => {
    const a = d.assignee || 'Unassigned';
    assigneeMap[a] = (assigneeMap[a] || 0) + 1;
  });
  const assigneeData = Object.entries(assigneeMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name: name.split(' ').slice(0, 2).join(' '), count }));

  // Area distribution
  const areaMap = {};
  defects.forEach(d => { const a = d.area || 'Unknown'; areaMap[a] = (areaMap[a] || 0) + 1; });
  const areaData = Object.entries(areaMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));

  // Net change trend from monthly data
  const lastMonth = monthlyData[monthlyData.length - 1];
  const prevMonth = monthlyData[monthlyData.length - 2];
  const netTrend = lastMonth && prevMonth ? (lastMonth.Opened - lastMonth.Closed) - (prevMonth.Opened - prevMonth.Closed) : null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color }}>{label} — SWAG vs Actuals</h1>
        <p className="text-sm text-gray-500 mt-1">Monthly defect flow and trend analysis — live from Jira</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total Open" value={stats?.total || 0} sublabel="All open defects" color={color} />
        <StatCard label="Customer Impacting" value={stats?.customerImpacting || 0} sublabel="RCA-Type-Defect" color="#dc2626" />
        <StatCard label="P1 + P2" value={stats?.p1p2 || 0} sublabel="High priority" color="#ea580c" />
        <StatCard label="High Severity" value={stats?.s1s2 || 0} sublabel="S1 + S2" color="#7c3aed" />
        <StatCard label="Stale (30+ days)" value={stats?.stale || 0} sublabel="No update" color="#6b7280" />
      </div>

      {/* Monthly flow chart + assignee distribution side by side */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-1">Monthly Defect Flow (Last 6 Months)</h2>
          <p className="text-xs text-gray-400 mb-4">Opened vs Closed per month — computed from Jira created/resolution dates</p>
          {monthlyData.some(m => m.Opened > 0 || m.Closed > 0) ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Opened" fill="#dc2626" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Closed" fill="#16a34a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p>No monthly data available — defects may predate the current month window</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-4">By Assignee</h2>
          {assigneeData.length > 0 ? (
            <div className="space-y-2">
              {assigneeData.map(({ name, count }) => (
                <div key={name}>
                  <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                    <span className={name === 'Unassigned' ? 'text-amber-500 font-medium' : ''}>{name}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(count / (stats?.total || 1)) * 100}%`, background: color }} />
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400">No data</p>}
        </div>
      </div>

      {/* Area breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-4">
        <h2 className="font-semibold text-gray-700 mb-4">Defects by Area</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={areaData} layout="vertical" margin={{ left: 120, right: 20 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
            <Tooltip />
            <Bar dataKey="count" fill={color} radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Open defects table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-700 mb-1">Open Defects — Live from Jira</h2>
        <p className="text-xs text-gray-400 mb-4">All open {label} defects. Click any key to open in Jira.</p>
        <DefectTable defects={defects} />
      </div>
    </div>
  );
}
