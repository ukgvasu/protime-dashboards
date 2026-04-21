import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Shield, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

const SEV_COLORS = { S1: '#dc2626', S2: '#ea580c', S3: '#ca8a04', S4: '#16a34a', Unknown: '#9ca3af' };
const LABEL_COLORS = ['#dc2626', '#7c3aed', '#0d9488', '#ea580c', '#3b82f6', '#16a34a', '#f59e0b'];

export default function SecurityDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getSecurity()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading security data...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!data) return <div className="p-8 text-center text-gray-500">No data</div>;

  const sevData = Object.entries(data.bySeverity || {}).map(([k, v]) => ({ name: k, value: v }));
  const labelData = Object.entries(data.byLabel || {}).map(([k, v]) => ({ name: k.toUpperCase(), count: v })).sort((a, b) => b.count - a.count);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Shield className="text-[#dc2626]" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Security Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">CVE and security vulnerability tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
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
      </div>

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
          <h2 className="font-semibold text-gray-700 mb-3">By Security Type</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={labelData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {labelData.map((_, i) => <Cell key={i} fill={LABEL_COLORS[i % LABEL_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Defect list */}
      {data.defects && data.defects.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-3">Security Defects ({data.defects.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-2 font-semibold text-gray-500">Key</th>
                  <th className="pb-2 font-semibold text-gray-500">Summary</th>
                  <th className="pb-2 font-semibold text-gray-500">Product</th>
                  <th className="pb-2 font-semibold text-gray-500">Priority</th>
                  <th className="pb-2 font-semibold text-gray-500">Severity</th>
                  <th className="pb-2 font-semibold text-gray-500">Assignee</th>
                </tr>
              </thead>
              <tbody>
                {data.defects.slice(0, 20).map(d => (
                  <tr key={d.key} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 font-mono text-[#005151] text-xs">{d.key}</td>
                    <td className="py-2 max-w-xs truncate text-xs" title={d.summary}>{d.summary}</td>
                    <td className="py-2 text-xs text-gray-500">{d.product?.toUpperCase()}</td>
                    <td className="py-2 text-xs font-semibold text-red-600">{d.priority}</td>
                    <td className="py-2 text-xs">{d.severity || '—'}</td>
                    <td className="py-2 text-xs text-gray-500">{d.assignee || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
