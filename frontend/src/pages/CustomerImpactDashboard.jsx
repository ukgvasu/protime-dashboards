import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
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

function CustomerRow({ customer, color }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer border-b border-gray-50"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="px-3 py-2 whitespace-nowrap">
          {expanded
            ? <ChevronDown size={14} className="text-gray-400" />
            : <ChevronRight size={14} className="text-gray-400" />}
        </td>
        <td className="px-3 py-2">
          <span className="text-sm font-medium text-gray-800">{customer.name}</span>
        </td>
        <td className="px-3 py-2 text-center">
          <span className="text-sm font-bold" style={{ color }}>{customer.count}</span>
        </td>
        <td className="px-3 py-2">
          <Badge text={customer.maxPriority} color={PRIORITY_COLOR[customer.maxPriority] || '#6b7280'} />
        </td>
        <td className="px-3 py-2">
          <div className="flex flex-wrap gap-1">
            {(customer.defects || []).slice(0, 4).map(key => (
              <a key={key} href={`${JIRA_BASE}/browse/${key}`} target="_blank" rel="noreferrer"
                className="text-xs font-medium hover:underline flex items-center gap-0.5"
                style={{ color }}
                onClick={e => e.stopPropagation()}>
                {key}<ExternalLink size={9} className="text-gray-400" />
              </a>
            ))}
            {(customer.defects || []).length > 4 && (
              <span className="text-xs text-gray-400">+{customer.defects.length - 4} more</span>
            )}
          </div>
        </td>
      </tr>
      {expanded && (customer.defectDetails || []).length > 0 && (
        <tr className="bg-gray-50/60">
          <td colSpan={5} className="px-6 py-3">
            <div className="rounded border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="px-3 py-1.5 font-semibold text-gray-500 uppercase">Key</th>
                    <th className="px-3 py-1.5 font-semibold text-gray-500 uppercase">Summary</th>
                    <th className="px-3 py-1.5 font-semibold text-gray-500 uppercase">Priority</th>
                    <th className="px-3 py-1.5 font-semibold text-gray-500 uppercase">Severity</th>
                    <th className="px-3 py-1.5 font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-3 py-1.5 font-semibold text-gray-500 uppercase">Assignee</th>
                    <th className="px-3 py-1.5 font-semibold text-gray-500 uppercase whitespace-nowrap">Age</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customer.defectDetails.map(d => (
                    <tr key={d.key} className="bg-white hover:bg-gray-50">
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        <a href={`${JIRA_BASE}/browse/${d.key}`} target="_blank" rel="noreferrer"
                          className="font-medium hover:underline flex items-center gap-1" style={{ color }}>
                          {d.key}<ExternalLink size={9} className="text-gray-400" />
                        </a>
                      </td>
                      <td className="px-3 py-1.5 max-w-xs">
                        <span className="text-gray-700 line-clamp-2" title={d.summary}>{d.summary}</span>
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        <Badge text={d.priority || '—'} color={PRIORITY_COLOR[d.priority] || '#6b7280'} />
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        {d.severity ? <Badge text={d.severity} color={SEVERITY_COLOR[d.severity] || '#6b7280'} /> : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-1.5 text-gray-600">{d.status || '—'}</td>
                      <td className="px-3 py-1.5">
                        <span className={!d.assignee || d.assignee === 'Unassigned' ? 'text-amber-500' : 'text-gray-600'}>
                          {d.assignee || 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        <span className={(d.age_days || 0) >= 30 ? 'text-red-500 font-medium' : 'text-gray-500'}>
                          {d.age_days ?? '?'}d
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
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

  // Top customer bar chart
  const topCustomerChart = (data.topCustomers || []).slice(0, 10).map(c => ({
    name: c.name.length > 22 ? c.name.slice(0, 22) + '…' : c.name,
    count: c.count,
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

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Top customers chart */}
        <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-1">Top Impacted Customers</h2>
          <p className="text-xs text-gray-400 mb-4">Customers with the most open impacted defects</p>
          {topCustomerChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topCustomerChart} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={150} />
                <Tooltip />
                <Bar dataKey="count" fill={color} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-400">No impacted customer data</div>
          )}
        </div>

        {/* Priority + Severity breakdown */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 flex-1">
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

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 flex-1">
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
      </div>

      {/* Customer drill-down table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-4">
        <h2 className="font-semibold text-gray-700 mb-1">Customers — Defect Drill-Down</h2>
        <p className="text-xs text-gray-400 mb-4">Click any row to expand defect details. Click a key to open in Jira.</p>
        {(data.topCustomers || []).length === 0 ? (
          <p className="text-sm text-gray-400 italic py-4 text-center">No customer data available.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-3 py-2 w-6"></th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase text-center">Defects</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Max Priority</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Jira Keys</th>
                </tr>
              </thead>
              <tbody>
                {(data.topCustomers || []).map(customer => (
                  <CustomerRow key={customer.name} customer={customer} color={color} />
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                      <a href={`${JIRA_BASE}/browse/${d.key}`} target="_blank" rel="noreferrer"
                        className="font-medium hover:underline flex items-center gap-1" style={{ color }}>
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
