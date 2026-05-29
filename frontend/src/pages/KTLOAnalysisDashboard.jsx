import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';

const PRODUCTS = ['uta', 'utm', 'wfmClassic'];
const PRODUCT_LABELS = { uta: 'UTA', utm: 'UTM', wfmClassic: 'WFM Classic' };
const CAT_COLORS = { security: '#dc2626', techDebt: '#7c3aed', customerReported: '#005151', operational: '#6b7280' };
const CAT_LABELS = { security: 'Security', techDebt: 'Tech Debt', customerReported: 'Customer Reported', operational: 'Operational' };

const JIRA_BASE = 'https://engjira.int.kronos.com';

const PRODUCT_BASE_JQL = {
  uta: 'cf[22500] = "UTA" AND issuetype in (Bug, Defect) AND statusCategory != Done',
  utm: 'cf[22500] = "UTM" AND (issuetype in (Bug, Defect) OR labels in ("RCA-Type-Defect")) AND statusCategory != Done',
  wfmClassic: 'cf[22500] = "ProTime India" AND (issuetype in (Bug, Defect) OR labels in ("RCA-Type-Defect")) AND statusCategory != Done',
};

const CAT_JQL_SUFFIX = {
  security: ' AND labels in (Checkmarx, SCA, CVE, Security, SAST, DAST)',
  techDebt: ' AND labels in ("tech-debt", refactor, cleanup)',
  customerReported: ' AND labels in ("RCA-Type-Defect") AND NOT labels in (Checkmarx, SCA, CVE, Security, SAST, DAST)',
  operational: ' AND NOT labels in (Checkmarx, SCA, CVE, Security, SAST, DAST, "tech-debt", refactor, cleanup, "RCA-Type-Defect")',
};

function jiraUrl(product, cat) {
  const jql = PRODUCT_BASE_JQL[product] + (cat ? CAT_JQL_SUFFIX[cat] : '');
  return `${JIRA_BASE}/issues/?jql=${encodeURIComponent(jql)}`;
}

export default function KTLOAnalysisDashboard() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all(PRODUCTS.map(p => api.getKTLO(p).then(r => [p, r])))
      .then(results => setData(Object.fromEntries(results)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading KTLO analysis...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">KTLO Analysis</h1>
        <p className="text-sm text-gray-500 mt-1">Keep The Lights On — defect classification breakdown</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {PRODUCTS.map(product => {
          const d = data[product];
          if (!d) return null;
          const pieData = Object.entries(d.breakdown || {}).map(([cat, count]) => ({
            name: CAT_LABELS[cat] || cat, value: count, color: CAT_COLORS[cat] || '#888'
          })).filter(x => x.value > 0);

          return (
            <div key={product} className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-lg mb-1" style={{ color: { uta: '#005151', utm: '#0d9488', wfmClassic: '#b7950b' }[product] }}>
                {PRODUCT_LABELS[product]}
              </h2>
              <div className="text-3xl font-bold text-gray-800 mb-4">
                <a href={jiraUrl(product, null)} target="_blank" rel="noopener noreferrer" className="hover:underline">{d.total}</a>
                {' '}<span className="text-sm font-normal text-gray-400">open defects</span>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1">
                {Object.entries(d.breakdown || {}).map(([cat, count]) => (
                  <div key={cat} className="flex justify-between text-sm">
                    <span className="text-gray-600">{CAT_LABELS[cat] || cat}</span>
                    <a href={jiraUrl(product, cat)} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: CAT_COLORS[cat] || '#374151' }}>{count}</a>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
