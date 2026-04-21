import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '../services/api';

const COLORS = ['#b7950b', '#d4a017', '#005151', '#dc2626', '#7c3aed', '#ea580c', '#16a34a', '#3b82f6'];

function StatCard({ label, value, sublabel, color = '#b7950b' }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-3xl font-bold" style={{ color }}>{value ?? '—'}</div>
      {sublabel && <div className="text-xs text-gray-400 mt-1">{sublabel}</div>}
    </div>
  );
}

export default function WFMClassicDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getStats('wfmClassic')
      .then(setStats)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading WFM Classic dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!stats) return <div className="p-8 text-center text-gray-500">No data</div>;

  const priorityData = Object.entries(stats.byPriority || {}).filter(([k]) => k !== 'Unknown').map(([k, v]) => ({ name: k, value: v }));
  const areaData = Object.entries(stats.byArea || {}).map(([k, v]) => ({ name: k, count: v })).sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#b7950b]">WFM Classic Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">WFM Classic — Defect Health</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Open" value={stats.total} sublabel="All open defects" />
        <StatCard label="Customer Impacting" value={stats.customerImpacting} sublabel="RCA-Type-Defect" color="#dc2626" />
        <StatCard label="High Priority (P1+P2)" value={stats.p1p2} sublabel="Urgent" color="#ca8a04" />
        <StatCard label="Stale" value={stats.stale} sublabel="No update 30+ days" color="#6b7280" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-3">By Priority</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                {priorityData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-700 mb-3">By Area</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={areaData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#b7950b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
