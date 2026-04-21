import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../services/api';

const PRODUCTS = ['uta', 'utm', 'wfmClassic'];
const PRODUCT_LABELS = { uta: 'UTA', utm: 'UTM', wfmClassic: 'WFM Classic' };
const PRODUCT_COLORS = { uta: '#005151', utm: '#0d9488', wfmClassic: '#b7950b' };

export default function AllProductsDashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all(PRODUCTS.map(p => api.getStats(p).then(r => [p, r])))
      .then(results => setStats(Object.fromEntries(results)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading all products...</div>;

  const comparisonData = PRODUCTS.map(p => ({
    name: PRODUCT_LABELS[p],
    total: stats[p]?.total || 0,
    customer: stats[p]?.customerImpacting || 0,
    p1p2: stats[p]?.p1p2 || 0,
    color: PRODUCT_COLORS[p],
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">All Products Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Cross-product defect comparison</p>
      </div>

      {/* Product Cards */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {PRODUCTS.map(product => {
          const s = stats[product] || {};
          return (
            <div key={product} className="bg-white rounded-lg shadow-sm border-2 p-5" style={{ borderColor: PRODUCT_COLORS[product] }}>
              <h2 className="text-lg font-bold mb-3" style={{ color: PRODUCT_COLORS[product] }}>{PRODUCT_LABELS[product]}</h2>
              <div className="space-y-2">
                {[
                  { label: 'Total Open', value: s.total },
                  { label: 'Customer Impacting', value: s.customerImpacting },
                  { label: 'High Priority (P1+P2)', value: s.p1p2 },
                  { label: 'Stale (30+ days)', value: s.stale },
                  { label: 'Unassigned', value: s.unassigned },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-bold text-gray-800">{value ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-700 mb-4">Product Comparison</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={comparisonData} barCategoryGap="30%">
            <XAxis dataKey="name" tick={{ fontSize: 13 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="total" name="Total Open" radius={[4, 4, 0, 0]}>
              {comparisonData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
