import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { api } from '../services/api';

const PRODUCT_COLORS = { uta: '#005151', utm: '#3AD6C5', wfmClassic: '#b7950b' };
const PRODUCT_LABELS = { uta: 'UTA', utm: 'UTM', wfmClassic: 'WFM Classic' };

function StatCard({ label, value, sublabel, color = '#005151', bg = '#f0fdf4' }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</div>
      <div className="text-4xl font-bold mb-1" style={{ color }}>{value ?? '—'}</div>
      {sublabel && <div className="text-xs text-gray-400">{sublabel}</div>}
    </div>
  );
}

export default function LeadershipDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getLeadership()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading leadership data...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
  if (!data) return <div className="p-8 text-center text-gray-500">No data available</div>;

  const productHealthData = Object.entries(data.productHealth || {}).map(([key, val]) => ({
    name: PRODUCT_LABELS[key] || key,
    total: val.total || 0,
    p1p2: val.p1p2 || 0,
    color: PRODUCT_COLORS[key],
  }));

  const volumeData = (data.customerVolume || []).map(v => ({
    name: PRODUCT_LABELS[v.product] || v.product,
    count: v.count,
    fill: PRODUCT_COLORS[v.product] || '#888',
  }));

  const priorityData = Object.entries(data.byPriority || {})
    .filter(([k]) => k !== 'Unknown')
    .map(([priority, count]) => ({ name: priority, value: count }));

  const PIE_COLORS = ['#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#3b82f6'];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#005151]">Leadership Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Portfolio-wide defect health • RCA-Type-Defect labeled issues</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard label="Total Open Defects" value={data.totalOpenDefects} sublabel="RCA-Type-Defect" color="#dc2626" />
        <StatCard label="Customer-Facing" value={data.totalOpenCustomerFacing} sublabel="With Customers" color="#ea580c" />
        <StatCard label="High Priority (P1+P2)" value={data.p1p2} sublabel="Needs urgent attention" color="#ca8a04" />
        <StatCard label="High Severity (Internal)" value={data.highSeverityInternal} sublabel="S1+S2 no customers" color="#7c3aed" />
        <StatCard label="High Severity (Customer)" value={data.highSeverityCustomer} sublabel="S1+S2 with customers" color="#dc2626" />
        <StatCard label="Aging" value={data.stale} sublabel="No update 30+ days" color="#6b7280" />
      </div>

      {/* Product Health Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Product Health Comparison</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={productHealthData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="total" name="Total Defects" radius={[4, 4, 0, 0]}>
                {productHealthData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Customer-Reported Volume */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Customer-Reported Defect Volume</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={volumeData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" name="Customer-Facing" radius={[4, 4, 0, 0]}>
                {volumeData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Portfolio Distribution */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h2 className="text-base font-semibold text-gray-700 mb-4">Portfolio Distribution by Priority</h2>
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {priorityData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
