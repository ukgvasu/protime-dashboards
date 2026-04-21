import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';
import { ExternalLink, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

const JIRA_BASE = 'https://engjira.int.kronos.com';
const PRODUCTS = ['uta', 'utm', 'wfmClassic'];
const PRODUCT_COLORS = { uta: '#005151', utm: '#3AD6C5', wfmClassic: '#b7950b' };
const PRODUCT_LABELS = { uta: 'UTA', utm: 'UTM', wfmClassic: 'WFM Classic' };
const PRIORITY_COLOR = { P1: '#dc2626', P2: '#ea580c', P3: '#b7950b', P4: '#6b7280', P5: '#9ca3af', None: '#9ca3af' };
const SEVERITY_COLOR = { S1: '#dc2626', S2: '#ea580c', S3: '#b7950b', S4: '#6b7280' };
const MONTH_SHORT = { '01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun','07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec' };

function Badge({ text, color = '#6b7280' }) {
  return (
    <span className="inline-block text-xs font-semibold px-1.5 py-0.5 rounded" style={{ color, background: color + '22' }}>
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

function SectionHeader({ children }) {
  return (
    <div className="text-sm font-bold text-white bg-[#005151] border-l-4 border-[#3AD6C5] px-4 py-2.5 rounded mb-4">
      {children}
    </div>
  );
}

function getHealthStatus(defects, stats) {
  const p1 = defects.filter(d => d.priority === 'P1').length;
  const s1 = defects.filter(d => d.severity === 'S1').length;
  if (p1 > 0 || s1 > 0) return { label: 'CRITICAL', color: '#c0392b', bg: '#fde8e8' };
  const p2 = defects.filter(d => d.priority === 'P2').length;
  const s2 = defects.filter(d => d.severity === 'S2').length;
  if (p2 > 0 || s2 > 0 || (stats?.unassigned || 0) > 5 || (stats?.stale || 0) > 10)
    return { label: 'AT RISK', color: '#d35400', bg: '#fef3e6' };
  return { label: 'HEALTHY', color: '#27ae60', bg: '#eafaf1' };
}

function DonutChart({ data, label }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex-1 min-w-[220px] max-w-[280px]">
      <div className="text-xs font-bold text-[#005151] text-center uppercase tracking-wider mb-2">{label}</div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
            {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
          </Pie>
          <Tooltip formatter={(val, name) => [`${val} (${total ? Math.round(val/total*100) : 0}%)`, name]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-0.5 mt-1">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: d.fill }} />
            <span className="text-gray-600 flex-1">{d.name}</span>
            <span className="font-semibold text-gray-800">{d.value}</span>
            <span className="text-gray-400">({total ? Math.round(d.value/total*100) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LeadershipDashboard() {
  const [lData, setLData] = useState(null);
  const [statsData, setStatsData] = useState({});
  const [historyData, setHistoryData] = useState({});
  const [defectsData, setDefectsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getLeadership().then(r => ['leadership', r]),
      ...PRODUCTS.map(p => api.getStats(p).then(r => [`stats_${p}`, r])),
      ...PRODUCTS.map(p => api.getHistory(p, 6).then(r => [`hist_${p}`, r])),
      ...PRODUCTS.map(p => api.getDefects(p).then(r => [`defs_${p}`, r.defects || []])),
    ])
      .then(results => {
        const stats = {}, hist = {}, defs = {};
        let ld = null;
        results.forEach(([key, val]) => {
          if (key === 'leadership') ld = val;
          else if (key.startsWith('stats_')) stats[key.replace('stats_', '')] = val;
          else if (key.startsWith('hist_')) hist[key.replace('hist_', '')] = val;
          else if (key.startsWith('defs_')) defs[key.replace('defs_', '')] = val;
        });
        setLData(ld);
        setStatsData(stats);
        setHistoryData(hist);
        setDefectsData(defs);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading leadership data...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!lData) return <div className="p-8 text-center text-gray-500">No data available</div>;

  // === Items Requiring Attention ===
  const attentionItems = PRODUCTS.flatMap(p =>
    (defectsData[p] || [])
      .filter(d => !['Closed', 'Canceled'].includes(d.status))
      .filter(d => {
        const isS1 = d.severity === 'S1';
        const isHighP = ['P1', 'P2'].includes(d.priority);
        const isUnassigned = !d.assignee || d.assignee === 'Unassigned';
        const isStale = (d.age_days || 0) >= 30;
        return isS1 || (isHighP && isUnassigned) || (isHighP && isStale);
      })
      .map(d => {
        const isS1 = d.severity === 'S1';
        const isHighP = ['P1', 'P2'].includes(d.priority);
        const isUnassigned = !d.assignee || d.assignee === 'Unassigned';
        const reason = isS1 ? 'S1 Severity'
          : isHighP && isUnassigned ? 'Unassigned P2+'
          : 'Stale P2+';
        return { ...d, productLabel: PRODUCT_LABELS[p], productColor: PRODUCT_COLORS[p], reason };
      })
  );

  // === Portfolio Totals (aggregated from live per-product stats) ===
  const portfolio = {
    total:     PRODUCTS.reduce((s, p) => s + (statsData[p]?.total || 0), 0),
    customer:  PRODUCTS.reduce((s, p) => s + (statsData[p]?.customerImpacting || 0), 0),
    p1p2:      PRODUCTS.reduce((s, p) => s + (statsData[p]?.p1p2 || 0), 0),
    s1s2:      PRODUCTS.reduce((s, p) => s + (statsData[p]?.s1s2 || 0), 0),
    stale:     PRODUCTS.reduce((s, p) => s + (statsData[p]?.stale || 0), 0),
    unassigned:PRODUCTS.reduce((s, p) => s + (statsData[p]?.unassigned || 0), 0),
  };

  // === Cross-Product Breakdown ===
  const allDefects = PRODUCTS.flatMap(p => defectsData[p] || []);

  const byProductData = PRODUCTS.map(p => ({
    name: PRODUCT_LABELS[p],
    value: (defectsData[p] || []).length,
    fill: PRODUCT_COLORS[p],
  })).filter(d => d.value > 0);

  const byPriorityMap = {};
  allDefects.forEach(d => { const k = d.priority || 'None'; byPriorityMap[k] = (byPriorityMap[k] || 0) + 1; });
  const pOrder = { P1: 0, P2: 1, P3: 2, P4: 3, P5: 4, None: 5 };
  const byPriorityData = Object.entries(byPriorityMap)
    .sort(([a], [b]) => (pOrder[a] ?? 6) - (pOrder[b] ?? 6))
    .map(([name, value]) => ({ name, value, fill: PRIORITY_COLOR[name] || '#ccc' }));

  const bySeverityMap = {};
  allDefects.forEach(d => { const k = d.severity || 'Unset'; bySeverityMap[k] = (bySeverityMap[k] || 0) + 1; });
  const bySeverityData = Object.entries(bySeverityMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ({ name, value, fill: SEVERITY_COLOR[name] || '#ddd' }));

  const byAgeData = [
    { name: '0–7d (Recent)', value: allDefects.filter(d => (d.age_days||0) <= 7).length, fill: '#27ae60' },
    { name: '8–30d (Aging)', value: allDefects.filter(d => (d.age_days||0) > 7 && (d.age_days||0) <= 30).length, fill: '#b7950b' },
    { name: '31–90d (Stale)', value: allDefects.filter(d => (d.age_days||0) > 30 && (d.age_days||0) <= 90).length, fill: '#d35400' },
    { name: '90d+ (Critical)', value: allDefects.filter(d => (d.age_days||0) > 90).length, fill: '#c0392b' },
  ].filter(d => d.value > 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#005151]">Leadership Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Portfolio-wide defect health · UTA · UTM · WFM Classic · Excludes CVE/security issues</p>
      </div>

      {/* ── Portfolio Summary ── */}
      <SectionHeader>Portfolio Summary</SectionHeader>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Total Open Defects" value={portfolio.total} sublabel="All products" color="#005151" />
        <StatCard label="Customer Impacting" value={portfolio.customer} sublabel="customer_count > 0" color="#dc2626" />
        <StatCard label="High Priority (P1+P2)" value={portfolio.p1p2} sublabel="Urgent attention" color="#ea580c" />
        <StatCard label="High Severity (S1+S2)" value={portfolio.s1s2} sublabel="S1+S2 all products" color="#c0392b" />
        <StatCard label="Stale (30+ days)" value={portfolio.stale} sublabel="No update" color="#d35400" />
        <StatCard label="Unassigned" value={portfolio.unassigned} sublabel="No owner" color="#ca8a04" />
      </div>

      {/* ── Items Requiring Attention ── */}
      <SectionHeader>Items Requiring Attention ({attentionItems.length})</SectionHeader>
      {attentionItems.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-100 p-5 mb-8 text-center text-sm text-green-600 font-medium">
          ✓ No items currently require urgent attention
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Issue</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Priority</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Severity</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Age</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Reason</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Assignee</th>
                <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {attentionItems.map((d, i) => (
                <tr key={d.key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded"
                      style={{ color: d.productColor, background: d.productColor + '22' }}>
                      {d.productLabel}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <a href={`${JIRA_BASE}/browse/${d.key}`} target="_blank" rel="noreferrer"
                      className="font-bold hover:underline flex items-center gap-1" style={{ color: d.productColor }}>
                      {d.key}<ExternalLink size={10} className="text-gray-400" />
                    </a>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Badge text={d.priority || '—'} color={PRIORITY_COLOR[d.priority] || '#6b7280'} />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {d.severity ? <Badge text={d.severity} color={SEVERITY_COLOR[d.severity] || '#6b7280'} /> : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${(d.age_days||0) >= 30 ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-500'}`}>
                      {d.age_days ?? '?'}d
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{d.reason}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`text-xs ${!d.assignee || d.assignee === 'Unassigned' ? 'text-amber-500' : 'text-gray-600'}`}>
                      {d.assignee || 'Unassigned'}
                    </span>
                  </td>
                  <td className="px-3 py-2 max-w-[280px]">
                    <span className="text-xs text-gray-700 line-clamp-2" title={d.summary}>{d.summary}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Product Health Comparison ── */}
      <SectionHeader>Product Health Comparison</SectionHeader>
      <div className="flex gap-4 flex-wrap mb-8">
        {PRODUCTS.map(p => {
          const defs = defectsData[p] || [];
          const st = statsData[p] || {};
          const health = getHealthStatus(defs, st);
          const color = PRODUCT_COLORS[p];
          const s1count = defs.filter(d => d.severity === 'S1').length;
          const s2count = defs.filter(d => d.severity === 'S2').length;
          const avgAge = defs.length
            ? Math.round(defs.reduce((s, d) => s + (d.age_days || 0), 0) / defs.length)
            : 0;
          return (
            <div key={p} className="flex-1 min-w-[220px] bg-white border border-gray-200 rounded-lg p-5"
              style={{ borderTop: `4px solid ${color}` }}>
              <div className="flex justify-between items-start mb-4">
                <div className="text-sm font-bold" style={{ color }}>{PRODUCT_LABELS[p]}</div>
                <span className="text-xs font-bold px-2.5 py-1 rounded"
                  style={{ color: health.color, background: health.bg }}>
                  {health.label}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-2xl font-bold text-gray-800">{st.total ?? defs.length}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Open Defects</div>
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: (st.p1p2||0) > 0 ? '#d35400' : '#27ae60' }}>{st.p1p2 || 0}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">P1 + P2</div>
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: (st.s1s2||0) > 0 ? '#d35400' : '#27ae60' }}>{st.s1s2 || 0}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">S1 + S2 Sev</div>
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: avgAge >= 60 ? '#c0392b' : '#222' }}>{avgAge}d</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Avg Age</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                {s1count > 0 && (
                  <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                    {s1count} S1 severity
                  </div>
                )}
                {s2count > 0 && (
                  <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    {s2count} S2 severity
                  </div>
                )}
                {(st.unassigned || 0) > 0 && (
                  <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                    {st.unassigned} unassigned
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Customer-Reported 6-Month Trend ── */}
      <SectionHeader>Customer-Reported Defect Volume — 6-Month Trend</SectionHeader>
      <div className="flex gap-4 flex-wrap mb-4">
        {PRODUCTS.map(p => {
          const color = PRODUCT_COLORS[p];
          const monthlyFlow = historyData[p]?.monthlyFlow || [];
          const chartData = monthlyFlow.map(m => ({
            month: MONTH_SHORT[m.month?.slice(5, 7)] || m.month?.slice(5, 7) || m.month,
            count: m.opened_count || 0,
          }));
          const total = chartData.reduce((s, m) => s + m.count, 0);
          return (
            <div key={p} className="flex-1 min-w-[200px] bg-white border border-gray-200 rounded-lg p-4"
              style={{ borderTop: `4px solid ${color}` }}>
              <div className="text-sm font-bold mb-3" style={{ color }}>{PRODUCT_LABELS[p]}</div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={chartData} barGap={2}>
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#999' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#999' }} axisLine={false} tickLine={false} allowDecimals={false} width={20} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Bar dataKey="count" fill={color} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[120px] flex items-center justify-center text-xs text-gray-400">No data</div>
              )}
              <div className="text-xs text-gray-400 mt-2">
                <strong className="text-gray-700">{total}</strong> total inbound (6 months)
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mb-8">
        Defects opened per month by product, computed from Jira created dates. Excludes CVEs and security issues.
      </p>

      {/* ── Cross-Product Breakdown ── */}
      <SectionHeader>Cross-Product Breakdown</SectionHeader>
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-4">
        <div className="flex gap-8 flex-wrap justify-around">
          <DonutChart data={byProductData} label="By Product" />
          <DonutChart data={byPriorityData} label="By Priority" />
          <DonutChart data={bySeverityData} label="By Severity" />
          <DonutChart data={byAgeData} label="By Age" />
        </div>
      </div>
    </div>
  );
}
