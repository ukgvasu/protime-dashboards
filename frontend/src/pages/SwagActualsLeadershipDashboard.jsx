import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ExternalLink } from 'lucide-react';
import { api } from '../services/api';

const JIRA_BASE = 'https://engjira.int.kronos.com';
const PRODUCTS = ['uta', 'utm', 'wfmClassic'];
const PRODUCT_LABELS = { uta: 'UTA', utm: 'UTM', wfmClassic: 'WFM Classic' };
const PRODUCT_COLORS = { uta: '#005151', utm: '#0d9488', wfmClassic: '#b7950b' };
const PRIORITY_COLOR = { P1: '#dc2626', P2: '#ea580c', P3: '#b7950b', P4: '#6b7280', P5: '#9ca3af', None: '#9ca3af' };
const SEVERITY_COLOR = { S1: '#dc2626', S2: '#ea580c', S3: '#b7950b', S4: '#6b7280' };

function Badge({ text, color = '#6b7280' }) {
  return (
    <span className="inline-block text-xs font-semibold px-1.5 py-0.5 rounded" style={{ color, background: color + '18' }}>
      {text}
    </span>
  );
}

function parseCustomers(raw) {
  try {
    const arr = typeof raw === 'string' ? JSON.parse(raw) : (raw || []);
    return arr.filter(Boolean).join(', ') || '—';
  } catch { return '—'; }
}

function ProductStatCard({ product, stats }) {
  const color = PRODUCT_COLORS[product];
  const label = PRODUCT_LABELS[product];
  if (!stats) return null;
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 rounded-full" style={{ background: color }} />
        <span className="font-semibold text-gray-700">{label}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-2xl font-bold" style={{ color }}>{stats.total || 0}</div>
          <div className="text-xs text-gray-400">Total Open</div>
        </div>
        <div className="text-center p-2 bg-red-50 rounded">
          <div className="text-2xl font-bold text-red-600">{stats.customerImpacting || 0}</div>
          <div className="text-xs text-gray-400">Customer</div>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded">
          <div className="text-xl font-bold text-orange-600">{stats.p1p2 || 0}</div>
          <div className="text-xs text-gray-400">P1+P2</div>
        </div>
        <div className="text-center p-2 bg-purple-50 rounded">
          <div className="text-xl font-bold text-purple-600">{stats.s1s2 || 0}</div>
          <div className="text-xs text-gray-400">S1+S2</div>
        </div>
        <div className="text-center p-2 bg-amber-50 rounded">
          <div className="text-xl font-bold text-amber-600">{stats.unassigned || 0}</div>
          <div className="text-xs text-gray-400">Unassigned</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-xl font-bold text-gray-600">{stats.stale || 0}</div>
          <div className="text-xs text-gray-400">Stale</div>
        </div>
      </div>
    </div>
  );
}

export default function SwagActualsLeadershipDashboard() {
  const [statsData, setStatsData] = useState({});
  const [historyData, setHistoryData] = useState({});
  const [defectsData, setDefectsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeProduct, setActiveProduct] = useState('all');
  const [monthlyProduct, setMonthlyProduct] = useState('all');
  const [monthlySort, setMonthlySort] = useState('month'); // 'month' | 'count'

  useEffect(() => {
    Promise.all([
      ...PRODUCTS.map(p => api.getStats(p).then(r => [p, r])),
      ...PRODUCTS.map(p => api.getHistory(p, 6).then(r => [p + '_h', r])),
      ...PRODUCTS.map(p => api.getDefects(p).then(r => [p + '_d', r])),
    ])
      .then(results => {
        const stats = {}, hist = {}, defs = {};
        results.forEach(([key, val]) => {
          if (key.endsWith('_h')) hist[key.replace('_h', '')] = val;
          else if (key.endsWith('_d')) defs[key.replace('_d', '')] = val.defects || [];
          else stats[key] = val;
        });
        setStatsData(stats);
        setHistoryData(hist);
        setDefectsData(defs);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading SWAG Leadership...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

  // Build combined monthly data
  const allMonths = new Set();
  PRODUCTS.forEach(p => (historyData[p]?.monthlyFlow || []).forEach(m => allMonths.add(m.month)));
  const sortedMonths = Array.from(allMonths).sort();

  const combinedMonthly = sortedMonths.map(month => {
    const row = { month };
    PRODUCTS.forEach(p => {
      const mf = historyData[p]?.monthlyFlow || [];
      const entry = mf.find(m => m.month === month);
      row[`${PRODUCT_LABELS[p]} Opened`] = entry?.opened_count || 0;
      row[`${PRODUCT_LABELS[p]} Closed`] = entry?.closed_count || 0;
    });
    return row;
  });

  // Portfolio totals
  const totals = {
    total: PRODUCTS.reduce((s, p) => s + (statsData[p]?.total || 0), 0),
    customer: PRODUCTS.reduce((s, p) => s + (statsData[p]?.customerImpacting || 0), 0),
    p1p2: PRODUCTS.reduce((s, p) => s + (statsData[p]?.p1p2 || 0), 0),
    s1s2: PRODUCTS.reduce((s, p) => s + (statsData[p]?.s1s2 || 0), 0),
    stale: PRODUCTS.reduce((s, p) => s + (statsData[p]?.stale || 0), 0),
    unassigned: PRODUCTS.reduce((s, p) => s + (statsData[p]?.unassigned || 0), 0),
  };

  // All customer-facing defects across all products
  const allCustomerDefects = PRODUCTS.flatMap(p =>
    (defectsData[p] || [])
      .filter(d => d.is_customer_reported === 1 || d.is_customer_reported === true)
      .map(d => ({ ...d, productLabel: PRODUCT_LABELS[p], productColor: PRODUCT_COLORS[p] }))
  ).sort((a, b) => (b.age_days || 0) - (a.age_days || 0));

  // Filtered defects for table
  const tableDefects = activeProduct === 'all'
    ? PRODUCTS.flatMap(p => (defectsData[p] || []).map(d => ({ ...d, productLabel: PRODUCT_LABELS[p], productColor: PRODUCT_COLORS[p] })))
    : (defectsData[activeProduct] || []).map(d => ({ ...d, productLabel: PRODUCT_LABELS[activeProduct], productColor: PRODUCT_COLORS[activeProduct] }));

  const tableDefectsSorted = [...tableDefects].sort((a, b) => {
    const pOrder = { P1: 0, P2: 1, P3: 2, P4: 3, P5: 4, None: 5 };
    return (pOrder[a.priority] ?? 5) - (pOrder[b.priority] ?? 5);
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">SWAG vs Actuals — Leadership View</h1>
        <p className="text-sm text-gray-500 mt-1">Cross-product defect health and monthly trends — live from Jira</p>
      </div>

      {/* Portfolio totals */}
      <div className="grid grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Portfolio Total', value: totals.total, color: '#005151' },
          { label: 'Customer Impacting', value: totals.customer, color: '#dc2626' },
          { label: 'P1 + P2', value: totals.p1p2, color: '#ea580c' },
          { label: 'S1 + S2', value: totals.s1s2, color: '#7c3aed' },
          { label: 'Unassigned', value: totals.unassigned, color: '#ca8a04' },
          { label: 'Stale (30d+)', value: totals.stale, color: '#6b7280' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-lg shadow-sm border border-gray-100 p-3 text-center">
            <div className="text-xs font-semibold text-gray-400 uppercase mb-1">{label}</div>
            <div className="text-2xl font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Per-product stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {PRODUCTS.map(p => <ProductStatCard key={p} product={p} stats={statsData[p]} />)}
      </div>

      {/* Monthly trend chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-4">
        <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
          <div>
            <h2 className="font-semibold text-gray-700">Monthly Opened Defects</h2>
            <p className="text-xs text-gray-400 mt-0.5">Defects opened per month by product, computed from Jira created dates</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Product filter */}
            {['all', ...PRODUCTS].map(p => (
              <button key={p}
                onClick={() => setMonthlyProduct(p)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${monthlyProduct === p ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                style={monthlyProduct === p ? { background: p === 'all' ? '#374151' : PRODUCT_COLORS[p] } : {}}
              >
                {p === 'all' ? 'All' : PRODUCT_LABELS[p]}
              </button>
            ))}
            {/* Sort toggle */}
            <button
              onClick={() => setMonthlySort(s => s === 'month' ? 'count' : 'month')}
              className="text-xs px-3 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors"
              title={monthlySort === 'month' ? 'Currently sorted by month — click to sort by count' : 'Currently sorted by count — click to sort by month'}
            >
              Sort: {monthlySort === 'month' ? 'By Month' : 'By Count'}
            </button>
          </div>
        </div>
        {(() => {
          const visibleProducts = monthlyProduct === 'all' ? PRODUCTS : [monthlyProduct];
          const chartData = [...combinedMonthly].sort((a, b) => {
            if (monthlySort === 'count') {
              const aTotal = visibleProducts.reduce((s, p) => s + (a[`${PRODUCT_LABELS[p]} Opened`] || 0), 0);
              const bTotal = visibleProducts.reduce((s, p) => s + (b[`${PRODUCT_LABELS[p]} Opened`] || 0), 0);
              return bTotal - aTotal;
            }
            return a.month.localeCompare(b.month);
          });
          const hasData = chartData.some(m => visibleProducts.some(p => (m[`${PRODUCT_LABELS[p]} Opened`] || 0) > 0));
          return hasData ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                {visibleProducts.map(p => (
                  <Bar key={p} dataKey={`${PRODUCT_LABELS[p]} Opened`} fill={PRODUCT_COLORS[p]} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p>No monthly data — defects may predate the 6-month window or all were created before this month.</p>
            </div>
          );
        })()}
      </div>

      {/* Customer-facing defects across all products */}
      {allCustomerDefects.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-4">
          <h2 className="font-semibold text-gray-700 mb-1">Customer-Facing Defects — All Products ({allCustomerDefects.length})</h2>
          <p className="text-xs text-gray-400 mb-4">RCA-Type-Defect labeled issues actively impacting customers</p>
          <div className="overflow-x-auto rounded border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Key</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Summary</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Priority</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Severity</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Assignee</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Customer(s)</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Age</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allCustomerDefects.map((d, i) => (
                  <tr key={d.key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <a href={`${JIRA_BASE}/browse/${d.key}`} target="_blank" rel="noreferrer"
                        className="font-medium hover:underline flex items-center gap-1" style={{ color: d.productColor }}>
                        {d.key}<ExternalLink size={11} className="text-gray-400 flex-shrink-0" />
                      </a>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: d.productColor, background: d.productColor + '18' }}>
                        {d.productLabel}
                      </span>
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
        </div>
      )}

      {/* All defects table with product filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-700 mb-1">All Open Defects by Product</h2>
        <div className="flex items-center gap-2 mb-4">
          {['all', ...PRODUCTS].map(p => (
            <button key={p}
              onClick={() => setActiveProduct(p)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${activeProduct === p ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
              style={activeProduct === p ? { background: p === 'all' ? '#374151' : PRODUCT_COLORS[p], borderColor: 'transparent' } : {}}
            >
              {p === 'all' ? `All (${totals.total})` : `${PRODUCT_LABELS[p]} (${statsData[p]?.total || 0})`}
            </button>
          ))}
        </div>
        {tableDefectsSorted.length === 0 ? (
          <p className="text-sm text-gray-400 italic py-4 text-center">No defects for this product.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Key</th>
                  {activeProduct === 'all' && <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Product</th>}
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Summary</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Priority</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Assignee</th>
                  <th className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">Age</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tableDefectsSorted.slice(0, 50).map((d, i) => (
                  <tr key={d.key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <a href={`${JIRA_BASE}/browse/${d.key}`} target="_blank" rel="noreferrer"
                        className="font-medium hover:underline flex items-center gap-1" style={{ color: d.productColor }}>
                        {d.key}<ExternalLink size={11} className="text-gray-400 flex-shrink-0" />
                      </a>
                    </td>
                    {activeProduct === 'all' && (
                      <td className="px-3 py-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ color: d.productColor, background: d.productColor + '18' }}>
                          {d.productLabel}
                        </span>
                      </td>
                    )}
                    <td className="px-3 py-2 max-w-xs">
                      <span className="text-gray-700 text-xs leading-snug line-clamp-2" title={d.summary}>{d.summary}</span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Badge text={d.priority || '—'} color={PRIORITY_COLOR[d.priority] || '#6b7280'} />
                    </td>
                    <td className="px-3 py-2"><span className="text-xs text-gray-600">{d.status || '—'}</span></td>
                    <td className="px-3 py-2">
                      <span className={`text-xs ${!d.assignee || d.assignee === 'Unassigned' ? 'text-amber-500' : 'text-gray-600'}`}>
                        {d.assignee || 'Unassigned'}
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
            {tableDefectsSorted.length > 50 && (
              <div className="px-3 py-2 text-xs text-gray-400 bg-gray-50 border-t border-gray-100">
                Showing top 50 of {tableDefectsSorted.length} defects — use individual product pages for full lists
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
