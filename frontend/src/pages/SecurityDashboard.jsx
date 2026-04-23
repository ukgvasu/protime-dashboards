import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Shield, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

const SEV_COLORS = { S1: '#dc2626', S2: '#ea580c', S3: '#ca8a04', S4: '#16a34a', Unknown: '#9ca3af' };
const CLASS_COLORS = ['#dc2626', '#7c3aed', '#0d9488', '#ea580c', '#3b82f6', '#16a34a', '#f59e0b', '#6366f1', '#14b8a6', '#f97316', '#9ca3af'];

const PRODUCTS = [
  { key: 'uta',        label: 'UTA',        color: '#059669', bg: '#f0fdf4', border: '#059669' },
  { key: 'utm',        label: 'UTM',        color: '#2563eb', bg: '#eff6ff', border: '#2563eb' },
  { key: 'wfmClassic', label: 'WFM Classic', color: '#7c3aed', bg: '#f5f3ff', border: '#7c3aed' },
];

const PRODUCT_CONFIG = {
  uta:        { label: 'UTA',        color: '#059669', fetch: () => api.getSecurityUTA() },
  utm:        { label: 'UTM',        color: '#2563eb', fetch: () => api.getSecurityUTM() },
  wfmClassic: { label: 'WFM Classic', color: '#7c3aed', fetch: () => api.getSecurityWFM() },
};

const PRODUCT_LABEL = { uta: 'UTA', utm: 'UTM', wfmClassic: 'WFM Classic', other: 'Other' };

const keyNum = key => parseInt(key.replace(/\D/g, ''), 10) || 0;
const sortDefects = defects =>
  [...defects].sort((a, b) => {
    if (a.tveSubmitted !== b.tveSubmitted) return a.tveSubmitted ? 1 : -1;
    return keyNum(b.key) - keyNum(a.key);
  });

function SecurityCharts({ data }) {
  const sevData   = Object.entries(data.bySeverity || {}).map(([k, v]) => ({ name: k, value: v }));
  const classData = Object.entries(data.bySecurityClassification || {}).map(([k, v]) => ({ name: k, count: v })).sort((a, b) => b.count - a.count);
  return (
    <div className="grid grid-cols-2 gap-6 mb-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-700 mb-3">By Severity</h2>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={sevData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
              {sevData.map((entry) => <Cell key={entry.name} fill={SEV_COLORS[entry.name] || '#9ca3af'} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-700 mb-3">By Security Classification</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={classData} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
            <Tooltip />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {classData.map((_, i) => <Cell key={i} fill={CLASS_COLORS[i % CLASS_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DefectTable({ defects, label, showProduct = false }) {
  if (!defects.length) return null;
  const sorted = sortDefects(defects);
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
      <h2 className="font-semibold text-gray-700 mb-3">{label} ({defects.length})</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-100">
              <th className="pb-2 font-semibold text-gray-500">Key</th>
              <th className="pb-2 font-semibold text-gray-500">Summary</th>
              {showProduct && <th className="pb-2 font-semibold text-gray-500">Product</th>}
              <th className="pb-2 font-semibold text-gray-500">Classification</th>
              <th className="pb-2 font-semibold text-gray-500">Priority</th>
              <th className="pb-2 font-semibold text-gray-500">Severity</th>
              <th className="pb-2 font-semibold text-gray-500">Assignee</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(d => {
              const prod = PRODUCTS.find(p => p.key === d.product);
              return (
                <tr key={d.key} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 font-mono text-[#005151] text-xs">{d.key}</td>
                  <td className="py-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="max-w-xs truncate" title={d.summary}>{d.summary}</span>
                      {d.tveSubmitted && (
                        <span style={{ flexShrink: 0, padding: '1px 5px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd', whiteSpace: 'nowrap' }}>TVE</span>
                      )}
                    </div>
                  </td>
                  {showProduct && (
                    <td className="py-2 text-xs">
                      {prod ? (
                        <span className="px-1.5 py-0.5 rounded text-white text-[10px] font-semibold" style={{ background: prod.color }}>
                          {prod.label}
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                  )}
                  <td className="py-2 text-xs text-gray-500">{d.securityClass || '—'}</td>
                  <td className="py-2 text-xs font-semibold text-red-600">{d.priority}</td>
                  <td className="py-2 text-xs">{d.severity || '—'}</td>
                  <td className="py-2 text-xs text-gray-500">{d.assignee || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SecurityDashboard({ product = null }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [filter, setFilter]   = useState('all');

  const config = product ? PRODUCT_CONFIG[product] : null;

  useEffect(() => {
    setLoading(true);
    setData(null);
    setError(null);
    setFilter('all');
    const fetchFn = config ? config.fetch : api.getSecurity;
    fetchFn()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [product]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading security data...</div>;
  if (error)   return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!data)   return <div className="p-8 text-center text-gray-500">No data</div>;

  // ── Product-specific view ──────────────────────────────────────
  if (config) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <Shield size={28} style={{ color: config.color }} />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{config.label} Security</h1>
            <p className="text-sm text-gray-500 mt-1">Security defects — {config.label} · Transitional Offerings pillar</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${config.color}18` }}>
              <Shield size={24} style={{ color: config.color }} />
            </div>
            <div>
              <div className="text-3xl font-bold" style={{ color: config.color }}>{data.total}</div>
              <div className="text-sm text-gray-500">Total Security Defects</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600">{data.critical}</div>
              <div className="text-sm text-gray-500">Critical (S1+S2)</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#dbeafe' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#1d4ed8' }}>TVE</span>
            </div>
            <div>
              <div className="text-3xl font-bold" style={{ color: '#1d4ed8' }}>
                {data.defects.filter(d => d.tveSubmitted).length}
              </div>
              <div className="text-sm text-gray-500">TVE Submitted</div>
            </div>
          </div>
        </div>

        <SecurityCharts data={data} />
        <DefectTable defects={data.defects} label={`${config.label} Security Defects`} />
      </div>
    );
  }

  // ── Overview ───────────────────────────────────────────────────
  const byProduct      = data.byProduct || {};
  const visibleDefects = filter === 'all'
    ? data.defects
    : data.defects.filter(d => d.product === filter);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Shield className="text-[#dc2626]" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Security Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Pro Time security defects — Transitional Offerings pillar</p>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="text-red-600" size={24} />
          </div>
          <div>
            <div className="text-3xl font-bold text-red-600">{data.total}</div>
            <div className="text-sm text-gray-500">Total Security Defects</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
            <AlertTriangle className="text-orange-600" size={24} />
          </div>
          <div>
            <div className="text-3xl font-bold text-orange-600">{data.critical}</div>
            <div className="text-sm text-gray-500">Critical (S1+S2)</div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#dbeafe' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#1d4ed8' }}>TVE</span>
          </div>
          <div>
            <div className="text-3xl font-bold" style={{ color: '#1d4ed8' }}>
              {data.defects.filter(d => d.tveSubmitted).length}
            </div>
            <div className="text-sm text-gray-500">TVE Submitted</div>
          </div>
        </div>
      </div>

      {/* Product breakdown cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {PRODUCTS.map(p => {
          const count    = byProduct[p.key] || 0;
          const critical = data.defects.filter(d => d.product === p.key && ['S1','S2'].includes(d.severity)).length;
          const active   = filter === p.key;
          return (
            <button
              key={p.key}
              onClick={() => setFilter(active ? 'all' : p.key)}
              className="text-left rounded-lg p-4 border-2 transition-all hover:shadow-md"
              style={{ background: active ? p.color : p.bg, borderColor: p.border }}
            >
              <div className="text-2xl font-bold" style={{ color: active ? '#fff' : p.color }}>{count}</div>
              <div className="font-semibold text-sm mt-0.5" style={{ color: active ? '#fff' : p.color }}>{p.label}</div>
              <div className="text-xs mt-1" style={{ color: active ? 'rgba(255,255,255,0.8)' : '#6b7280' }}>
                {critical} critical (S1+S2)
              </div>
            </button>
          );
        })}
      </div>

      <SecurityCharts data={data} />

      {/* Defect list */}
      {visibleDefects.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-700">
              Security Defects ({visibleDefects.length}{filter !== 'all' ? ` — ${PRODUCT_LABEL[filter]}` : ''})
            </h2>
            {filter !== 'all' && (
              <button onClick={() => setFilter('all')} className="text-xs text-[#005151] underline hover:no-underline">
                Show all
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-2 font-semibold text-gray-500">Key</th>
                  <th className="pb-2 font-semibold text-gray-500">Summary</th>
                  <th className="pb-2 font-semibold text-gray-500">Product</th>
                  <th className="pb-2 font-semibold text-gray-500">Classification</th>
                  <th className="pb-2 font-semibold text-gray-500">Priority</th>
                  <th className="pb-2 font-semibold text-gray-500">Severity</th>
                  <th className="pb-2 font-semibold text-gray-500">Assignee</th>
                </tr>
              </thead>
              <tbody>
                {sortDefects(visibleDefects).map(d => {
                  const prod = PRODUCTS.find(p => p.key === d.product);
                  return (
                    <tr key={d.key} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 font-mono text-[#005151] text-xs">{d.key}</td>
                      <td className="py-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="max-w-xs truncate" title={d.summary}>{d.summary}</span>
                          {d.tveSubmitted && (
                            <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">TVE</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 text-xs">
                        {prod ? (
                          <span className="px-1.5 py-0.5 rounded text-white text-[10px] font-semibold" style={{ background: prod.color }}>
                            {prod.label}
                          </span>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="py-2 text-xs text-gray-500">{d.securityClass || '—'}</td>
                      <td className="py-2 text-xs font-semibold text-red-600">{d.priority}</td>
                      <td className="py-2 text-xs">{d.severity || '—'}</td>
                      <td className="py-2 text-xs text-gray-500">{d.assignee || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
